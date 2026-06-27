# Torino Günlükleri içerik rehberi

Yayımlanacak yazılar bu klasörde `YYYY-AA-GG-kisa-baslik.md` biçiminde tutulur. Taslaklar `_drafts/` altına eklenir ve normal üretimde siteye dahil edilmez.

## Zorunlu front matter

```yaml
---
title: "Yazı başlığı"
date: 2026-06-27
summary: "Kısa ve açıklayıcı özet"
category: Kampüs Yaşamı
tags:
  - Torino
  - Erasmus
location: Torino, İtalya
---
```

`modified`, `slug`, `cover`, `cover_alt`, `featured` ve `draft` isteğe bağlıdır. `cover` kullanılırsa erişilebilirlik için `cover_alt` zorunludur.

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
