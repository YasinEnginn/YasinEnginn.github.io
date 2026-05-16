import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const files = [
  "index.html",
  "cv.html",
  "projects/index.html",
  "projects/netreka-nexus/index.html",
  "projects/tolerex/index.html",
  "projects/rehydrator/index.html",
  "projects/network-automation-labs/index.html",
  "projects/go-network-programming/index.html",
  "projects/ndn-simulation-labs/index.html",
  "projects/ccnp-labs/index.html",
  "notes/index.html",
  "notes/production-ready-network-automation-checklist.html",
  "notes/designing-grpc-apis-for-network-control-planes.html",
  "notes/fast-incident-triage-for-lab-and-production.html",
  "videos/index.html"
];

let count = 0;

for (const file of files) {
  const html = await readFile(join(ROOT_DIR, file), "utf8");
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>\s*([\s\S]*?)\s*<\/script>/gi)];

  for (const [, json] of scripts) {
    JSON.parse(json);
    count += 1;
  }
}

console.log(`Checked ${count} JSON-LD blocks.`);
