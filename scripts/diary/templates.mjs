import { escapeHtml, safeJson, slugify } from "../lib/content_engine.mjs";
import {
  ASSET_VERSION,
  COLLECTION_NAME,
  COLLECTION_PATH,
  COLLECTION_URL,
  INDEX_DESCRIPTION,
  OG_IMAGE,
  PERSON_ID,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  postUrl
} from "./config.mjs";

function tagMarkup(tags) {
  return `<ul class="diary-tags" aria-label="Etiketler">
    ${tags.map((tag) => `<li><a href="/torino-gunlukleri/etiket/${slugify(tag)}/" rel="tag">#${escapeHtml(tag)}</a></li>`).join("\n    ")}
  </ul>`;
}

function postCard(post, { headingLevel = 2 } = {}) {
  const headingTag = `h${headingLevel}`;
  return `<li class="diary-card" data-diary-card data-category="${escapeHtml(slugify(post.category))}" data-tags="${escapeHtml(post.tags.map(slugify).join(" "))}" data-facets="${escapeHtml(post.facets.map(slugify).join(" "))}" data-search="${escapeHtml(post.searchText)}">
  <article>
    ${post.cover
      ? `<a class="diary-card__cover" href="/torino-gunlukleri/${post.slug}/" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(post.cover)}" alt="" width="640" height="360" loading="lazy" decoding="async"></a>`
      : `<div class="diary-card__cover diary-card__cover--placeholder" aria-hidden="true"><span>45.07° N · 7.69° E</span><strong>TO</strong></div>`}
    <div class="diary-card__badges" aria-label="İçerik özellikleri">
      <span class="diary-type-badge">${escapeHtml(post.contentType)}</span>
      ${post.facets.slice(0, 2).map((facet) => `<span>${escapeHtml(facet)}</span>`).join("\n      ")}
    </div>
    <div class="diary-card__meta">
      <time datetime="${post.dateText}">${escapeHtml(post.period || post.dateLabel)}</time>
      <span>${post.readingMinutes} dk okuma</span>
      ${post.location ? `<span>${escapeHtml(post.location)}</span>` : ""}
    </div>
    <${headingTag}><a href="/torino-gunlukleri/${post.slug}/">${escapeHtml(post.title)}</a></${headingTag}>
    <p>${escapeHtml(post.summary)}</p>
    <div class="diary-card__footer">
      <a class="diary-category" href="/torino-gunlukleri/kategori/${slugify(post.category)}/">${escapeHtml(post.category)}</a>
      ${tagMarkup(post.tags)}
    </div>
  </article>
</li>`;
}

function breadcrumb(items) {
  return `<nav class="diary-breadcrumb" aria-label="İçerik yolu">
  <ol>
    ${items.map((item, index) => `<li>${index === items.length - 1
      ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
      : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a>`}</li>`).join("\n    ")}
  </ol>
</nav>`;
}

function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function headTemplate({ title, description, canonical, schema, type = "website", post = null }) {
  const articleMeta = post ? `
  <meta property="article:published_time" content="${post.date.toISOString()}">
  <meta property="article:modified_time" content="${post.modified.toISOString()}">
  <meta property="article:section" content="${escapeHtml(post.category)}">
  ${post.tags.map((tag) => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join("\n  ")}` : "";

  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="${SITE_NAME}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" type="application/rss+xml" title="${COLLECTION_NAME} RSS" href="${absoluteUrl("feed.xml")}">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${post?.coverAbsolute || OG_IMAGE}">
  <meta property="og:image:alt" content="${escapeHtml(post?.coverAlt || `${COLLECTION_NAME} sosyal paylaşım görseli`)}">${articleMeta}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${post?.coverAbsolute || OG_IMAGE}">
  <script type="application/ld+json">${safeJson(schema)}</script>
  <link rel="stylesheet" href="/assets/css/docs.css?v=${ASSET_VERSION}">
  <link rel="stylesheet" href="/assets/css/torino-diary.css?v=${ASSET_VERSION}">
  <script src="/assets/js/torino-diary.js?v=${ASSET_VERSION}" defer></script>`;
}

function siteHeader() {
  return `<a class="skip" href="#main-content">İçeriğe geç</a>
  <header class="diary-site-header">
    <a class="diary-brand" href="/torino-gunlukleri/" aria-label="Politecnico di Torino Günlükleri ana sayfası">
      <span class="diary-brand__mark" aria-hidden="true">TO</span>
      <span><strong>Torino Günlükleri</strong><small>Yasin Engin</small></span>
    </a>
    <nav aria-label="Torino Günlükleri ana menüsü">
      <a href="/">Portfolyo</a>
      <a href="/torino-erasmus-map/">Erasmus Haritası</a>
      <a href="/torino-gunlukleri/feed.xml">RSS</a>
    </nav>
  </header>`;
}

function siteFooter() {
  return `<footer class="diary-site-footer">
    <p><strong>${COLLECTION_NAME}</strong> · Torino’da öğrenme, yaşam ve keşif notları.</p>
    <nav aria-label="Torino Günlükleri alt menüsü">
      <a href="/">Portfolyo</a>
      <a href="/torino-erasmus-map/">Torino Erasmus Map</a>
      <a href="mailto:yasinenginofficial@gmail.com?subject=Torino%20G%C3%BCnl%C3%BCkleri">İletişim</a>
    </nav>
  </footer>`;
}

function indexSchema(posts) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${COLLECTION_URL}#collection`,
        name: COLLECTION_NAME,
        description: INDEX_DESCRIPTION,
        url: COLLECTION_URL,
        inLanguage: "tr-TR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": `${COLLECTION_URL}#blog` },
        author: { "@id": PERSON_ID }
      },
      {
        "@type": "Blog",
        "@id": `${COLLECTION_URL}#blog`,
        name: COLLECTION_NAME,
        url: COLLECTION_URL,
        inLanguage: "tr-TR",
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        blogPost: posts.map((post) => ({
          "@type": "BlogPosting",
          "@id": `${postUrl(post)}#article`,
          headline: post.seoTitle,
          alternativeHeadline: post.title,
          url: postUrl(post),
          datePublished: post.date.toISOString(),
          dateModified: post.modified.toISOString(),
          description: post.metaDescription
        }))
      },
      breadcrumbSchema([
        { name: "Portfolyo", url: `${SITE_URL}/` },
        { name: COLLECTION_NAME, url: COLLECTION_URL }
      ])
    ]
  };
}

