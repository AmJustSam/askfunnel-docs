#!/usr/bin/env node
// Makes every screenshot on every page load fast, like askfunnel.com:
// - rewrites each image embed (Markdown `![alt](/images/x.png)` or a tag this tool
//   wrote before) as `<img src alt width height loading>`; the width and height
//   keep the image's space while it loads, and every image except the first on a
//   page loads lazily (the first is usually on screen right away);
// - writes a tiny blurred preview next to each image (`x.blur.webp`, a few hundred
//   bytes) that lazy-images.js shows until the sharp image has loaded, and deletes
//   previews whose image is gone.
// Mintlify's CDN then serves each image as WebP or AVIF in the size the screen needs.
//
// Usage: node tools/embed-images.mjs [--check] [page.mdx ...]
//   --check  change nothing; exit 1 and list the pages that need a rewrite.
//   pages    only these pages (default: every page; orphan previews are only removed then).
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const check = process.argv.includes("--check");
const only = process.argv.slice(2).filter((a) => a.endsWith(".mdx"));
const SKIP = new Set(["node_modules", ".home", ".git", "source", "tools", "images", "logo"]);
const EMBED = new RegExp(
  [
    String.raw`!\[([^\]]*)\]\((\/images\/[^)\s]+\.png)(?:\s+"[^"]*")?\)`,
    String.raw`<img src="(\/images\/[^"]+\.png)" alt=(?:"([^"]*)"|\{("(?:[^"\\]|\\.)*")\})[^>]*?\/>`,
  ].join("|"),
  "g",
);

function pages(dir = ".") {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (SKIP.has(name)) return [];
    if (statSync(path).isDirectory()) return pages(path);
    return name.endsWith(".mdx") ? [path] : [];
  });
}

const size = new Map();
async function dimensions(src) {
  if (!size.has(src)) {
    const { width, height } = await sharp(`.${src}`).metadata();
    size.set(src, { width, height });
  }
  return size.get(src);
}

const missingPreviews = [];
async function writePreview(src) {
  const png = `.${src}`;
  const preview = png.replace(/\.png$/, ".blur.webp");
  // A fresh clone gives files arbitrary modified times, so --check only asks that the
  // preview exists; a normal run still refreshes previews of images edited since.
  if (existsSync(preview) && (check || statSync(preview).mtimeMs >= statSync(png).mtimeMs)) return;
  missingPreviews.push(preview);
  if (!check) await sharp(png).resize({ width: 24 }).webp({ quality: 40, alphaQuality: 40 }).toFile(preview);
}

const altAttribute = (alt) => (alt.includes('"') ? `alt={${JSON.stringify(alt)}}` : `alt="${alt}"`);

const used = new Set();
const stale = [];
for (const page of only.length ? only : pages()) {
  const text = readFileSync(page, "utf8");
  const matches = [...text.matchAll(EMBED)];
  if (!matches.length) continue;
  let out = "";
  let last = 0;
  for (const [i, m] of matches.entries()) {
    const src = m[2] ?? m[3];
    const alt = m[1] ?? m[4] ?? JSON.parse(m[5]);
    if (!existsSync(`.${src}`)) throw new Error(`${page}: missing image ${src}`);
    used.add(src);
    await writePreview(src);
    const { width, height } = await dimensions(src);
    const lazy = i === 0 ? "" : ' loading="lazy"';
    out += text.slice(last, m.index) + `<img src="${src}" ${altAttribute(alt)} width="${width}" height="${height}"${lazy} />`;
    last = m.index + m[0].length;
  }
  out += text.slice(last);
  if (out !== text) {
    stale.push(page);
    if (!check) writeFileSync(page, out);
  }
}

// Previews whose image is no longer on any page, or no longer exists.
function previews(dir = "images") {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? previews(path) : name.endsWith(".blur.webp") ? [path] : [];
  });
}
const orphans = only.length ? [] : previews().filter((p) => !existsSync(p.replace(/\.blur\.webp$/, ".png")));
if (!check) orphans.forEach((p) => unlinkSync(p));

console.log(
  `${used.size} images on ${pages().length} pages: ${stale.length} pages ${check ? "need" : "got"} a rewrite, ` +
    `${missingPreviews.length} previews ${check ? "missing" : "written"}, ${orphans.length} orphan previews ${check ? "found" : "removed"}.`,
);
stale.forEach((p) => console.log(`  ${p}`));
if (check && (stale.length || missingPreviews.length || orphans.length)) process.exit(1);
