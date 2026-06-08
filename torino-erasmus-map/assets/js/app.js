const DATA_URL = './data/app-data.json';
const TRANSIT_URL = './data/transit.json';
const CORE_CATEGORIES = [
  'personal',
  'highlight',
  'museum',
  'history',
  'park',
  'cheap',
  'student',
  'transport',
  'atm',
  'gtt',
  'mosque',
  'halal',
  'outside',
];

const state = {
  data: null,
  transit: null,
  transitPromise: null,
  map: null,
  cluster: null,
  transitLayer: null,
  railLayer: null,
  markers: new Map(),
  active: new Set(),
  fuse: null,
  selectedBounds: null,
};

const el = {
  appShell: document.getElementById('appShell'),
  loadStatus: document.getElementById('loadStatus'),
  categoryList: document.getElementById('categoryList'),
  searchInput: document.getElementById('searchInput'),
  poiList: document.getElementById('poiList'),
  resultCount: document.getElementById('resultCount'),
  routeSelect: document.getElementById('routeSelect'),
  routeMeta: document.getElementById('routeMeta'),
  transitInfo: document.getElementById('transitInfo'),
  airportRailBtn: document.getElementById('airportRailBtn'),
  metroBtn: document.getElementById('metroBtn'),
  locateBtn: document.getElementById('locateBtn'),
  showCore: document.getElementById('showCore'),
  showAll: document.getElementById('showAll'),
  resetMap: document.getElementById('resetMap'),
  clearRoute: document.getElementById('clearRoute'),
  focusRoute: document.getElementById('focusRoute'),
};

init().catch((error) => {
  console.error(error);
  el.loadStatus.textContent = 'Hata';
  el.transitInfo.textContent = 'Harita verisi yüklenemedi. İnternet bağlantısını ve dosya yolunu kontrol et.';
});

async function init() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`App data error: ${response.status}`);
  state.data = await response.json();
  state.active = new Set(categoryKeys().filter((key) => state.data.categoryMeta[key].default));

  initMap();
  initSearch();
  initCategories();
  initPoiMarkers();
  initEvents();
  render();
  markReady();
  warmTransit();
  registerServiceWorker();
}

function markReady() {
  el.loadStatus.textContent = `${state.data.stats.total} nokta`;
  el.loadStatus.classList.add('is-ready');
  el.routeMeta.textContent = 'İstek üzerine';
  el.transitInfo.textContent = 'Hat seçiciye dokununca GTT verisi yüklenir.';
}

function initMap() {
  state.map = L.map('map', {
    zoomControl: true,
    preferCanvas: true,
  }).setView(state.data.center, 12);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(state.map);

  state.cluster = L.markerClusterGroup({
    maxClusterRadius: 45,
    showCoverageOnHover: false,
    spiderfyDistanceMultiplier: 1.25,
  }).addTo(state.map);

  state.transitLayer = L.layerGroup().addTo(state.map);
  state.railLayer = L.layerGroup().addTo(state.map);
}

function initSearch() {
  state.fuse = window.Fuse
    ? new Fuse(state.data.pois, {
        keys: ['name', 'category', 'description', 'address', 'tags'],
        threshold: 0.33,
        ignoreLocation: true,
      })
    : null;
}

function initCategories() {
  el.categoryList.innerHTML = '';
  for (const key of categoryKeys()) {
    const meta = state.data.categoryMeta[key];
    const count = state.data.stats.categories[key] || 0;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cat-btn';
    button.dataset.category = key;
    button.style.setProperty('--cat-color', meta.color);
    button.setAttribute('aria-pressed', state.active.has(key) ? 'true' : 'false');
    button.innerHTML = `<span class="dot"></span><span>${escapeHtml(meta.label)} (${count})</span>`;
    button.addEventListener('click', () => {
      if (state.active.has(key)) state.active.delete(key);
      else state.active.add(key);
      syncCategoryButtons();
      render();
    });
    el.categoryList.appendChild(button);
  }
}

function initPoiMarkers() {
  for (const poi of state.data.pois) {
    const marker = L.marker([poi.lat, poi.lng], {
      icon: markerIcon(poi),
      title: poi.name,
    });
    marker.bindPopup(() => popupHtml(poi));
    marker.on('click', () => highlightListItem(poi.id));
    state.markers.set(poi.id, marker);
  }
}

