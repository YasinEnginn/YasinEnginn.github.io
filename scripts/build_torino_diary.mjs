import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  asArray,
  cleanOutput,
  contentStats,
  escapeHtml,
  escapeXml,
  formatTurkishDate,
  markdownToPlainText,
  parseDate,
  parseFrontMatter,
  renderMarkdown,
  safeJson,
  slugify,
  toDateText
} from "./lib/content_engine.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SOURCE_DIR = path.join(ROOT, "content", "torino-diary");
const DRAFTS_DIR = path.join(SOURCE_DIR, "_drafts");
const OUTPUT_DIR = path.join(ROOT, "torino-gunlukleri");
const SITEMAP_PATH = path.join(ROOT, "sitemap-torino-diary.xml");
const INCLUDE_DRAFTS = process.argv.includes("--drafts");

const SITE_URL = "https://yasinenginn.github.io";
const COLLECTION_PATH = "torino-gunlukleri";
const COLLECTION_URL = `${SITE_URL}/${COLLECTION_PATH}/`;
const COLLECTION_NAME = "Politecnico di Torino Günlükleri";
const SITE_NAME = "Yasin Engin";
const PERSON_ID = `${SITE_URL}/#person`;
const OG_IMAGE = `${SITE_URL}/assets/img/social/og-home.png`;
const TODAY_TEXT = process.env.CONTENT_BUILD_DATE || new Date().toISOString().slice(0, 10);
const TODAY = parseDate(TODAY_TEXT, "CONTENT_BUILD_DATE");

function absoluteUrl(relativePath = "") {
  return relativePath ? `${COLLECTION_URL}${relativePath.replace(/^\/+/, "")}` : COLLECTION_URL;
}

function relativeOutputPath(post) {
  return `${post.slug}/`;
}

function postUrl(post) {
  return absoluteUrl(relativeOutputPath(post));
}

function tagUrl(tag) {
  return absoluteUrl(`etiket/${slugify(tag)}/`);
}

function categoryUrl(category) {
  return absoluteUrl(`kategori/${slugify(category)}/`);
}

function tagMarkup(tags) {
  return `<ul class="diary-tags" aria-label="Etiketler">
    ${tags
      .map(
        (tag) => `<li><a href="/torino-gunlukleri/etiket/${slugify(tag)}/" rel="tag">#${escapeHtml(tag)}</a></li>`
      )
      .join("\n    ")}
  </ul>`;
}

function postCard(post, { headingLevel = 2 } = {}) {
  const headingTag = `h${headingLevel}`;
  return `<li class="diary-card" data-diary-card data-category="${escapeHtml(slugify(post.category))}" data-tags="${escapeHtml(post.tags.map(slugify).join(" "))}" data-search="${escapeHtml(post.searchText)}">
  <article>
    <div class="diary-card__meta">
      <time datetime="${post.dateText}">${escapeHtml(post.dateLabel)}</time>
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
    ${items
      .map(
        (item, index) => `<li>${
          index === items.length - 1
            ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
            : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a>`
        }</li>`
      )
      .join("\n    ")}
  </ol>
</nav>`;
}

