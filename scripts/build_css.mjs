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

const OUTPUT_FILE = "assets/css/app.css";

async function main() {
  const chunks = await Promise.all(
    SOURCE_FILES.map(async (file) => {
      const css = await readFile(file, "utf8");
      return `\n/* ${file} */\n${css.trim()}\n`;
    })
  );

  const banner = "/* Built from assets/css/01-tokens.css through 08-responsive.css. Update source partials, then run node scripts/build_css.mjs. */\n";
  await writeFile(OUTPUT_FILE, `${banner}${chunks.join("")}`, "utf8");

  const { size } = await stat(OUTPUT_FILE);
  console.log(`${OUTPUT_FILE} written (${size} bytes)`);
}

main();