export function indexTemplate(posts) {
  const categories = [...new Set(posts.map((post) => post.category))].sort((a, b) => a.localeCompare(b, "tr"));
  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b, "tr"));
  const facets = [...new Set(posts.flatMap((post) => post.facets))].sort((a, b) => a.localeCompare(b, "tr"));
  const locations = new Set(posts.map((post) => post.location).filter(Boolean));
  const latest = posts[0];

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  ${headTemplate({
    title: `${COLLECTION_NAME} | Yasin Engin`,
    description: INDEX_DESCRIPTION,
    canonical: COLLECTION_URL,
    schema: indexSchema(posts)
  })}
</head>
<body data-diary-index>
  ${siteHeader()}
  <main id="main-content" class="diary-page" tabindex="-1">
    <section class="diary-hero" aria-labelledby="diary-title">
      <div class="diary-hero__copy">
        <p class="diary-kicker">Torino · Erasmus · Politecnico</p>
        <h1 id="diary-title">Şehri sadece gezmiyorum; okuyorum.</h1>
        <p>${INDEX_DESCRIPTION}</p>
        <div class="diary-actions">
          ${latest ? `<a class="diary-button diary-button--primary" href="/${COLLECTION_PATH}/${latest.slug}/">Son yazıyı oku</a>` : ""}
          <a class="diary-button" href="/torino-erasmus-map/">Erasmus haritasını aç</a>
          <a class="diary-text-link" href="/${COLLECTION_PATH}/feed.xml">RSS ile takip et <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div class="diary-hero__aside" aria-label="Günlük özeti">
        <p class="diary-hero__stamp" aria-hidden="true">45.07° N<br>7.69° E</p>
        <dl class="diary-stats">
          <div><dt>Yazı</dt><dd>${posts.length}</dd></div>
          <div><dt>Kategori</dt><dd>${categories.length}</dd></div>
          <div><dt>Konum</dt><dd>${locations.size}</dd></div>
        </dl>
      </div>
    </section>

    <section class="diary-photo-journal" aria-labelledby="photo-journal-title">
      <div class="diary-photo-journal__intro">
        <div>
          <p class="diary-kicker">Torino’dan kareler</p>
          <h2 id="photo-journal-title">Şehrin altı farklı ritmi</h2>
        </div>
        <p>Meydanlardan kulelere, nehir kıyısından sessiz raylara uzanan küçük bir görsel mola.</p>
      </div>
      <div class="diary-photo-journal__grid">
        <figure class="diary-photo-journal__item diary-photo-journal__item--palazzo">
          <img src="/assets/img/torino/index-gallery/palazzo-reale.webp" alt="Piazzetta Reale’den Palazzo Reale ve girişteki atlı heykeller" width="1200" height="900" loading="lazy" decoding="async">
          <figcaption>Palazzo Reale · meydanın geniş nefesi</figcaption>
        </figure>
        <figure class="diary-photo-journal__item diary-photo-journal__item--mole">
          <img src="/assets/img/torino/index-gallery/mole-antonelliana.webp" alt="Mole Antonelliana’ya bir ağacın yanından aşağıdan bakış" width="900" height="1200" loading="lazy" decoding="async">
          <figcaption>Mole Antonelliana · yukarı bakınca</figcaption>
        </figure>
        <figure class="diary-photo-journal__item diary-photo-journal__item--river">
          <img src="/assets/img/torino/index-gallery/po-nehri.webp" alt="Ağaçlarla çevrili Po Nehri ve suya yansıyan kıyılar" width="1200" height="900" loading="lazy" decoding="async">
          <figcaption>Po Nehri · şehrin sakin tarafı</figcaption>
        </figure>
        <figure class="diary-photo-journal__item diary-photo-journal__item--tree">
          <img src="/assets/img/torino/index-gallery/agac-golgesi.webp" alt="Nehir kıyısında güneş ışığının arasından geçtiği büyük bir ağaç" width="900" height="1200" loading="lazy" decoding="async">
          <figcaption>Nehir kıyısı · yaprakların altında</figcaption>
        </figure>
        <figure class="diary-photo-journal__item diary-photo-journal__item--street">
          <img src="/assets/img/torino/index-gallery/tramvay-sokagi.webp" alt="Tramvay rayları ve havai hatlarla uzanan sakin bir Torino sokağı" width="900" height="1200" loading="lazy" decoding="async">
          <figcaption>Raylar · sabahın boş sokağı</figcaption>
        </figure>
        <figure class="diary-photo-journal__item diary-photo-journal__item--church">
          <img src="/assets/img/torino/index-gallery/torino-kilisesi.webp" alt="Çift kuleli tarihî bir Torino kilisesine sokaktan aşağıdan bakış" width="900" height="1200" loading="lazy" decoding="async">
          <figcaption>Taş ve ışık · başka bir köşe</figcaption>
        </figure>
      </div>
      <p class="diary-photo-journal__note">Kişisel arşiv · 5 Temmuz 2026</p>
    </section>

    <section class="diary-explorer" aria-labelledby="entries-title">
      <div class="diary-section-head">
        <div><p class="diary-kicker">Yaşayan arşiv</p><h2 id="entries-title">Günlük yazıları</h2></div>
        <p>Hazırlıktan kampüs yaşamına, şehir keşiflerinden pratik Erasmus notlarına kadar düzenli büyüyen bir koleksiyon.</p>
      </div>
      <form class="diary-filters" role="search" aria-label="Günlük yazılarında ara" data-diary-filters>
        <label for="diary-search">Yazılarda ara</label>
        <div class="diary-filter-row">
          <input id="diary-search" name="q" type="search" placeholder="Örn. kampüs, ulaşım, Erasmus…" autocomplete="off" data-diary-search>
          <select id="diary-category" name="category" data-diary-category aria-label="Kategoriye göre filtrele">
            <option value="">Tüm kategoriler</option>
            ${categories.map((category) => `<option value="${slugify(category)}">${escapeHtml(category)}</option>`).join("\n            ")}
          </select>
          <button type="reset" data-diary-reset>Temizle</button>
        </div>
        <div class="diary-filter-tags" aria-label="Etikete göre filtrele">
          ${tags.slice(0, 10).map((tag) => `<button type="button" data-diary-tag="${slugify(tag)}" aria-pressed="false">#${escapeHtml(tag)}</button>`).join("\n          ")}
        </div>
        <div class="diary-filter-facets" aria-label="Okuma amacına göre filtrele">
          <span>Hızlı seçim</span>
          ${facets.map((facet) => `<button type="button" data-diary-facet="${slugify(facet)}" aria-pressed="false">${escapeHtml(facet)}</button>`).join("\n          ")}
        </div>
      </form>
      <p class="diary-results" aria-live="polite" data-diary-results>${posts.length} yazı gösteriliyor.</p>
      <ol class="diary-card-list" data-diary-list>${posts.map((post) => postCard(post)).join("\n        ")}</ol>
      <div class="diary-empty" data-diary-empty hidden><strong>Bu aramada bir yazı bulamadım.</strong><p>Filtreleri temizleyip başka bir ifade deneyebilirsin.</p></div>
    </section>
  </main>
  ${siteFooter()}