function initEvents() {
  el.searchInput.addEventListener('input', render);
  el.showAll.addEventListener('click', () => {
    state.active = new Set(categoryKeys());
    syncCategoryButtons();
    render();
  });
  el.showCore.addEventListener('click', () => {
    state.active = new Set(CORE_CATEGORIES);
    syncCategoryButtons();
    render();
  });
  el.resetMap.addEventListener('click', () => {
    state.active = new Set(categoryKeys().filter((key) => state.data.categoryMeta[key].default));
    el.searchInput.value = '';
    syncCategoryButtons();
    clearRouteLayers();
    state.map.setView(state.data.center, 12);
    render();
  });
  el.locateBtn.addEventListener('click', locateUser);
  el.airportRailBtn.addEventListener('click', () => drawRailGuide('airport-train'));
  el.metroBtn.addEventListener('click', showMetro);
  el.routeSelect.addEventListener('pointerdown', () => ensureTransit());
  el.routeSelect.addEventListener('focus', () => ensureTransit());
  el.routeSelect.addEventListener('change', () => drawRoute(el.routeSelect.value));
  el.clearRoute.addEventListener('click', () => {
    el.routeSelect.value = '';
    clearRouteLayers();
  });
  el.focusRoute.addEventListener('click', () => {
    if (state.selectedBounds) {
      state.map.fitBounds(state.selectedBounds, { padding: [32, 32], maxZoom: 15 });
    }
  });
}

function categoryKeys() {
  return Object.keys(state.data.categoryMeta).sort(
    (a, b) => state.data.categoryMeta[a].rank - state.data.categoryMeta[b].rank,
  );
}

function markerIcon(poi) {
  const meta = state.data.categoryMeta[poi.category];
  const color = meta?.color || '#334155';
  const high = (poi.priority || 0) >= 90 ? ' high' : '';
  const defaults = { atm: 'BNL', mosque: 'CAMİ', halal: 'HALAL', gtt: 'GTT' };
  const label = poi.markerLabel || defaults[poi.category] || '';
  const labeled = label ? ' labeled' : '';
  const catClass = ` cat-${poi.category}`;
  return L.divIcon({
    className: `poi-marker${high}${labeled}${catClass}`,
    html: `<span style="--marker-color:${color}">${escapeHtml(label)}</span>`,
    iconSize: label ? [58, 36] : [28, 28],
  });
}

function currentResults() {
  const query = el.searchInput.value.trim();
  let base = state.data.pois;
  if (query && state.fuse) {
    base = state.fuse.search(query).map((item) => item.item);
  } else if (query) {
    const needle = query.toLocaleLowerCase('tr');
    base = state.data.pois.filter((poi) =>
      JSON.stringify([poi.name, poi.description, poi.address, poi.tags]).toLocaleLowerCase('tr').includes(needle),
    );
  }

  return base
    .filter((poi) => state.active.has(poi.category))
    .sort((a, b) => {
      const meta = state.data.categoryMeta;
      return (
        (b.priority || 0) - (a.priority || 0) ||
        meta[a.category].rank - meta[b.category].rank ||
        a.name.localeCompare(b.name, 'tr')
      );
    });
}

function render() {
  const results = currentResults();
  renderMarkers(results);
  renderList(results);
}

function renderMarkers(results) {
  state.cluster.clearLayers();
  for (const poi of results) {
    const marker = state.markers.get(poi.id);
    if (marker) state.cluster.addLayer(marker);
  }
}

function renderList(results) {
  el.resultCount.textContent = `${results.length} nokta gösteriliyor`;
  el.poiList.innerHTML = '';
  const visible = results.slice(0, 120);
  for (const poi of visible) {
    const meta = state.data.categoryMeta[poi.category] || { label: poi.category, color: '#334155' };
    const card = document.createElement('article');
    card.className = 'poi-card';
    card.id = `list-${poi.id}`;
    card.innerHTML = `
      <h2>${escapeHtml(poi.name)}</h2>
      <div class="poi-meta">
        <span class="pill" style="border-color:${meta.color}55">${escapeHtml(meta.label)}</span>
        <span class="pill">öncelik ${poi.priority || 0}</span>
        ${poi.source === 'Curated' ? '<span class="pill">seçilmiş</span>' : ''}
      </div>`;
    card.addEventListener('click', () => focusPoi(poi));
    el.poiList.appendChild(card);
  }

  if (results.length > visible.length) {
    const more = document.createElement('div');
    more.className = 'transit-info';
    more.textContent = `İlk ${visible.length} sonuç listeleniyor; aramayla daraltabilirsin.`;
    el.poiList.appendChild(more);
  }
}

function focusPoi(poi) {
  const marker = state.markers.get(poi.id);
  state.map.setView([poi.lat, poi.lng], Math.max(state.map.getZoom(), 15), { animate: true });
  setTimeout(() => marker?.openPopup(), 220);
}

