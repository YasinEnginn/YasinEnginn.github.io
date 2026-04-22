CREATE TABLE IF NOT EXISTS visitor_events (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  event_name TEXT NOT NULL,
  site_host TEXT,
  page_url TEXT,
  page_path TEXT,
  page_title TEXT,
  referrer TEXT,
  visitor_id TEXT,
  session_id TEXT,
  ip_raw TEXT,
  ip_masked TEXT,
  ip_hash TEXT,
  country TEXT,
  region TEXT,
  region_code TEXT,
  city TEXT,
  continent TEXT,
  timezone TEXT,
  latitude REAL,
  longitude REAL,
  asn INTEGER,
  as_organization TEXT,
  colo TEXT,
  tls_version TEXT,
  user_agent TEXT,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  device_category TEXT,
  screen_size TEXT,
  viewport_size TEXT,
  language TEXT,
  color_scheme TEXT,
  connection_type TEXT,
  effective_type TEXT,
  is_touch INTEGER DEFAULT 0,
  event_payload_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_visitor_events_received_at ON visitor_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_events_event_name ON visitor_events(event_name);
CREATE INDEX IF NOT EXISTS idx_visitor_events_page_path ON visitor_events(page_path);
CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor_id ON visitor_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_country ON visitor_events(country);
