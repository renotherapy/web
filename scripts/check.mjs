import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(projectRoot, "src", "index.html");
const html = await readFile(htmlPath, "utf8");
const htmlValidate = path.join(projectRoot, "node_modules", "html-validate", "bin", "html-validate.mjs");

execFileSync(process.execPath, [htmlValidate, htmlPath], { cwd: projectRoot, stdio: "inherit" });

const requiredPatterns = [
  [/<title>[^<]{20,65}<\/title>/i, "a descriptive title between 20 and 65 characters"],
  [/<meta\s+name="description"\s+content="[^"]{120,170}"/i, "a 120–170 character meta description"],
  [/<link\s+rel="canonical"/i, "a canonical URL"],
  [/<script\s+type="application\/ld\+json">/i, "structured data"],
  [/<meta\s+property="og:title"/i, "Open Graph metadata"],
];

for (const [pattern, label] of requiredPatterns) {
  if (!pattern.test(html)) throw new Error(`SEO check failed: missing ${label}.`);
}

const h1Count = (html.match(/<h1(?:\s|>)/gi) ?? []).length;
if (h1Count !== 1) throw new Error(`SEO check failed: expected exactly one H1, found ${h1Count}.`);

await access(path.join(projectRoot, "dist", "index.html"));
await access(path.join(projectRoot, "dist", "sitemap.xml"));
await access(path.join(projectRoot, "dist", "robots.txt"));
await access(path.join(projectRoot, "dist", "assets", "styles.css"));

const builtHtml = await readFile(path.join(projectRoot, "dist", "index.html"), "utf8");
if (builtHtml.includes("{{")) throw new Error("Output check failed: unresolved template token in dist/index.html.");

console.log("HTML, accessibility, SEO, and output checks passed.");
