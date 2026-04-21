import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://yasinenginn.github.io";
const SITE_NAME = "Yasin Engin";
const PERSON_ID = `${SITE_URL}/#person`;
const OG_IMAGE = `${SITE_URL}/assets/img/og-card.png`;
const SOURCE_DIR = "content/notes";
const OUTPUT_DIR = "notes";
const RSS_PATH = "rss.xml";
const SITEMAP_PATH = "sitemap.xml";
const BUILD_DATE = new Date();
const BUILD_DATE_TEXT = BUILD_DATE.toISOString().slice(0, 10);
const NOTES_COLLECTION_TITLE = "Yasin Engin Engineering Notes";

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function formatDate(value) {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toDateText(date) {
  return date.toISOString().slice(0, 10);
}

function toAbsoluteUrl(pathname = "") {
  const trimmed = String(pathname).replace(/^\/+/, "");
  return trimmed ? `${SITE_URL}/${trimmed}` : `${SITE_URL}/`;
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseFrontMatter(raw) {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    return { meta: {}, content: normalized };
  }

  const block = match[1];
  const content = normalized.slice(match[0].length);
  const meta = {};

  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    meta[key] = value;
  }

  return { meta, content };
}

function applyInlines(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(
    /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return out;
}

function markdownToText(markdown) {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadingMinutes(markdown) {
  const plainText = markdownToText(markdown);
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  return {
    wordCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 220))
  };
}

