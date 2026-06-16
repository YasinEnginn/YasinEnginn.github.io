const CORE_DATA_URL = './data/pois-core.json';
const TRANSIT_URL = './data/transit.json';
const GUIDE_URL = './data/erasmus-guide.json';
const APP_CACHE_NAME = 'torino-erasmus-map-v11';
const FAVORITES_KEY = 'torino-erasmus-map:favorites:v1';
const PRAYER_CACHE_KEY = 'torino-erasmus-map:prayer:v1';
const PRAYER_LAST_CACHE_KEY = 'torino-erasmus-map:prayer:last:v1';
const PRAYER_METHOD_KEY = 'torino-erasmus-map:prayer-method:v1';
const DATA_VERSION_KEY = 'torino-erasmus-map:data-generated-at:v1';
const CHECKLIST_KEY = 'torino-erasmus-map:checklist:v1';
const NOTES_KEY = 'torino-erasmus-map:private-notes:v1';
const PRIVATE_MODE_KEY = 'torino-erasmus-map:private-mode:v1';
const LOW_POWER_KEY = 'torino-erasmus-map:low-power:v1';
const RECENT_SEARCHES_KEY = 'torino-erasmus-map:recent-searches:v1';
const INSTALL_DISMISSED_KEY = 'torino-erasmus-map:install-dismissed:v1';
const SHEET_LEVELS = new Set(['compact', 'mid', 'full']);
const DEFAULT_COORDS = {
  lat: 45.0703,
  lng: 7.6869,
  label: 'Torino',
  timeZone: 'Europe/Rome',
};
const TILE_PROVIDER = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
};
const DEFAULT_PRAYER_METHOD = 13;
const PRAYER_SCHOOL = 1;
const PRAYER_METHODS = [
  { id: 13, label: 'Diyanet' },
  { id: 3, label: 'Muslim World League' },
  { id: 2, label: 'ISNA' },
  { id: 4, label: 'Umm al-Qura' },
  { id: 5, label: 'Egyptian General Authority' },
];
const PRAYERS = [
  ['Fajr', 'İmsak'],
  ['Dhuhr', 'Öğle'],
  ['Asr', 'İkindi'],
  ['Maghrib', 'Akşam'],
  ['Isha', 'Yatsı'],
];
const KAABA = { lat: 21.422487, lng: 39.826206 };
const SHOP_LABELS = {
  supermarket: 'süpermarket / günlük market',
  books: 'kitapçı',
  electronics: 'elektronik ve telefon aksesuar mağazası',
  second_hand: 'ikinci el mağazası',
  department_store: 'çok katlı mağaza',
  mall: 'alışveriş merkezi',
  charity: 'bağış / ikinci el mağazası',
  copyshop: 'fotokopi ve baskı noktası',
  auction_house: 'açık artırma / antika satış noktası',
  chemist: 'kişisel bakım ve eczane benzeri mağaza',
};
const AMENITY_LABELS = {
  pharmacy: 'eczane',
  university: 'üniversite / kampüs birimi',
  college: 'okul / kolej birimi',
  post_office: 'posta ofisi',
  marketplace: 'pazar alanı',
  police: 'polis / karakol birimi',
  clinic: 'klinik / sağlık merkezi',
  hospital: 'hastane',
  library: 'kütüphane / çalışma alanı',
  place_of_worship: 'ibadet yeri',
  bank: 'banka / ATM noktası',
  bus_station: 'otobüs terminali',
  ferry_terminal: 'nehir / feribot iskelesi',
  theatre: 'tiyatro / sahne',
  arts_centre: 'sanat merkezi',
  cafe: 'kafe',
  restaurant: 'restoran',
  fast_food: 'hızlı yemek noktası',
};
const TOURISM_LABELS = {
  museum: 'müze',
  attraction: 'turistik nokta',
  artwork: 'kamusal sanat eseri',
  gallery: 'galeri',
  viewpoint: 'manzara noktası',
};
const HISTORIC_LABELS = {
  monument: 'anıt',
  memorial: 'anı / hatıra noktası',
  castle: 'kale veya saray yapısı',
  ruins: 'tarihi kalıntı',
  archaeological_site: 'arkeolojik alan',
  locomotive: 'tarihi lokomotif / ulaşım mirası',
  tomb: 'tarihi mezar / anıt mezar',
  city_gate: 'tarihi şehir kapısı',
  yes: 'tarihi yapı',
};
const LEISURE_LABELS = {
  park: 'park',
  garden: 'bahçe',
  nature_reserve: 'doğa koruma alanı',
};
const DISCOUNT_BRANDS = new Set([
  'aldi',
  'dico',
  'ekom',
  'eurospin',
  "in's mercato",
  'lidl',
  'md',
  'penny',
  'pen ny',
]);
const OPTIONAL_DATASETS = {
  museum: './data/pois-museum.json',
  history: './data/pois-history.json',
  park: './data/pois-park.json',
  view: './data/pois-view.json',
  shopping: './data/pois-shopping.json',
  practical: './data/pois-practical.json',
};
const CORE_CATEGORIES = [
  'personal',
  'emergency',
  'highlight',
  'cheap',
  'student',
  'official',
  'transport',
  'atm',
  'gtt',
  'mosque',
  'halal',
  'food',
  'outside',
];
const INTENT_FILTERS = [
  { id: 'start', label: 'Başlangıç', categories: ['personal', 'official', 'transport', 'gtt', 'food', 'emergency'] },
  { id: 'daily', label: 'Günlük Yaşam', categories: ['cheap', 'shopping', 'practical', 'atm', 'student'] },
  { id: 'transport', label: 'Ulaşım', categories: ['transport', 'gtt', 'personal'] },
  { id: 'food', label: 'Yemek', categories: ['food', 'cheap', 'halal', 'shopping'] },
  { id: 'paperwork', label: 'Resmi İşler', categories: ['official', 'practical', 'gtt', 'atm', 'personal'] },
  { id: 'discover', label: 'Keşif', categories: ['highlight', 'museum', 'history', 'park', 'view', 'outside'] },
  { id: 'faith', label: 'İnanç', categories: ['mosque', 'halal'] },
];
const SEARCH_ALIASES = {
  yurt: ['residenza', 'residence', 'borsellino', 'konaklama'],
  kampus: ['campus', 'politecnico', 'polito', 'universite'],
  okul: ['politecnico', 'polito', 'student', 'universite'],
  market: ['supermarket', 'lidl', 'aldi', 'eurospin', "in's mercato"],
  eczane: ['pharmacy', 'farmacia', 'salute'],
  yemek: ['mensa', 'edisu', 'food', 'restaurant', 'pizza', 'kebab'],
  helal: ['halal', 'kebab', 'ethnic supermarket'],
  sim: ['tim', 'vodafone', 'iliad', 'windtre', 'electronics'],
  ulasim: ['gtt', 'metro', 'tram', 'bus', 'porta susa', 'train'],
  resmi: ['permesso', 'fiscal code', 'questura', 'edisu', 'polito'],
  atm: ['bnl', 'bnp paribas', 'bank'],
};
const REDUCED_MOTION_QUERY = window.matchMedia?.('(prefers-reduced-motion: reduce)');

const state = {
  data: null,
  guide: null,
  transit: null,
  transitPromise: null,
  transitStopIndex: null,
  loadedDatasets: new Set(['core']),
  datasetPromises: new Map(),
  map: null,
  cluster: null,
  transitLayer: null,
  railLayer: null,
  markers: new Map(),
  active: new Set(),
  favorites: new Set(),
  checklist: new Set(),
  showFavorites: false,
  lowPower: false,
  privateMode: true,
  modeId: '',
  intentId: '',
  fuse: null,
  searchIndexReady: false,
  searchIndexDatasetSize: 0,
  searchIndexTimer: null,
  searchWarmupStarted: false,
  renderTimer: null,
  networkTimer: null,
  waitingWorker: null,
  deferredInstallPrompt: null,
  refreshOnControllerChange: false,
  toastAction: 'reload',
  selectedBounds: null,
  prayer: {
    coords: DEFAULT_COORDS,
    timings: null,
    next: null,
    method: DEFAULT_PRAYER_METHOD,
  },
};

const el = {
  appShell: document.getElementById('appShell'),
  loadStatus: document.getElementById('loadStatus'),
  categoryList: document.getElementById('categoryList'),
  searchInput: document.getElementById('searchInput'),
  recentSearches: document.getElementById('recentSearches'),
  intentFilters: document.getElementById('intentFilters'),
  poiList: document.getElementById('poiList'),
  resultCount: document.getElementById('resultCount'),
  routeSelect: document.getElementById('routeSelect'),
  routeMeta: document.getElementById('routeMeta'),
  transitInfo: document.getElementById('transitInfo'),
  airportRailBtn: document.getElementById('airportRailBtn'),
  metroBtn: document.getElementById('metroBtn'),
  locateBtn: document.getElementById('locateBtn'),
  emergencyBtn: document.getElementById('emergencyBtn'),
  lowPowerBtn: document.getElementById('lowPowerBtn'),
  guideMeta: document.getElementById('guideMeta'),
  dailyModes: document.getElementById('dailyModes'),
  searchPresets: document.getElementById('searchPresets'),
  guideAlerts: document.getElementById('guideAlerts'),
  emergencyPanel: document.getElementById('emergencyPanel'),
  emergencyNumbers: document.getElementById('emergencyNumbers'),
  savedAddresses: document.getElementById('savedAddresses'),
  emergencyPhrases: document.getElementById('emergencyPhrases'),
  quickRoutes: document.getElementById('quickRoutes'),
  gttTools: document.getElementById('gttTools'),
  transitPasses: document.getElementById('transitPasses'),
  foodGuide: document.getElementById('foodGuide'),
  officialLinks: document.getElementById('officialLinks'),
  checklistPanel: document.getElementById('checklistPanel'),
  notesBox: document.getElementById('notesBox'),
  privateNotes: document.getElementById('privateNotes'),
  privateModeToggle: document.getElementById('privateModeToggle'),
  clearPrivateNotes: document.getElementById('clearPrivateNotes'),
  privacyWarnings: document.getElementById('privacyWarnings'),
  showCore: document.getElementById('showCore'),
  showAll: document.getElementById('showAll'),
  favoritesOnly: document.getElementById('favoritesOnly'),
  resetMap: document.getElementById('resetMap'),
  clearRoute: document.getElementById('clearRoute'),
  focusRoute: document.getElementById('focusRoute'),
  stopSearchInput: document.getElementById('stopSearchInput'),
  stopSearchResults: document.getElementById('stopSearchResults'),
  prayerMeta: document.getElementById('prayerMeta'),
  prayerMethod: document.getElementById('prayerMethod'),
  nextPrayerName: document.getElementById('nextPrayerName'),
  nextPrayerTime: document.getElementById('nextPrayerTime'),
  nextPrayerCountdown: document.getElementById('nextPrayerCountdown'),
  prayerTimes: document.getElementById('prayerTimes'),
  prayerNote: document.getElementById('prayerNote'),
  qiblaArrow: document.getElementById('qiblaArrow'),
  qiblaDegree: document.getElementById('qiblaDegree'),
  qiblaText: document.getElementById('qiblaText'),
  qiblaSensorStatus: document.getElementById('qiblaSensorStatus'),
  refreshPrayer: document.getElementById('refreshPrayer'),
  prayerLocation: document.getElementById('prayerLocation'),
  sheetButtons: document.querySelectorAll('[data-sheet-level]'),
  offlineBanner: document.getElementById('offlineBanner'),
  updateToast: document.getElementById('updateToast'),
  updateToastText: document.getElementById('updateToastText'),
  applyUpdate: document.getElementById('applyUpdate'),
  dismissUpdate: document.getElementById('dismissUpdate'),
  installPrompt: document.getElementById('installPrompt'),
  installApp: document.getElementById('installApp'),
  dismissInstall: document.getElementById('dismissInstall'),
  appAnnouncements: document.getElementById('appAnnouncements'),
  categorySummary: document.getElementById('categorySummary'),
};

