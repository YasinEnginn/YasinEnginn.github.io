export const CAMPUS_COORDS = { lat: 45.06302, lng: 7.66214 };

export const SHOPPING_FILTERS = [
  { key: 'all', label: 'Tümü', shortLabel: 'Tümü' },
  { key: 'supermarket', label: 'Süpermarket', shortLabel: 'Market' },
  { key: 'market', label: 'Mahalle marketi', shortLabel: 'Mahalle' },
  { key: 'kitchenware', label: 'Mutfak eşyası', shortLabel: 'Mutfak' },
  { key: 'houseware', label: 'Ev eşyası', shortLabel: 'Ev' },
  { key: 'second_hand', label: 'İkinci el', shortLabel: '2. el' },
  { key: 'clothing', label: 'Giyim', shortLabel: 'Giyim' },
  { key: 'open_now', label: 'Şu an açık', shortLabel: 'Açık' },
  { key: 'budget', label: 'Uygun fiyat', shortLabel: 'Ekonomik' },
  { key: 'campus', label: 'Kampüse yakın', shortLabel: 'Yakın' },
];

const SUBCATEGORY_META = {
  supermarket: { label: 'Süpermarket', color: '#15803d' },
  market: { label: 'Mahalle marketi', color: '#16a34a' },
  kitchenware: { label: 'Mutfak eşyası', color: '#d97706' },
  houseware: { label: 'Ev eşyası', color: '#b45309' },
  second_hand: { label: 'İkinci el', color: '#7c3aed' },
  clothing: { label: 'Giyim', color: '#e11d48' },
  electronics: { label: 'Elektronik', color: '#2563eb' },
  books: { label: 'Kitap', color: '#4f46e5' },
  mall: { label: 'AVM / Çoklu mağaza', color: '#0f766e' },
};

const PROFILE_CACHE = new WeakMap();

const SHOP_GROUPS = {
  supermarket: new Set(['supermarket', 'wholesale']),
  market: new Set(['convenience', 'greengrocer', 'general', 'food', 'deli']),
  kitchenware: new Set(['kitchenware', 'tableware']),
  houseware: new Set(['houseware', 'furniture', 'interior_decoration', 'doityourself', 'hardware']),
  second_hand: new Set(['second_hand', 'charity', 'antiques']),
  clothing: new Set(['clothes', 'shoes', 'fashion', 'boutique', 'sports']),
  electronics: new Set(['electronics', 'mobile_phone', 'computer']),
  books: new Set(['books', 'stationery']),
  mall: new Set(['mall', 'retail', 'department_store']),
};

export function shoppingProfile(poi) {
  if (!poi) return null;
  if (PROFILE_CACHE.has(poi)) return PROFILE_CACHE.get(poi);
  const osmTags = poi.osm?.tags || {};
  const rawShop = String(poi.subcategory || osmTags.shop || '').trim().toLocaleLowerCase('tr');
  if (!rawShop && !['shopping', 'cheap'].includes(poi.category)) {
    PROFILE_CACHE.set(poi, null);
    return null;
  }
  const haystack = normalize([
    poi.name,
    poi.description,
    poi.cost,
    ...(poi.tags || []),
    rawShop,
    osmTags.second_hand,
  ].filter(Boolean).join(' '));
  const subcategory = inferSubcategory(rawShop, haystack, poi.category);
  if (!subcategory && !['shopping', 'cheap'].includes(poi.category)) {
    PROFILE_CACHE.set(poi, null);
    return null;
  }

  const website = poi.website || poi.link || osmTags.website || osmTags['contact:website'] || '';
  const phone = poi.phone || osmTags.phone || osmTags['contact:phone'] || '';
  const openingHoursRaw = poi.opening_hours_raw || osmTags.opening_hours || '';
  const hours = openingStatus(openingHoursRaw);
  const budgetLevel = inferBudgetLevel(poi, haystack, subcategory);
  const confidenceScore = Number(poi.confidence_score)
    || (poi.source === 'Curated' ? 0.94 : website ? 0.82 : 0.68);
  const campusMinutes = walkingMinutes(poi, CAMPUS_COORDS);
  const meta = SUBCATEGORY_META[subcategory] || { label: 'Alışveriş', color: '#4f46e5' };

  const profile = {
    primaryCategory: 'shopping',
    subcategory: subcategory || 'mall',
    subcategoryLabel: meta.label,
    color: meta.color,
    website,
    phone,
    openingHoursRaw,
    hours,
    budgetLevel,
    confidenceScore: Math.min(1, Math.max(0, confidenceScore)),
    campusMinutes,
    district: poi.district || inferDistrict(poi.address),
    lastVerifiedAt: poi.last_verified_at || '',
    verificationMethod: poi.verification_method || (poi.source === 'Curated' ? 'manual' : website ? 'website' : 'osm'),
  };
  PROFILE_CACHE.set(poi, profile);
  return profile;
}

export function matchesShoppingFilters(poi, filters) {
  const profile = shoppingProfile(poi);
  if (!profile) return false;
  if (!filters?.size || filters.has('all')) return true;
  for (const filter of filters) {
    if (filter === 'open_now' && profile.hours.state !== 'open') return false;
    else if (filter === 'budget' && profile.budgetLevel !== 'low') return false;
    else if (filter === 'campus' && profile.campusMinutes > 20) return false;
    else if (!['open_now', 'budget', 'campus'].includes(filter) && profile.subcategory !== filter) return false;
  }
  return true;
}