function headTemplate({ title, description, canonical, schema, type = "website", post = null }) {
  const articleMeta = post
    ? `
  <meta property="article:published_time" content="${post.date.toISOString()}">
  <meta property="article:modified_time" content="${post.modified.toISOString()}">
  <meta property="article:section" content="${escapeHtml(post.category)}">
  ${post.tags.map((tag) => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join("\n  ")}`
    : "";

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
  <link rel="stylesheet" href="/assets/css/docs.css">
  <link rel="stylesheet" href="/assets/css/torino-diary.css">
  <script src="/assets/js/torino-diary.js" defer></script>`;
}

function siteHeader() {
  return `<a class="skip" href="#main-content">İçeriğe geç</a>
  <header class="diary-site-header">
    <a class="diary-brand" href="/torino-gunlukleri/" aria-label="Politecnico di Torino Günlükleri ana sayfası">
      <span class="diary-brand__mark" aria-hidden="true">TO</span>
      <span><strong>Torino Günlükleri</strong><small>Yasin Engin</small></span>
    </a>
    <nav aria-label="Ana bağlantılar">
      <a href="/">Portfolyo</a>
      <a href="/torino-erasmus-map/">Erasmus Haritası</a>
      <a href="/torino-gunlukleri/feed.xml">RSS</a>
    </nav>
  </header>`;
}

function siteFooter() {
  return `<footer class="diary-site-footer">
    <p><strong>${COLLECTION_NAME}</strong> · Torino’da öğrenme, yaşam ve keşif notları.</p>
    <nav aria-label="Alt bağlantılar">
      <a href="/">Portfolyo</a>
      <a href="/torino-erasmus-map/">Torino Erasmus Map</a>
      <a href="mailto:yasinenginofficial@gmail.com?subject=Torino%20G%C3%BCnl%C3%BCkleri">İletişim</a>
    </nav>
  </footer>`;
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

function indexSchema(posts) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${COLLECTION_URL}#collection`,
        name: COLLECTION_NAME,
        description: "Politecnico di Torino ve Torino yaşamına dair kişisel Erasmus günlüğü, pratik notlar ve keşifler.",
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
          headline: post.title,
          url: postUrl(post),
          datePublished: post.date.toISOString(),
          dateModified: post.modified.toISOString(),
          description: post.summary
        }))
      },
      breadcrumbSchema([
        { name: "Portfolyo", url: `${SITE_URL}/` },
        { name: COLLECTION_NAME, url: COLLECTION_URL }
      ])
    ]
  };
}

function indexTemplate(posts) {
  const categories = [...new Set(posts.map((post) => post.category))].sort((a, b) => a.localeCompare(b, "tr"));
  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b, "tr"));
  const locations = new Set(posts.map((post) => post.location).filter(Boolean));
  const latest = posts[0];
  const description = "Politecnico di Torino ve Torino yaşamına dair kişisel Erasmus günlüğü, pratik notlar, keşifler ve fotoğraf hikâyeleri.";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  ${headTemplate({
    title: `${COLLECTION_NAME} | Yasin Engin`,
    description,
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
        <p>${description}</p>
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

    <section class="diary-explorer" aria-labelledby="entries-title">
      <div class="diary-section-head">
        <div>
          <p class="diary-kicker">Yaşayan arşiv</p>
          <h2 id="entries-title">Günlük yazıları</h2>
        </div>
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
      </form>

      <p class="diary-results" aria-live="polite" data-diary-results>${posts.length} yazı gösteriliyor.</p>
      <ol class="diary-card-list" data-diary-list>
        ${posts.map((post) => postCard(post)).join("\n        ")}
      </ol>
      <div class="diary-empty" data-diary-empty hidden>
        <strong>Bu aramada bir yazı bulamadım.</strong>
        <p>Filtreleri temizleyip başka bir ifade deneyebilirsin.</p>
      </div>
    </section>
  </main>
  ${siteFooter()}
</body>
</html>`;
}

function tableOfContents(post) {
  if (post.headings.length < 2) return "";
  return `<nav class="diary-toc" aria-labelledby="toc-title">
  <h2 id="toc-title">Bu yazıda</h2>
  <ol>
    ${post.headings
      .map((heading) => `<li class="diary-toc__level-${heading.level}"><a href="#${heading.id}">${escapeHtml(heading.title)}</a></li>`)
      .join("\n    ")}
  </ol>
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
        headline: post.title,
        description: post.summary,
        url: canonical,
        mainEntityOfPage: canonical,
        image: post.coverAbsolute || OG_IMAGE,
        inLanguage: "tr-TR",
        datePublished: post.date.toISOString(),
        dateModified: post.modified.toISOString(),
        articleSection: post.category,
        keywords: post.tags.join(", "),
        wordCount: post.words,
        timeRequired: `PT${post.readingMinutes}M`,
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        isPartOf: { "@id": `${COLLECTION_URL}#blog` },
        about: post.tags.map((tag) => ({ "@type": "Thing", name: tag })),
        ...(post.location
          ? { contentLocation: { "@type": "Place", name: post.location } }
          : {})
      },
      breadcrumbSchema([
        { name: "Portfolyo", url: `${SITE_URL}/` },
        { name: COLLECTION_NAME, url: COLLECTION_URL },
        { name: post.title, url: canonical }
      ])
    ]
  };
}

