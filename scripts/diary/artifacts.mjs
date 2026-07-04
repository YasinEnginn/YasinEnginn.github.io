import { escapeXml, slugify } from "../lib/content_engine.mjs";
import {
  COLLECTION_NAME,
  COLLECTION_PATH,
  COLLECTION_URL,
  TODAY_TEXT,
  absoluteUrl,
  categoryUrl,
  postUrl,
  tagUrl
} from "./config.mjs";

export function buildFeed(posts, buildDate) {
  const items = posts
    .slice(0, 30)
    .map(
      (post) => `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${postUrl(post)}</link>
  <guid isPermaLink="true">${postUrl(post)}</guid>
  <pubDate>${post.date.toUTCString()}</pubDate>
  <description>${escapeXml(post.metaDescription)}</description>
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
  <description>Torino Erasmus günlüğü, fotoğraflı deneyimler ve pratik yaşam notları.</description>
  <language>tr-TR</language>
  <lastBuildDate>${buildDate.toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>`;
}

export function buildSearchIndex(posts) {
  return posts.map((post) => ({
    title: post.title,
    seoTitle: post.seoTitle,
    summary: post.summary,
    description: post.metaDescription,
    url: `/${COLLECTION_PATH}/${post.slug}/`,
    date: post.dateText,
    modified: post.modifiedText,
    category: post.category,
    type: post.contentType,
    tags: post.tags,
    facets: post.facets,
    location: post.location,
    readingMinutes: post.readingMinutes,
    text: post.plainText
  }));
}

export function buildSitemap(posts) {
  const entries = [
    { url: COLLECTION_URL, modified: posts[0]?.modifiedText || TODAY_TEXT, changefreq: "weekly", priority: "0.82" },
    { url: absoluteUrl("feed.xml"), modified: posts[0]?.modifiedText || TODAY_TEXT, changefreq: "weekly", priority: "0.35" },
    ...posts.map((post) => ({
      url: postUrl(post),
      modified: post.modifiedText,
      changefreq: "monthly",
      priority: "0.72",
      image: post.coverAbsolute || "",
      imageTitle: post.coverAlt || ""
    }))
  ];

  for (const tag of new Set(posts.flatMap((post) => post.tags))) {
    const matching = posts.filter((post) => post.tags.includes(tag));
    entries.push({ url: tagUrl(tag), modified: matching[0].modifiedText, changefreq: "monthly", priority: "0.55" });
  }

  for (const category of new Set(posts.map((post) => post.category))) {
    const matching = posts.filter((post) => post.category === category);
    entries.push({ url: categoryUrl(category), modified: matching[0].modifiedText, changefreq: "monthly", priority: "0.58" });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map((entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.modified}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${entry.image ? `
    <image:image>
      <image:loc>${escapeXml(entry.image)}</image:loc>
      <image:title>${escapeXml(entry.imageTitle)}</image:title>
    </image:image>` : ""}
  </url>`).join("\n")}
</urlset>`;
}

export function relatedPostsFor(post, posts) {
  return posts
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      candidate,
      score:
        candidate.tags.filter((tag) => post.tags.includes(tag)).length * 3 +
        candidate.facets.filter((facet) => post.facets.includes(facet)).length * 2 +
        (candidate.category === post.category ? 2 : 0) +
        (candidate.location && candidate.location === post.location ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || b.candidate.date - a.candidate.date)
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}
