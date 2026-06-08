const DATA_URL = './data/app-data.json';
const TRANSIT_URL = './data/transit.json';
const FAVORITES_KEY = 'torino-erasmus-map:favorites:v1';
const PRAYER_CACHE_KEY = 'torino-erasmus-map:prayer:v1';
const DEFAULT_COORDS = {
  lat: 45.0703,
  lng: 7.6869,
  label: 'Torino',
  timeZone: 'Europe/Rome',
};
const PRAYER_METHOD = 13;
const PRAYER_SCHOOL = 1;
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
  favorites: new Set(),
  showFavorites: false,
  fuse: null,
  selectedBounds: null,
  prayer: {
    coords: DEFAULT_COORDS,
    timings: null,
    next: null,
  },
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
  favoritesOnly: document.getElementById('favoritesOnly'),
  resetMap: document.getElementById('resetMap'),
  clearRoute: document.getElementById('clearRoute'),
  focusRoute: document.getElementById('focusRoute'),
  prayerMeta: document.getElementById('prayerMeta'),
  nextPrayerName: document.getElementById('nextPrayerName'),
  nextPrayerTime: document.getElementById('nextPrayerTime'),
  nextPrayerCountdown: document.getElementById('nextPrayerCountdown'),
  prayerTimes: document.getElementById('prayerTimes'),
  prayerNote: document.getElementById('prayerNote'),
  qiblaArrow: document.getElementById('qiblaArrow'),
  qiblaDegree: document.getElementById('qiblaDegree'),
  qiblaText: document.getElementById('qiblaText'),
  refreshPrayer: document.getElementById('refreshPrayer'),
  prayerLocation: document.getElementById('prayerLocation'),
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
  hydratePoiDetails();
  state.active = new Set(categoryKeys().filter((key) => state.data.categoryMeta[key].default));
  state.favorites = loadFavorites();

  initMap();
  initSearch();
  initCategories();
  initPoiMarkers();
  initEvents();
  render();
  markReady();
  initPrayer();
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
        keys: ['name', 'category', 'description', 'address', 'tags', 'details.summary', 'details.searchText'],
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
    state.showFavorites = false;
    syncCategoryButtons();
    render();
  });
  el.showCore.addEventListener('click', () => {
    state.active = new Set(CORE_CATEGORIES);
    state.showFavorites = false;
    syncCategoryButtons();
    render();
  });
  el.favoritesOnly.addEventListener('click', () => {
    state.showFavorites = !state.showFavorites;
    render();
  });
  el.resetMap.addEventListener('click', () => {
    state.active = new Set(categoryKeys().filter((key) => state.data.categoryMeta[key].default));
    state.showFavorites = false;
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
  el.refreshPrayer.addEventListener('click', () => loadPrayerTimes(state.prayer.coords, { force: true }));
  el.prayerLocation.addEventListener('click', useCurrentLocationForPrayer);
  document.addEventListener('click', handleDocumentClick);
}

function categoryKeys() {
  return Object.keys(state.data.categoryMeta).sort(
    (a, b) => state.data.categoryMeta[a].rank - state.data.categoryMeta[b].rank,
  );
}

function hydratePoiDetails() {
  for (const poi of state.data.pois) {
    poi.details = buildPoiDetails(poi);
  }
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
      JSON.stringify([poi.name, poi.description, poi.address, poi.tags, poi.details]).toLocaleLowerCase('tr').includes(needle),
    );
  }

  return base
    .filter((poi) => state.showFavorites || state.active.has(poi.category))
    .filter((poi) => !state.showFavorites || state.favorites.has(poi.id))
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
  updateFavoritesButton();
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
    const favorite = state.favorites.has(poi.id);
    const details = poi.details || { summary: '' };
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
    el.poiList.appendChild(card);
  }

  if (results.length > visible.length) {
    const more = document.createElement('div');
    more.className = 'transit-info';
    more.textContent = `İlk ${visible.length} sonuç listeleniyor; aramayla daraltabilirsin.`;
    el.poiList.appendChild(more);
  }
}

function updateFavoritesButton() {
  el.favoritesOnly.textContent = `Favoriler (${state.favorites.size})`;
  el.favoritesOnly.classList.toggle('is-active', state.showFavorites);
}

function handleDocumentClick(event) {
  const favoriteButton = event.target.closest('[data-favorite-id]');
  if (favoriteButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(favoriteButton.dataset.favoriteId);
  }
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
  const details = poi.details || buildPoiDetails(poi);
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
  el.prayerNote.textContent = 'Vakitler çevrimiçi alınır; kıble derecesi yerel hesaplanır.';
}

async function loadPrayerTimes(coords, options = {}) {
  state.prayer.coords = coords;
  renderQibla(coords);
  el.prayerMeta.textContent = coords.label || 'Konum';
  el.prayerNote.textContent = 'Namaz vakitleri alınıyor...';

  const date = prayerDateForTimeZone(coords.timeZone);
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lng),
    method: String(PRAYER_METHOD),
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
      el.prayerNote.textContent = `${cached.method || 'Diyanet yöntemi'} · cache · yaklaşık vakitler; yerel cami takvimini kontrol et.`;
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
    const method = payload?.data?.meta?.method?.name || 'Diyanet yöntemi';
    writePrayerCache(cacheKey, { timings: state.prayer.timings, method });
    el.prayerNote.textContent = `${method} · yaklaşık vakitler; yerel cami takvimini kontrol et.`;
  } catch (error) {
    console.warn('Prayer times failed', error);
    state.prayer.timings = null;
    renderPrayerSkeleton();
    el.nextPrayerName.textContent = '-';
    el.nextPrayerTime.textContent = '--:--';
    el.nextPrayerCountdown.textContent = 'Vakit alınamadı';
    el.prayerNote.textContent = 'Namaz vakti alınamadı; internet veya API erişimini kontrol et.';
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
    PRAYER_METHOD,
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
    localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify({ [key]: value }));
  } catch {
    // Storage can be disabled in private mode; the live API path still works.
  }
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
    el.prayerNote.textContent = 'Konum servisi bu tarayıcıda yok.';
    return;
  }
  el.prayerNote.textContent = 'Konum alınıyor...';
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
      el.prayerNote.textContent = 'Konum alınamadı. Telefonda konum iznini aç.';
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 300_000 },
  );
}

function renderQibla(coords) {
  const bearing = qiblaBearing(coords.lat, coords.lng);
  el.qiblaArrow.style.transform = `rotate(${bearing}deg)`;
  el.qiblaDegree.textContent = `${Math.round(bearing)}°`;
  el.qiblaText.textContent = `${cardinalDirection(bearing)} · Kıble`;
}

function qiblaBearing(lat, lng) {
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
