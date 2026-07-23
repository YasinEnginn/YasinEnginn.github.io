import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SITE_ORIGIN = "https://yasinenginn.github.io";
const VERIFICATION_FILES = new Set([
  "google05b8f340db6cd9fc.html",
  "yandex_782114a44a8a9997.html"
]);
const issues = [];
const titleOwners = new Map();
const descriptionOwners = new Map();

async function listHtmlFiles(directory, results = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await listHtmlFiles(fullPath, results);
    } else if (entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }

  return results;
}

function attributes(tag) {
  const result = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(["'])(.*?)\2)?/gs;

  for (const match of tag.matchAll(pattern)) {
    result.set(match[1].toLowerCase(), match[3] ?? "");
  }

  return result;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => ({
    raw: match[0],
    attrs: attributes(match[0])
  }));
}

function metaContent(html, key, value) {
  const match = tags(html, "meta").find((tag) => tag.attrs.get(key) === value);
  return match?.attrs.get("content")?.trim() || "";
}

function canonicalHref(html) {
  const match = tags(html, "link").find((tag) => {
    const rel = tag.attrs.get("rel")?.toLowerCase().split(/\s+/) || [];
    return rel.includes("canonical");
  });
  return match?.attrs.get("href")?.trim() || "";
}

function titleText(html) {
  return html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1].replace(/\s+/g, " ").trim() || "";
}

function countElements(html, name) {
  return (html.match(new RegExp(`<${name}\\b`, "gi")) || []).length;
}

function isRedirect(html) {
  return tags(html, "meta").some((tag) => tag.attrs.get("http-equiv")?.toLowerCase() === "refresh");
}

function isNoIndex(html) {
  return metaContent(html, "name", "robots").toLowerCase().split(/[\s,]+/).includes("noindex");
}

function checkExternalTargets(html, relativePath) {
  for (const anchor of tags(html, "a")) {
    if (anchor.attrs.get("target")?.toLowerCase() !== "_blank") continue;
    const rel = anchor.attrs.get("rel")?.toLowerCase().split(/\s+/) || [];
    if (!rel.includes("noopener")) {
      issues.push(`${relativePath}: target="_blank" link is missing rel="noopener"`);
    }
  }
}

function checkMetaCsp(html, relativePath) {
  for (const meta of tags(html, "meta")) {
    if (meta.attrs.get("http-equiv")?.toLowerCase() !== "content-security-policy") continue;
    if (meta.attrs.get("content")?.toLowerCase().includes("frame-ancestors")) {
      issues.push(`${relativePath}: frame-ancestors is ignored in meta CSP; configure it as an HTTP header instead`);
    }
  }
}

function checkIndexablePage(html, relativePath) {
  const title = titleText(html);
  const description = metaContent(html, "name", "description");
  const author = metaContent(html, "name", "author");
  const canonical = canonicalHref(html);
  const ogTitle = metaContent(html, "property", "og:title");
  const ogDescription = metaContent(html, "property", "og:description");
  const ogImage = metaContent(html, "property", "og:image");
  const ogUrl = metaContent(html, "property", "og:url");

  if (title.length < 15 || title.length > 75) {
    issues.push(`${relativePath}: title length ${title.length} is outside the 15-75 character quality range`);
  }
  if (description.length < 50 || description.length > 180) {
    issues.push(`${relativePath}: meta description length ${description.length} is outside the 50-180 character quality range`);
  }
  if (author !== "Yasin Engin") {
    issues.push(`${relativePath}: expected a consistent Yasin Engin author meta tag`);
  }
  if (!canonical.startsWith(`${SITE_ORIGIN}/`)) {
    issues.push(`${relativePath}: missing or unexpected canonical URL`);
  }
  if (countElements(html, "h1") !== 1) {
    issues.push(`${relativePath}: expected exactly one h1`);
  }
  if (countElements(html, "main") !== 1) {
    issues.push(`${relativePath}: expected exactly one main landmark`);
  }
  if (!ogTitle || !ogDescription || !ogImage) {
    issues.push(`${relativePath}: incomplete Open Graph title, description, or image metadata`);
  }
  if (ogUrl && canonical && ogUrl !== canonical) {
    issues.push(`${relativePath}: og:url does not match the canonical URL`);
  }

  for (const [value, owners] of [[title, titleOwners], [description, descriptionOwners]]) {
    if (!value) continue;
    const matches = owners.get(value) || [];
    matches.push(relativePath);
    owners.set(value, matches);
  }
}

const htmlFiles = await listHtmlFiles(ROOT);

for (const file of htmlFiles) {
  const relativePath = path.relative(ROOT, file).replaceAll(path.sep, "/");
  if (VERIFICATION_FILES.has(relativePath)) continue;

  const html = await readFile(file, "utf8");
  checkExternalTargets(html, relativePath);
  checkMetaCsp(html, relativePath);

  if (!isRedirect(html) && !isNoIndex(html)) {
    checkIndexablePage(html, relativePath);
  }
}

for (const [label, owners] of [["title", titleOwners], ["meta description", descriptionOwners]]) {
  for (const [value, files] of owners) {
    if (files.length > 1) {
      issues.push(`Duplicate ${label} across ${files.join(", ")}: ${value}`);
    }
  }
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log(`Checked HTML metadata, landmarks, CSP, and external-link safety across ${htmlFiles.length} files.`);
