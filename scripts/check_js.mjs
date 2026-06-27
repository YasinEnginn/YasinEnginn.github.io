import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const JS_EXTENSIONS = new Set([".js", ".mjs"]);
const DATA_FILES = [
  "assets/data/latest_video.json",
  "assets/data/translations.json",
  "torino-gunlukleri/search-index.json"
];

async function listFiles(dir, results = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await listFiles(fullPath, results);
    } else if (JS_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

const jsFiles = await listFiles(ROOT);

for (const file of jsFiles) {
  execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
}

for (const file of DATA_FILES) {
  JSON.parse(await readFile(path.join(ROOT, file), "utf8"));
}

console.log(`Checked ${jsFiles.length} JS files and ${DATA_FILES.length} JSON data files.`);
