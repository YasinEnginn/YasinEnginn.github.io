## Neler değişti?

- Yazı H1’i edebî kalırken ayrı `seo_title` ve `meta_description` alanları eklendi.
- Open Graph, Twitter ve JSON-LD başlık/açıklamaları arama niyetine göre üretildi.
- Başlangıç, pratik bilgi, fotoğraf hikâyesi, ulaşım, yurt ve Politecnico için görev odaklı hızlı filtreler eklendi.
- Kartlara içerik türü ve özellik rozetleri eklendi.
- Yazı detay sayfası 720 px okuma genişliğine sahip krem “paper mode” tasarımına geçirildi.
- İçindekiler menüsü mobilde kapanabilir ve erişilebilir `<details>` yapısına dönüştürüldü.
- Ana/alt menü erişilebilirlik etiketleri daha açıklayıcı hale getirildi.
- Günlük üreticisi `config`, `load_posts`, `templates` ve `artifacts` modüllerine ayrıldı.
- İçerik yapısı `posts/` ve `drafts/` klasörlerine taşındı; belgeler güncellendi.
- CSS/JS URL’lerine sürüm parametresi eklenerek eski asset önbelleği riski azaltıldı.

## Neden?

Arama sonuçlarında daha açıklayıcı başlık ve snippet üretmek, büyüyen günlük arşivini görev odaklı keşfedilebilir kılmak, uzun yazılarda göz yorgunluğunu azaltmak ve içerik üretim kodunun bakımını kolaylaştırmak.

## Canlı yayın teşhisi

GitHub Pages ayarı `main / root` ve build türü branch tabanlı (`legacy`). Son canlı yayın iki yazıyı gösteriyor; geri bildirimdeki eski görünüm önceki deploy/CDN önbelleğiyle ilişkiliydi. Yeni asset sürüm parametresi bu geçişlerde CSS/JS uyumsuzluğunu azaltıyor.

## Kontroller

- `npm run check`
- Taslak ve normal günlük build testi
- 1440 px masaüstü ve 390 px mobil Playwright denetimi
- Filtre/URL/reset davranışı
- SEO title, description, canonical, OG ve JSON-LD doğrulaması
- Mobil TOC aç/kapat testi
- 720 px okuma genişliği, kırık görsel, yatay taşma ve konsol hatası denetimi
