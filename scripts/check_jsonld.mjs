import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const SKIP_DIRECTORIES = new Set([".git", "node_modules", "test-results"]);

async function listHtmlFiles(directory, results = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await listHtmlFiles(fullPath, results);
    } else if (entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }

  return results;
}

const files = await listHtmlFiles(ROOT_DIR);
let blockCount = 0;
let fileCount = 0;

for (const file of files) {
  const html = await readFile(file, "utf8");
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>\s*([\s\S]*?)\s*<\/script>/gi)];
  if (!scripts.length) continue;

  fileCount += 1;
  for (const [, json] of scripts) {
    try {
      JSON.parse(json);
      blockCount += 1;
    } catch (error) {
      throw new Error(`${path.relative(ROOT_DIR, file)} contains invalid JSON-LD: ${error.message}`);
    }
  }
}

console.log(`Checked ${blockCount} JSON-LD blocks across ${fileCount} HTML files.`);
