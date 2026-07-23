import { access, readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ORIGIN = "https://yasinenginn.github.io";
const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const missing = [];
const sitemapUrls = new Set();
let checkedUrls = 0;
const VERIFICATION_FILES = new Set([
  "google05b8f340db6cd9fc.html",
  "yandex_782114a44a8a9997.html"
]);

function toLocalPath(loc) {
  const url = new URL(loc);

  if (url.origin !== SITE_ORIGIN) {
    missing.push(`${loc} uses unexpected origin ${url.origin}`);
    return null;
  }

  const pathname = decodeURIComponent(url.pathname);
  return pathname === "/"
    ? "index.html"
    : pathname.endsWith("/")
      ? `${pathname.slice(1)}index.html`
      : pathname.slice(1);
}

async function assertExists(loc) {
  const relativePath = toLocalPath(loc);
  if (!relativePath) return;

  try {
    await access(join(ROOT_DIR, relativePath));
    checkedUrls += 1;
  } catch {
    missing.push(`${loc} -> ${relativePath}`);
  }
}

async function readLocalXml(loc) {
  const relativePath = toLocalPath(loc);
  if (!relativePath) return "";

  try {
    await access(join(ROOT_DIR, relativePath));
    return readFile(join(ROOT_DIR, relativePath), "utf8");
  } catch {
    missing.push(`${loc} -> ${relativePath}`);
    return "";
  }
}

async function checkSitemapXml(xml, sourceName) {
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  if (locs.length === 0) {
    throw new Error(`No URLs found in ${sourceName}`);
  }

  if (/<sitemapindex\b/.test(xml)) {
    for (const loc of locs) {
      const childXml = await readLocalXml(loc);
      if (childXml) {
        await checkSitemapXml(childXml, loc);
      }
    }
    return;
  }

  for (const loc of locs) {
    sitemapUrls.add(loc);
    await assertExists(loc);
  }
}

async function listHtmlFiles(directory, results = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await listHtmlFiles(fullPath, results);
    } else if (entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }

  return results;
}

function metaContent(html, name) {
  const tags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  const tag = tags.find((value) => new RegExp(`\\bname\\s*=\\s*["']${name}["']`, "i").test(value));
  return tag?.match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2]?.trim() || "";
}

function canonicalUrl(html) {
  const tags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const tag = tags.find((value) => /\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["']/i.test(value));
  return tag?.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2]?.trim() || "";
}

function isIndexable(html) {
  const robots = metaContent(html, "robots").toLowerCase().split(/[\s,]+/);
  return !robots.includes("noindex") && !/<meta\b[^>]*http-equiv\s*=\s*["']refresh["']/i.test(html);
}

async function checkIndexableCoverage() {
  const htmlFiles = await listHtmlFiles(ROOT_DIR);

  for (const file of htmlFiles) {
    const relativePath = relative(ROOT_DIR, file).replaceAll("\\", "/");
    if (VERIFICATION_FILES.has(relativePath)) continue;

    const html = await readFile(file, "utf8");
    if (!isIndexable(html)) continue;

    const canonical = canonicalUrl(html);
    if (canonical.startsWith(`${SITE_ORIGIN}/`) && !sitemapUrls.has(canonical)) {
      missing.push(`${relativePath}: indexable canonical is absent from the sitemap index (${canonical})`);
    }
  }
}

const sitemap = await readFile(join(ROOT_DIR, "sitemap.xml"), "utf8");
await checkSitemapXml(sitemap, "sitemap.xml");
await checkIndexableCoverage();

if (missing.length > 0) {
  console.error("Sitemap entries without matching local files:");
  for (const entry of missing) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(`Checked ${checkedUrls} sitemap URLs.`);