init().catch((error) => {
  console.error(error);
  el.loadStatus.textContent = 'Hata';
  el.transitInfo.textContent = 'Harita verisi yüklenemedi. İnternet bağlantısını ve dosya yolunu kontrol et.';
});

async function init() {
  const [appData, guideData] = await Promise.all([loadJson(CORE_DATA_URL), fetchOptionalJson(GUIDE_URL)]);
  state.data = appData;
  state.data.fullStats = state.data.fullStats || state.data.stats;
  state.guide = guideData || {};
  mergeGuideData();
  handleDataVersion([state.data.generatedAt, state.guide.generatedAt].filter(Boolean).join('|'));
  state.active = new Set(categoryKeys().filter((key) => state.data.categoryMeta[key].default));
  state.favorites = loadFavorites();
  state.checklist = loadChecklist();
  state.lowPower = readStorageValue(LOW_POWER_KEY) === 'true';
  state.privateMode = readStorageValue(PRIVATE_MODE_KEY) !== 'false';
  const savedPrayerMethod = Number(readStorageValue(PRAYER_METHOD_KEY));
  if (PRAYER_METHODS.some((method) => method.id === savedPrayerMethod)) {
    state.prayer.method = savedPrayerMethod;
  }

  initMap();
  initSearch();
  initCategories();
  initGuidePanels();
  initEvents();
  syncLowPowerUi();
  render();
  markReady();
  initPrayer();
  registerServiceWorker();
}

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`JSON load error: ${url} ${response.status}`);
  return response.json();
}

async function fetchOptionalJson(url) {
  try {
    return await loadJson(url);
  } catch (error) {
    console.warn('Optional guide data unavailable', error);
    return null;
  }
}

function mergeGuideData() {
  if (!state.data || !state.guide) return;

  state.data.categoryMeta = {
    ...state.data.categoryMeta,
    ...(state.guide.categoryMeta || {}),
  };
  state.data.sources = [...(state.data.sources || []), ...(state.guide.sources || [])];

  const guidePois = (state.guide.pois || []).map((poi) => ({
    source: 'Erasmus Guide',
    ...poi,
  }));
  if (guidePois.length) {
    state.data.pois = [...guidePois, ...state.data.pois];
    state.data.fullStats = addPoiCountsToStats(state.data.fullStats, guidePois);
  }
  recomputeStats();
}

function recomputeStats() {
  const categories = {};
  for (const poi of state.data.pois) {
    categories[poi.category] = (categories[poi.category] || 0) + 1;
  }
  state.data.stats = {
    ...(state.data.stats || {}),
    total: state.data.pois.length,
    categories,
  };
}

function addPoiCountsToStats(stats, pois) {
  const next = {
    total: stats?.total || 0,
    osm: stats?.osm || 0,
    curated: stats?.curated || 0,
    categories: { ...(stats?.categories || {}) },
  };
  for (const poi of pois || []) {
    next.total += 1;
    next.categories[poi.category] = (next.categories[poi.category] || 0) + 1;
    if (poi.source === 'OSM') next.osm += 1;
    else next.curated += 1;
  }
  return next;
}

function markReady() {
  el.loadStatus.textContent = `${state.data.stats.total}/${state.data.fullStats?.total || state.data.stats.total} nokta`;
  el.loadStatus.classList.add('is-ready');
  el.routeMeta.textContent = 'İstek üzerine';
  el.transitInfo.textContent = 'Hat seçiciye dokununca GTT verisi yüklenir.';
}

function initMap() {
  state.map = L.map('map', {
    attributionControl: false,
    zoomControl: true,
    preferCanvas: true,
    zoomAnimation: !prefersReducedMotion(),
    markerZoomAnimation: !prefersReducedMotion(),
  }).setView(state.data.center, 12);

  L.control.attribution({ position: 'topright' }).addTo(state.map);

  L.tileLayer(TILE_PROVIDER.url, {
    maxZoom: TILE_PROVIDER.maxZoom,
    attribution: TILE_PROVIDER.attribution,
  }).addTo(state.map);

  state.cluster = L.markerClusterGroup({
    maxClusterRadius: 45,
    chunkedLoading: true,
    chunkDelay: 32,
    chunkInterval: 160,
    showCoverageOnHover: false,
    spiderfyDistanceMultiplier: 1.25,
    animate: !prefersReducedMotion(),
  }).addTo(state.map);

  state.transitLayer = L.layerGroup().addTo(state.map);
  state.railLayer = L.layerGroup().addTo(state.map);
}

function initSearch() {
  state.fuse = null;
  state.searchIndexReady = false;
  state.searchIndexDatasetSize = 0;
}

function ensureSearchIndex() {
  if (!window.Fuse) return;
  if (state.searchIndexReady && state.searchIndexDatasetSize === state.data.pois.length) return;
  state.fuse = new Fuse(state.data.pois, {
    keys: ['name', 'category', 'description', 'address', 'tags'],
    threshold: 0.33,
    ignoreLocation: true,
  });
  state.searchIndexReady = true;
  state.searchIndexDatasetSize = state.data.pois.length;
}

function scheduleSearchIndexBuild() {
  if (state.searchIndexTimer) {
    if ('cancelIdleCallback' in window) window.cancelIdleCallback(state.searchIndexTimer);
    else window.clearTimeout(state.searchIndexTimer);
  }
  const run = () => ensureSearchIndex();
  if ('requestIdleCallback' in window) {
    state.searchIndexTimer = window.requestIdleCallback(run, { timeout: 1200 });
  } else {
    state.searchIndexTimer = window.setTimeout(run, 0);
  }
}

function invalidateSearchIndex() {
  state.fuse = null;
  state.searchIndexReady = false;
  state.searchIndexDatasetSize = 0;
}

function initCategories() {
  el.categoryList.innerHTML = '';
  for (const key of categoryKeys()) {
    const meta = state.data.categoryMeta[key];
    const count = categoryCount(key);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cat-btn';
    button.dataset.category = key;
    button.style.setProperty('--cat-color', meta.color);
    button.setAttribute('aria-pressed', state.active.has(key) ? 'true' : 'false');
    button.dataset.loaded = isCategoryLoaded(key) ? 'true' : 'false';
    button.title = meta.label;
    button.setAttribute('aria-label', `${meta.label}, ${count} nokta`);
    button.innerHTML = `<span class="dot"></span><span>${escapeHtml(meta.label)} <small>${count}</small></span>`;
    button.addEventListener('click', async () => {
      await toggleCategory(key);
    });
    el.categoryList.appendChild(button);
  }
  updateCategorySummary();
}

async function toggleCategory(category) {
  const nextActive = !state.active.has(category);
  if (nextActive) {
    await ensureCategoryDataset(category);
    state.active.add(category);
  } else {
    state.active.delete(category);
  }
  state.modeId = '';
  state.intentId = '';
  state.showFavorites = false;
  syncCategoryButtons();
  syncModeButtons();
  syncIntentButtons();
  render();
}

async function ensureCategoryDataset(category, options = {}) {
  const url = OPTIONAL_DATASETS[category];
  if (!url || state.loadedDatasets.has(category)) return;
  if (state.datasetPromises.has(category)) return state.datasetPromises.get(category);

  const promise = loadJson(url)
    .then((dataset) => {
      appendPois(dataset.pois || []);
      state.loadedDatasets.add(category);
      invalidateSearchIndex();
      syncCategoryButtons();
      if (!options.silent) {
        announce(`${state.data.categoryMeta[category]?.label || category} verisi yuklendi.`);
      }
    })
    .catch((error) => {
      console.error(error);
      el.transitInfo.textContent = 'Kategori verisi yuklenemedi. Baglantiyi kontrol edip tekrar dene.';
      throw error;
    })
    .finally(() => {
      state.datasetPromises.delete(category);
      syncCategoryButtons();
      markReady();
    });

  state.datasetPromises.set(category, promise);
  syncCategoryButtons();
  markReady();
  return promise;
}

async function ensureCategoriesLoaded(categories, options = {}) {
  const unique = [...new Set(categories || [])].filter((category) => OPTIONAL_DATASETS[category]);
  await Promise.all(unique.map((category) => ensureCategoryDataset(category, options)));
}

async function ensureAllCategoryDatasets(options = {}) {
  await ensureCategoriesLoaded(Object.keys(OPTIONAL_DATASETS), options);
}

function appendPois(pois) {
  if (!pois.length) return;
  const seen = new Set(state.data.pois.map((poi) => poi.id));
  const nextPois = [];
  for (const poi of pois) {
    if (!poi?.id || seen.has(poi.id)) continue;
    seen.add(poi.id);
    nextPois.push(poi);
  }
  if (!nextPois.length) return;
  state.data.pois = [...state.data.pois, ...nextPois];
  recomputeStats();
}

function categoryCount(category) {
  return state.data.fullStats?.categories?.[category] || state.data.stats.categories[category] || 0;
}

