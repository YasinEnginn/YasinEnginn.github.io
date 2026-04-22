(function () {
  const config = window.__VISITOR_TELEMETRY_CONFIG || {};
  const isEnabled = config.enabled !== false;
  const endpoint = normalizeBaseUrl(config.endpoint);

  const api = {
    enabled: Boolean(isEnabled && endpoint),
    endpoint,
    track(eventName, details = {}) {
      if (!this.enabled) return;
      const safeName = sanitizeEventName(eventName);
      if (!safeName) return;
      postEvent(safeName, details);
    }
  };

  window.visitorTelemetry = api;

  if (!api.enabled) return;
  if (config.respectDoNotTrack !== false && isDoNotTrackEnabled()) {
    api.enabled = false;
    return;
  }
  if (!isSampledIn(config.sampleRate)) {
    api.enabled = false;
    return;
  }

  const sessionId = getOrCreateSessionId();
  const visitorId = getOrCreateVisitorId();
  postEvent("page_view");

  function postEvent(eventName, details = {}) {
    const body = {
      event_name: eventName,
      site: sanitizeString(config.site, 120) || window.location.host,
      visitor_id: visitorId,
      session_id: sessionId,
      page: collectPageContext(),
      client: collectClientContext(),
      details: sanitizeDetails(details)
    };

    const targetUrl = `${endpoint}/collect`;
    const payload = JSON.stringify(body);

    try {
      if (typeof navigator.sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon(targetUrl, blob)) {
          return;
        }
      }
    } catch {
      // Fall back to fetch below.
    }

    fetch(targetUrl, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      keepalive: true,
      headers: {
        "content-type": "application/json"
      },
      body: payload
    }).catch(() => {
      // Analytics must never break page experience.
    });
  }

  function collectPageContext() {
    return {
      title: sanitizeString(document.title, 180),
      url: sanitizeString(window.location.href, 800),
      path: sanitizeString(window.location.pathname + window.location.search, 400),
      referrer: sanitizeString(document.referrer || "", 800)
    };
  }

  function collectClientContext() {
    const ua = navigator.userAgent || "";
    const uaData = navigator.userAgentData || null;
    const browser = detectBrowser(ua, uaData);
    const os = detectOs(ua, uaData);
    const deviceCategory = detectDeviceCategory(uaData);
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    const timezone = safeTimeZone();
    const colorScheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    return {
      language: sanitizeString(navigator.language || "", 32),
      timezone,
      browser_name: browser.name,
      browser_version: browser.version,
      os_name: os,
      device_category: deviceCategory,
      user_agent: sanitizeString(ua, 512),
      screen_size: `${safeNumber(window.screen?.width)}x${safeNumber(window.screen?.height)}`,
      viewport_size: `${safeNumber(window.innerWidth)}x${safeNumber(window.innerHeight)}`,
      color_scheme: colorScheme,
      connection_type: sanitizeString(connection?.type || "", 32),
      effective_type: sanitizeString(connection?.effectiveType || "", 32),
      is_touch: hasTouchSupport() ? 1 : 0
    };
  }

  function getOrCreateVisitorId() {
    return getOrCreateStorageValue("visitorTelemetryVisitorId", 365);
  }

  function getOrCreateSessionId() {
    try {
      const key = "visitorTelemetrySessionId";
      const existing = window.sessionStorage.getItem(key);
      if (existing) return existing;
      const created = createUuid();
      window.sessionStorage.setItem(key, created);
      return created;
    } catch {
      return createUuid();
    }
  }

  function getOrCreateStorageValue(key) {
    try {
      const existing = window.localStorage.getItem(key);
      if (existing) return existing;
      const created = createUuid();
      window.localStorage.setItem(key, created);
      return created;
    } catch {
      return createUuid();
    }
  }

  function createUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "vt-" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function detectBrowser(ua, uaData) {
    const fromBrands = detectBrowserFromBrands(uaData?.brands);
    if (fromBrands) return fromBrands;

    if (/Edg\/([\d.]+)/.test(ua)) {
      return { name: "Edge", version: RegExp.$1 };
    }
    if (/OPR\/([\d.]+)/.test(ua)) {
      return { name: "Opera", version: RegExp.$1 };
    }
    if (/Chrome\/([\d.]+)/.test(ua)) {
      return { name: "Chrome", version: RegExp.$1 };
    }
    if (/Firefox\/([\d.]+)/.test(ua)) {
      return { name: "Firefox", version: RegExp.$1 };
    }
    if (/Version\/([\d.]+).*Safari/.test(ua)) {
      return { name: "Safari", version: RegExp.$1 };
    }

    return { name: "Unknown", version: "" };
  }

  function detectBrowserFromBrands(brands) {
    if (!Array.isArray(brands)) return null;
    const known = ["Microsoft Edge", "Google Chrome", "Chromium", "Opera", "Firefox", "Safari"];

    for (const brandInfo of brands) {
      const brand = sanitizeString(brandInfo?.brand || "", 64);
      if (!known.includes(brand)) continue;
      return {
        name: brand.replace("Google ", ""),
        version: sanitizeString(brandInfo?.version || "", 32)
      };
    }

    return null;
  }

  function detectOs(ua, uaData) {
    const platform = sanitizeString(uaData?.platform || navigator.platform || "", 48);
    if (platform) {
      if (/mac/i.test(platform)) return "macOS";
      if (/win/i.test(platform)) return "Windows";
      if (/linux/i.test(platform)) return "Linux";
      if (/android/i.test(platform)) return "Android";
      if (/ios|iphone|ipad/i.test(platform)) return "iOS";
    }

    if (/Windows NT/i.test(ua)) return "Windows";
    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
  }

  function detectDeviceCategory(uaData) {
    if (uaData && typeof uaData.mobile === "boolean") {
      return uaData.mobile ? "mobile" : fallbackDeviceCategory();
    }

    return fallbackDeviceCategory();
  }

  function fallbackDeviceCategory() {
    const width = safeNumber(window.innerWidth);
    if (width <= 768) return "mobile";
    if (width <= 1024 && hasTouchSupport()) return "tablet";
    return "desktop";
  }

  function hasTouchSupport() {
    const coarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    return Boolean(
      navigator.maxTouchPoints > 0 ||
      "ontouchstart" in window ||
      coarsePointer
    );
  }

  function safeTimeZone() {
    try {
      return sanitizeString(Intl.DateTimeFormat().resolvedOptions().timeZone || "", 64);
    } catch {
      return "";
    }
  }

  function safeNumber(value) {
    return Number.isFinite(value) ? value : 0;
  }

  function sanitizeDetails(details) {
    if (!details || typeof details !== "object") {
      return {};
    }

    const output = {};
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === "string") {
        output[sanitizeString(key, 80)] = sanitizeString(value, 200);
      } else if (typeof value === "number" || typeof value === "boolean") {
        output[sanitizeString(key, 80)] = value;
      }
    }
    return output;
  }

  function sanitizeEventName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9:_-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80);
  }

  function sanitizeString(value, maxLength) {
    return String(value || "").trim().slice(0, maxLength);
  }

  function normalizeBaseUrl(value) {
    const trimmed = String(value || "").trim().replace(/\/+$/, "");
    return trimmed;
  }

  function isDoNotTrackEnabled() {
    return ["1", "yes"].includes(String(navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack || "").toLowerCase());
  }

  function isSampledIn(sampleRate) {
    const rate = Number(sampleRate);
    if (!Number.isFinite(rate) || rate >= 1) return true;
    if (rate <= 0) return false;
    return Math.random() < rate;
  }
})();
