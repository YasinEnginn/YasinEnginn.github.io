(function () {
  const form = document.getElementById("insights-form");
  const endpointInput = document.getElementById("telemetry-endpoint");
  const tokenInput = document.getElementById("admin-token");
  const limitInput = document.getElementById("recent-limit");
  const statusEl = document.getElementById("insights-status");
  const totalEventsEl = document.getElementById("stat-total-events");
  const uniqueVisitorsEl = document.getElementById("stat-unique-visitors");
  const uniqueIpsEl = document.getElementById("stat-unique-ips");
  const countryCountEl = document.getElementById("stat-country-count");
  const topPagesEl = document.getElementById("top-pages");
  const topCountriesEl = document.getElementById("top-countries");
  const topDevicesEl = document.getElementById("top-devices");
  const tableBodyEl = document.getElementById("recent-body");
  const emptyStateEl = document.getElementById("recent-empty");

  const config = window.__VISITOR_TELEMETRY_CONFIG || {};
  const storedEndpoint = localStorage.getItem("visitorTelemetryAdminEndpoint") || "";
  const storedLimit = localStorage.getItem("visitorTelemetryAdminLimit") || "40";
  const storedToken = sessionStorage.getItem("visitorTelemetryAdminToken") || "";

  endpointInput.value = storedEndpoint || String(config.endpoint || "").trim();
  tokenInput.value = storedToken;
  limitInput.value = storedLimit;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadInsights();
  });

  document.getElementById("refresh-insights")?.addEventListener("click", async () => {
    await loadInsights();
  });

  if (endpointInput.value && tokenInput.value) {
    loadInsights().catch(() => {
      // Manual retry is available in the UI.
    });
  }

  async function loadInsights() {
    const endpoint = normalizeUrl(endpointInput.value);
    const token = tokenInput.value.trim();
    const limit = clampInt(limitInput.value, 40, 10, 200);

    limitInput.value = String(limit);
    localStorage.setItem("visitorTelemetryAdminEndpoint", endpoint);
    localStorage.setItem("visitorTelemetryAdminLimit", String(limit));
    sessionStorage.setItem("visitorTelemetryAdminToken", token);

    if (!endpoint) {
      setStatus("Telemetri uç noktası gerekli.", "error");
      return;
    }

    if (!token) {
      setStatus("Yönetici anahtarı gerekli.", "error");
      return;
    }

    setStatus("Veriler yükleniyor...", "loading");

    try {
      const [summary, recent] = await Promise.all([
        fetchJson(`${endpoint}/admin/summary?days=30`, token),
        fetchJson(`${endpoint}/admin/recent?limit=${limit}&event=page_view`, token)
      ]);

      renderSummary(summary);
      renderRecent(recent.rows || []);
      setStatus(`Son güncelleme: ${formatDateTime(new Date().toISOString())}`, "success");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "Veriler yüklenemedi.", "error");
    }
  }

  async function fetchJson(url, token) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    return payload;
  }

  function renderSummary(summary) {
    const totals = summary.totals || {};
    totalEventsEl.textContent = formatNumber(totals.total_events);
    uniqueVisitorsEl.textContent = formatNumber(totals.unique_visitors);
    uniqueIpsEl.textContent = formatNumber(totals.unique_ips);
    countryCountEl.textContent = formatNumber(totals.country_count);

    renderList(topPagesEl, summary.top_pages || [], (row) => ({
      title: row.page_path || "/",
      value: `${formatNumber(row.hits)} ziyaret`
    }));

    renderList(topCountriesEl, summary.top_countries || [], (row) => ({
      title: [row.country, row.region].filter(Boolean).join(" / ") || "Bilinmiyor",
      value: `${formatNumber(row.hits)} ziyaret`
    }));

    renderList(topDevicesEl, summary.top_devices || [], (row) => ({
      title: [row.device_category, row.browser_name].filter(Boolean).join(" / ") || "Bilinmiyor",
      value: `${formatNumber(row.hits)} ziyaret`
    }));
  }

  function renderList(root, rows, mapper) {
    root.innerHTML = "";

    if (!rows.length) {
      root.innerHTML = '<div class="empty">Henüz veri yok.</div>';
      return;
    }

    rows.forEach((row) => {
      const mapped = mapper(row);
      const item = document.createElement("div");
      item.className = "list-row";
      item.innerHTML = `<strong>${escapeHtml(mapped.title)}</strong><span>${escapeHtml(mapped.value)}</span>`;
      root.appendChild(item);
    });
  }

  function renderRecent(rows) {
    tableBodyEl.innerHTML = "";
    emptyStateEl.hidden = rows.length > 0;

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      const location = [row.country, row.region, row.city].filter(Boolean).join(" / ") || "Bilinmiyor";
      const device = [row.device_category, row.browser_name, row.os_name].filter(Boolean).join(" / ") || "Bilinmiyor";
      const visitorId = shortenId(row.visitor_id);
      const pageTags = [row.event_name, row.site_host].filter(Boolean).map((value) => `<span class="tag">${escapeHtml(value)}</span>`).join("");

      tr.innerHTML = `
        <td>${escapeHtml(formatDateTime(row.received_at))}</td>
        <td>
          <div class="mono">${escapeHtml(row.ip_display || row.ip_masked || row.ip_hash || "-")}</div>
          <div class="microcopy">${escapeHtml(location)}</div>
        </td>
        <td>
          <div>${escapeHtml(device)}</div>
          <div class="microcopy">Ziyaretçi: <span class="mono">${escapeHtml(visitorId)}</span></div>
        </td>
        <td>
          <div class="mono">${escapeHtml(row.page_path || "/")}</div>
          <div class="microcopy">${escapeHtml(row.page_title || "")}</div>
        </td>
        <td>
          <div>${pageTags || '<span class="tag">page_view</span>'}</div>
          <div class="microcopy">${escapeHtml(trimReferrer(row.referrer))}</div>
        </td>
      `;
      tableBodyEl.appendChild(tr);
    });
  }

  function setStatus(message, state) {
    statusEl.textContent = message;
    statusEl.dataset.state = state;
  }

  function normalizeUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function shortenId(value) {
    const text = String(value || "");
    if (!text) return "-";
    return text.length <= 12 ? text : `${text.slice(0, 8)}...${text.slice(-4)}`;
  }

  function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function trimReferrer(value) {
    const text = String(value || "").trim();
    if (!text) return "Yönlendiren yok";
    return text.length > 64 ? `${text.slice(0, 61)}...` : text;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("tr-TR").format(Number(value || 0));
  }

  function clampInt(value, fallback, min, max) {
    const num = Number.parseInt(value, 10);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, num));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