function isCategoryLoaded(category) {
  return !OPTIONAL_DATASETS[category] || state.loadedDatasets.has(category);
}

function isCategoryLoading(category) {
  return state.datasetPromises.has(category);
}

function warmSearchDatasets() {
  if (state.searchWarmupStarted) return;
  state.searchWarmupStarted = true;
  ensureAllCategoryDatasets({ silent: true })
    .then(() => {
      scheduleSearchIndexBuild();
      if (el.searchInput.value.trim()) render();
    })
    .catch(() => {
      state.searchWarmupStarted = false;
    });
}

function setSheetLevel(level) {
  if (!SHEET_LEVELS.has(level)) return;
  document.body.classList.remove('sheet-compact', 'sheet-mid', 'sheet-full');
  document.body.classList.add(`sheet-${level}`);
  el.sheetButtons.forEach((button) => {
    button.setAttribute('aria-pressed', button.dataset.sheetLevel === level ? 'true' : 'false');
  });
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 880px)').matches;
}

function prefersReducedMotion() {
  return Boolean(REDUCED_MOTION_QUERY?.matches);
}

function updateNetworkBanner() {
  const offline = !navigator.onLine;
  setOfflineBanner(offline);
  if (!offline) {
    window.clearTimeout(state.networkTimer);
    state.networkTimer = window.setTimeout(checkConnectivity, 250);
  }
}

function setOfflineBanner(offline) {
  el.offlineBanner.hidden = !offline;
  if (offline) {
    announce('Çevrimdışı mod açık. Harita altlığı gelmeyebilir; kayıtlı noktalar çalışır.');
  }
}

async function checkConnectivity() {
  try {
    await fetch(`./manifest.webmanifest?__ping=${Date.now()}`, {
      cache: 'no-store',
    });
    setOfflineBanner(false);
  } catch {
    setOfflineBanner(true);
  }
}

function showUpdateToast(message, action = 'reload') {
  state.toastAction = action;
  el.updateToastText.textContent = message;
  el.updateToast.hidden = false;
  announce(message);
}

function hideUpdateToast() {
  el.updateToast.hidden = true;
}

function applyUpdateToastAction() {
  if (state.toastAction === 'service-worker' && state.waitingWorker) {
    state.refreshOnControllerChange = true;
    state.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    return;
  }
  window.location.reload();
}

function announce(message) {
  if (!el.appAnnouncements) return;
  el.appAnnouncements.textContent = '';
  window.setTimeout(() => {
    el.appAnnouncements.textContent = message;
  }, 20);
}

function handleDataVersion(generatedAt) {
  if (!generatedAt) return;
  try {
    const previous = localStorage.getItem(DATA_VERSION_KEY);
    localStorage.setItem(DATA_VERSION_KEY, generatedAt);
    if (previous && previous !== generatedAt) {
      clearOldAppCaches();
      showUpdateToast('Harita verisi güncellendi. En temiz sürüm için yenileyebilirsin.', 'reload');
    }
  } catch {
    // Local storage can be unavailable in some privacy modes.
  }
}

function clearOldAppCaches() {
  if (!('caches' in window)) return;
  caches.keys()
    .then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('torino-erasmus-map-') && key !== APP_CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    )
    .catch(() => {});
}

function initEvents() {
  el.searchInput.addEventListener('input', () => {
    state.modeId = '';
    state.intentId = '';
    syncModeButtons();
    syncIntentButtons();
    if (el.searchInput.value.trim() && isMobileViewport()) setSheetLevel('full');
    if (el.searchInput.value.trim().length >= 2) warmSearchDatasets();
    scheduleRender();
  });
  el.searchInput.addEventListener('focus', () => {
    scheduleSearchIndexBuild();
    if (isMobileViewport() && document.body.classList.contains('sheet-compact')) setSheetLevel('mid');
  });
  el.searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    saveRecentSearch(el.searchInput.value);
  });
  el.searchInput.addEventListener('blur', () => saveRecentSearch(el.searchInput.value));
  el.sheetButtons.forEach((button) => {
    button.addEventListener('click', () => setSheetLevel(button.dataset.sheetLevel));
  });
  el.showAll.addEventListener('click', async () => {
    state.modeId = '';
    state.intentId = '';
    await ensureAllCategoryDatasets();
    state.active = new Set(categoryKeys());
    state.showFavorites = false;
    syncCategoryButtons();
    syncModeButtons();
    syncIntentButtons();
    render();
  });
  el.showCore.addEventListener('click', async () => {
    state.modeId = '';
    state.intentId = '';
    await ensureCategoriesLoaded(CORE_CATEGORIES);
    state.active = new Set(CORE_CATEGORIES);
    state.showFavorites = false;
    syncCategoryButtons();
    syncModeButtons();
    syncIntentButtons();
    render();
  });
  el.favoritesOnly.addEventListener('click', async () => {
    state.modeId = '';
    state.intentId = '';
    state.showFavorites = !state.showFavorites;
    if (state.showFavorites) await ensureAllCategoryDatasets();
    syncModeButtons();
    syncIntentButtons();
    render();
  });
  el.resetMap.addEventListener('click', () => {
    state.modeId = '';
    state.intentId = '';
    state.active = new Set(categoryKeys().filter((key) => state.data.categoryMeta[key].default));
    state.showFavorites = false;
    el.searchInput.value = '';
    syncCategoryButtons();
    syncModeButtons();
    syncIntentButtons();
    clearRouteLayers();
    state.map.setView(state.data.center, 12, { animate: !prefersReducedMotion() });
    render();
  });
  el.locateBtn.addEventListener('click', locateUser);
  el.emergencyBtn.addEventListener('click', () => activateEmergencyMode());
  el.lowPowerBtn.addEventListener('click', () => toggleLowPower());
  el.airportRailBtn.addEventListener('click', () => drawRailGuide('airport-train'));
  el.metroBtn.addEventListener('click', showMetro);
  el.routeSelect.addEventListener('pointerdown', () => ensureTransit());
  el.routeSelect.addEventListener('focus', () => ensureTransit());
  el.routeSelect.addEventListener('change', () => drawRoute(el.routeSelect.value));
  el.stopSearchInput?.addEventListener('focus', () => ensureTransit().then(renderStopSearchResults).catch(() => {}));
  el.stopSearchInput?.addEventListener('input', () => ensureTransit().then(renderStopSearchResults).catch(() => {}));
  el.clearRoute.addEventListener('click', () => {
    el.routeSelect.value = '';
    clearRouteLayers();
  });
  el.focusRoute.addEventListener('click', () => {
    if (state.selectedBounds) {
      state.map.fitBounds(state.selectedBounds, { padding: [32, 32], maxZoom: 15, animate: !prefersReducedMotion() });
    }
  });
  el.refreshPrayer.addEventListener('click', () => loadPrayerTimes(state.prayer.coords, { force: true }));
  el.prayerLocation.addEventListener('click', useCurrentLocationForPrayer);
  el.prayerMethod?.addEventListener('change', () => {
    const nextMethod = Number(el.prayerMethod.value);
    if (!PRAYER_METHODS.some((method) => method.id === nextMethod)) return;
    state.prayer.method = nextMethod;
    try {
      localStorage.setItem(PRAYER_METHOD_KEY, String(nextMethod));
    } catch {
      // The selection still applies for this session.
    }
    loadPrayerTimes(state.prayer.coords, { force: true });
  });
  el.applyUpdate.addEventListener('click', applyUpdateToastAction);
  el.dismissUpdate.addEventListener('click', hideUpdateToast);
  el.installApp?.addEventListener('click', installApp);
  el.dismissInstall?.addEventListener('click', dismissInstallPrompt);
  el.privateNotes?.addEventListener('input', () => savePrivateNotes(el.privateNotes.value));
  el.privateModeToggle?.addEventListener('change', () => {
    state.privateMode = Boolean(el.privateModeToggle.checked);
    try {
      localStorage.setItem(PRIVATE_MODE_KEY, String(state.privateMode));
    } catch {
      // Visible privacy state still changes for this session.
    }
    syncPrivateModeUi();
  });
  el.clearPrivateNotes?.addEventListener('click', () => clearPrivateNotes());
  window.addEventListener('online', updateNetworkBanner);
  window.addEventListener('offline', updateNetworkBanner);
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('change', handleDocumentChange);
  setSheetLevel('mid');
  updateNetworkBanner();
  if (document.body.dataset.offlineFallback === 'true') setOfflineBanner(true);
}

function initGuidePanels() {
  const guide = state.guide || {};
  if (el.guideMeta) {
    el.guideMeta.textContent = guide.lastReviewed ? `Kontrol: ${formatDate(guide.lastReviewed)}` : 'Offline hazir';
  }
  renderDailyModes();
  renderIntentFilters();
  renderSearchPresets();
  renderRecentSearches();
  renderGuideAlerts();
  renderEmergencyPanel();
  renderQuickRoutes();
  renderTransitTools();
  renderFoodGuide();
  renderOfficialLinks();
  renderChecklist();
  renderPrivacyPanel();
  renderPrayerMethodOptions();
  if (el.privateNotes) el.privateNotes.value = loadPrivateNotes();
  syncPrivateModeUi();
}

function renderDailyModes() {
  if (!el.dailyModes) return;
  const modes = state.guide?.dailyModes || [];
  el.dailyModes.innerHTML = modes.map((mode) => `
    <button class="mode-chip" type="button" data-mode-id="${escapeAttr(mode.id)}" aria-pressed="${state.modeId === mode.id ? 'true' : 'false'}">
      ${escapeHtml(mode.label)}
    </button>
  `).join('');
}

function renderIntentFilters() {
  if (!el.intentFilters) return;
  el.intentFilters.innerHTML = INTENT_FILTERS.map((intent) => `
    <button class="intent-chip" type="button" data-intent-id="${escapeAttr(intent.id)}" aria-pressed="${state.intentId === intent.id ? 'true' : 'false'}">
      ${escapeHtml(intent.label)}
    </button>
  `).join('');
}

function renderSearchPresets() {
  if (!el.searchPresets) return;
  const presets = state.guide?.searchPresets || [];
  el.searchPresets.innerHTML = presets.map((preset) => `
    <button class="preset-chip" type="button" data-search-preset="${escapeAttr(preset.query)}">
      ${escapeHtml(preset.label)}
    </button>
  `).join('');
}

