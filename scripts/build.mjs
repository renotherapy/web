import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src");
const outputRoot = path.join(projectRoot, "dist");
const sourceImages = path.join(sourceRoot, "assets", "images");
const outputImages = path.join(outputRoot, "assets", "images");
const tailwindBinary = path.join(projectRoot, "node_modules", "@tailwindcss", "cli", "dist", "index.mjs");
const siteUrl = (process.env.SITE_URL || "https://renotherapy-construction.company-5897.chatgpt.site").replace(/\/$/, "");
const requestedBasePath = process.env.BASE_PATH || "/";
const basePath = `/${requestedBasePath.replace(/^\/+|\/+$/g, "")}${requestedBasePath === "/" ? "" : "/"}`;

await rm(outputRoot, { recursive: true, force: true });
await mkdir(path.join(outputRoot, "assets"), { recursive: true });
await mkdir(outputImages, { recursive: true });

execFileSync(
  process.execPath,
  [tailwindBinary, "-i", path.join(sourceRoot, "input.css"), "-o", path.join(outputRoot, "assets", "styles.css"), "--minify"],
  { cwd: projectRoot, stdio: "inherit" },
);

await Promise.all([
  cp(path.join(sourceRoot, "index.html"), path.join(outputRoot, "index.html")),
  mkdir(path.join(outputRoot, "bathroom-renovation"), { recursive: true }).then(() =>
    cp(path.join(sourceRoot, "bathroom-renovation.html"), path.join(outputRoot, "bathroom-renovation", "index.html")),
  ),
  cp(path.join(sourceRoot, "app.js"), path.join(outputRoot, "assets", "app.js")),
  cp(path.join(sourceRoot, "public"), outputRoot, { recursive: true }),
]);

for (const relativePath of ["index.html", "bathroom-renovation/index.html", "robots.txt", "sitemap.xml", "site.webmanifest"]) {
  const outputPath = path.join(outputRoot, relativePath);
  const template = await readFile(outputPath, "utf8");
  const rendered = template
    .replaceAll("{{SITE_URL}}", siteUrl)
    .replaceAll("{{BASE_PATH}}", basePath);
  await writeFile(outputPath, rendered, "utf8");
}

for (const entry of await readdir(sourceImages, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const inputPath = path.join(sourceImages, entry.name);
  const extension = path.extname(entry.name).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    const outputName = `${path.parse(entry.name).name}.webp`;
    await sharp(inputPath)
      .rotate()
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(path.join(outputImages, outputName));
  } else {
    await cp(inputPath, path.join(outputImages, entry.name));
  }
}

console.log("Built optimized static site in dist/.");