function postTemplate(post, relatedPosts) {
  const canonical = postUrl(post);
  const shareText = encodeURIComponent(`${post.title} — ${COLLECTION_NAME}`);
  const shareUrl = encodeURIComponent(canonical);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  ${headTemplate({
    title: `${post.title} | ${COLLECTION_NAME}`,
    description: post.summary,
    canonical,
    schema: postSchema(post),
    type: "article",
    post
  })}
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
          <time datetime="${post.dateText}">${escapeHtml(post.dateLabel)}</time>
          <span>${post.readingMinutes} dk okuma</span>
          <span>${post.words} kelime</span>
          ${post.location ? `<span>${escapeHtml(post.location)}</span>` : ""}
        </div>
        ${tagMarkup(post.tags)}
      </header>
      ${
        post.cover
          ? `<figure class="diary-cover"><img src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.coverAlt)}" width="1200" height="675" decoding="async" fetchpriority="high"></figure>`
          : ""
      }
      <div class="diary-article__layout">
        ${tableOfContents(post)}
        <div class="diary-content">
          ${post.html}
        </div>
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
        <div class="diary-feedback">
          <p><strong>Bir düzeltme ya da önerin mi var?</strong></p>
          <a href="mailto:yasinenginofficial@gmail.com?subject=${encodeURIComponent(`Torino Günlükleri: ${post.title}`)}">Bana not bırak</a>
        </div>
      </footer>
    </article>
    ${
      relatedPosts.length
        ? `<section class="diary-related" aria-labelledby="related-title">
      <div class="diary-section-head"><div><p class="diary-kicker">Yol devam ediyor</p><h2 id="related-title">İlgili yazılar</h2></div></div>
      <ol class="diary-card-list diary-card-list--related">
        ${relatedPosts.map((related) => postCard(related, { headingLevel: 3 })).join("\n        ")}
      </ol>
    </section>`
        : ""
    }
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
          itemListElement: posts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: postUrl(post),
            name: post.title
          }))
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

