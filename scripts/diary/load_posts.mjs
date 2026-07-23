import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  asArray,
  contentStats,
  formatTurkishDate,
  markdownToPlainText,
  parseDate,
  parseFrontMatter,
  renderMarkdown,
  slugify,
  toDateText
} from "../lib/content_engine.mjs";
import { DEFAULT_SEO_KEYWORDS, DRAFTS_DIR, POSTS_DIR, ROOT, SITE_URL, TODAY_TEXT } from "./config.mjs";

function uniqueKeywords(values) {
  const seen = new Set();
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLocaleLowerCase("tr-TR");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }

  for (let offset = 12; offset + 8 <= buffer.length;) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunkType === "VP8X" && dataOffset + 10 <= buffer.length) {
      return {
        width: 1 + buffer.readUIntLE(dataOffset + 4, 3),
        height: 1 + buffer.readUIntLE(dataOffset + 7, 3)
      };
    }

    if (chunkType === "VP8L" && dataOffset + 5 <= buffer.length && buffer[dataOffset] === 0x2f) {
      const b1 = buffer[dataOffset + 1];
      const b2 = buffer[dataOffset + 2];
      const b3 = buffer[dataOffset + 3];
      const b4 = buffer[dataOffset + 4];
      return {
        width: 1 + b1 + ((b2 & 0x3f) << 8),
        height: 1 + ((b2 & 0xc0) >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10)
      };
    }

    if (
      chunkType === "VP8 " &&
      dataOffset + 10 <= buffer.length &&
      buffer[dataOffset + 3] === 0x9d &&
      buffer[dataOffset + 4] === 0x01 &&
      buffer[dataOffset + 5] === 0x2a
    ) {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  for (let offset = 2; offset + 8 < buffer.length;) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x00 || marker === 0xff || (marker >= 0xd0 && marker <= 0xd8)) {
      offset += 2;
      continue;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (startOfFrame.has(marker) && offset + 8 < buffer.length) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5)
      };
    }
    if (segmentLength < 2) break;
    offset += segmentLength + 2;
  }

  return null;
}

async function localImageDimensions(source) {
  let url;
  try {
    url = new URL(source, SITE_URL);
  } catch {
    return null;
  }

  if (url.origin !== SITE_URL || !url.pathname.startsWith("/assets/")) return null;
  const localPath = path.resolve(ROOT, `.${decodeURIComponent(url.pathname)}`);
  const assetsRoot = path.resolve(ROOT, "assets");
  if (!localPath.startsWith(`${assetsRoot}${path.sep}`)) return null;

  try {
    const buffer = await readFile(localPath);
    return webpDimensions(buffer) || pngDimensions(buffer) || jpegDimensions(buffer);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function extractMarkdownImages(content) {
  return Promise.all([...String(content).matchAll(/^!\[([^\]]*)]\(([^)\s]+)(?:\s+["']([^"']+)["'])?\)$/gm)].map(async (match) => {
    const [, alt, source, caption = ""] = match;
    const dimensions = await localImageDimensions(source);
    return {
      url: new URL(source, SITE_URL).href,
      source,
      alt: alt.trim(),
      caption: caption.trim(),
      ...(dimensions || {})
    };
  }));
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

export async function loadPosts({ includeDrafts = false } = {}) {
  const today = parseDate(TODAY_TEXT, "CONTENT_BUILD_DATE");
  const sources = [
    ...(await markdownFiles(POSTS_DIR)),
    ...(includeDrafts ? await markdownFiles(DRAFTS_DIR, { draft: true }) : [])
  ];
  const posts = [];
  const slugs = new Set();

  for (const source of sources) {
    const raw = await readFile(source.file, "utf8");
    const { meta, content } = parseFrontMatter(raw);
    const fileLabel = path.relative(ROOT, source.file);
    const title = String(meta.title || "").trim();
    const summary = String(meta.summary || "").trim();
    const seoTitle = String(meta.seo_title || title).trim();
    const metaDescription = String(meta.meta_description || summary).trim();
    const date = parseDate(meta.date || (source.isDraftSource ? TODAY_TEXT : null), `${fileLabel} date`);

    if (!title) throw new Error(`${fileLabel}: title is required`);
    if (!summary) throw new Error(`${fileLabel}: summary is required`);
    if (!date) throw new Error(`${fileLabel}: date is required`);

    const isDraft = source.isDraftSource || meta.draft === true;
    if (!includeDrafts && (isDraft || date > today)) continue;

    const slug = slugify(meta.slug || path.basename(source.file, ".md").replace(/^\d{4}-\d{2}-\d{2}-/, ""));
    if (!slug) throw new Error(`${fileLabel}: a valid slug is required`);
    if (slugs.has(slug)) throw new Error(`${fileLabel}: duplicate slug ${slug}`);
    slugs.add(slug);

    const tags = asArray(meta.tags);
    const facets = asArray(meta.facets);
    const contentType = String(meta.type || "Not").trim();
    const category = String(meta.category || "Genel").trim();
    if (!tags.length) throw new Error(`${fileLabel}: at least one tag is required`);
    if (!category) throw new Error(`${fileLabel}: category is required`);

    const modified = parseDate(meta.modified || meta.date, `${fileLabel} modified`);
    if (modified < date) throw new Error(`${fileLabel}: modified cannot be earlier than date`);

    const cover = String(meta.cover || "").trim();
    const coverCard = String(meta.cover_card || "").trim();
    const coverAlt = String(meta.cover_alt || "").trim();
    if (cover && !coverAlt) throw new Error(`${fileLabel}: cover_alt is required when cover is set`);

    const images = await extractMarkdownImages(content);
    const imageMetadata = new Map(images.map((image) => [image.source, image]));
    const rendered = renderMarkdown(content, { imageMetadata });
    const plainText = markdownToPlainText(content);
    const stats = contentStats(content);
    const location = String(meta.location || "").trim();
    const period = String(meta.period || "").trim();
    const keywords = uniqueKeywords([
      DEFAULT_SEO_KEYWORDS,
      title,
      seoTitle,
      category,
      contentType,
      location,
      tags,
      facets
    ]);

    posts.push({
      title,
      summary,
      seoTitle,
      metaDescription,
      slug,
      date,
      dateText: toDateText(date),
      dateLabel: formatTurkishDate(date),
      period,
      modified,
      modifiedText: toDateText(modified),
      category,
      tags,
      facets,
      contentType,
      location,
      cover,
      coverCard,
      coverAlt,
      coverAbsolute: cover ? new URL(cover, SITE_URL).href : "",
      images,
      keywords,
      keywordText: keywords.join(", "),
      isDraft,
      plainText,
      searchText: [title, seoTitle, summary, metaDescription, category, contentType, ...keywords, location, plainText].join(" ").toLocaleLowerCase("tr-TR"),
      ...stats,
      ...rendered
    });
  }

  posts.sort((a, b) => b.date - a.date || a.title.localeCompare(b.title, "tr"));
  return posts;
}