function renderRecentSearches() {
  if (!el.recentSearches) return;
  const searches = loadRecentSearches();
  if (!searches.length) {
    el.recentSearches.innerHTML = '';
    return;
  }
  el.recentSearches.innerHTML = searches.map((query) => `
    <button class="recent-chip" type="button" data-recent-query="${escapeAttr(query)}">${escapeHtml(query)}</button>
  `).join('');
}

function renderGuideAlerts() {
  if (!el.guideAlerts) return;
  el.guideAlerts.innerHTML = (state.guide?.alerts || [])
    .map((alert) => `<div class="guide-alert">${escapeHtml(alert)}</div>`)
    .join('');
}

function renderEmergencyPanel() {
  if (el.emergencyNumbers) {
    el.emergencyNumbers.innerHTML = (state.guide?.emergencyNumbers || []).map((item) => `
      <a class="call-link" href="tel:${escapeAttr(item.label)}">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.detail)}</span>
      </a>
    `).join('');
  }

  if (el.savedAddresses) {
    el.savedAddresses.innerHTML = (state.guide?.savedAddresses || []).map((item) => `
      <div class="address-item">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.value)}</span>
        ${item.phone ? `<small>${escapeHtml(item.phone)}</small>` : ''}
      </div>
    `).join('');
  }

  if (el.emergencyPhrases) {
    el.emergencyPhrases.innerHTML = (state.guide?.phrases || []).map((item) => `
      <div class="phrase-item">
        <strong>${escapeHtml(item.it)}</strong>
        <span>${escapeHtml(item.tr)}</span>
      </div>
    `).join('');
  }
}

function renderQuickRoutes() {
  if (!el.quickRoutes) return;
  el.quickRoutes.innerHTML = (state.guide?.quickRoutes || []).map((route) => `
    <a class="route-link" href="${escapeAttr(route.href)}" target="_blank" rel="noreferrer">${escapeHtml(route.label)}</a>
  `).join('');
}

function renderTransitTools() {
  if (el.gttTools) {
    el.gttTools.innerHTML = (state.guide?.transitTools || []).map((tool) => `
      <a class="tool-card" href="${escapeAttr(tool.href)}" target="_blank" rel="noreferrer">
        <strong>${escapeHtml(tool.label)}</strong>
        <span>${escapeHtml(tool.description || '')}</span>
      </a>
    `).join('');
  }

  if (el.transitPasses) {
    el.transitPasses.innerHTML = (state.guide?.transitPasses || []).map((pass) => `
      <div class="pass-card">
        <strong>${escapeHtml(pass.title)}</strong>
        <span>${escapeHtml(pass.detail || '')}</span>
        <a href="${escapeAttr(pass.href)}" target="_blank" rel="noreferrer">GTT fares</a>
      </div>
    `).join('');
  }
}

function renderFoodGuide() {
  if (!el.foodGuide) return;
  const guide = state.guide?.foodGuide || {};
  const alerts = (guide.alerts || []).map((alert) => `
    <div class="food-alert">
      <strong>Uyarı</strong>
      <span>${escapeHtml(alert)}</span>
    </div>
  `).join('');
  const links = (guide.links || []).map((link) => `
    <a class="food-link" href="${escapeAttr(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>
  `).join('');
  const canteens = (guide.canteens || []).map((name) => `
    <div class="canteen-chip"><strong>${escapeHtml(name)}</strong><span>EDISU mensa</span></div>
  `).join('');
  const searches = (guide.searches || []).map((item) => `
    <button class="food-search" type="button" data-search-preset="${escapeAttr(item.query)}">${escapeHtml(item.label)}</button>
  `).join('');

  el.foodGuide.innerHTML = `
    <div class="food-alerts">${alerts}</div>
    <div class="subsection-title">EDISU linkleri</div>
    <div class="food-link-grid">${links}</div>
    <div class="subsection-title">Torino mensaları</div>
    <div class="canteen-list">${canteens}</div>
    <div class="subsection-title">Ucuz yemek aramaları</div>
    <div class="food-search-grid">${searches}</div>
  `;
}

