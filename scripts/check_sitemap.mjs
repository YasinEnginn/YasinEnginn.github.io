import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ORIGIN = "https://yasinenginn.github.io";
const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const missing = [];
let checkedUrls = 0;

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
    await assertExists(loc);
  }
}

const sitemap = await readFile(join(ROOT_DIR, "sitemap.xml"), "utf8");
await checkSitemapXml(sitemap, "sitemap.xml");

if (missing.length > 0) {
  console.error("Sitemap entries without matching local files:");
  for (const entry of missing) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log(`Checked ${checkedUrls} sitemap URLs.`);
