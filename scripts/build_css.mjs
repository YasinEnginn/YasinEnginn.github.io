import { readFile, stat, writeFile } from "node:fs/promises";

const SOURCE_FILES = [
  "assets/css/01-tokens.css",
  "assets/css/02-base.css",
  "assets/css/03-layout.css",
  "assets/css/04-navbar.css",
  "assets/css/05-hero.css",
  "assets/css/06-cards.css",
  "assets/css/07-sections.css",
  "assets/css/08-responsive.css"
];

const CRITICAL_SOURCE_FILES = [
  "assets/css/01-tokens.css",
  "assets/css/02-base.css",
  "assets/css/03-layout.css",
  "assets/css/04-navbar.css",
  "assets/css/05-hero.css",
  "assets/css/09-critical-responsive.css"
];

const DEFERRED_SOURCE_FILES = [
  "assets/css/06-cards.css",
  "assets/css/07-sections.css",
  "assets/css/08-responsive.css"
];

const OUTPUT_FILE = "assets/css/app.css";
const CRITICAL_OUTPUT_FILE = "assets/css/app-critical.css";
const DEFERRED_OUTPUT_FILE = "assets/css/app-deferred.css";

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

async function main() {
  async function buildBundle(files, outputFile, label) {
    const chunks = await Promise.all(files.map(async (file) => {
      const css = await readFile(file, "utf8");
      return css.trim();
    }));

    const banner = `/* ${label}. Update source partials, then run node scripts/build_css.mjs. */\n`;
    await writeFile(outputFile, `${banner}${minifyCss(chunks.join("\n"))}\n`, "utf8");

    const { size } = await stat(outputFile);
    console.log(`${outputFile} written (${size} bytes)`);
  }

  await buildBundle(
    SOURCE_FILES,
    OUTPUT_FILE,
    "Built from assets/css/01-tokens.css through 08-responsive.css"
  );
  await buildBundle(
    CRITICAL_SOURCE_FILES,
    CRITICAL_OUTPUT_FILE,
    "Critical first-screen CSS built from tokens, base, layout, navbar, hero, and critical responsive partials"
  );
  await buildBundle(
    DEFERRED_SOURCE_FILES,
    DEFERRED_OUTPUT_FILE,
    "Deferred below-the-fold CSS built from card and section partials"
  );
}

main();
