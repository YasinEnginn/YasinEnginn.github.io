import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://yasinenginn.github.io";
const SOURCE_DIR = "content/notes";
const OUTPUT_DIR = "notes";
const RSS_PATH = "rss.xml";

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
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
  out = out.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return out;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let inList = false;
  let inCode = false;
  let codeBuffer = [];
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${applyInlines(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!inList) return;
    html.push("</ul>");
    inList = false;
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
      const level = heading[1].length;
      html.push(`<h${level}>${applyInlines(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${applyInlines(listItem[1])}</li>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  flushCode();

  return html.join("\n");
}

function docTemplate({ title, description, content, published, tags, canonicalPath }) {
  const canonical = `${SITE_URL}/${canonicalPath}`;
  const tagsHtml = tags.length
    ? `<div class="tag-row">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Notes</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="stylesheet" href="../assets/css/docs.css" />
</head>
<body>
  <main class="page">
    <div class="topbar">
      <a class="btn" href="../index.html">Back to Portfolio</a>
      <a class="btn" href="index.html">All Notes</a>
    </div>
    <article class="card note-content">
      <h1 class="title">${escapeHtml(title)}</h1>
      <p class="meta">${escapeHtml(published)}</p>
      ${tagsHtml}
      ${content}
    </article>
    <p class="footer">Generated from markdown in <code>content/notes</code>.</p>
  </main>
</body>
</html>
`;
}

function indexTemplate(notes) {
  const cards = notes
    .map(
      (note) => `
      <article class="card">
        <h2>${escapeHtml(note.title)}</h2>
        <p class="meta">${escapeHtml(note.dateText)}</p>
        <p>${escapeHtml(note.summary)}</p>
        <div class="tag-row">${note.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <p><a class="btn" href="${note.slug}.html">Read Note</a></p>
      </article>
    `
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Engineering Notes | Yasin Engin</title>
  <meta name="description" content="Engineering notes about network automation, SDN and backend systems." />
  <link rel="canonical" href="${SITE_URL}/notes/" />
  <link rel="alternate" type="application/rss+xml" title="Engineering Notes RSS" href="${SITE_URL}/rss.xml" />
  <link rel="stylesheet" href="../assets/css/docs.css" />
</head>
<body>
  <main class="page">
    <div class="topbar">
      <a class="btn" href="../index.html">Back to Portfolio</a>
      <a class="btn" href="../rss.xml">RSS</a>
    </div>
    <h1 class="title">Engineering Notes</h1>
    <p class="subtitle">Markdown-based notes generated automatically during deploy.</p>
    <section class="grid">
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
      const link = `${SITE_URL}/notes/${note.slug}.html`;
      return `<item>
  <title>${escapeHtml(note.title)}</title>
  <link>${link}</link>
  <guid>${link}</guid>
  <pubDate>${note.date.toUTCString()}</pubDate>
  <description>${escapeHtml(note.summary)}</description>
</item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Yasin Engin Engineering Notes</title>
  <link>${SITE_URL}/notes/</link>
  <description>Notes on network automation, distributed systems and backend engineering.</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>
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
    const summary = meta.summary || "Engineering note";
    const slug = meta.slug || slugify(path.basename(fileName, ".md"));
    const date = formatDate(meta.date) || new Date();
    const dateText = date.toISOString().slice(0, 10);
    const tags = (meta.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    notes.push({
      title,
      summary,
      slug,
      date,
      dateText,
      tags,
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
    const page = docTemplate({
      title: note.title,
      description: note.summary,
      content: note.html,
      published: note.dateText,
      tags: note.tags,
      canonicalPath: `notes/${note.slug}.html`
    });

    await writeFile(path.join(OUTPUT_DIR, `${note.slug}.html`), page, "utf8");
  }

  await writeFile(path.join(OUTPUT_DIR, "index.html"), indexTemplate(notes), "utf8");
  await writeFile(RSS_PATH, buildRss(notes), "utf8");

  console.log(`Generated ${notes.length} notes and RSS feed.`);
}

main();