function highlightListItem(id) {
  const item = document.getElementById(`list-${id}`);
  if (!item) return;
  item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  item.style.borderColor = '#0f766e';
  setTimeout(() => {
    item.style.borderColor = '';
  }, 900);
}

function syncCategoryButtons() {
  document.querySelectorAll('.cat-btn').forEach((button) => {
    button.setAttribute('aria-pressed', state.active.has(button.dataset.category) ? 'true' : 'false');
  });
}

function popupHtml(poi) {
  const meta = state.data.categoryMeta[poi.category] || { label: poi.category, color: '#334155' };
  const tags = (poi.tags || [])
    .slice(0, 4)
    .map((tag) => `<span class="pill">${escapeHtml(String(tag))}</span>`)
    .join('');
  const address = poi.address ? `<p class="popup-text"><strong>Adres:</strong> ${escapeHtml(poi.address)}</p>` : '';
  const cost = poi.cost ? `<p class="popup-text"><strong>Fiyat:</strong> ${escapeHtml(poi.cost)}</p>` : '';
  const source = poi.source ? `<p class="popup-text"><strong>Kaynak:</strong> ${escapeHtml(poi.source)}</p>` : '';
  const ownLink = poi.link ? `<a href="${escapeAttr(poi.link)}" target="_blank" rel="noreferrer">Resmi/site</a>` : '';
  return `
    <h3 class="popup-title">${escapeHtml(poi.name)}</h3>
    <div class="popup-cat"><span class="dot" style="--cat-color:${meta.color}"></span>${escapeHtml(meta.label)}</div>
    <p class="popup-text">${escapeHtml(poi.description || '')}</p>
    ${address}
    ${cost}
    <div class="poi-meta">${tags}</div>
    ${source}
    <div class="popup-links">
      <a href="${mapsUrl(poi.lat, poi.lng)}" target="_blank" rel="noreferrer">Google Maps</a>
      <a href="${osmUrl(poi)}" target="_blank" rel="noreferrer">OSM</a>
      ${ownLink}
    </div>`;
}

