const TURKISH_CHAR_MAP = new Map([
  ["ç", "c"],
  ["ğ", "g"],
  ["ı", "i"],
  ["İ", "i"],
  ["ö", "o"],
  ["ş", "s"],
  ["ü", "u"]
]);

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const escapeXml = escapeHtml;

export function safeJson(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

export function cleanOutput(value) {
  return `${String(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trimEnd()}\n`;
}

export function slugify(value = "") {
  const transliterated = [...String(value)]
    .map((character) => TURKISH_CHAR_MAP.get(character) ?? character)
    .join("");

  return transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseScalar(value) {
  const text = String(value).trim();

  if (!text) return "";
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "null") return null;

  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }

  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      return JSON.parse(text);
    } catch {
      return text
        .slice(1, -1)
        .split(",")
        .map((item) => parseScalar(item))
        .filter((item) => item !== "");
    }
  }

  return text;
}

export function parseFrontMatter(raw) {
  const normalized = String(raw).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);

  if (!match) {
    return { meta: {}, content: normalized };
  }

  const meta = {};
  let activeListKey = null;

  for (const rawLine of match[1].split("\n")) {
    const listItem = rawLine.match(/^\s+-\s+(.+)$/);
    if (listItem && activeListKey) {
      meta[activeListKey].push(parseScalar(listItem[1]));
      continue;
    }

    const property = rawLine.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!property) {
      activeListKey = null;
      continue;
    }

    const [, key, value = ""] = property;
    if (!value.trim()) {
      meta[key] = [];
      activeListKey = key;
      continue;
    }

    meta[key] = parseScalar(value);
    activeListKey = null;
  }

  return {
    meta,
    content: normalized.slice(match[0].length)
  };
}

export function asArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (value === undefined || value === null || value === "") return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseDate(value, label = "date") {
  if (!value) return null;
  const text = String(value).trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T12:00:00Z` : text;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}: ${text}`);
  }
  return date;
}

export function toDateText(date) {
  return date.toISOString().slice(0, 10);
}

export function formatTurkishDate(date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function safeUrl(value, { allowMail = false } = {}) {
  const url = String(value || "").trim();
  if (!url) return "#";
  if (/^(?:https?:\/\/|\/|\.\.?\/|#)/i.test(url)) return url;
  if (allowMail && /^mailto:/i.test(url)) return url;
  return "#";
}

function renderInline(value) {
  let output = escapeHtml(value);

  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_match, label, href) => {
    // `output` is already HTML-escaped, so the captured URL is safe to place
    // in an attribute after the protocol allow-list check.
    const safeHref = safeUrl(href, { allowMail: true });
    const external = /^https?:\/\//i.test(href)
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
    return `<a href="${safeHref}"${external}>${label}</a>`;
  });
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  output = output.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  output = output.replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>");

  return output;
}

function imageMarkup(line) {
  const match = line.match(/^!\[([^\]]*)]\(([^)\s]+)(?:\s+["']([^"']+)["'])?\)$/);
  if (!match) return null;
  const [, alt, source, caption] = match;
  const safeSource = safeUrl(source);
  if (safeSource === "#") return null;

  return `<figure class="diary-figure">
  <img src="${escapeHtml(safeSource)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">
  ${caption ? `<figcaption>${renderInline(caption)}</figcaption>` : ""}
</figure>`;
}

function youtubeId(value) {
  const raw = String(value || "").trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    if (url.hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
    if (!/(^|\.)youtube(?:-nocookie)?\.com$/i.test(url.hostname)) return null;
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || null;
  } catch {
    return null;
  }

  return null;
}

function youtubeMarkup(line) {
  const match = line.match(/^@\[youtube]\(([^)\s]+)(?:\s+["']([^"']+)["'])?\)$/i);
  if (!match) return null;
  const id = youtubeId(match[1]);
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  const title = match[2] || "YouTube videosu";

  return `<figure class="diary-video">
  <div class="diary-video__frame">
    <iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${escapeHtml(title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
  </div>
  <figcaption>${escapeHtml(title)}</figcaption>
</figure>`;
}

