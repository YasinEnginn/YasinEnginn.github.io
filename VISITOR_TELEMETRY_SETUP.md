# Visitor Telemetry Kurulumu

Bu repo artık statik siteye uygun, uçta çalışan bir ziyaretçi telemetri paketi içeriyor.

## Neler toplanıyor?

- `page_view` olayları ve `main.js` içinden tetiklenen özel olaylar
- Yaklaşık konum bilgisi: ülke, bölge, şehir, saat dilimi ve ASN
- Cihaz bilgisi: tarayıcı, işletim sistemi, cihaz türü, viewport ve ekran ölçüleri
- IP bilgisi:
  - Varsayılan: maske + hash
  - İsteğe bağlı: ham IP (`STORE_RAW_IP=true`)

## Teknik sınır

Bir ziyaretçinin gerçek kimliğini yalnızca IP ve cihaz bilgisiyle kesin olarak belirleyemezsin. Bu yapı sana, "aynı tarayıcı tekrar gelmiş mi, hangi IP/konum/cihazdan gelmiş" düzeyinde takip imkânı verir. Gerçek kullanıcı kimliği için giriş yapan kullanıcılar veya sunucu taraflı oturum yönetimi gerekir.

## 1. Cloudflare Worker ve D1 oluştur

1. Cloudflare üzerinde bir Worker projesi aç.
2. Bu repo içindeki `telemetry/cloudflare-worker.js` dosyasını Worker ana dosyası olarak kullan.
3. Bir D1 veritabanı oluştur.
4. `telemetry/schema.sql` dosyasını D1 veritabanına uygula.
5. `telemetry/wrangler.example.toml` dosyasını referans alarak kendi `wrangler.toml` dosyanı hazırla.

## 2. Worker ortam değişkenleri

- `ADMIN_TOKEN`: yönetim ekranına erişim için güçlü ve gizli bir anahtar.
- `ALLOWED_ORIGINS`: telemetri isteklerine izin verilecek origin listesi.
  - Örnek: `https://yasinenginn.github.io`
  - Birden fazla değer varsa virgülle ayır.
- `STORE_RAW_IP`: `true` yapılırsa ham IP de saklanır.

## 3. Site tarafındaki uç nokta ayarı

Aşağıdaki dosyada `endpoint` alanını doldur:

- [assets/js/visitor_telemetry_config.js](/d:/yasinenginexpert.github.io/assets/js/visitor_telemetry_config.js:1)

Örnek:

```js
window.__VISITOR_TELEMETRY_CONFIG = Object.freeze({
  enabled: true,
  endpoint: "https://visitor-telemetry.example.workers.dev",
  site: "yasinenginn.github.io",
  respectDoNotTrack: true,
  sampleRate: 1
});
```

Eğer Worker'ı Cloudflare üzerinde ayrı bir `workers.dev` alan adında yayımlarsan, ana sayfa CSP'si buna izin verecek şekilde zaten güncellendi.

## 4. Yönetim ekranını private tutma

Public portfolyo içinde yönetim/analiz ekranı yayınlama. `ADMIN_TOKEN`, uç nokta ve ziyaretçi özetlerini gösteren
arayüzü ayrı bir private repo, yerel dosya veya erişimi kapalı bir admin paneli içinde tut.

Önerilen kullanım:

1. Worker uç noktasını yalnızca private yönetim arayüzünde kullan.
2. `ADMIN_TOKEN` değerini public repoya veya public GitHub Pages çıktısına koyma.
3. Son 30 gün özetini ve son girişleri yalnızca private/admin ortamından incele.

## 5. Güvenlik ve hukuk notu

- Ham IP adresi kişisel veri sayılabilir.
- `STORE_RAW_IP=false` daha güvenli varsayılandır.
- Ham IP saklayacaksan aydınlatma metni, gizlilik politikası ve KVKK/GDPR uyumunu ayrıca değerlendirmen gerekir.
- `respectDoNotTrack: true` ayarı açık durumda.

## 6. Mevcut repo entegrasyonu

Telemetri betiği şu sayfa türlerine bağlandı:

- Ana sayfa
- Topluluk merkezi
- CV sayfası
- 404 sayfası
- Notlar sayfaları
- Vaka incelemeleri
- Ayrıca `main.js` içindeki özel olay takipleri

## 7. Önerilen sonraki adım

İstersen bir sonraki adımda şunları da ekleyebilirim:

- gizlilik bildirimi bandı
- bot ve kötüye kullanım filtreleme
- e-posta veya Telegram uyarıları
- yönetim ekranına filtreleme ve dışa aktarma

özellikleri.