function renderOfficialLinks() {
  if (!el.officialLinks) return;
  el.officialLinks.innerHTML = (state.guide?.officialGroups || []).map((group) => `
    <div class="official-group">
      <strong>${escapeHtml(group.title)}</strong>
      <div class="official-link-list">
        ${(group.links || []).map((link) => `
          <a class="official-link" href="${escapeAttr(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderChecklist() {
  if (!el.checklistPanel) return;
  el.checklistPanel.innerHTML = (state.guide?.checklists || []).map((group) => `
    <div class="official-group">
      <strong>${escapeHtml(group.title)}</strong>
      ${(group.items || []).map((item) => `
        <label class="check-item">
          <input type="checkbox" data-check-id="${escapeAttr(item.id)}" ${state.checklist.has(item.id) ? 'checked' : ''}>
          <span>${escapeHtml(item.label)}</span>
        </label>
      `).join('')}
    </div>
  `).join('');
}

function renderPrivacyPanel() {
  if (!el.privacyWarnings) return;
  el.privacyWarnings.innerHTML = (state.guide?.privacyWarnings || [])
    .map((warning) => `<div class="privacy-item">${escapeHtml(warning)}</div>`)
    .join('');
}

function renderPrayerMethodOptions() {
  if (!el.prayerMethod) return;
  el.prayerMethod.innerHTML = PRAYER_METHODS.map((method) => `
    <option value="${method.id}" ${method.id === state.prayer.method ? 'selected' : ''}>${escapeHtml(method.label)}</option>
  `).join('');
}

async function applyDailyMode(modeId) {
  const mode = (state.guide?.dailyModes || []).find((item) => item.id === modeId);
  if (!mode) return;
  state.modeId = mode.id;
  state.intentId = '';
  state.showFavorites = false;
  el.searchInput.value = mode.query || '';
  if (Array.isArray(mode.categories) && mode.categories.length) {
    const categories = mode.categories.filter((category) => state.data.categoryMeta[category]);
    await ensureCategoriesLoaded(categories);
    state.active = new Set(categories);
  }
  syncCategoryButtons();
  syncModeButtons();
  syncIntentButtons();
  if (isMobileViewport()) setSheetLevel(mode.query ? 'full' : 'mid');
  render();
  announce(`${mode.label} modu acildi.`);
}

async function applyIntentFilter(intentId) {
  const intent = INTENT_FILTERS.find((item) => item.id === intentId);
  if (!intent) return;
  state.intentId = intent.id;
  state.modeId = '';
  state.showFavorites = false;
  el.searchInput.value = '';
  const categories = intent.categories.filter((category) => state.data.categoryMeta[category]);
  await ensureCategoriesLoaded(categories);
  state.active = new Set(categories);
  syncCategoryButtons();
  syncModeButtons();
  syncIntentButtons();
  if (isMobileViewport()) setSheetLevel('mid');
  render();
  announce(`${intent.label} odagi acildi.`);
}

function applySearchPreset(query) {
  state.modeId = '';
  state.intentId = '';
  state.showFavorites = false;
  el.searchInput.value = query || '';
  if (el.searchInput.value.trim()) warmSearchDatasets();
  syncModeButtons();
  syncIntentButtons();
  if (isMobileViewport()) setSheetLevel('full');
  saveRecentSearch(query);
  render();
}

async function activateEmergencyMode() {
  state.modeId = '';
  state.intentId = '';
  state.showFavorites = false;
  el.searchInput.value = '';
  const categories = ['emergency', 'official', 'personal', 'practical', 'transport'].filter((category) => state.data.categoryMeta[category]);
  await ensureCategoriesLoaded(categories);
  state.active = new Set(categories);
  syncCategoryButtons();
  syncModeButtons();
  syncIntentButtons();
  if (isMobileViewport()) setSheetLevel('full');
  el.emergencyPanel?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  render();
  announce('Acil mod acildi.');
}

function toggleLowPower(force) {
  state.lowPower = typeof force === 'boolean' ? force : !state.lowPower;
  try {
    localStorage.setItem(LOW_POWER_KEY, String(state.lowPower));
  } catch {
    // The visible mode still works for this session.
  }
  syncLowPowerUi();
  if (state.lowPower && isMobileViewport()) setSheetLevel('full');
  render();
  if (!state.lowPower) window.setTimeout(() => state.map?.invalidateSize(), 80);
}

function syncLowPowerUi() {
  document.body.classList.toggle('low-power', state.lowPower);
  if (!el.lowPowerBtn) return;
  el.lowPowerBtn.setAttribute('aria-pressed', state.lowPower ? 'true' : 'false');
  el.lowPowerBtn.textContent = state.lowPower ? 'Haritayi Ac' : 'Liste Modu';
}

function syncModeButtons() {
  document.querySelectorAll('[data-mode-id]').forEach((button) => {
    const active = button.dataset.modeId === state.modeId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function syncIntentButtons() {
  document.querySelectorAll('[data-intent-id]').forEach((button) => {
    const active = button.dataset.intentId === state.intentId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function loadChecklist() {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function saveChecklist() {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify([...state.checklist]));
  } catch {
    // Checklist remains in memory when storage is unavailable.
  }
}

function loadPrivateNotes() {
  return readStorageValue(NOTES_KEY) || '';
}

function savePrivateNotes(value) {
  if (!state.privateMode) return;
  try {
    localStorage.setItem(NOTES_KEY, value);
  } catch {
    // Private notes are intentionally local-only.
  }
}

function clearPrivateNotes() {
  try {
    localStorage.removeItem(NOTES_KEY);
  } catch {
    // The visible field can still be cleared.
  }
  if (el.privateNotes) el.privateNotes.value = '';
  announce('Yerel notlar temizlendi.');
}

function syncPrivateModeUi() {
  if (el.privateModeToggle) el.privateModeToggle.checked = state.privateMode;
  if (el.notesBox) el.notesBox.classList.toggle('is-private-off', !state.privateMode);
  if (el.privateNotes) {
    el.privateNotes.disabled = !state.privateMode;
    if (state.privateMode && !el.privateNotes.value) el.privateNotes.value = loadPrivateNotes();
  }
}

function readStorageValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function loadRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const searches = raw ? JSON.parse(raw) : [];
    return Array.isArray(searches) ? searches.filter(Boolean).slice(0, 4) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(value) {
  const query = String(value || '').trim();
  if (query.length < 2) return;
  const searches = [query, ...loadRecentSearches().filter((item) => item.toLocaleLowerCase('tr') !== query.toLocaleLowerCase('tr'))].slice(0, 4);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Recent searches are convenience-only.
  }
  renderRecentSearches();
}

function handleBeforeInstallPrompt(event) {
  event.preventDefault();
  state.deferredInstallPrompt = event;
  if (readStorageValue(INSTALL_DISMISSED_KEY) === 'true') return;
  if (el.installPrompt) el.installPrompt.hidden = false;
}

async function installApp() {
  if (!state.deferredInstallPrompt) {
    dismissInstallPrompt();
    return;
  }
  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice.catch(() => null);
  state.deferredInstallPrompt = null;
  dismissInstallPrompt();
}

function dismissInstallPrompt() {
  if (el.installPrompt) el.installPrompt.hidden = true;
  try {
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
  } catch {
    // The prompt can still be hidden for this session.
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function categoryKeys() {
  return Object.keys(state.data.categoryMeta).sort(
    (a, b) => (state.data.categoryMeta[a].rank ?? 999) - (state.data.categoryMeta[b].rank ?? 999),
  );
}

function buildPoiDetails(poi) {
  const tags = poi.osm?.tags || {};
  const type = inferPoiType(poi, tags);
  const use = inferPoiUse(poi, tags);
  const note = inferPoiNote(poi, tags);
  const items = [
    { label: 'Ne burası?', value: type },
    { label: 'Ne işine yarar?', value: use },
  ];

  const brand = tags.brand || tags.operator;
  if (brand) items.push({ label: 'Kurum/marka', value: brand });
  if (poi.address) items.push({ label: 'Adres', value: poi.address });
  if (tags.opening_hours) items.push({ label: 'Saat etiketi', value: tags.opening_hours });
  if (poi.cost) items.push({ label: 'Not/ücret', value: poi.cost });
  if (note) items.push({ label: 'Dikkat', value: note });

  const cleanItems = uniqueDetailItems(items).slice(0, 7);
  const summary = `${type}. ${use}`;
  return {
    summary,
    items: cleanItems,
    searchText: [summary, ...cleanItems.map((item) => `${item.label}: ${item.value}`)].join(' '),
  };
}

function getPoiDetails(poi) {
  if (!poi.details) poi.details = buildPoiDetails(poi);
  return poi.details;
}

function inferPoiType(poi, tags) {
  const meta = state.data.categoryMeta[poi.category];
  const categoryLabel = meta?.label || poi.category;
  const shop = tagLabel(tags.shop, SHOP_LABELS);
  const amenity = tagLabel(tags.amenity, AMENITY_LABELS);
  const tourism = tagLabel(tags.tourism, TOURISM_LABELS);
  const historic = tagLabel(tags.historic, HISTORIC_LABELS);
  const leisure = tagLabel(tags.leisure, LEISURE_LABELS);
  const haystack = poiText(poi, tags);

  if (poi.category === 'personal') {
    if (haystack.includes('yurt') || haystack.includes('konaklama')) return 'senin ana konaklama noktan olan öğrenci yurdu';
    if (haystack.includes('paolo giaccone') || haystack.includes('hoca')) return 'hocanla görüşme ve akademik iletişim için Politecnico ofis yönlendirmesi';
    if (haystack.includes('det') || haystack.includes('haberleşme')) return 'elektronik ve haberleşme bölümüyle ilgili akademik nokta';
    return 'senin Torino Erasmus planında ana referans noktan';
  }
  if (poi.category === 'emergency') return 'acil durumda hizli karar icin sabitlenmis hastane, eczane veya yardim noktasi';
  if (poi.category === 'official') return 'PoliTO, EDISU, oturum, sigorta veya ogrenci islemleri icin resmi referans noktasi';
  if (poi.category === 'atm') return 'TEB/CEPTETEB için işaretlenmiş BNL/BNP Paribas banka veya ATM noktası';
  if (poi.category === 'gtt') return 'resmi GTT müşteri merkezi ve BIP kart işlem noktası';
  if (poi.category === 'mosque') return 'cami veya Müslüman ibadet noktası';
  if (poi.category === 'halal') return 'helal ibaresiyle işaretlenmiş restoran veya hızlı yemek noktası';
  if (poi.category === 'food') return 'öğrenci bütçesine uygun yemek veya mensa noktası';
  if (poi.category === 'outside') return 'Torino çevresinde günübirlik gezi rotası';
  if (poi.category === 'transport') {
    if (tags.railway || tags.public_transport) return 'tren, metro, durak veya aktarma noktası';
    return amenity || 'ulaşım ve şehir içi aktarma noktası';
  }
  if (poi.category === 'practical') {
    if (haystack.includes('questura') || haystack.includes('immigrazione')) return 'oturum izni ve polis randevuları için resmi işlem noktası';
    if (haystack.includes('agenzia delle entrate') || haystack.includes('codice fiscale')) return 'codice fiscale ve vergi numarası işleri için resmi kurum';
    if (haystack.includes('asl')) return 'ASL sağlık kaydı ve doktor/SSN işlemleri için sağlık kurumu';
    return amenity || 'sağlık, resmi işlem veya günlük pratik ihtiyaç noktası';
  }
  if (poi.category === 'cheap') {
    if (tags.amenity === 'marketplace') return 'pazar alanı ve günlük uygun fiyat alışveriş noktası';
    if (shop) return `${shop} olarak etiketlenmiş uygun fiyat alışveriş noktası`;
    return 'öğrenci bütçesine uygun alışveriş veya pazar rotası';
  }
  if (poi.category === 'shopping') {
    if (shop) return `${shop} olarak etiketlenmiş mağaza veya alışveriş noktası`;
    return 'AVM, outlet, kitapçı, teknoloji veya özel alışveriş noktası';
  }
  if (poi.category === 'museum') return tourism || amenity || 'müze, galeri veya kültür kurumu';
  if (poi.category === 'history') return historic || tourism || 'tarihi yapı, anıt veya miras noktası';
  if (poi.category === 'park') return leisure || 'park, bahçe veya açık hava mola noktası';
  if (poi.category === 'view') return tourism || 'manzara ve fotoğraf noktası';
  if (poi.category === 'student') {
    if (amenity) return `${amenity} olarak etiketlenmiş öğrenci/üniversite noktası`;
    return 'Erasmus, üniversite, öğrenci desteği veya kampüs bağlantılı nokta';
  }
  if (poi.category === 'highlight') return tourism || historic || amenity || `${categoryLabel} rotası`;
  return shop || amenity || tourism || historic || leisure || `${categoryLabel} noktası`;
}

function inferPoiUse(poi, tags) {
  const haystack = poiText(poi, tags);
  const brand = String(tags.brand || '').toLocaleLowerCase('tr');

  if (poi.category === 'personal') {
    if (haystack.includes('yurt')) return 'check-in, oda/rezidans işleri, ilk hafta yön bulma ve Politecnico çevresi için ana başlangıç noktasıdır.';
    if (haystack.includes('paolo giaccone') || haystack.includes('hoca')) return 'hocayla görüşme, ofis saatini teyit etme, ders/proje iletişimi ve randevu planı için kullanılır.';
    if (haystack.includes('det')) return 'derslik, bölüm ofisi, laboratuvar ve elektronik-haberleşme akademik işleri için referans olur.';
    return 'ilk günlerde rota kurmak, belge işleri ve kampüs çevresini ezberlemek için kullanılır.';
  }
  if (poi.category === 'emergency') return '112 aramadan once/sonra en yakin acil servis, gece eczanesi veya yardim noktasini hizlica bulmak icin kullanilir.';
  if (poi.category === 'official') return 'PoliTO, EDISU, immigration, sigorta, fiscal code ve ilk hafta resmi islemlerini tek rotada toplamak icin kullanilir.';
  if (poi.category === 'atm') return 'TEB kartıyla BNL/BNP Paribas ağını denemek, nakit çekmek veya banka lokasyonu bulmak için işaretlendi.';
  if (poi.category === 'gtt') return 'BIP kart, abonman, kart arızası/kayıp kart, müşteri hizmetleri ve bazı öğrenci ulaşım işlemleri için kullanılır.';
  if (poi.category === 'mosque') return 'vakit namazı, cuma namazı, cemaatle tanışma ve Torino’daki Müslüman topluluk duyurularını takip etmek için kullanılır.';
  if (poi.category === 'halal') return 'helal yemek ararken ilk bakılacak restoran listesidir; menüdeki helal ibaresini ve et kaynağını mekanda ayrıca sor.';
  if (poi.category === 'food') return 'mensa, hızlı öğün veya öğrenci bütçesine daha uygun yemek alternatifi bulmak için işaretlendi.';
  if (poi.category === 'outside') return 'hafta sonu veya boş günde Torino dışına kısa gezi planlamak için kullanılır.';

  if (haystack.includes('questura') || haystack.includes('immigrazione')) return 'permesso di soggiorno, parmak izi, randevu, belge teslimi veya teslim alma süreçlerinde işine yarar.';
  if (haystack.includes('agenzia delle entrate') || haystack.includes('codice fiscale')) return 'codice fiscale, vergi numarası ve bazı resmi kayıt işleri için bakılacak kurumdur.';
  if (haystack.includes('edisu')) return 'burs, yurt, mensa, öğrenci desteği veya EDISU başvuruları için kullanılır.';
  if (haystack.includes('esn')) return 'ESNcard, Erasmus etkinlikleri, buddy ağı ve sosyal çevre kurmak için kullanılır.';
  if (haystack.includes('asl')) return 'sağlık kaydı, aile hekimi/SSN yönlendirmesi ve yerel sağlık sistemiyle ilgili işlemler için kullanılır.';

  if (tags.amenity === 'pharmacy') return 'ilaç, reçete, temel sağlık ürünü ve acil eczane ihtiyacında kullanılır.';
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'sağlık hizmeti, muayene, acil olmayan yönlendirme veya hastane bölümü bulmak için işaretlendi.';
  if (tags.amenity === 'post_office') return 'mektup/kargo, resmi posta, bazı ödeme veya posta işlemleri için kullanılır.';
  if (tags.amenity === 'police') return 'kayıp, güvenlik, resmi bildirim veya polis birimi ihtiyacında referans olur.';
  if (tags.amenity === 'library') return 'ders çalışmak, araştırma yapmak, sessiz alan ve akademik kaynak bulmak için kullanılır.';
  if (tags.amenity === 'bank') return 'banka şubesi, ATM ve para işlemleri için referans olur.';
  if (tags.amenity === 'university' || tags.amenity === 'college') return 'kampüs, derslik, öğrenci işleri veya akademik ofis bulmak için kullanılır.';
  if (tags.amenity === 'marketplace') return 'sebze-meyve, gıda, ev ihtiyacı veya yerel pazar alışverişi için kullanılır.';

  if (tags.shop === 'supermarket') {
    if (DISCOUNT_BRANDS.has(brand)) return 'haftalık market alışverişi, temel gıda ve öğrenci bütçesine uygun ürün aramak için iyi bir adaydır.';
    return 'günlük market, temel gıda, temizlik ürünü ve ev ihtiyacı almak için kullanılır.';
  }
  if (tags.shop === 'books') return 'kitap, kırtasiye, ders kaynağı, dil kitabı veya ikinci el kitap bakmak için kullanılır.';
  if (tags.shop === 'electronics') return 'telefon/laptop aksesuarı, şarj kablosu, adaptör, SIM/teknik ihtiyaç veya küçük elektronik alışverişi için kullanılır.';
  if (tags.shop === 'second_hand' || tags.shop === 'charity') return 'ikinci el kıyafet, küçük ev eşyası veya daha uygun fiyatlı parça bulmak için kullanılır.';
  if (tags.shop === 'copyshop') return 'fotokopi, çıktı, tarama ve belge hazırlama işleri için kullanılır.';
  if (tags.shop === 'mall' || tags.shop === 'department_store') return 'birden fazla mağaza, giyim, teknoloji, market ve yeme-içme seçeneklerini tek yerde görmek için kullanılır.';

  if (tags.tourism === 'museum' || poi.category === 'museum') return 'koleksiyon, sergi, sanat/tarih bilgisi ve öğrenci indirimli kültür rotası için kullanılır.';
  if (tags.tourism === 'gallery') return 'sergi, sanat etkinliği ve kısa kültür molası için kullanılır.';
  if (tags.tourism === 'viewpoint' || poi.category === 'view') return 'fotoğraf, şehir manzarası ve kısa yürüyüş rotası için kullanılır.';
  if (tags.tourism === 'artwork') return 'kamusal sanat eseri veya kısa fotoğraf durağı olarak işaretlendi.';
  if (tags.historic === 'castle') return 'saray/kale mimarisi, müze bağlantısı ve Torino tarihini görmek için kullanılır.';
  if (tags.historic === 'memorial' || tags.historic === 'monument') return 'anıt, hatıra noktası veya kısa tarih/fotoğraf durağı olarak kullanılır.';
  if (tags.historic === 'ruins' || tags.historic === 'archaeological_site') return 'tarihi kalıntı veya arkeolojik miras görmek için kullanılır.';
  if (tags.leisure === 'park' || tags.leisure === 'garden') return 'yürüyüş, koşu, piknik, ders arası mola veya açık havada dinlenmek için kullanılır.';

  if (poi.category === 'transport') return 'metro, tren, otobüs, havaalanı veya şehir içi aktarma planında işine yarar.';
  if (poi.category === 'student') return 'öğrenci işleri, kampüs, sosyal çevre, spor veya Erasmus destek rotası için kullanılır.';
  if (poi.category === 'highlight') return 'Torino’ya alışmak, merkez yürüyüşü yapmak ve şehrin önemli noktalarını görmek için kullanılır.';
  return 'haritada hızlıca konumunu bulmak, yakındaki rota ve resmi/OSM bağlantısıyla detayı doğrulamak için kullanılır.';
}

function inferPoiNote(poi, tags) {
  const haystack = poiText(poi, tags);
  if (poi.category === 'emergency') return 'Gercek acil durumda once 112; haritadaki adresleri resmi yonlendirme ve canli bilgiyle teyit et.';
  if (poi.category === 'official') return 'Resmi islemlerde randevu belgesi, e-posta ve kurum sayfasindaki guncel saatler bu haritadan onceliklidir.';
  if (poi.category === 'atm') return 'ATM ekranındaki ücret uyarısını okumadan onaylama; TEB anlaşma koşulları zamanla değişebilir.';
  if (poi.category === 'halal') return 'Helal bilgisi liste/isim bazlıdır; sipariş vermeden önce mekana menü ve sertifika durumunu sor.';
  if (poi.category === 'mosque') return 'Namaz ve cuma saatleri caminin duyurusuna göre değişebilir; mini vakit panelini destekleyici bilgi gibi kullan.';
  if (poi.category === 'gtt' || poi.category === 'transport') return 'Hat, saat, grev ve kart kuralı değişebileceği için GTT/Trenitalia canlı bilgisini kontrol et.';
  if (haystack.includes('questura') || haystack.includes('agenzia delle entrate') || haystack.includes('asl')) return 'Resmi işlemlerde randevu belgesindeki adres ve saat her zaman bu haritadan önceliklidir.';
  if (tags.amenity === 'pharmacy') return 'Nöbetçi eczane saatleri değişebilir; gece/acil durumda güncel nöbet listesini kontrol et.';
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'Acil durum için İtalya’da 112; rutin işlemde randevu ve yönlendirme gerekebilir.';
  if (tags.shop || tags.amenity === 'marketplace') return 'Fiyat, stok ve açılış saatleri değişebilir; gitmeden önce Google Maps veya resmi siteyle kontrol et.';
  if (tags.tourism || tags.historic || poi.category === 'museum') return 'Bilet, ücretsiz gün, öğrenci indirimi ve kapanış günleri değişebilir.';
  return '';
}

function tagLabel(value, labels) {
  if (!value) return '';
  const first = String(value).split(';')[0];
  return labels[first] || humanizeTagValue(first);
}

function humanizeTagValue(value) {
  return String(value || '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function poiText(poi, tags) {
  return [
    poi.name,
    poi.category,
    poi.description,
    poi.address,
    poi.cost,
    ...(poi.tags || []),
    ...Object.values(tags || {}),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('tr');
}

function uniqueDetailItems(items) {
  const seen = new Set();
  const clean = [];
  for (const item of items) {
    const value = String(item.value || '').trim();
    if (!value) continue;
    const key = `${item.label}:${value}`.toLocaleLowerCase('tr');
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push({ label: item.label, value });
  }
  return clean;
}

function markerIcon(poi) {
  const meta = state.data.categoryMeta[poi.category];
  const color = meta?.color || '#334155';
  const high = (poi.priority || 0) >= 90 ? ' high' : '';
  const defaults = { emergency: 'SOS', official: 'INFO', atm: 'BNL', mosque: 'CAMİ', halal: 'HALAL', gtt: 'GTT' };
  const label = poi.markerLabel || defaults[poi.category] || '';
  const labeled = label ? ' labeled' : '';
  const catClass = ` cat-${poi.category}`;
  return L.divIcon({
    className: `poi-marker${high}${labeled}${catClass}`,
    html: `<span style="--marker-color:${color}">${escapeHtml(label)}</span>`,
    iconSize: label ? [58, 36] : [28, 28],
  });
}

function getMarkerForPoi(poi) {
  let marker = state.markers.get(poi.id);
  if (marker) return marker;

  marker = L.marker([poi.lat, poi.lng], {
    icon: markerIcon(poi),
    title: poi.name,
    alt: poi.name,
    keyboard: true,
    riseOnHover: true,
  });
  marker.bindPopup(() => popupHtml(poi));
  marker.on('click', () => highlightListItem(poi.id));
  marker.on('popupopen', (event) => focusPopup(event, poi));
  state.markers.set(poi.id, marker);
  return marker;
}

function focusPopup(event, poi) {
  const popup = event.popup?.getElement?.();
  if (!popup) return;
  popup.setAttribute('tabindex', '-1');
  window.requestAnimationFrame(() => {
    const focusable = popup.querySelector('a, button');
    (focusable || popup).focus({ preventScroll: true });
  });
  announce(`${poi.name} açıldı.`);
}

function currentResults() {
  const query = el.searchInput.value.trim();
  let base = state.data.pois;
  if (query && state.fuse) {
    const variants = queryVariants(query);
    const fuseMatches = variants.flatMap((variant) => state.fuse.search(variant).map((item) => item.item));
    const needles = variants.map((variant) => variant.toLocaleLowerCase('tr'));
    const detailMatches = state.data.pois.filter((poi) => {
      const text = getPoiDetails(poi).searchText.toLocaleLowerCase('tr');
      return needles.some((needle) => text.includes(needle));
    });
    base = uniquePois([...fuseMatches, ...detailMatches]);
  } else if (query) {
    scheduleSearchIndexBuild();
    const needles = queryVariants(query).map((variant) => variant.toLocaleLowerCase('tr'));
    base = state.data.pois.filter((poi) => {
      const text = JSON.stringify([poi.name, poi.description, poi.address, poi.tags, getPoiDetails(poi)]).toLocaleLowerCase('tr');
      return needles.some((needle) => text.includes(needle));
    });
  }

  return base
    .filter((poi) => state.showFavorites || query || state.active.has(poi.category))
    .filter((poi) => !state.showFavorites || state.favorites.has(poi.id))
    .sort((a, b) => {
      const meta = state.data.categoryMeta;
      return (
        (b.priority || 0) - (a.priority || 0) ||
        (meta[a.category]?.rank ?? 999) - (meta[b.category]?.rank ?? 999) ||
        a.name.localeCompare(b.name, 'tr')
      );
    });
}

function queryVariants(query) {
  const normalized = query.toLocaleLowerCase('tr');
  const variants = new Set([query]);
  for (const [term, aliases] of Object.entries(SEARCH_ALIASES)) {
    if (normalized.includes(term)) aliases.forEach((alias) => variants.add(alias));
  }
  return [...variants];
}

function uniquePois(pois) {
  const seen = new Set();
  const unique = [];
  for (const poi of pois) {
    if (seen.has(poi.id)) continue;
    seen.add(poi.id);
    unique.push(poi);
  }
  return unique;
}

function scheduleRender() {
  window.clearTimeout(state.renderTimer);
  state.renderTimer = window.setTimeout(render, 140);
}

function render() {
  const results = currentResults();
  updateFavoritesButton();
  renderMarkers(results);
  renderList(results);
}

function renderMarkers(results) {
  state.cluster.clearLayers();
  if (state.lowPower) return;
  state.cluster.addLayers(results.map(getMarkerForPoi));
}

function renderList(results) {
  el.resultCount.textContent = `${results.length} nokta gösteriliyor`;
  el.poiList.innerHTML = '';
  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const query = el.searchInput.value.trim();
    empty.innerHTML = `
      <strong>${query ? 'Sonuc bulunamadi' : 'Torino’da ne ariyorsun?'}</strong>
      <span>${query ? 'Daha genel bir kelime dene veya Tumunu ac.' : 'Arama, niyet filtresi veya favorilerle baslayabilirsin.'}</span>
    `;
    el.poiList.appendChild(empty);
    return;
  }
  const visible = results.slice(0, 120);
  const fragment = document.createDocumentFragment();
  for (const poi of visible) {
    const meta = state.data.categoryMeta[poi.category] || { label: poi.category, color: '#334155' };
    const card = document.createElement('article');
    card.className = 'poi-card';
    card.id = `list-${poi.id}`;
    const favorite = state.favorites.has(poi.id);
    const details = getPoiDetails(poi);
    card.innerHTML = `
      <div class="poi-card-head">
        <h2>${escapeHtml(poi.name)}</h2>
        <button class="fav-btn ${favorite ? 'is-active' : ''}" type="button" data-favorite-id="${escapeAttr(poi.id)}" aria-pressed="${favorite ? 'true' : 'false'}" aria-label="Favori">${favorite ? '★' : '☆'}</button>
      </div>
      <div class="poi-meta">
        <span class="pill" style="border-color:${meta.color}55">${escapeHtml(meta.label)}</span>
        <span class="pill">öncelik ${poi.priority || 0}</span>
        ${favorite ? '<span class="pill">favori</span>' : ''}
        ${poi.source === 'Curated' ? '<span class="pill">seçilmiş</span>' : ''}
      </div>
      <p class="poi-detail">${escapeHtml(details.summary)}</p>`;
    card.addEventListener('click', (event) => {
      if (event.target.closest('[data-favorite-id]')) return;
      focusPoi(poi);
    });
    fragment.appendChild(card);
  }

  if (results.length > visible.length) {
    const more = document.createElement('div');
    more.className = 'transit-info';
    more.textContent = `İlk ${visible.length} sonuç listeleniyor; aramayla daraltabilirsin.`;
    fragment.appendChild(more);
  }
  el.poiList.appendChild(fragment);
}

function updateFavoritesButton() {
  el.favoritesOnly.textContent = `Favoriler (${state.favorites.size})`;
  el.favoritesOnly.classList.toggle('is-active', state.showFavorites);
}

function handleDocumentClick(event) {
  const target = eventTargetElement(event);
  if (!target) return;

  const modeButton = target.closest('[data-mode-id]');
  if (modeButton) {
    event.preventDefault();
    applyDailyMode(modeButton.dataset.modeId).catch(() => {});
    return;
  }

  const intentButton = target.closest('[data-intent-id]');
  if (intentButton) {
    event.preventDefault();
    applyIntentFilter(intentButton.dataset.intentId).catch(() => {});
    return;
  }

  const presetButton = target.closest('[data-search-preset]');
  if (presetButton) {
    event.preventDefault();
    applySearchPreset(presetButton.dataset.searchPreset);
    return;
  }

  const recentButton = target.closest('[data-recent-query]');
  if (recentButton) {
    event.preventDefault();
    applySearchPreset(recentButton.dataset.recentQuery);
    return;
  }

  const favoriteButton = target.closest('[data-favorite-id]');
  if (favoriteButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(favoriteButton.dataset.favoriteId);
  }
}

function handleDocumentChange(event) {
  const target = eventTargetElement(event);
  const checkbox = target?.closest('[data-check-id]');
  if (!checkbox) return;
  if (checkbox.checked) state.checklist.add(checkbox.dataset.checkId);
  else state.checklist.delete(checkbox.dataset.checkId);
  saveChecklist();
}

function eventTargetElement(event) {
  if (event.target instanceof Element) return event.target;
  return event.target?.parentElement || null;
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
}

function toggleFavorite(id) {
  if (!id) return;
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  saveFavorites();
  render();
}

function focusPoi(poi) {
  const marker = getMarkerForPoi(poi);
  state.map.setView([poi.lat, poi.lng], Math.max(state.map.getZoom(), 15), { animate: !prefersReducedMotion() });
  setTimeout(() => marker?.openPopup(), 220);
}

function highlightListItem(id) {
  const item = document.getElementById(`list-${id}`);
  if (!item) return;
  item.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  item.style.borderColor = '#0f766e';
  setTimeout(() => {
    item.style.borderColor = '';
  }, 900);
}

function syncCategoryButtons() {
  document.querySelectorAll('.cat-btn').forEach((button) => {
    const category = button.dataset.category;
    const loading = isCategoryLoading(category);
    button.setAttribute('aria-pressed', state.active.has(category) ? 'true' : 'false');
    button.toggleAttribute('aria-busy', loading);
    button.disabled = loading;
    button.dataset.loaded = isCategoryLoaded(category) ? 'true' : 'false';
  });
  updateCategorySummary();
}

function updateCategorySummary() {
  if (!el.categorySummary || !state.data) return;
  const total = categoryKeys().length;
  const loaded = categoryKeys().filter(isCategoryLoaded).length;
  el.categorySummary.textContent = `${state.active.size} / ${total} kategori acik. ${loaded} kategori verisi hazir.`;
}

function popupHtml(poi) {
  const meta = state.data.categoryMeta[poi.category] || { label: poi.category, color: '#334155' };
  const details = getPoiDetails(poi);
  const tags = (poi.tags || [])
    .slice(0, 4)
    .map((tag) => `<span class="pill">${escapeHtml(String(tag))}</span>`)
    .join('');
  const source = poi.source ? `<p class="popup-text"><strong>Kaynak:</strong> ${escapeHtml(poi.source)}</p>` : '';
  const ownLink = poi.link ? `<a href="${escapeAttr(poi.link)}" target="_blank" rel="noreferrer">Resmi/site</a>` : '';
  const favorite = state.favorites.has(poi.id);
  const detailSummary = details.summary
    ? `<p class="popup-text popup-detail-summary"><strong>Detay:</strong> ${escapeHtml(details.summary)}</p>`
    : '';
  const detailBlock = (details.items || []).length
    ? `<dl class="detail-list">${details.items.map((item) => `
        <div>
          <dt>${escapeHtml(item.label)}</dt>
          <dd>${escapeHtml(item.value)}</dd>
        </div>
      `).join('')}</dl>`
    : '';
  return `
    <h3 class="popup-title">${escapeHtml(poi.name)}</h3>
    <div class="popup-cat"><span class="dot" style="--cat-color:${meta.color}"></span>${escapeHtml(meta.label)}</div>
    <p class="popup-text">${escapeHtml(poi.description || '')}</p>
    ${detailSummary}
    ${detailBlock}
    <div class="poi-meta">${tags}</div>
    ${source}
    <div class="popup-links">
      <a href="${mapsUrl(poi.lat, poi.lng)}" target="_blank" rel="noreferrer">Google Maps</a>
      <a href="${osmUrl(poi)}" target="_blank" rel="noreferrer">OSM</a>
      ${ownLink}
      <button class="popup-fav ${favorite ? 'is-active' : ''}" type="button" data-favorite-id="${escapeAttr(poi.id)}" aria-pressed="${favorite ? 'true' : 'false'}">${favorite ? 'Favoriden çıkar' : 'Favoriye ekle'}</button>
    </div>`;
}

function initPrayer() {
  renderPrayerMethodOptions();
  renderQibla(DEFAULT_COORDS);
  renderPrayerSkeleton();
  loadPrayerTimes(DEFAULT_COORDS);
  window.setInterval(updateNextPrayer, 60_000);
}

function renderPrayerSkeleton() {
  el.prayerTimes.innerHTML = PRAYERS.map(([, label]) => `
    <div class="prayer-time">
      <span>${escapeHtml(label)}</span>
      <strong>--:--</strong>
    </div>
  `).join('');
  el.nextPrayerName.textContent = '-';
  el.nextPrayerTime.textContent = '--:--';
  el.nextPrayerCountdown.textContent = 'Hazirlaniyor';
  el.prayerNote.textContent = 'Vakitler cevrimici alinir; ibadet icin resmi veya tercih ettigin kaynaktan kontrol et.';
}

async function loadPrayerTimes(coords, options = {}) {
  state.prayer.coords = coords;
  renderQibla(coords);
  el.prayerMeta.textContent = coords.label || 'Konum';
  el.prayerNote.textContent = 'Namaz vakitleri aliniyor...';

  const date = prayerDateForTimeZone(coords.timeZone);
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lng),
    method: String(state.prayer.method),
    school: String(PRAYER_SCHOOL),
    timezonestring: coords.timeZone,
  });
  const cacheKey = prayerCacheKey(coords, date);

  if (!options.force) {
    const cached = readPrayerCache(cacheKey);
    if (cached) {
      state.prayer.timings = cached.timings;
      renderPrayerTimes();
      updateNextPrayer();
      el.prayerNote.textContent = prayerSourceNote(cached.method, 'cache');
      return;
    }
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`https://api.aladhan.com/v1/timings/${date}?${params}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Prayer API error: ${response.status}`);
    const payload = await response.json();
    state.prayer.timings = payload?.data?.timings || null;
    if (!state.prayer.timings) throw new Error('Prayer timings missing');
    renderPrayerTimes();
    updateNextPrayer();
    const method = payload?.data?.meta?.method?.name || currentPrayerMethodLabel();
    writePrayerCache(cacheKey, { timings: state.prayer.timings, method, coords, date, methodId: state.prayer.method });
    el.prayerNote.textContent = prayerSourceNote(method);
  } catch (error) {
    console.warn('Prayer times failed', error);
    const fallback = readLastPrayerCache();
    if (fallback) {
      state.prayer.timings = fallback.timings;
      renderPrayerTimes();
      updateNextPrayer();
      el.prayerNote.textContent = prayerSourceNote(fallback.method, 'son kayit');
      return;
    }
    state.prayer.timings = null;
    renderPrayerSkeleton();
    el.nextPrayerCountdown.textContent = 'Vakit alinamadi';
    el.prayerNote.textContent = 'Namaz vakti alinamadi; internet/API erisimini kontrol et veya resmi takvimi kullan.';
  } finally {
    window.clearTimeout(timeout);
  }
}

function prayerCacheKey(coords, date) {
  return [
    date,
    coords.timeZone,
    Number(coords.lat).toFixed(3),
    Number(coords.lng).toFixed(3),
    state.prayer.method,
    PRAYER_SCHOOL,
  ].join('|');
}

function readPrayerCache(key) {
  try {
    const cache = JSON.parse(localStorage.getItem(PRAYER_CACHE_KEY) || '{}');
    return cache[key]?.timings ? cache[key] : null;
  } catch {
    return null;
  }
}

function writePrayerCache(key, value) {
  try {
    const cache = JSON.parse(localStorage.getItem(PRAYER_CACHE_KEY) || '{}');
    const entry = { ...value, writtenAt: new Date().toISOString() };
    cache[key] = entry;
    localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(cache));
    localStorage.setItem(PRAYER_LAST_CACHE_KEY, JSON.stringify({ ...entry, cacheKey: key }));
  } catch {
    // Storage can be disabled in private mode; the live API path still works.
  }
}

function readLastPrayerCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(PRAYER_LAST_CACHE_KEY) || 'null');
    return cached?.timings ? cached : null;
  } catch {
    return null;
  }
}