function buildSummary(markdown, fallback = "Engineering note by Yasin Engin.") {
  const plainText = markdownToText(markdown);
  if (!plainText) return fallback;
  if (plainText.length <= 160) return plainText;
  return `${plainText.slice(0, 157).trimEnd()}...`;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listType = null;
  let inCode = false;
  let codeBuffer = [];
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${applyInlines(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  }

  function openList(type) {
    if (listType === type) return;
    closeList();
    html.push(`<${type}>`);
    listType = type;
  }

  function flushCode() {
    if (!inCode) return;
    html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
    codeBuffer = [];
    inCode = false;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushParagraph();
      closeList();
      if (inCode) {
        flushCode();
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(6, heading[1].length + 1);
      html.push(`<h${level}>${applyInlines(heading[2])}</h${level}>`);
      continue;
    }

    const orderedItem = line.match(/^\d+\.\s+(.+)$/);
    if (orderedItem) {
      flushParagraph();
      openList("ol");
      html.push(`<li>${applyInlines(orderedItem[1])}</li>`);
      continue;
    }

    const unorderedItem = line.match(/^[-*]\s+(.+)$/);
    if (unorderedItem) {
      flushParagraph();
      openList("ul");
      html.push(`<li>${applyInlines(unorderedItem[1])}</li>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  flushCode();

  return html.join("\n");
}

function buildNoteSchema(note, canonicalUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    headline: note.title,
    description: note.summary,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    image: OG_IMAGE,
    inLanguage: "en",
    keywords: ["Yasin Engin", ...note.tags].join(", "),
    articleSection: note.tags.join(", "),
    datePublished: note.date.toISOString(),
    dateModified: note.date.toISOString(),
    timeRequired: `PT${note.readingMinutes}M`,
    wordCount: note.wordCount,
    author: {
      "@id": PERSON_ID
    },
    publisher: {
      "@id": PERSON_ID
    },
    isPartOf: {
      "@type": "Blog",
      "@id": `${toAbsoluteUrl("notes/")}#blog`,
      name: NOTES_COLLECTION_TITLE,
      url: toAbsoluteUrl("notes/")
    },
    about: note.tags.map((tag) => ({
      "@type": "Thing",
      name: tag
    }))
  };
}

function docTemplate(note, relatedNotes) {
  const canonical = toAbsoluteUrl(`notes/${note.slug}.html`);
  const tagsHtml = note.tags.length
    ? `<div class="tag-row">${note.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";
  const relatedHtml = relatedNotes.length
    ? `
    <section class="related-section" aria-labelledby="related-notes-title">
      <div class="section-head">
        <p class="eyebrow">More From Yasin Engin</p>
        <h2 id="related-notes-title">Related Engineering Notes</h2>
      </div>
      <div class="grid">
        ${relatedNotes
          .map(
            (related) => `
        <article class="card">
          <h3>${escapeHtml(related.title)}</h3>
          <p class="meta">${escapeHtml(related.dateText)} · ${related.readingMinutes} min read</p>
          <p>${escapeHtml(related.summary)}</p>
          <div class="tag-row">${related.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
          <p><a class="btn" href="${related.slug}.html">Read Note</a></p>
        </article>`
          )
          .join("\n")}
      </div>
    </section>`
    : "";
  const schema = buildNoteSchema(note, canonical);
  const keywords = ["Yasin Engin", "network automation", "SDN", "gRPC", "distributed systems", ...note.tags].join(", ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(note.title)} | Yasin Engin Notes</title>
  <meta name="description" content="${escapeHtml(note.summary)}" />
  <meta name="author" content="${SITE_NAME}" />
  <meta name="creator" content="${SITE_NAME}" />
  <meta name="publisher" content="${SITE_NAME}" />
  <meta name="robots" content="index, follow" />
  <meta name="keywords" content="${escapeHtml(keywords)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${escapeHtml(note.title)} | ${SITE_NAME}" />
  <meta property="og:description" content="${escapeHtml(note.summary)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="${NOTES_COLLECTION_TITLE}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:image:alt" content="Yasin Engin engineering notes preview" />
  <meta property="article:published_time" content="${note.date.toISOString()}" />
  <meta property="article:author" content="${SITE_NAME}" />
  ${note.tags.map((tag) => `<meta property="article:tag" content="${escapeHtml(tag)}" />`).join("\n  ")}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(note.title)} | ${SITE_NAME}" />
  <meta name="twitter:description" content="${escapeHtml(note.summary)}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  <script type="application/ld+json">${safeJson(schema)}</script>
  <link rel="stylesheet" href="../assets/css/docs.css" />
</head>
<body>
  <main class="page">
    <div class="topbar">
      <a class="btn" href="../index.html">Back to Portfolio</a>
      <a class="btn" href="index.html">All Notes</a>
    </div>
    <article class="card note-content">
      <p class="eyebrow">Engineering Note by Yasin Engin</p>
      <h1 class="title">${escapeHtml(note.title)}</h1>
      <p class="subtitle">${escapeHtml(note.summary)}</p>
      <div class="meta-row">
        <span class="meta-pill">Published ${escapeHtml(note.dateText)}</span>
        <span class="meta-pill">${note.readingMinutes} min read</span>
        <span class="meta-pill">${note.wordCount} words</span>
      </div>
      ${tagsHtml}
      ${note.html}
    </article>
    ${relatedHtml}
    <p class="footer">Published by ${SITE_NAME}. Source markdown lives in <code>content/notes</code>.</p>
  </main>
</body>
</html>
`;
}

function buildNotesIndexSchema(notes) {
  const collectionUrl = toAbsoluteUrl("notes/");

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${collectionUrl}#collection`,
      name: "Engineering Notes by Yasin Engin",
      description: "Technical writing from Yasin Engin about network automation, SDN, Go backends, and distributed systems.",
      url: collectionUrl,
      inLanguage: "en",
      isPartOf: {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Yasin Engin Portfolio",
        url: SITE_URL
      },
      about: {
        "@id": PERSON_ID
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${collectionUrl}#blog`,
      name: NOTES_COLLECTION_TITLE,
      url: collectionUrl,
      description: "Technical notes about network automation, SDN, gRPC APIs, and backend systems.",
      author: {
        "@id": PERSON_ID
      },
      publisher: {
        "@id": PERSON_ID
      },
      blogPost: notes.map((note) => ({
        "@type": "BlogPosting",
        "@id": `${toAbsoluteUrl(`notes/${note.slug}.html`)}#article`,
        headline: note.title,
        url: toAbsoluteUrl(`notes/${note.slug}.html`),
        datePublished: note.date.toISOString(),
        description: note.summary
      }))
    }
  ];
}

function indexTemplate(notes) {
  const cards = notes
    .map(
      (note) => `
      <article class="card">
        <h2>${escapeHtml(note.title)}</h2>
        <p class="meta">${escapeHtml(note.dateText)} · ${note.readingMinutes} min read · By ${SITE_NAME}</p>
        <p>${escapeHtml(note.summary)}</p>
        <div class="tag-row">${note.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <p><a class="btn" href="${note.slug}.html">Read Note</a></p>
      </article>
    `
    )
    .join("\n");
  const schema = buildNotesIndexSchema(notes);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Engineering Notes by Yasin Engin | SDN, Go and Network Automation</title>
  <meta name="description" content="Technical notes and field guides from Yasin Engin on network automation, SDN, Go backends, gRPC, and distributed systems." />
  <meta name="author" content="${SITE_NAME}" />
  <meta name="creator" content="${SITE_NAME}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${toAbsoluteUrl("notes/")}" />
  <link rel="alternate" type="application/rss+xml" title="Engineering Notes RSS" href="${toAbsoluteUrl("rss.xml")}" />
  <meta property="og:title" content="Engineering Notes by ${SITE_NAME}" />
  <meta property="og:description" content="Technical notes and field guides on SDN, network automation, Go backends, and distributed systems." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${toAbsoluteUrl("notes/")}" />
  <meta property="og:site_name" content="${NOTES_COLLECTION_TITLE}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:image:alt" content="Yasin Engin engineering notes preview" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Engineering Notes by ${SITE_NAME}" />
  <meta name="twitter:description" content="Technical notes and field guides on SDN, network automation, Go backends, and distributed systems." />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  <script type="application/ld+json">${safeJson(schema)}</script>
  <link rel="stylesheet" href="../assets/css/docs.css" />
</head>
<body>
  <main class="page">
    <div class="topbar">
      <a class="btn" href="../index.html">Back to Portfolio</a>
      <a class="btn" href="../rss.xml">RSS</a>
    </div>
    <section class="card">
      <p class="eyebrow">Writing by Yasin Engin</p>
      <h1 class="title">Engineering Notes</h1>
      <p class="subtitle">Practical notes on network automation, SDN, gRPC APIs, backend systems, and production operations.</p>
    </section>
    <section class="grid notes-grid">
      ${cards}
    </section>
  </main>
</body>
</html>
`;
}

function buildRss(notes) {
  const items = notes
    .slice(0, 20)
    .map((note) => {
      const link = toAbsoluteUrl(`notes/${note.slug}.html`);
      const categories = note.tags.map((tag) => `  <category>${escapeHtml(tag)}</category>`).join("\n");
      return `<item>
  <title>${escapeHtml(note.title)}</title>
  <link>${link}</link>
  <guid>${link}</guid>
  <pubDate>${note.date.toUTCString()}</pubDate>
  <description>${escapeHtml(note.summary)}</description>
${categories}
</item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${NOTES_COLLECTION_TITLE}</title>
  <link>${toAbsoluteUrl("notes/")}</link>
  <description>Technical notes from Yasin Engin on network automation, distributed systems, and backend engineering.</description>
  <language>en</language>
  <lastBuildDate>${BUILD_DATE.toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>
`;
}

function buildSitemap(notes) {
  const staticPages = [
    { path: "", lastmod: BUILD_DATE_TEXT, changefreq: "weekly", priority: "1.0" },
    { path: "community_hub.html", lastmod: BUILD_DATE_TEXT, changefreq: "monthly", priority: "0.8" },
    { path: "cv.html", lastmod: BUILD_DATE_TEXT, changefreq: "monthly", priority: "0.7" },
    { path: "notes/", lastmod: BUILD_DATE_TEXT, changefreq: "weekly", priority: "0.75" },
    { path: "case-studies/", lastmod: BUILD_DATE_TEXT, changefreq: "monthly", priority: "0.72" },
    { path: "case-studies/netreka-nexus.html", lastmod: BUILD_DATE_TEXT, changefreq: "monthly", priority: "0.68" },
    { path: "case-studies/tolerex.html", lastmod: BUILD_DATE_TEXT, changefreq: "monthly", priority: "0.68" },
    { path: "case-studies/network-automation-labs.html", lastmod: BUILD_DATE_TEXT, changefreq: "monthly", priority: "0.68" },
    { path: "case-studies/go-network-programming.html", lastmod: BUILD_DATE_TEXT, changefreq: "monthly", priority: "0.68" },
    { path: "case-studies/rest-api.html", lastmod: BUILD_DATE_TEXT, changefreq: "monthly", priority: "0.68" }
  ];
  const notePages = notes.map((note) => ({
    path: `notes/${note.slug}.html`,
    lastmod: note.dateText,
    changefreq: "monthly",
    priority: "0.65"
  }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...notePages]
  .map(
    (page) => `  <url>
    <loc>${toAbsoluteUrl(page.path)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

async function loadNotes() {
  const files = (await readdir(SOURCE_DIR)).filter((name) => name.endsWith(".md"));
  const notes = [];

  for (const fileName of files) {
    const fullPath = path.join(SOURCE_DIR, fileName);
    const raw = await readFile(fullPath, "utf8");
    const { meta, content } = parseFrontMatter(raw);
    const title = meta.title || path.basename(fileName, ".md");
    const summary = meta.summary || buildSummary(content);
    const slug = meta.slug || slugify(path.basename(fileName, ".md"));
    const date = formatDate(meta.date) || BUILD_DATE;
    const dateText = toDateText(date);
    const tags = (meta.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const { wordCount, readingMinutes } = estimateReadingMinutes(content);

    notes.push({
      title,
      summary,
      slug,
      date,
      dateText,
      tags,
      wordCount,
      readingMinutes,
      html: markdownToHtml(content)
    });
  }

  notes.sort((a, b) => b.date.getTime() - a.date.getTime());
  return notes;
}

async function cleanOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const files = await readdir(OUTPUT_DIR);
  for (const file of files) {
    if (file.endsWith(".html")) {
      await rm(path.join(OUTPUT_DIR, file));
    }
  }
}

async function main() {
  const notes = await loadNotes();
  await cleanOutputDir();

  for (const note of notes) {
    const relatedNotes = notes.filter((candidate) => candidate.slug !== note.slug).slice(0, 2);
    const page = docTemplate(note, relatedNotes);
    await writeFile(path.join(OUTPUT_DIR, `${note.slug}.html`), page, "utf8");
  }

  await writeFile(path.join(OUTPUT_DIR, "index.html"), indexTemplate(notes), "utf8");
  await writeFile(RSS_PATH, buildRss(notes), "utf8");
  await writeFile(SITEMAP_PATH, buildSitemap(notes), "utf8");

  console.log(`Generated ${notes.length} notes, RSS feed, and sitemap.`);
}

main();
