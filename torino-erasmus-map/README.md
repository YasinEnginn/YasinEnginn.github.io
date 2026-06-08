# Torino Erasmus Haritası

Mobil uyumlu, GitHub Pages / Netlify için hazır statik web uygulaması.

## Dosyalar

- `index.html`: Uygulama girişi.
- `assets/css/styles.css`: Mobil ve masaüstü arayüz.
- `assets/js/app.js`: Harita, filtreler, arama, GTT hatları ve havaalanı tren rehberi.
- `data/app-data.json`: POI, kategori ve havaalanı tren rehberi verisi.
- `data/transit.json`: GTT hat, durak ve güzergah verisi.
- `manifest.webmanifest` ve `sw.js`: PWA / ana ekrana ekleme desteği.

## Mobil Kullanım

Web linki üzerinden açınca telefonda Chrome/Safari ile kullanılır. HTTPS üzerinde konum butonu daha sağlıklı çalışır.

Öne çıkanlar:

- Havaalanı Treni düğmesi: Torino Airport - Porta Susa - Borsellino yurdu rehberi.
- Metro M1 düğmesi: metro hattını kalın ve parlak çizgiyle açar.
- Kategori filtreleri: yurt, Politecnico, BNL ATM, cami, helal yemek, GTT kart merkezleri.
- GTT Hatları: hat seçince durak ve güzergah görünür.

## Yerel Test

Bu klasörde:

```powershell
python -m http.server 8088
```

Sonra tarayıcıda `http://localhost:8088/` aç.