function currentPrayerMethodLabel() {
  return PRAYER_METHODS.find((method) => method.id === state.prayer.method)?.label || 'Seçili yöntem';
}

function prayerSourceNote(method, source = 'canli') {
  const sourceLabel = source === 'cache' ? 'cache' : source === 'son kayit' ? 'offline son kayit' : 'canli';
  return `${method || currentPrayerMethodLabel()} · ${sourceLabel} · yaklasik vakitler; ibadet icin resmi veya tercih ettigin kaynaktan kontrol et.`;
}

function renderPrayerTimes() {
  const timings = state.prayer.timings;
  if (!timings) return;
  const next = findNextPrayer();
  el.prayerTimes.innerHTML = PRAYERS.map(([key, label]) => {
    const time = cleanPrayerTime(timings[key]);
    const active = next?.key === key ? ' is-next' : '';
    return `
      <div class="prayer-time${active}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(time || '--:--')}</strong>
      </div>
    `;
  }).join('');
}

function updateNextPrayer() {
  if (!state.prayer.timings) return;
  const next = findNextPrayer();
  if (!next) return;
  state.prayer.next = next;
  el.nextPrayerName.textContent = next.label;
  el.nextPrayerTime.textContent = next.time;
  el.nextPrayerCountdown.textContent = formatCountdown(next.diff);
  renderPrayerTimes();
}

