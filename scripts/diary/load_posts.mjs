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
import { DRAFTS_DIR, POSTS_DIR, ROOT, SITE_URL, TODAY_TEXT } from "./config.mjs";

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
    const coverAlt = String(meta.cover_alt || "").trim();
    if (cover && !coverAlt) throw new Error(`${fileLabel}: cover_alt is required when cover is set`);

    const rendered = renderMarkdown(content);
    const plainText = markdownToPlainText(content);
    const stats = contentStats(content);
    const location = String(meta.location || "").trim();
    const period = String(meta.period || "").trim();

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
      coverAlt,
      coverAbsolute: cover ? new URL(cover, SITE_URL).href : "",
      isDraft,
      plainText,
      searchText: [title, seoTitle, summary, metaDescription, category, contentType, ...tags, ...facets, location, plainText].join(" ").toLocaleLowerCase("tr-TR"),
      ...stats,
      ...rendered
    });
  }

  posts.sort((a, b) => b.date - a.date || a.title.localeCompare(b.title, "tr"));
  return posts;
}
