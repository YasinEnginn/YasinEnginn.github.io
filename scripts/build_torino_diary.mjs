import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { cleanOutput, slugify } from "./lib/content_engine.mjs";
import { updateSitemapIndexLastmod } from "./lib/sitemap_index.mjs";
import { buildFeed, buildSearchIndex, buildSitemap, relatedPostsFor } from "./diary/artifacts.mjs";
import { COLLECTION_PATH, OUTPUT_DIR, ROOT, SITEMAP_PATH, SITE_URL } from "./diary/config.mjs";
import { loadPosts } from "./diary/load_posts.mjs";
import { archiveTemplate, indexTemplate, postTemplate } from "./diary/templates.mjs";

const INCLUDE_DRAFTS = process.argv.includes("--drafts");
const SITEMAP_INDEX_PATH = path.join(ROOT, "sitemap.xml");
const SITEMAP_URL = `${SITE_URL}/sitemap-torino-diary.xml`;

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
  const posts = await loadPosts({ includeDrafts: INCLUDE_DRAFTS });
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
  await updateSitemapIndexLastmod(SITEMAP_INDEX_PATH, SITEMAP_URL, buildDate.toISOString().slice(0, 10));

  console.log(
    `Generated ${posts.length} Torino diary post(s), ${tags.length} tag archive(s), ${categories.length} category archive(s), RSS, search index, and sitemap${INCLUDE_DRAFTS ? " with draft previews" : ""}.`
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