function archiveTemplate({ kind, value, posts }) {
  const kindLabel = kind === "etiket" ? "Etiket" : "Kategori";
  const canonical = absoluteUrl(`${kind}/${slugify(value)}/`);
  const title = `${kindLabel}: ${value} | ${COLLECTION_NAME}`;
  const description = `${COLLECTION_NAME} içindeki “${value}” ${kindLabel.toLocaleLowerCase("tr-TR")} arşivi.`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  ${headTemplate({
    title,
    description,
    canonical,
    schema: archiveSchema({ name: `${kindLabel}: ${value}`, description, canonical, posts })
  })}
</head>
<body>
  ${siteHeader()}
  <main id="main-content" class="diary-page" tabindex="-1">
    ${breadcrumb([
      { name: "Portfolyo", href: "/" },
      { name: "Torino Günlükleri", href: "/torino-gunlukleri/" },
      { name: `${kindLabel}: ${value}`, href: `/${COLLECTION_PATH}/${kind}/${slugify(value)}/` }
    ])}
    <header class="diary-archive-header">
      <p class="diary-kicker">${kindLabel} arşivi</p>
      <h1>${escapeHtml(value)}</h1>
      <p>${posts.length} yazı bu başlık altında buluşuyor.</p>
      <a class="diary-text-link" href="/torino-gunlukleri/">Tüm günlüklere dön <span aria-hidden="true">→</span></a>
    </header>
    <ol class="diary-card-list">
      ${posts.map((post) => postCard(post)).join("\n      ")}
    </ol>
  </main>
  ${siteFooter()}
</body>
</html>`;
}

function buildFeed(posts, buildDate) {
  const items = posts
    .slice(0, 30)
    .map(
      (post) => `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${postUrl(post)}</link>
  <guid isPermaLink="true">${postUrl(post)}</guid>
  <pubDate>${post.date.toUTCString()}</pubDate>
  <description>${escapeXml(post.summary)}</description>
  ${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n  ")}
</item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${COLLECTION_NAME}</title>
  <link>${COLLECTION_URL}</link>
  <atom:link href="${absoluteUrl("feed.xml")}" rel="self" type="application/rss+xml"/>
  <description>Politecnico di Torino ve Torino yaşamına dair Erasmus günlüğü, pratik notlar ve keşifler.</description>
  <language>tr-TR</language>
  <lastBuildDate>${buildDate.toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>`;
}

function buildSearchIndex(posts) {
  return posts.map((post) => ({
    title: post.title,
    summary: post.summary,
    url: `/${COLLECTION_PATH}/${post.slug}/`,
    date: post.dateText,
    modified: post.modifiedText,
    category: post.category,
    tags: post.tags,
    location: post.location,
    readingMinutes: post.readingMinutes,
    text: post.plainText
  }));
}

function buildSitemap(posts) {
  const entries = [
    {
      url: COLLECTION_URL,
      modified: posts[0]?.modifiedText || TODAY_TEXT,
      changefreq: "weekly",
      priority: "0.82"
    },
    {
      url: absoluteUrl("feed.xml"),
      modified: posts[0]?.modifiedText || TODAY_TEXT,
      changefreq: "weekly",
      priority: "0.35"
    },
    ...posts.map((post) => ({
      url: postUrl(post),
      modified: post.modifiedText,
      changefreq: "monthly",
      priority: "0.72",
      image: post.coverAbsolute || "",
      imageTitle: post.coverAlt || ""
    }))
  ];

  const tags = [...new Set(posts.flatMap((post) => post.tags))];
  for (const tag of tags) {
    const matching = posts.filter((post) => post.tags.includes(tag));
    entries.push({
      url: tagUrl(tag),
      modified: matching[0].modifiedText,
      changefreq: "monthly",
      priority: "0.55"
    });
  }

  const categories = [...new Set(posts.map((post) => post.category))];
  for (const category of categories) {
    const matching = posts.filter((post) => post.category === category);
    entries.push({
      url: categoryUrl(category),
      modified: matching[0].modifiedText,
      changefreq: "monthly",
      priority: "0.58"
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.modified}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${
      entry.image
        ? `
    <image:image>
      <image:loc>${escapeXml(entry.image)}</image:loc>
      <image:title>${escapeXml(entry.imageTitle)}</image:title>
    </image:image>`
        : ""
    }
  </url>`
  )
  .join("\n")}
</urlset>`;
}

function relatedPostsFor(post, posts) {
  return posts
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      candidate,
      score:
        candidate.tags.filter((tag) => post.tags.includes(tag)).length * 3 +
        (candidate.category === post.category ? 2 : 0) +
        (candidate.location && candidate.location === post.location ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || b.candidate.date - a.candidate.date)
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}

async function markdownFiles(directory, { draft = false } = {}) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && (draft || /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(entry.name)))
      .map((entry) => ({ file: path.join(directory, entry.name), isDraftSource: draft }));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function loadPosts() {
  const sources = [
    ...(await markdownFiles(SOURCE_DIR)),
    ...(INCLUDE_DRAFTS ? await markdownFiles(DRAFTS_DIR, { draft: true }) : [])
  ];
  const posts = [];
  const slugs = new Set();

  for (const source of sources) {
    const raw = await readFile(source.file, "utf8");
    const { meta, content } = parseFrontMatter(raw);
    const fileLabel = path.relative(ROOT, source.file);
    const title = String(meta.title || "").trim();
    const summary = String(meta.summary || "").trim();
    const date = parseDate(meta.date || (source.isDraftSource ? TODAY_TEXT : null), `${fileLabel} date`);

    if (!title) throw new Error(`${fileLabel}: title is required`);
    if (!summary) throw new Error(`${fileLabel}: summary is required`);
    if (!date) throw new Error(`${fileLabel}: date is required`);

    const isDraft = source.isDraftSource || meta.draft === true;
    if (!INCLUDE_DRAFTS && (isDraft || date > TODAY)) continue;

    const slug = slugify(meta.slug || path.basename(source.file, ".md").replace(/^\d{4}-\d{2}-\d{2}-/, ""));
    if (!slug) throw new Error(`${fileLabel}: a valid slug is required`);
    if (slugs.has(slug)) throw new Error(`${fileLabel}: duplicate slug ${slug}`);
    slugs.add(slug);

    const tags = asArray(meta.tags);
    const category = String(meta.category || "Genel").trim();
    if (!tags.length) throw new Error(`${fileLabel}: at least one tag is required`);
    if (!category) throw new Error(`${fileLabel}: category is required`);

    const modified = parseDate(meta.modified || meta.date, `${fileLabel} modified`);
    if (modified < date) throw new Error(`${fileLabel}: modified cannot be earlier than date`);

    const cover = String(meta.cover || "").trim();
    const coverAlt = String(meta.cover_alt || "").trim();
    if (cover && !coverAlt) throw new Error(`${fileLabel}: cover_alt is required when cover is set`);

    const rendered = renderMarkdown(content);
    const plainText = markdownToPlainText(content);
    const stats = contentStats(content);
    const location = String(meta.location || "").trim();

    posts.push({
      title,
      summary,
      slug,
      date,
      dateText: toDateText(date),
      dateLabel: formatTurkishDate(date),
      modified,
      modifiedText: toDateText(modified),
      category,
      tags,
      location,
      cover,
      coverAlt,
      coverAbsolute: cover ? new URL(cover, SITE_URL).href : "",
      isDraft,
      plainText,
      searchText: [title, summary, category, ...tags, location, plainText].join(" ").toLocaleLowerCase("tr-TR"),
      ...stats,
      ...rendered
    });
  }

  posts.sort((a, b) => b.date - a.date || a.title.localeCompare(b.title, "tr"));
  return posts;
}

function assertSafeOutputDirectory() {
  const root = path.resolve(ROOT);
  const output = path.resolve(OUTPUT_DIR);
  if (output !== path.join(root, COLLECTION_PATH) || !output.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing to clean unexpected output directory: ${output}`);
  }
}

