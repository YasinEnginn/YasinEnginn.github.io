import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const HTML_ATTRS = ["href", "src", "poster"];
const SKIP_SCHEMES = /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i;
const CSS_URL_RE = /url\((['"]?)(?!data:|https?:|#)([^'")]+)\1\)/gi;

const issues = [];

async function listFiles(dir, predicate, results = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await listFiles(fullPath, predicate, results);
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function stripQueryAndHash(value) {
  return value.split("#")[0].split("?")[0];
}

function normalizePagePath(target) {
  const cleanTarget = target.endsWith(path.sep) ? target.slice(0, -1) : target;

  if (existsSync(cleanTarget)) {
    return cleanTarget;
  }

  if (!path.extname(cleanTarget)) {
    const asDirectoryIndex = path.join(cleanTarget, "index.html");
    if (existsSync(asDirectoryIndex)) return asDirectoryIndex;

    const asHtml = `${cleanTarget}.html`;
    if (existsSync(asHtml)) return asHtml;
  }

  return cleanTarget;
}

function resolveWebPath(fromFile, rawValue) {
  const value = stripQueryAndHash(rawValue.trim());
  if (!value || SKIP_SCHEMES.test(value) || value.startsWith("//")) return null;

  const baseDir = path.dirname(fromFile);
  const target = value.startsWith("/")
    ? path.join(ROOT, value.slice(1))
    : path.resolve(baseDir, value);

  return normalizePagePath(target);
}

function extractAttributeValues(html) {
  const values = [];

  for (const attr of HTML_ATTRS) {
    const pattern = new RegExp(`${attr}\\s*=\\s*(["'])(.*?)\\1`, "gi");
    for (const match of html.matchAll(pattern)) {
      const value = match[2].trim();
      if (value) values.push({ attr, value });
    }
  }

  for (const match of html.matchAll(/<meta\b[^>]*(?:property|name)\s*=\s*(["'])(?:og:image|twitter:image|msapplication-TileImage)\1[^>]*>/gi)) {
    const content = match[0].match(/\scontent\s*=\s*(["'])(.*?)\1/i);
    if (content?.[2]) values.push({ attr: "content", value: content[2].trim() });
  }

  return values;
}

function extractIds(html) {
  const ids = new Set();
  for (const match of html.matchAll(/\s(?:id|name)\s*=\s*(["'])(.*?)\1/gi)) {
    ids.add(match[2]);
  }
  return ids;
}

function extractHash(rawValue) {
  const hashIndex = rawValue.indexOf("#");
  if (hashIndex === -1) return "";
  return rawValue.slice(hashIndex + 1).split("?")[0];
}

async function checkHtmlFile(file) {
  const html = await readFile(file, "utf8");
  const values = extractAttributeValues(html);
  const currentIds = extractIds(html);

  for (const { attr, value } of values) {
    if (attr === "content" && !value.includes("/") && !value.includes(".")) continue;

    const target = resolveWebPath(file, value);
    if (!target) continue;

    if (!target.startsWith(ROOT)) {
      issues.push(`${path.relative(ROOT, file)}: ${value} resolves outside the repository`);
      continue;
    }

    if (!existsSync(target)) {
      issues.push(`${path.relative(ROOT, file)}: missing ${attr} target ${value}`);
      continue;
    }

    const hash = extractHash(value);
    if (hash && target.endsWith(".html")) {
      const ids = target === file ? currentIds : extractIds(await readFile(target, "utf8"));
      if (!ids.has(decodeURIComponent(hash))) {
        issues.push(`${path.relative(ROOT, file)}: missing anchor #${hash} in ${path.relative(ROOT, target)}`);
      }
    }
  }
}

async function checkCssFile(file) {
  const css = await readFile(file, "utf8");

  for (const match of css.matchAll(CSS_URL_RE)) {
    const value = match[2].trim();
    const target = resolveWebPath(file, value);
    if (target && !existsSync(target)) {
      issues.push(`${path.relative(ROOT, file)}: missing CSS url target ${value}`);
    }
  }
}

const htmlFiles = await listFiles(ROOT, (file) => file.endsWith(".html"));
const cssFiles = await listFiles(ROOT, (file) => file.endsWith(".css"));

for (const file of htmlFiles) {
  await checkHtmlFile(file);
}

for (const file of cssFiles) {
  await checkCssFile(file);
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files and ${cssFiles.length} CSS files.`);
