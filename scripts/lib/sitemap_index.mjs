import { readFile, writeFile } from "node:fs/promises";

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function updateSitemapIndexLastmod(indexPath, sitemapUrl, lastmod) {
  const xml = await readFile(indexPath, "utf8");
  const pattern = new RegExp(
    `(<sitemap>\\s*<loc>${escapeRegExp(sitemapUrl)}</loc>\\s*<lastmod>)([^<]+)(</lastmod>\\s*</sitemap>)`,
    "m"
  );

  if (!pattern.test(xml)) {
    throw new Error(`Could not find sitemap index entry for ${sitemapUrl}`);
  }

  await writeFile(indexPath, xml.replace(pattern, `$1${lastmod}$3`), "utf8");
}