async function writeOutput(relativePath, content) {
  const destination = path.join(OUTPUT_DIR, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, cleanOutput(content), "utf8");
}

async function main() {
  const posts = await loadPosts();
  if (!posts.length) throw new Error("No publishable Torino diary entries found.");

  assertSafeOutputDirectory();
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  await writeOutput("index.html", indexTemplate(posts));

  for (const post of posts) {
    await writeOutput(path.join(post.slug, "index.html"), postTemplate(post, relatedPostsFor(post, posts)));
  }

  const tags = [...new Set(posts.flatMap((post) => post.tags))];
  for (const tag of tags) {
    const matching = posts.filter((post) => post.tags.includes(tag));
    await writeOutput(path.join("etiket", slugify(tag), "index.html"), archiveTemplate({ kind: "etiket", value: tag, posts: matching }));
  }

  const categories = [...new Set(posts.map((post) => post.category))];
  for (const category of categories) {
    const matching = posts.filter((post) => post.category === category);
    await writeOutput(path.join("kategori", slugify(category), "index.html"), archiveTemplate({ kind: "kategori", value: category, posts: matching }));
  }

  const buildDate = posts.reduce((latest, post) => (post.modified > latest ? post.modified : latest), posts[0].modified);
  await writeOutput("feed.xml", buildFeed(posts, buildDate));
  await writeOutput("search-index.json", `${JSON.stringify(buildSearchIndex(posts), null, 2)}\n`);
  await writeFile(SITEMAP_PATH, cleanOutput(buildSitemap(posts)), "utf8");

  console.log(
    `Generated ${posts.length} Torino diary post(s), ${tags.length} tag archive(s), ${categories.length} category archive(s), RSS, search index, and sitemap${INCLUDE_DRAFTS ? " with draft previews" : ""}.`
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
