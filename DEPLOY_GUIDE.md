# GitHub Pages Yayınlama Kılavuzu

Web siteniz yerel olarak hazır! 🎉
Bunu tüm dünyaya yayınlamak için yapmanız gerekenler sırasıyla aşağıdadır.

## 1. Hazırlık Kontrolü
Aşağıdaki dosyaların klasörünüzde olduğundan emin olun (Ben sizin için oluşturdum ✅):
- `index.html` (Ana sayfa)
- `.nojekyll` (GitHub'ın siteyi düzgün işlemesi için gizli dosya)
- `assets/` (Resimler, stiller ve kodlar)
- `404.html` (Hata sayfası)

## 2. GitHub'a Gönderme (Deploy)

Terminali veya komut satırını bu klasörde açın ve şu komutları sırasıyla yazın:

1. **Değişiklikleri Sahneye Alın:**
   ```bash
   git add .
   ```

2. **Kayıt Oluşturun (Commit):**
   ```bash
   git commit -m "Web sitesi tasarımı tamamlandı - v1.0"
   ```

3. **GitHub'a Yükleyin (Push):**
   *(Eğer bu repoyu daha önce bağladıysanız)*
   ```bash
   git push origin main
   ```
   *(Eğer hata alırsanız veya branch adınız 'master' ise `git push origin master` deneyin)*

## 3. Yayına Alma (GitHub Pages Ayarları)

1. Tarayıcınızda GitHub reponuzu açın: [https://github.com/YasinEnginExpert/yasinenginexpert.github.io](https://github.com/YasinEnginExpert/yasinenginexpert.github.io)
2. Üst menüden **Settings** (Ayarlar) sekmesine tıklayın.
3. Soldaki menüden **Pages** kısmını bulun ve tıklayın.
4. **Build and deployment** altında:
   - **Source:** `Deploy from a branch` seçili olsun.
   - **Branch:** `main` (veya `master`) seçin ve kök klasör (`/root`) olarak ayarlayıp **Save** butonuna basın.

## 4. Sonuç 🚀
Birkaç dakika bekleyin (sayfayı yenileyin). En üstte şu yazıyı göreceksiniz:
> **"Your site is live at https://yasinenginexpert.github.io"**

Siteye tıkladığınızda tasarımınız yayında olacak!
