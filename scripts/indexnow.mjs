import { readFile } from "node:fs/promises";

const HOST = "yasinenginn.github.io";
const KEY = "6f8d2a9b4c1e7f5038a0d6c9b2e4f1a7";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || "https://www.bing.com/indexnow";

const keyFile = new URL(`../${KEY}.txt`, import.meta.url);
const sitemapFile = new URL("../sitemap-pages.xml", import.meta.url);

const hostedKey = (await readFile(keyFile, "utf8")).trim();
if (hostedKey !== KEY) {
  throw new Error(`IndexNow key file does not match ${KEY}.txt`);
}

const sitemap = await readFile(sitemapFile, "utf8");
const urlList = [...sitemap.matchAll(/<loc>(https:\/\/yasinenginn\.github\.io\/[^<]*)<\/loc>/g)].map(
  (match) => match[1],
);

if (!urlList.length) {
  throw new Error("No URLs found in sitemap-pages.xml");
}

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList,
};

if (process.env.INDEXNOW_DRY_RUN === "1") {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(payload),
});

const text = await response.text();
console.log(`IndexNow ${response.status}: ${text || response.statusText}`);

if (!response.ok) {
  process.exitCode = 1;
}