</body>
</html>`;
}

function tableOfContents(post) {
  if (post.headings.length < 2) return "";
  return `<nav class="diary-toc" aria-label="Yazı içindekiler menüsü">
  <details open data-diary-toc-details>
    <summary>Bu yazıda <span aria-hidden="true">${post.headings.length} bölüm</span></summary>
    <ol>
      ${post.headings.map((heading) => `<li class="diary-toc__level-${heading.level}"><a href="#${heading.id}">${escapeHtml(heading.title)}</a></li>`).join("\n      ")}
    </ol>
  </details>
</nav>`;
}

function postSchema(post) {
  const canonical = postUrl(post);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        headline: post.seoTitle,
        alternativeHeadline: post.title,
        description: post.metaDescription,
        url: canonical,
        mainEntityOfPage: canonical,
        image: post.coverAbsolute || OG_IMAGE,
        inLanguage: "tr-TR",
        isAccessibleForFree: true,
        datePublished: post.date.toISOString(),
        dateModified: post.modified.toISOString(),
        articleSection: post.category,
        keywords: [...post.tags, ...post.facets].join(", "),
        wordCount: post.words,
        timeRequired: `PT${post.readingMinutes}M`,
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        isPartOf: { "@id": `${COLLECTION_URL}#blog` },
        about: [...post.tags, ...post.facets].map((name) => ({ "@type": "Thing", name })),
        ...(post.location ? { contentLocation: { "@type": "Place", name: post.location } } : {})
      },
      breadcrumbSchema([
        { name: "Portfolyo", url: `${SITE_URL}/` },
        { name: COLLECTION_NAME, url: COLLECTION_URL },
        { name: post.title, url: canonical }
      ])
    ]
  };
}

