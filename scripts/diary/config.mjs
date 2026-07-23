import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "../lib/content_engine.mjs";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const SOURCE_DIR = path.join(ROOT, "content", "torino-diary");
export const POSTS_DIR = path.join(SOURCE_DIR, "posts");
export const DRAFTS_DIR = path.join(SOURCE_DIR, "drafts");
export const OUTPUT_DIR = path.join(ROOT, "torino-gunlukleri");
export const SITEMAP_PATH = path.join(ROOT, "sitemap-torino-diary.xml");

export const SITE_URL = "https://yasinenginn.github.io";
export const COLLECTION_PATH = "torino-gunlukleri";
export const COLLECTION_URL = `${SITE_URL}/${COLLECTION_PATH}/`;
export const COLLECTION_NAME = "Politecnico di Torino Günlükleri";
export const SITE_NAME = "Yasin Engin";
export const PERSON_NAME = "Yasin Engin";
export const PERSON_ID = `${SITE_URL}/#person`;
export const PERSON_URL = `${SITE_URL}/`;
export const PERSON_SAME_AS = [
  "https://github.com/YasinEnginn",
  "https://www.linkedin.com/in/yasin-engin/",
  "https://www.youtube.com/@Netreka_Akademi",
  "https://www.instagram.com/___ozgur__ruh___/"
];
export const DEFAULT_SEO_KEYWORDS = [
  "Yasin Engin",
  "YasinEnginn",
  "Netreka Akademi",
  "Politecnico di Torino Günlükleri",
  "Torino Günlükleri",
  "Torino Erasmus",
  "Politecnico di Torino",
  "Torino",
  "Erasmus",
  "İtalya",
  "Erasmus rehberi",
  "öğrenci günlüğü",
  "Torino gezi notları"
];
export const OG_IMAGE = `${SITE_URL}/assets/img/social/og-home.png`;
export const ASSET_VERSION = "20260723-quality";
export const TODAY_TEXT = process.env.CONTENT_BUILD_DATE || new Date().toISOString().slice(0, 10);
export const INDEX_DESCRIPTION = "Torino Erasmus günlükleri: yolculuk, Politecnico kampüs yaşamı, ulaşım, yurt ve şehir deneyimleri için fotoğraflı rehberler ve pratik notlar.";

export function absoluteUrl(relativePath = "") {
  return relativePath ? `${COLLECTION_URL}${relativePath.replace(/^\/+/, "")}` : COLLECTION_URL;
}

export function postUrl(post) {
  return absoluteUrl(`${post.slug}/`);
}

export function tagUrl(tag) {
  return absoluteUrl(`etiket/${slugify(tag)}/`);
}

export function categoryUrl(category) {
  return absoluteUrl(`kategori/${slugify(category)}/`);
}
