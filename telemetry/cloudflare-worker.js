export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return handleOptions(request, env);
    }

    try {
      if (isRoute(url.pathname, ["health"]) && request.method === "GET") {
        return jsonResponse({ ok: true, service: "visitor-telemetry" }, 200, request, env);
      }

      if (isRoute(url.pathname, ["collect"]) && request.method === "POST") {
        return handleCollect(request, env);
      }

      if (isRoute(url.pathname, ["admin", "recent"]) && request.method === "GET") {
        requireAdmin(request, env);
        return handleRecent(request, env);
      }

      if (isRoute(url.pathname, ["admin", "summary"]) && request.method === "GET") {
        requireAdmin(request, env);
        return handleSummary(request, env);
      }

      return jsonResponse({ error: "Not found" }, 404, request, env);
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonResponse({ error: error.message }, error.status, request, env);
      }

      return jsonResponse({
        error: error instanceof Error ? error.message : "Unexpected error"
      }, 500, request, env);
    }
  }
};

async function handleCollect(request, env) {
  enforceOriginPolicy(request, env);

  const rawBody = await request.text();
  if (!rawBody || rawBody.length > 24_000) {
    return jsonResponse({ error: "Invalid telemetry payload" }, 400, request, env);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Payload must be valid JSON" }, 400, request, env);
  }

  const eventName = sanitizeEventName(payload?.event_name);
  if (!eventName) {
    return jsonResponse({ error: "event_name is required" }, 400, request, env);
  }

  const cf = request.cf || {};
  const ipRaw = firstNonEmpty([
    request.headers.get("CF-Connecting-IP"),
    request.headers.get("X-Forwarded-For")
  ]);
  const ipMasked = maskIp(ipRaw);
  const ipHash = ipRaw ? await sha256Hex(ipRaw) : "";
  const shouldStoreRawIp = isTrue(env.STORE_RAW_IP);
  const receivedAt = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO visitor_events (
      id, received_at, event_name, site_host, page_url, page_path, page_title, referrer,
      visitor_id, session_id, ip_raw, ip_masked, ip_hash, country, region, region_code,
      city, continent, timezone, latitude, longitude, asn, as_organization, colo, tls_version,
      user_agent, browser_name, browser_version, os_name, device_category, screen_size,
      viewport_size, language, color_scheme, connection_type, effective_type, is_touch,
      event_payload_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    receivedAt,
    eventName,
    sanitizeString(payload?.site, 120),
    sanitizeString(payload?.page?.url, 800),
    sanitizeString(payload?.page?.path, 400),
    sanitizeString(payload?.page?.title, 180),
    sanitizeString(payload?.page?.referrer, 800),
    sanitizeString(payload?.visitor_id, 64),
    sanitizeString(payload?.session_id, 64),
    shouldStoreRawIp ? sanitizeString(ipRaw, 64) : "",
    sanitizeString(ipMasked, 64),
    sanitizeString(ipHash, 128),
    sanitizeString(cf.country, 16),
    sanitizeString(cf.region, 80),
    sanitizeString(cf.regionCode, 24),
    sanitizeString(cf.city, 80),
    sanitizeString(cf.continent, 12),
    sanitizeString(cf.timezone, 80),
    normalizeFloat(cf.latitude),
    normalizeFloat(cf.longitude),
    normalizeInt(cf.asn),
    sanitizeString(cf.asOrganization, 120),
    sanitizeString(cf.colo, 16),
    sanitizeString(cf.tlsVersion, 24),
    sanitizeString(payload?.client?.user_agent, 512),
    sanitizeString(payload?.client?.browser_name, 64),
    sanitizeString(payload?.client?.browser_version, 32),
    sanitizeString(payload?.client?.os_name, 64),
    sanitizeString(payload?.client?.device_category, 24),
    sanitizeString(payload?.client?.screen_size, 32),
    sanitizeString(payload?.client?.viewport_size, 32),
    sanitizeString(payload?.client?.language, 32),
    sanitizeString(payload?.client?.color_scheme, 16),
    sanitizeString(payload?.client?.connection_type, 32),
    sanitizeString(payload?.client?.effective_type, 32),
    normalizeBool(payload?.client?.is_touch),
    safeJson(payload?.details || {})
  ).run();

  return jsonResponse({ ok: true }, 202, request, env);
}