export function postTemplate(post, relatedPosts) {
  const canonical = postUrl(post);
  const shareText = encodeURIComponent(`${post.title} — ${COLLECTION_NAME}`);
  const shareUrl = encodeURIComponent(canonical);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  ${headTemplate({ title: post.seoTitle, description: post.metaDescription, canonical, schema: postSchema(post), type: "article", post })}
</head>
<body>
  ${siteHeader()}
  <main id="main-content" class="diary-page diary-page--article" tabindex="-1">
    ${breadcrumb([
      { name: "Portfolyo", href: "/" },
      { name: "Torino Günlükleri", href: "/torino-gunlukleri/" },
      { name: post.title, href: `/${COLLECTION_PATH}/${post.slug}/` }
    ])}
    <article class="diary-article">
      <header class="diary-article__header">
        ${post.isDraft ? '<p class="diary-draft-banner" role="status">Taslak önizleme · Bu yazı yayımlanmış değildir.</p>' : ""}
        <a class="diary-category" href="/torino-gunlukleri/kategori/${slugify(post.category)}/">${escapeHtml(post.category)}</a>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="diary-article__lead">${escapeHtml(post.summary)}</p>
        <div class="diary-article__meta">
          <time datetime="${post.dateText}">${escapeHtml(post.period || post.dateLabel)}</time>
          <span>${post.readingMinutes} dk okuma</span><span>${post.words} kelime</span>
          ${post.location ? `<span>${escapeHtml(post.location)}</span>` : ""}
        </div>
        ${tagMarkup(post.tags)}
      </header>
      ${post.cover ? `<figure class="diary-cover"><img src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.coverAlt)}" width="1200" height="675" decoding="async" fetchpriority="high"></figure>` : ""}
      <div class="diary-article__layout">
        ${tableOfContents(post)}
        <div class="diary-content">${post.html}</div>
      </div>
      <footer class="diary-article__footer">
        <div>
          <p class="diary-kicker">Paylaş</p>
          <div class="diary-share">
            <button type="button" data-share-title="${escapeHtml(post.title)}" data-share-url="${canonical}" data-native-share>Paylaş</button>
            <button type="button" data-copy-url="${canonical}">Bağlantıyı kopyala</button>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://x.com/intent/post?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener noreferrer">X</a>
          </div>
          <p class="diary-share-status" aria-live="polite" data-share-status></p>
        </div>
        <div class="diary-feedback"><p><strong>Bir düzeltme ya da önerin mi var?</strong></p><a href="mailto:yasinenginofficial@gmail.com?subject=${encodeURIComponent(`Torino Günlükleri: ${post.title}`)}">Bana not bırak</a></div>
      </footer>
    </article>
    ${relatedPosts.length ? `<section class="diary-related" aria-labelledby="related-title">
      <div class="diary-section-head"><div><p class="diary-kicker">Yol devam ediyor</p><h2 id="related-title">İlgili yazılar</h2></div></div>
      <ol class="diary-card-list diary-card-list--related">${relatedPosts.map((related) => postCard(related, { headingLevel: 3 })).join("\n        ")}</ol>
    </section>` : ""}
  </main>
  ${siteFooter()}
</body>
</html>`;
}

function archiveSchema({ name, description, canonical, posts }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name,
        description,
        url: canonical,
        inLanguage: "tr-TR",
        isPartOf: { "@id": `${COLLECTION_URL}#blog` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: posts.length,
          itemListElement: posts.map((post, index) => ({ "@type": "ListItem", position: index + 1, url: postUrl(post), name: post.title }))
        }
      },
      breadcrumbSchema([
        { name: "Portfolyo", url: `${SITE_URL}/` },
        { name: COLLECTION_NAME, url: COLLECTION_URL },
        { name, url: canonical }
      ])
    ]
  };
}

