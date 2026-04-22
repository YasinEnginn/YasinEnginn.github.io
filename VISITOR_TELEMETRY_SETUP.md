# Visitor Telemetry Setup

Bu repo artik statik siteye uygun, edge tabanli bir ziyaretci telemetry paketi iceriyor.

## Neler toplaniyor

- `page_view` ve `main.js` icinden tetiklenen ozel event'ler
- Yaklasik lokasyon: ulke, bolge, sehir, timezone, ASN
- Cihaz baglami: browser, isletim sistemi, cihaz tipi, viewport, screen
- IP baglami:
  - Varsayilan: maske + hash
  - Opsiyonel: ham IP (`STORE_RAW_IP=true`)

## Teknik sinir

Bir ziyaretcinin gercek kimligini sadece IP ve cihaz bilgisiyle kesin olarak bilemezsin. Bu yapi sana "ayni browser tekrar gelmis mi, hangi IP/lokasyon/cihazdan gelmis" seviyesinde takip verir. Gercek kullanici kimligi icin login/sunucu tarafli oturum gerekir.

## 1. Cloudflare Worker + D1 olustur

1. Cloudflare'da bir Worker projesi ac.
2. Bu repo icindeki `telemetry/cloudflare-worker.js` dosyasini Worker ana dosyasi olarak kullan.
3. Bir D1 veritabani olustur.
4. `telemetry/schema.sql` dosyasini D1 veritabanina uygula.
5. `telemetry/wrangler.example.toml` dosyasini referans alip kendi `wrangler.toml` dosyani yaz.

## 2. Worker ortam degiskenleri

- `ADMIN_TOKEN`: dashboard sayfasina erisim icin guclu bir gizli token.
- `ALLOWED_ORIGINS`: telemetry isteklerine izin verilecek origin listesi.
  - Ornek: `https://yasinenginn.github.io`
  - Birden fazla ise virgul ile ayir.
- `STORE_RAW_IP`: `true` yaparsan ham IP de saklanir.

## 3. Site tarafi endpoint ayari

Asagidaki dosyada endpoint'i doldur:

- [assets/js/visitor_telemetry_config.js](/d:/yasinenginexpert.github.io/assets/js/visitor_telemetry_config.js:1)

Ornek:

```js
window.__VISITOR_TELEMETRY_CONFIG = Object.freeze({
  enabled: true,
  endpoint: "https://visitor-telemetry.example.workers.dev",
  site: "yasinenginn.github.io",
  respectDoNotTrack: true,
  sampleRate: 1
});
```

Eger Worker'i Cloudflare uzerinde ayri `workers.dev` domain'inde yayinlarsan, ana sayfa CSP'si buna izin verecek sekilde guncellendi.

## 4. Dashboard kullanimi

Dashboard dosyasi:

- [visitor-insights.html](/d:/yasinenginexpert.github.io/visitor-insights.html:1)

Burada:

1. Worker endpoint'ini gir.
2. `ADMIN_TOKEN` degerini gir.
3. Son 30 gunun ozetini ve son girisleri izle.

## 5. Guvenlik ve hukuk notu

- Ham IP adresi kisisel veri sayilabilir.
- `STORE_RAW_IP=false` daha guvenli varsayilandir.
- Ham IP saklayacaksan aydinlatma metni / gizlilik politikasi / KVKK-GDPR uyumunu ayri degerlendirmen gerekir.
- `respectDoNotTrack: true` ayari acik durumda.

## 6. Mevcut repo entegrasyonu

Telemetry script su sayfa tiplerine baglandi:

- Ana sayfa
- Topluluk merkezi
- CV sayfasi
- 404 sayfasi
- Notlar sayfalari
- Vaka incelemeleri
- Ayrica `main.js` icindeki ozel event takipleri

## 7. Onerilen sonraki adim

Eger istersen bir sonraki adimda sana:

- gizlilik bildirimi banner'i
- bot / abuse filtreleme
- e-posta veya Telegram uyarilari
- dashboard'a filtreleme ve export

ekleyebilirim.
