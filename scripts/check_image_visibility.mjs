import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const IMAGE_ROOTS = [
  path.join(ROOT, "assets", "img"),
  path.join(ROOT, "torino-erasmus-map", "assets")
];
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".txt", ".webmanifest", ".xml"]);
const SKIP_DIRECTORIES = new Set([".git", "dist", "node_modules", "output", "test-results", "tmp"]);
const issues = [];

async function listFiles(directory, extensions, results = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await listFiles(fullPath, extensions, results);
    } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }

  return results;
}

const imageFiles = [];
for (const imageRoot of IMAGE_ROOTS) {
  await listFiles(imageRoot, IMAGE_EXTENSIONS, imageFiles);
}

const textFiles = await listFiles(ROOT, TEXT_EXTENSIONS);
const corpus = (await Promise.all(textFiles.map((file) => readFile(file, "utf8")))).join("\n");

for (const imageFile of imageFiles) {
  const fileName = path.basename(imageFile);
  if (!corpus.includes(fileName)) {
    issues.push(`${path.relative(ROOT, imageFile)} is not referenced by a public page, manifest, stylesheet, script, or sitemap`);
  }
}

const relativeImages = imageFiles.map((file) => path.relative(ROOT, file).replaceAll(path.sep, "/"));
const ignored = spawnSync("git", ["check-ignore", "--stdin"], {
  cwd: ROOT,
  input: `${relativeImages.join("\n")}\n`,
  encoding: "utf8"
});

if (ignored.status === 0 && ignored.stdout.trim()) {
  for (const file of ignored.stdout.trim().split(/\r?\n/)) {
    issues.push(`${file} is ignored by Git and cannot be published`);
  }
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log(`Checked ${imageFiles.length} public image assets; every file is referenced and publishable.`);