function findNextPrayer() {
  const timings = state.prayer.timings;
  const now = minutesNowInTimeZone(state.prayer.coords.timeZone);
  let best = null;
  for (const [key, label] of PRAYERS) {
    const time = cleanPrayerTime(timings[key]);
    const minutes = minutesFromTime(time);
    if (minutes == null) continue;
    const diff = (minutes - now + 1440) % 1440;
    if (!best || diff < best.diff) best = { key, label, time, minutes, diff };
  }
  return best;
}

function useCurrentLocationForPrayer() {
  if (!navigator.geolocation) {
    useTorinoPrayerFallback('Konum servisi bu tarayicida yok');
    return;
  }
  el.prayerNote.textContent = 'Konum aliniyor...';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_COORDS.timeZone;
      loadPrayerTimes({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        label: 'Konumum',
        timeZone,
      });
    },
    () => {
      useTorinoPrayerFallback('Konum izni yok veya konum alinamadi');
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 300_000 },
  );
}

function useTorinoPrayerFallback(reason) {
  const fallback = { ...DEFAULT_COORDS, label: 'Torino sabit' };
  loadPrayerTimes(fallback).then(() => {
    el.prayerNote.textContent = `${reason}; Torino sabit koordinati kullanildi. ${el.prayerNote.textContent}`;
  });
}

