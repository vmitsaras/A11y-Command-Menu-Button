import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = path.join(projectRoot, "dist");
const docsDir = path.join(projectRoot, "docs");
const sourceIndex = path.join(projectRoot, "examples", "basic", "index.html");
const docsIndex = path.join(docsDir, "index.html");
const favicon = path.join(projectRoot, "examples", "basic", "favicon.svg");
const docsFavicon = path.join(docsDir, "favicon.svg");
const socialPreview = path.join(projectRoot, ".github", "social-preview.png");
const docsSocialPreview = path.join(docsDir, "social-preview.png");

async function assertExists(filePath, message) {
  try {
    await access(filePath);
  } catch {
    throw new Error(message);
  }
}

await assertExists(sourceIndex, "Cannot generate Pages output: examples/basic/index.html is missing.");
await assertExists(favicon, "Cannot generate Pages output: examples/basic/favicon.svg is missing.");
await assertExists(socialPreview, "Cannot generate Pages output: .github/social-preview.png is missing.");
await assertExists(path.join(distDir, "index.js"), "Cannot generate Pages output: run the package build first.");
await assertExists(path.join(distDir, "styles.css"), "Cannot generate Pages output: dist/styles.css is missing.");

let html = await readFile(sourceIndex, "utf8");
html = html.replaceAll("../../dist/", "./dist/");
html = html.replace(
  '<meta name="robots" content="noindex,follow" />',
  '<meta name="robots" content="index,follow" />\n' +
    '    <link rel="canonical" href="https://vmitsaras.github.io/A11y-Command-Menu-Button/" />'
);

await rm(docsDir, { recursive: true, force: true });
await mkdir(docsDir, { recursive: true });
await writeFile(docsIndex, html);
await cp(favicon, docsFavicon);
await cp(socialPreview, docsSocialPreview);
await cp(distDir, path.join(docsDir, "dist"), { recursive: true });
await writeFile(path.join(docsDir, ".nojekyll"), "");

await assertExists(docsIndex, "Generated Pages output is missing docs/index.html.");

console.log("Generated GitHub Pages output in docs/.");