export function shoppingFilterCounts(pois) {
  const counts = Object.fromEntries(SHOPPING_FILTERS.map((item) => [item.key, 0]));
  for (const poi of pois || []) {
    const profile = shoppingProfile(poi);
    if (!profile) continue;
    counts.all += 1;
    if (profile.subcategory in counts) counts[profile.subcategory] += 1;
    if (profile.hours.state === 'open') counts.open_now += 1;
    if (profile.budgetLevel === 'low') counts.budget += 1;
    if (profile.campusMinutes <= 20) counts.campus += 1;
  }
  return counts;
}

export function compareShoppingPois(a, b, mode = 'relevance') {
  const aProfile = shoppingProfile(a);
  const bProfile = shoppingProfile(b);
  if (mode === 'campus') return (aProfile?.campusMinutes ?? 9999) - (bProfile?.campusMinutes ?? 9999);
  if (mode === 'name') return String(a.name).localeCompare(String(b.name), 'tr');
  if (mode === 'confidence') return (bProfile?.confidenceScore ?? 0) - (aProfile?.confidenceScore ?? 0);
  return (b.priority || 0) - (a.priority || 0)
    || (bProfile?.confidenceScore ?? 0) - (aProfile?.confidenceScore ?? 0)
    || String(a.name).localeCompare(String(b.name), 'tr');
}

function inferSubcategory(rawShop, haystack, category) {
  if (/mercato|market|pazar/.test(haystack) && ['department_store', 'general', 'food'].includes(rawShop)) return 'market';
  for (const [key, values] of Object.entries(SHOP_GROUPS)) {
    if (values.has(rawShop)) return key;
  }
  if (/\b(avm|mall|outlet|shopping center)\b/.test(haystack)) return 'mall';
  if (/second.?hand|ikinci el|vintage|usato|charity/.test(haystack)) return 'second_hand';
  if (/kitchen|mutfak|casalinghi|tableware/.test(haystack)) return 'kitchenware';
  if (/houseware|ev eşy|furniture|arredo|brico/.test(haystack)) return 'houseware';
  if (/clothes|giyim|abbigliamento|scarpe|fashion/.test(haystack)) return 'clothing';
  if (/supermarket|süpermarket|ipermercato/.test(haystack) || category === 'cheap') return 'supermarket';
  if (/market|mercato|gıda|food/.test(haystack)) return 'market';
  if (/electronic|telefon|computer/.test(haystack)) return 'electronics';
  if (/book|kitap|librer/.test(haystack)) return 'books';
  if (/mall|avm|outlet|shopping/.test(haystack) || category === 'shopping') return 'mall';
  return '';
}

function inferBudgetLevel(poi, haystack, subcategory) {
  if (/ücretsiz|ucuz|uygun fiyat|indirim|discount|outlet|econom/.test(haystack)) return 'low';
  if (/yüksek|premium|luxury|lüks/.test(haystack)) return 'high';
  if (['supermarket', 'market', 'second_hand'].includes(subcategory)) return 'low';
  if ((poi.priority || 0) >= 85) return 'mid';
  return 'unknown';
}

function openingStatus(value, date = new Date()) {
  const raw = String(value || '').trim();
  if (!raw) return { state: 'unknown', label: 'Saat bilgisi yok' };
  if (raw === '24/7') return { state: 'open', label: 'Şu an açık' };
  try {
    const romeNow = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
    const day = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][romeNow.getDay()];
    const minutes = romeNow.getHours() * 60 + romeNow.getMinutes();
    const rules = raw.split(';').map((part) => part.trim()).filter(Boolean);
    let hasMatchingDay = false;
    for (const rule of rules) {
      const match = rule.match(/^([A-Za-z,-]+)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      if (!match || !dayMatches(match[1], day)) continue;
      hasMatchingDay = true;
      const start = Number(match[2]) * 60 + Number(match[3]);
      const end = Number(match[4]) * 60 + Number(match[5]);
      const open = end >= start ? minutes >= start && minutes < end : minutes >= start || minutes < end;
      if (open) return { state: 'open', label: 'Şu an açık' };
    }
    if (hasMatchingDay || rules.some((rule) => /^[A-Za-z,-]+\s+off$/i.test(rule))) {
      return { state: 'closed', label: 'Şu an kapalı' };
    }
  } catch {
    // Keep the raw value visible when it cannot be parsed safely.
  }
  return { state: 'unknown', label: 'Saat bilgisi var' };
}

function dayMatches(expression, current) {
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  return expression.split(',').some((part) => {
    const [start, end] = part.split('-');
    if (!end) return start === current;
    const startIndex = days.indexOf(start);
    const endIndex = days.indexOf(end);
    const currentIndex = days.indexOf(current);
    if (startIndex < 0 || endIndex < 0) return false;
    return startIndex <= endIndex
      ? currentIndex >= startIndex && currentIndex <= endIndex
      : currentIndex >= startIndex || currentIndex <= endIndex;
  });
}

function walkingMinutes(a, b) {
  const distance = distanceKm(a, b);
  return Math.max(1, Math.round((distance * 1.22) / 0.08));
}

function distanceKm(a, b) {
  const earthRadius = 6371;
  const latDelta = toRad(Number(b.lat) - Number(a.lat));
  const lngDelta = toRad(Number(b.lng) - Number(a.lng));
  const startLat = toRad(Number(a.lat));
  const endLat = toRad(Number(b.lat));
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function inferDistrict(address) {
  const value = String(address || '').trim();
  if (!value) return 'Torino';
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts.at(-1) : 'Torino';
}

function normalize(value) {
  return String(value || '').toLocaleLowerCase('tr').replace(/[_-]+/g, ' ');
}

function toRad(value) {
  return (value * Math.PI) / 180;
}