async function ensureTransit() {
  if (state.transit) return state.transit;
  if (!state.transitPromise) {
    el.routeMeta.textContent = 'Yükleniyor';
    el.transitInfo.textContent = 'GTT hatları yükleniyor...';
    state.transitPromise = fetch(TRANSIT_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Transit data error: ${response.status}`);
        return response.json();
      })
      .then((transit) => {
        state.transit = transit;
        populateRoutes();
        return transit;
      })
      .catch((error) => {
        console.error(error);
        el.routeMeta.textContent = 'Hata';
        el.transitInfo.textContent = 'GTT hat verisi yüklenemedi.';
        throw error;
      });
  }
  return state.transitPromise;
}

function warmTransit() {
  const idle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 650));
  idle(() => ensureTransit().catch(() => {}));
}

function populateRoutes() {
  const routes = state.transit.routes || [];
  el.routeSelect.disabled = false;
  el.routeSelect.innerHTML = '<option value="">Hat seç</option>';
  for (const route of routes) {
    const option = document.createElement('option');
    option.value = route.id;
    option.textContent = [route.shortName, route.type, route.longName].filter(Boolean).join(' · ');
    el.routeSelect.appendChild(option);
  }
  el.routeMeta.textContent = `${state.transit.stats.routeCount} hat`;
  el.transitInfo.textContent = `GTT GTFS ${state.transit.stats.serviceDate || ''} · ${state.transit.stats.directionCount} yön`;
}

function clearRouteLayers() {
  state.transitLayer.clearLayers();
  state.railLayer.clearLayers();
  state.selectedBounds = null;
  if (state.transit) {
    el.transitInfo.textContent = `GTT GTFS ${state.transit.stats.serviceDate || ''} · ${state.transit.stats.routeCount} hat hazır`;
  } else {
    el.transitInfo.textContent = 'Hat seçiciye dokununca GTT verisi yüklenir.';
  }
}

function isRailRoute(route) {
  return ['Metro', 'Tram', 'Tren'].includes(route.type);
}

function routeVisual(route, direction) {
  const rail = isRailRoute(route);
  return {
    color: route.color || (rail ? '#0f172a' : '#2563eb'),
    haloColor: rail ? '#0f172a' : '#ffffff',
    haloWeight: rail ? 18 : 10,
    lineWeight: rail ? 9 : 5,
    lineOpacity: direction.directionId === '1' ? (rail ? 0.76 : 0.62) : 0.98,
    stopRadius: rail ? 6 : 4,
    stopWeight: rail ? 3 : 2,
  };
}

async function showMetro() {
  const transit = await ensureTransit();
  const metro = transit.routes.find((route) => route.type === 'Metro' || route.shortName === 'M1');
  if (!metro) {
    el.transitInfo.textContent = 'Metro hattı bulunamadı.';
    return;
  }
  el.routeSelect.value = metro.id;
  drawRoute(metro.id);
}

function drawRoute(routeId) {
  clearRouteLayers();
  if (!routeId || !state.transit) return;
  const route = state.transit.routes.find((item) => item.id === routeId);
  if (!route) {
    el.transitInfo.textContent = 'Hat bulunamadı.';
    return;
  }

  const bounds = L.latLngBounds([]);
  let stopTotal = 0;
  for (const direction of route.directions || []) {
    const visual = routeVisual(route, direction);
    const latlngs = (direction.geometry || []).map((point) => [point[0], point[1]]);
    if (latlngs.length) {
      L.polyline(latlngs, {
        color: visual.haloColor,
        weight: visual.haloWeight,
        opacity: isRailRoute(route) ? 0.26 : 0.42,
        dashArray: direction.directionId === '1' ? '8 8' : null,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(state.transitLayer);
      const line = L.polyline(latlngs, {
        color: visual.color,
        weight: visual.lineWeight,
        opacity: visual.lineOpacity,
        dashArray: direction.directionId === '1' ? '8 8' : null,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(state.transitLayer);
      line.bindPopup(() => routePopup(route, direction));
      latlngs.forEach((latlng) => bounds.extend(latlng));
    }

    for (const [index, stop] of (direction.stops || []).entries()) {
      stopTotal += 1;
      const marker = L.circleMarker([stop.lat, stop.lng], {
        radius: visual.stopRadius,
        color: visual.color,
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: visual.stopWeight,
      }).addTo(state.transitLayer);
      marker.bindPopup(() => stopPopup(route, direction, stop, index));
      bounds.extend([stop.lat, stop.lng]);
    }
  }

  state.selectedBounds = bounds.isValid() ? bounds : null;
  const directionCount = (route.directions || []).length;
  const date = state.transit.stats.serviceDate ? ` · GTFS ${state.transit.stats.serviceDate}` : '';
  el.transitInfo.textContent = `${route.shortName || route.id} · ${route.type || 'hat'} · ${directionCount} yön · ${stopTotal} durak${date}`;
  if (state.selectedBounds) {
    state.map.fitBounds(state.selectedBounds, { padding: [32, 32], maxZoom: 15 });
  }
}

function drawRailGuide(guideId) {
  clearRouteLayers();
  el.routeSelect.value = '';
  const guide = (state.data.railGuides || []).find((item) => item.id === guideId);
  if (!guide) {
    el.transitInfo.textContent = 'Tren rehberi bulunamadı.';
    return;
  }

  const bounds = L.latLngBounds([]);
  for (const segment of guide.segments || []) {
    const latlngs = (segment.geometry || []).map((point) => [point[0], point[1]]);
    if (latlngs.length) {
      L.polyline(latlngs, {
        color: guide.color || '#0f172a',
        weight: segment.kind === 'train' ? 20 : 13,
        opacity: segment.kind === 'train' ? 0.24 : 0.16,
        dashArray: segment.style === 'dash' ? '10 10' : null,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(state.railLayer);
      const line = L.polyline(latlngs, {
        color: segment.kind === 'train' ? guide.accentColor || '#38bdf8' : '#ef4444',
        weight: segment.kind === 'train' ? 10 : 7,
        opacity: 0.98,
        dashArray: segment.style === 'dash' ? '10 10' : null,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(state.railLayer);
      line.bindPopup(() => railGuidePopup(guide, segment));
      latlngs.forEach((latlng) => bounds.extend(latlng));
    }

    for (const station of segment.stations || []) {
      const marker = L.circleMarker([station.lat, station.lng], {
        radius: station.primary ? 8 : 6,
        color: guide.color || '#0f172a',
        fillColor: station.primary ? '#ffffff' : guide.accentColor || '#38bdf8',
        fillOpacity: 1,
        weight: station.primary ? 4 : 3,
      }).addTo(state.railLayer);
      marker.bindTooltip(escapeHtml(station.label || station.name), {
        permanent: Boolean(station.primary),
        direction: 'top',
        className: 'rail-tooltip',
        offset: [0, -6],
      });
      marker.bindPopup(() => railStationPopup(guide, station));
      bounds.extend([station.lat, station.lng]);
    }
  }

  state.selectedBounds = bounds.isValid() ? bounds : null;
  el.transitInfo.textContent = `${guide.shortName || guide.name} · istasyonlar belirgin · saat için Trenitalia`;
  if (state.selectedBounds) {
    state.map.fitBounds(state.selectedBounds, { padding: [32, 32], maxZoom: 13 });
  }
}

function routePopup(route, direction) {
  const headsign = direction.headsign
    ? `<p class="popup-text"><strong>Yön:</strong> ${escapeHtml(direction.headsign)}</p>`
    : '';
  return `
    <h3 class="popup-title">GTT ${escapeHtml(route.shortName || route.longName || route.id)}</h3>
    <div class="popup-cat"><span class="dot" style="--cat-color:${route.color || '#2563eb'}"></span>${escapeHtml(route.type || 'Hat')}</div>
    <p class="popup-text">${escapeHtml(route.longName || '')}</p>
    ${headsign}
    <p class="popup-text"><strong>Durak:</strong> ${direction.stops.length}</p>
    <p class="popup-text"><strong>Kaynak:</strong> GTT GTFS</p>`;
}

function stopPopup(route, direction, stop, index) {
  const headsign = direction.headsign ? ` · ${escapeHtml(direction.headsign)}` : '';
  return `
    <h3 class="popup-title">${escapeHtml(stop.name)}</h3>
    <div class="popup-cat"><span class="dot" style="--cat-color:${route.color || '#2563eb'}"></span>GTT ${escapeHtml(route.shortName || route.id)}${headsign}</div>
    <p class="popup-text"><strong>Sıra:</strong> ${index + 1} / ${direction.stops.length}</p>
    <div class="popup-links">
      <a href="${mapsUrl(stop.lat, stop.lng)}" target="_blank" rel="noreferrer">Google Maps</a>
      <a href="https://www.openstreetmap.org/?mlat=${stop.lat}&mlon=${stop.lng}#map=17/${stop.lat}/${stop.lng}" target="_blank" rel="noreferrer">OSM</a>
    </div>`;
}

function railGuidePopup(guide, segment) {
  return `
    <h3 class="popup-title">${escapeHtml(guide.shortName || guide.name)}</h3>
    <div class="popup-cat"><span class="dot" style="--cat-color:${guide.accentColor || guide.color}"></span>${escapeHtml(guide.type || 'Tren rotası')}</div>
    <p class="popup-text">${escapeHtml(segment.name || guide.description || '')}</p>
    <p class="popup-text"><strong>Not:</strong> Bu çizgi istasyon bazlı rota rehberidir; saat ve peron için Trenitalia ekranını kontrol et.</p>
    <p class="popup-text"><strong>Kaynak:</strong> ${escapeHtml(guide.source || 'Trenitalia / OSM')}</p>`;
}

function railStationPopup(guide, station) {
  return `
    <h3 class="popup-title">${escapeHtml(station.name)}</h3>
    <div class="popup-cat"><span class="dot" style="--cat-color:${guide.accentColor || guide.color}"></span>${escapeHtml(guide.shortName || guide.name)}</div>
    <div class="popup-links">
      <a href="${mapsUrl(station.lat, station.lng)}" target="_blank" rel="noreferrer">Google Maps</a>
      <a href="https://www.openstreetmap.org/?mlat=${station.lat}&mlon=${station.lng}#map=17/${station.lat}/${station.lng}" target="_blank" rel="noreferrer">OSM</a>
    </div>`;
}

function locateUser() {
  if (!navigator.geolocation) {
    el.transitInfo.textContent = 'Konum servisi bu tarayıcıda yok.';
    return;
  }
  state.map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
  state.map.once('locationfound', (event) => {
    L.circleMarker(event.latlng, {
      radius: 8,
      color: '#0f766e',
      fillColor: '#0f766e',
      fillOpacity: 0.25,
      weight: 3,
    }).addTo(state.map).bindPopup('Buradasın').openPopup();
  });
  state.map.once('locationerror', () => {
    el.transitInfo.textContent = 'Konum alınamadı. Telefonda konum iznini aç.';
  });
}

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

function osmUrl(poi) {
  if (poi.osm?.type && poi.osm?.id) return `https://www.openstreetmap.org/${poi.osm.type}/${poi.osm.id}`;
  return `https://www.openstreetmap.org/?mlat=${poi.lat}&mlon=${poi.lng}#map=17/${poi.lat}/${poi.lng}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  });
}