async function handleRecent(request, env) {
  const url = new URL(request.url);
  const limit = clampInt(url.searchParams.get("limit"), 40, 10, 200);
  const eventName = sanitizeEventName(url.searchParams.get("event") || "page_view");

  const rows = await env.DB.prepare(`
    SELECT
      received_at,
      event_name,
      site_host,
      page_path,
      page_title,
      referrer,
      visitor_id,
      ip_raw,
      ip_masked,
      ip_hash,
      CASE
        WHEN ip_raw IS NOT NULL AND ip_raw != '' THEN ip_raw
        WHEN ip_masked IS NOT NULL AND ip_masked != '' THEN ip_masked
        ELSE ip_hash
      END AS ip_display,
      country,
      region,
      city,
      browser_name,
      os_name,
      device_category
    FROM visitor_events
    WHERE event_name = ?
    ORDER BY received_at DESC
    LIMIT ?
  `).bind(eventName, limit).run();

  return jsonResponse({ rows: rows.results || [] }, 200, request, env);
}

async function handleSummary(request, env) {
  const url = new URL(request.url);
  const days = clampInt(url.searchParams.get("days"), 30, 1, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const totals = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total_events,
      COUNT(DISTINCT visitor_id) AS unique_visitors,
      COUNT(DISTINCT CASE
        WHEN ip_raw IS NOT NULL AND ip_raw != '' THEN ip_raw
        WHEN ip_hash IS NOT NULL AND ip_hash != '' THEN ip_hash
        ELSE ip_masked
      END) AS unique_ips,
      COUNT(DISTINCT country) AS country_count
    FROM visitor_events
    WHERE received_at >= ?
  `).bind(since).first();

  const topPages = await env.DB.prepare(`
    SELECT page_path, COUNT(*) AS hits
    FROM visitor_events
    WHERE received_at >= ? AND event_name = 'page_view'
    GROUP BY page_path
    ORDER BY hits DESC
    LIMIT 8
  `).bind(since).run();

  const topCountries = await env.DB.prepare(`
    SELECT country, region, COUNT(*) AS hits
    FROM visitor_events
    WHERE received_at >= ? AND event_name = 'page_view'
    GROUP BY country, region
    ORDER BY hits DESC
    LIMIT 8
  `).bind(since).run();

  const topDevices = await env.DB.prepare(`
    SELECT device_category, browser_name, COUNT(*) AS hits
    FROM visitor_events
    WHERE received_at >= ? AND event_name = 'page_view'
    GROUP BY device_category, browser_name
    ORDER BY hits DESC
    LIMIT 8
  `).bind(since).run();

  return jsonResponse({
    totals: totals || {},
    top_pages: topPages.results || [],
    top_countries: topCountries.results || [],
    top_devices: topDevices.results || []
  }, 200, request, env);
}

function requireAdmin(request, env) {
  const configured = String(env.ADMIN_TOKEN || "").trim();
  if (!configured) {
    throw new Error("ADMIN_TOKEN is not configured");
  }

  const header = request.headers.get("Authorization") || "";
  const candidate = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!timingSafeEqual(configured, candidate)) {
    throw new HttpError(401, "Unauthorized");
  }
}

function handleOptions(request, env) {
  const headers = buildCorsHeaders(request, env);
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}

function jsonResponse(payload, status, request, env) {
  const headers = buildCorsHeaders(request, env);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(payload), { status, headers });
}

function buildCorsHeaders(request, env) {
  const headers = new Headers();
  headers.set("Vary", "Origin");
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = parseAllowList(env.ALLOWED_ORIGINS);

  if (!origin) {
    headers.set("Access-Control-Allow-Origin", "*");
    return headers;
  }

  if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function enforceOriginPolicy(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = parseAllowList(env.ALLOWED_ORIGINS);

  if (!origin || !allowedOrigins.length) {
    return;
  }

  if (!allowedOrigins.includes(origin)) {
    throw new HttpError(403, "Origin is not allowed");
  }
}

function parseAllowList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRoute(pathname, suffixParts) {
  const parts = String(pathname || "")
    .split("/")
    .filter(Boolean);

  if (parts.length < suffixParts.length) {
    return false;
  }

  const tail = parts.slice(parts.length - suffixParts.length);
  return tail.every((part, index) => part === suffixParts[index]);
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

function normalizeFloat(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBool(value) {
  return value ? 1 : 0;
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function isTrue(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

function firstNonEmpty(values) {
  for (const value of values) {
    const normalized = sanitizeString(value, 128);
    if (normalized) {
      return normalized.split(",")[0].trim();
    }
  }

  return "";
}

function maskIp(value) {
  const ip = sanitizeString(value, 128);
  if (!ip) return "";

  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(":")}::`;
    }
  }

  return ip;
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value || ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = [...new Uint8Array(digest)];
  return bytes.map((item) => item.toString(16).padStart(2, "0")).join("");
}

function safeJson(value) {
  return JSON.stringify(value || {}).slice(0, 4_000);
}

function timingSafeEqual(expected, candidate) {
  const left = String(expected || "");
  const right = String(candidate || "");
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