export function archiveTemplate({ kind, value, posts }) {
  const kindLabel = kind === "etiket" ? "Etiket" : "Kategori";
  const canonical = absoluteUrl(`${kind}/${slugify(value)}/`);
  const title = `${kindLabel}: ${value} | ${COLLECTION_NAME}`;
  const description = `${COLLECTION_NAME} içindeki “${value}” ${kindLabel.toLocaleLowerCase("tr-TR")} arşivi.`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>${headTemplate({ title, description, canonical, schema: archiveSchema({ name: `${kindLabel}: ${value}`, description, canonical, posts }) })}</head>
<body>
  ${siteHeader()}
  <main id="main-content" class="diary-page" tabindex="-1">
    ${breadcrumb([
      { name: "Portfolyo", href: "/" },
      { name: "Torino Günlükleri", href: "/torino-gunlukleri/" },
      { name: `${kindLabel}: ${value}`, href: `/${COLLECTION_PATH}/${kind}/${slugify(value)}/` }
    ])}
    <header class="diary-archive-header">
      <p class="diary-kicker">${kindLabel} arşivi</p><h1>${escapeHtml(value)}</h1>
      <p>${posts.length} yazı bu başlık altında buluşuyor.</p>
      <a class="diary-text-link" href="/torino-gunlukleri/">Tüm günlüklere dön <span aria-hidden="true">→</span></a>
    </header>
    <ol class="diary-card-list">${posts.map((post) => postCard(post)).join("\n      ")}</ol>
  </main>
  ${siteFooter()}
</body>
</html>`;
}
