# Torino Erasmus Haritası

Mobil uyumlu, GitHub Pages / Netlify için hazır statik web uygulaması.

## Dosyalar

- `index.html`: Uygulama girişi.
- `assets/css/styles.css`: Mobil ve masaüstü arayüz.
- `assets/js/app.js`: Harita, filtreler, arama, GTT hatları ve havaalanı tren rehberi.
- `assets/vendor/`: Leaflet, MarkerCluster ve Fuse yerel kopyaları; mobil/offline kullanımda CDN bağımlılığını azaltır.
- `data/app-data.json`: POI, kategori ve havaalanı tren rehberi verisi.
- `data/erasmus-guide.json`: Offline acil kart, hazir rotalar, resmi linkler, checklist ve ek acil/resmi POI verisi.
- `data/transit.json`: GTT hat, durak ve güzergah verisi.
- `manifest.webmanifest` ve `sw.js`: PWA / ana ekrana ekleme desteği.
- `assets/icons/` ve `assets/screenshots/`: Profesyonel PWA ikonları ve manifest ekran görüntüleri.

## Mobil Kullanım

Web linki üzerinden açınca telefonda Chrome/Safari ile kullanılır. HTTPS üzerinde konum butonu daha sağlıklı çalışır.

Öne çıkanlar:

- Havaalanı Treni düğmesi: Torino Airport - Porta Susa - Borsellino yurdu rehberi.
- Metro M1 düğmesi: metro hattını kalın ve parlak çizgiyle açar.
- Kategori filtreleri: yurt, Politecnico, BNL ATM, cami, helal yemek, GTT kart merkezleri.
- GTT Hatları: hat seçince durak ve güzergah görünür.
- Favoriler: Kart veya popup yıldızıyla nokta kaydedilir; telefonda yerel olarak saklanır.
- Namaz & Kıble: AlAdhan API ile Diyanet yöntemi namaz vakitleri alınır; kıble derecesi uygulama içinde hesaplanır.
- Detaylı lokasyon rehberi: Mağaza türü, tarihi yapı türü, resmi işlem amacı, adres/marka ve dikkat notları popup içinde gösterilir.
- Mobil bottom sheet: Ara / Filtre / Liste seviyeleriyle panel yüksekliği telefonda hızlı değişir.
- Offline/update: Yeni sürüm toast bildirimi, offline uyarısı ve cache-first app shell desteği vardır.
- Acil Erasmus modu: 112/113/115/118, kayboldum cumleleri, Borsellino/PoliTO adresleri, resmi PoliTO/EDISU/GTT linkleri, hazir rota butonlari, ilk hafta checklist'i ve dusuk batarya liste modu vardir.

## Yerel Test

Bu klasörde:

```powershell
python -m http.server 8088
```

Sonra tarayıcıda `http://localhost:8088/` aç.
