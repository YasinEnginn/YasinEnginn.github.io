# Torino Günlükleri içerik rehberi

Yayımlanacak yazılar `posts/` klasöründe `YYYY-AA-GG-kisa-baslik.md` biçiminde tutulur. Taslaklar `drafts/` altına eklenir ve normal üretimde siteye dahil edilmez.

## Zorunlu front matter

```yaml
---
title: "Yazı başlığı"
date: 2026-06-27
summary: "Kısa ve açıklayıcı özet"
seo_title: "Arama niyetine göre kısa ve açıklayıcı başlık"
meta_description: "Okuyucunun bu yazıda ne bulacağını anlatan özgün açıklama"
type: Deneyim
facets:
  - Başlangıç için önerilenler
  - Pratik bilgi
category: Kampüs Yaşamı
tags:
  - Torino
  - Erasmus
location: Torino, İtalya
---
```

`seo_title` ve `meta_description` verilmezse sırasıyla `title` ve `summary` kullanılır. `type` kart rozetini; `facets` ise görev odaklı hızlı filtreleri üretir. `modified`, `period`, `slug`, `cover`, `cover_alt`, `featured` ve `draft` isteğe bağlıdır. `cover` kullanılırsa erişilebilirlik için `cover_alt` zorunludur.

## Medya

Tek görsel:

```md
![Anlamlı alternatif metin](/assets/img/torino/fotograf.webp "Görsel altyazısı")
```

Galeri:

```md
:::gallery
![Birinci görsel](/assets/img/torino/bir.webp "Birinci not")
![İkinci görsel](/assets/img/torino/iki.webp "İkinci not")
:::
```

Gizlilik geliştirilmiş YouTube gömme:

```md
@[youtube](VIDEO_ID "Videonun erişilebilir başlığı")
```

## Üretim

```bash
npm run build:diary
```

Taslak önizlemek için:

```bash
node scripts/build_torino_diary.mjs --drafts
```

Taslak önizlemesinden sonra yayımlanmış çıktıyı geri üretmek için yeniden `npm run build:diary` çalıştırılır.
