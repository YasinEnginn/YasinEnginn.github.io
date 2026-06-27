# Torino Erasmus Haritası

Torino'daki Erasmus öğrencileri için market, ikinci el, ev/mutfak eşyası ve günlük ihtiyaç keşfine odaklanan; mobil uyumlu, GitHub Pages / Netlify için hazır statik PWA.

## Dosyalar

- `index.html`: Uygulama girişi.
- `assets/css/styles.css`: Mobil ve masaüstü arayüz.
- `assets/js/app.js`: Harita, filtreler, arama, GTT hat/durak arama, namaz/kible ve havaalani tren rehberi.
- `assets/js/shopping.js`: Alışveriş taksonomisi, açık saat, bütçe, güven skoru ve kampüse yürüme süresi görünüm modeli.
- `assets/vendor/`: Leaflet, MarkerCluster ve Fuse yerel kopyaları; mobil/offline kullanımda CDN bağımlılığını azaltır.
- `data/pois-core.json`: İlk açılışta yüklenen çekirdek POI, kategori ve havaalanı tren rehberi verisi.
- `data/pois-*.json`: Müze, tarih, park, manzara, alışveriş ve pratik/resmi işler gibi ağır kategori paketleri; filtre, arama veya mod seçilince lazy-load edilir.
- `data/app-data.json`: Geriye dönük tam veri kaynağı; uygulama ilk yükte bunu indirmez.
- `data/erasmus-guide.json`: Offline acil kart, hazir rotalar, GTT/EDISU rehberi, checklist, gizlilik uyarilari ve ek POI verisi.
- `data/genova-guide.json`: Genova rehberi; uygulama ilk açıldığında haritaya eklenmez, Genova butonu/paneli açılınca kategori filtreleri, rota kartları, POI'ler ve Torino-Genova rota çizgisi yüklenir.
- `data/local-radar.json`: Torino Radar kaynaklari; hava, ulasim, resmi duyuru ve yerel haber linkleri JSON'dan beslenir.
- `data/transit.json`: GTT hat, durak ve güzergah verisi; hat seçiciyle etkileşimde yüklenir.
- `manifest.webmanifest` ve `sw.js`: PWA / ana ekrana ekleme desteği.
- `assets/icons/` ve `assets/screenshots/`: Profesyonel PWA ikonları ve manifest ekran görüntüleri.
- `tr/`: Market, ikinci el, giyim, mutfak eşyası ve kampüse yakın marketler için indekslenebilir statik landing sayfaları.

## Mobil Kullanım

Web linki üzerinden açınca telefonda Chrome/Safari ile kullanılır. HTTPS üzerinde konum butonu daha sağlıklı çalışır.

Öne çıkanlar:

- Shopping-first keşif: Süpermarket, mahalle marketi, mutfak/ev eşyası, ikinci el ve giyim için semantik filtreler; açık şimdi, uygun fiyat ve kampüse yakın seçenekleri vardır.
- Zengin mağaza kartları: Alt kategori, açık saat durumu, kampüse tahmini yürüme süresi, güven skoru, web sitesi, detay ve rota eylemleri gösterilir.
- Masaüstü hover önizlemesi: Marker üzerinde mağaza, kategori, açık durumu ve doğrulanmış site sinyali görünür.
- Koleksiyonlar: Favorilere ek olarak cihazda yeni listeler oluşturulabilir; mağazalar birden fazla çevrimdışı koleksiyona kaydedilebilir.
- Havaalanı Treni düğmesi: Torino Airport - Porta Susa - Borsellino yurdu rehberi.
- Genova düğmesi: Kapalı duran ayrı Genova bölümünü açar; Torino'dan otobüs/tren geçiş notları, Genova filtreleri, bütçe/gezi/yemek/namaz odakları ve rota çizimi vardır.
- Torino Radar: Sol panelde canli hava karti, ARPA/GTT/Comune/Regione ve yerel haber kaynaklari tek yerde durur; haber kaynaklari link tabanlidir, hava karti Open-Meteo'dan cache'li gelir.
- Metro M1 düğmesi: metro hattını kalın ve parlak çizgiyle açar.
- Kategori filtreleri: yurt, Politecnico, BNL ATM, cami, helal yemek, GTT kart merkezleri.
- GTT Hatlari: hat secince durak ve guzergah gorunur; durak arama, resmi Journey Planner, live arrivals, gttorari_bot, Google Transit, Moovit ve MATO kisayollari vardir.
- Ulasim karti: GTT fares icindeki Urban + Suburban, Under 26 ve Train + Public Transport basliklari hizli kontrol icin listelenir.
- Yemek / mensa: EDISU Castelfidardo, Borsellino, Olimpia, Principe Amedeo, Ristoreria River, Campus Piemonte ID Meal notu ve Agustos mensa uyarisi vardir.
- Favoriler: Kart yıldızıyla hızlı kaydetme; detay panelinden koleksiyon seçerek düzenli cihaz-içi saklama vardır.
- Namaz & Kible: AlAdhan API ile secilebilir yontemle vakit alinir; konum izni yoksa Torino sabit koordinati kullanilir, offline durumda son basarili vakitler gosterilir.
- Detaylı lokasyon rehberi: Mağaza türü, tarihi yapı türü, resmi işlem amacı, adres/marka ve dikkat notları popup içinde gösterilir.
- Mobil bottom sheet: Ara / Filtre / Liste seviyeleriyle panel yüksekliği telefonda hızlı değişir.
- Niyet filtreleri: Başlangıç, Günlük Yaşam, Ulaşım, Yemek, Resmi İşler, Keşif ve İnanç başlıklarıyla karma kategoriler daha hızlı odaklanır.
- Arama deneyimi: Türkçe arama alias'lari, son arama chip'leri ve boş sonuç yönlendirmesi vardır.
- Offline/update: Yeni sürüm toast bildirimi, offline uyarısı ve cache-first app shell desteği vardır.
- PWA yükleme: Tarayıcı desteklediğinde uygulamayı telefona ekleme kartı gösterilir.
- Acil Erasmus modu: 112/113/115/118, kayboldum cumleleri, Borsellino/PoliTO adresleri, resmi PoliTO/EDISU/GTT linkleri, hazir rota butonlari, ilk hafta checklist'i ve dusuk batarya liste modu vardir.
- Notlarim: localStorage tabanli cihaz-ici notlar ve Özel Mod vardir; pasaport, kart, kapi kodu, belge linki veya kimlik gorseli public GitHub Pages dosyalarina gomulmemelidir.

## Platform Notları

- Harita altlığı `assets/js/app.js` içindeki `TILE_PROVIDER` ayarından yönetilir. Trafik artarsa managed tile sağlayıcıya geçiş için bu nokta güncellenmelidir.
- Vite/MapLibre/Cloudflare Pages geçişleri ürün ve dağıtım kararı gerektiren orta vadeli başlıklardır; mevcut sürüm statik GitHub Pages akışını korur.

## Yerel Test

Bu klasörde:

```powershell
python -m http.server 8088
```

Sonra tarayıcıda `http://localhost:8088/` aç.

## Kalite Kontrol

Node 22 ile:

```powershell
npm install
npm run test:e2e
npm run lhci
```

GitHub Actions `quality` workflow'u Chromium, Firefox, WebKit ve mobil Chromium Playwright testlerini, axe-core erişilebilirlik taramasını ve Lighthouse CI kalite uyarılarını çalıştırır. Lighthouse eşikleri rapordaki Web Vitals hedeflerine göre uyarı seviyesinde tutulur; statik yayın kırılmaz ama regresyon görünür olur.