function renderQibla(coords) {
  const bearing = qiblaBearing(coords.lat, coords.lng);
  if (!Number.isFinite(bearing)) {
    el.qiblaArrow.style.transform = 'rotate(0deg)';
    el.qiblaDegree.textContent = 'Hesaplanamadı';
    el.qiblaText.textContent = 'Kıble';
    if (el.qiblaSensorStatus) el.qiblaSensorStatus.textContent = 'Pusula izni yoksa sadece derece gosterilir; koordinat yoksa kible hesaplanamaz.';
    return;
  }
  el.qiblaArrow.style.transform = `rotate(${bearing}deg)`;
  el.qiblaDegree.textContent = `${Math.round(bearing)}°`;
  el.qiblaText.textContent = `${cardinalDirection(bearing)} · Kıble`;
  if (el.qiblaSensorStatus) {
    el.qiblaSensorStatus.textContent = 'Pusula izni istenmez; derece gercek kuzeye gore hesaplanir. Telefon pusulasi manyetik kuzey kullaniyorsa kucuk fark olabilir.';
  }
}

function qiblaBearing(lat, lng) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return Number.NaN;
  const fromLat = toRad(lat);
  const fromLng = toRad(lng);
  const toLat = toRad(KAABA.lat);
  const toLng = toRad(KAABA.lng);
  const deltaLng = toLng - fromLng;
  const y = Math.sin(deltaLng);
  const x = Math.cos(fromLat) * Math.tan(toLat) - Math.sin(fromLat) * Math.cos(deltaLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function prayerDateForTimeZone(timeZone) {
  const parts = datePartsInTimeZone(timeZone, ['day', 'month', 'year']);
  return `${parts.day}-${parts.month}-${parts.year}`;
}

function minutesNowInTimeZone(timeZone) {
  const parts = datePartsInTimeZone(timeZone, ['hour', 'minute']);
  const hour = Number(parts.hour) % 24;
  return hour * 60 + Number(parts.minute);
}

function datePartsInTimeZone(timeZone, fields) {
  const options = {
    timeZone,
    hour12: false,
  };
  if (fields.includes('day')) options.day = '2-digit';
  if (fields.includes('month')) options.month = '2-digit';
  if (fields.includes('year')) options.year = 'numeric';
  if (fields.includes('hour')) options.hour = '2-digit';
  if (fields.includes('minute')) options.minute = '2-digit';
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  return Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
}

function cleanPrayerTime(value) {
  return String(value || '').match(/\d{1,2}:\d{2}/)?.[0] || '';
}

function minutesFromTime(value) {
  const match = cleanPrayerTime(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatCountdown(diffMinutes) {
  if (diffMinutes === 0) return 'Şimdi';
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (!hours) return `${minutes} dk kaldı`;
  return `${hours} sa ${minutes} dk kaldı`;
}

function cardinalDirection(degrees) {
  const labels = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];
  return labels[Math.round(degrees / 45) % labels.length];
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function toDeg(value) {
  return (value * 180) / Math.PI;
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
  state.transitStopIndex = buildTransitStopIndex();
  renderStopSearchResults();
}

function buildTransitStopIndex() {
  const index = new Map();
  for (const route of state.transit?.routes || []) {
    const routeLabel = route.shortName || route.id;
    for (const direction of route.directions || []) {
      for (const stop of direction.stops || []) {
        const key = stop.id || `${stop.name}|${Number(stop.lat).toFixed(5)}|${Number(stop.lng).toFixed(5)}`;
        const existing = index.get(key) || {
          id: key,
          name: stop.name,
          lat: stop.lat,
          lng: stop.lng,
          routes: new Set(),
          heads: new Set(),
        };
        if (routeLabel) existing.routes.add(routeLabel);
        if (direction.headsign) existing.heads.add(direction.headsign);
        index.set(key, existing);
      }
    }
  }

  return [...index.values()].map((stop) => {
    const routes = [...stop.routes].sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }));
    const heads = [...stop.heads].sort((a, b) => a.localeCompare(b, 'tr')).slice(0, 3);
    return {
      ...stop,
      routes,
      heads,
      searchText: [stop.name, routes.join(' '), heads.join(' ')].join(' ').toLocaleLowerCase('tr'),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

function renderStopSearchResults() {
  if (!el.stopSearchResults) return;
  if (!state.transit) {
    el.stopSearchResults.innerHTML = '';
    return;
  }
  const query = (el.stopSearchInput?.value || '').trim().toLocaleLowerCase('tr');
  if (!query) {
    el.stopSearchResults.innerHTML = '';
    return;
  }
  if (query.length < 2) {
    el.stopSearchResults.innerHTML = '<div class="stop-result"><span>En az 2 harf yaz.</span></div>';
    return;
  }

  const terms = query.split(/\s+/).filter(Boolean);
  const stops = state.transitStopIndex || buildTransitStopIndex();
  const matches = stops
    .filter((stop) => terms.every((term) => stop.searchText.includes(term)))
    .sort((a, b) => Number(b.name.toLocaleLowerCase('tr').startsWith(query)) - Number(a.name.toLocaleLowerCase('tr').startsWith(query)) || a.name.localeCompare(b.name, 'tr'))
    .slice(0, 6);

  if (!matches.length) {
    el.stopSearchResults.innerHTML = '<div class="stop-result"><span>Durak bulunamadı; GTT Journey Planner veya Maps fallback kullan.</span></div>';
    return;
  }

  el.stopSearchResults.innerHTML = matches.map((stop) => `
    <div class="stop-result">
      <div class="stop-result-head">
        <strong>${escapeHtml(stop.name)}</strong>
        <a href="${mapsUrl(stop.lat, stop.lng)}" target="_blank" rel="noreferrer">Maps</a>
      </div>
      <span>${escapeHtml(stop.heads.join(' / ') || 'Yön bilgisi GTFS içinde sınırlı olabilir.')}</span>
      <div class="stop-route-pills">
        ${stop.routes.slice(0, 10).map((route) => `<small>${escapeHtml(route)}</small>`).join('')}
      </div>
    </div>
  `).join('');
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
    state.map.fitBounds(state.selectedBounds, { padding: [32, 32], maxZoom: 15, animate: !prefersReducedMotion() });
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
    state.map.fitBounds(state.selectedBounds, { padding: [32, 32], maxZoom: 13, animate: !prefersReducedMotion() });
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
    el.transitInfo.textContent = 'Konum alınamadı. Tarayıcı ayarlarından bu site için konum izni verip tekrar dene.';
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
  const register = () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          state.waitingWorker = registration.waiting;
          showUpdateToast('Yeni uygulama sürümü hazır. Yenilemek ister misin?', 'service-worker');
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              state.waitingWorker = worker;
              showUpdateToast('Yeni uygulama sürümü hazır. Yenilemek ister misin?', 'service-worker');
            }
          });
        });
      })
      .catch((error) => {
        console.warn('Service worker registration failed', error);
      });
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!state.refreshOnControllerChange) return;
    state.refreshOnControllerChange = false;
    window.location.reload();
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'OFFLINE_FALLBACK') setOfflineBanner(true);
  });
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