function uniqueHeadingId(value, seen) {
  const base = slugify(
    String(value)
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
      .replace(/[*_~]/g, "")
  ) || "bolum";
  const count = seen.get(base) || 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

export function renderMarkdown(markdown) {
  const lines = String(markdown).replace(/\r\n/g, "\n").split("\n");
  const output = [];
  const headings = [];
  const seenHeadingIds = new Map();
  let paragraph = [];
  let listType = null;
  let codeFence = null;
  let codeLines = [];
  let galleryItems = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${renderInline(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = null;
  };

  const openList = (type) => {
    if (listType === type) return;
    closeList();
    output.push(`<${type}>`);
    listType = type;
  };

  const closeCode = () => {
    if (codeFence === null) return;
    const languageClass = codeFence ? ` class="language-${escapeHtml(codeFence)}"` : "";
    output.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeFence = null;
    codeLines = [];
  };

  const closeGallery = () => {
    if (galleryItems === null) return;
    output.push(`<div class="diary-gallery" aria-label="Fotoğraf galerisi">${galleryItems.join("\n")}</div>`);
    galleryItems = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (codeFence !== null) {
      if (/^```/.test(line.trim())) closeCode();
      else codeLines.push(rawLine);
      continue;
    }

    const fence = line.trim().match(/^```([A-Za-z0-9_-]*)$/);
    if (fence) {
      flushParagraph();
      closeList();
      codeFence = fence[1];
      continue;
    }

    if (line.trim() === ":::gallery") {
      flushParagraph();
      closeList();
      closeGallery();
      galleryItems = [];
      continue;
    }

    if (galleryItems !== null) {
      if (line.trim() === ":::") {
        closeGallery();
        continue;
      }
      const galleryImage = imageMarkup(line.trim());
      if (galleryImage) galleryItems.push(galleryImage);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,5})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(6, heading[1].length + 1);
      const id = uniqueHeadingId(heading[2], seenHeadingIds);
      output.push(`<h${level} id="${id}">${renderInline(heading[2])}</h${level}>`);
      if (level <= 3) headings.push({ level, id, title: heading[2].replace(/[*_`]/g, "") });
      continue;
    }

    if (/^(?:---|\*\*\*)$/.test(line.trim())) {
      flushParagraph();
      closeList();
      output.push("<hr>");
      continue;
    }

    const standaloneImage = imageMarkup(line.trim());
    if (standaloneImage) {
      flushParagraph();
      closeList();
      output.push(standaloneImage);
      continue;
    }

    const youtube = youtubeMarkup(line.trim());
    if (youtube) {
      flushParagraph();
      closeList();
      output.push(youtube);
      continue;
    }

    const blockquote = line.match(/^>\s?(.+)$/);
    if (blockquote) {
      flushParagraph();
      closeList();
      output.push(`<blockquote><p>${renderInline(blockquote[1])}</p></blockquote>`);
      continue;
    }

    const orderedItem = line.match(/^\d+\.\s+(.+)$/);
    if (orderedItem) {
      flushParagraph();
      openList("ol");
      output.push(`<li>${renderInline(orderedItem[1])}</li>`);
      continue;
    }

    const unorderedItem = line.match(/^[-*]\s+(.+)$/);
    if (unorderedItem) {
      flushParagraph();
      openList("ul");
      output.push(`<li>${renderInline(unorderedItem[1])}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  closeCode();
  closeGallery();

  return { html: output.join("\n"), headings };
}

export function markdownToPlainText(markdown) {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^:::gallery$[\s\S]*?^:::$|@\[youtube][^\n]*/gm, " ")
    .replace(/!\[([^\]]*)]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function contentStats(markdown) {
  const text = markdownToPlainText(markdown);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  return {
    words,
    readingMinutes: Math.max(1, Math.ceil(words / 200))
  };
}
