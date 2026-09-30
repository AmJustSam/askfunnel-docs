#!/usr/bin/env node
// Frames a screenshot for the help center: the AskFunnel blue gradient behind it,
// rounded corners, a soft shadow and optional orange rings around what to click.
// Plain screenshots blend into the white page; this keeps every image readable.
//
// Usage:
//   node tools/frame.mjs <input.png> <output.png> [--crop x,y,w,h]
//     [--ring x,y,w,h]... [--pad N] [--pad-y N] [--width N] [--radius N] [--max-width N]
//
// Coordinates are in source pixels (the screenshot's own pixels, before cropping).
// --width sets a fixed canvas width and centers the shot (use it for tall or narrow
// shots so every image in an article has the same width).

import sharp from "sharp";

const args = process.argv.slice(2);
const [input, output] = args;
if (!input || !output) {
  console.error("Usage: node tools/frame.mjs <input> <output> [--crop x,y,w,h] [--ring x,y,w,h] [--pad N] [--pad-y N] [--width N] [--radius N]");
  process.exit(1);
}

const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const numbers = (value) => value.split(",").map(Number);
const rings = args.flatMap((a, i) => (a === "--ring" ? [numbers(args[i + 1])] : []));

const meta = await sharp(input).metadata();
const [cx, cy, cw, ch] = option("--crop") ? numbers(option("--crop")) : [0, 0, meta.width, meta.height];
const radius = Number(option("--radius") ?? Math.round(Math.max(18, Math.min(40, cw / 90))));
const fixedWidth = option("--width") ? Number(option("--width")) : undefined;
const padX = fixedWidth ? Math.round((fixedWidth - cw) / 2) : Number(option("--pad") ?? Math.round(Math.max(64, cw * 0.065)));
const padY = Number(option("--pad-y") ?? (fixedWidth ? 90 : Math.round(padX * 0.9)));
const W = cw + padX * 2;
const H = ch + padY * 2;

const background = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a9c1ff"/>
      <stop offset="0.48" stop-color="#5b86ff"/>
      <stop offset="1" stop-color="#1f5efc"/>
    </linearGradient>
    <radialGradient id="light" cx="0" cy="0" r="0.75">
      <stop offset="0" stop-color="#e4ecff" stop-opacity="1"/>
      <stop offset="1" stop-color="#e4ecff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="deep" cx="1" cy="1" r="0.7">
      <stop offset="0" stop-color="#0f3fd8" stop-opacity="1"/>
      <stop offset="1" stop-color="#0f3fd8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#base)"/>
  <rect width="100%" height="100%" fill="url(#light)"/>
  <rect width="100%" height="100%" fill="url(#deep)"/>
</svg>`);

const blur = Math.round(Math.max(20, cw / 50));
const shadow = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>
  <rect x="${padX}" y="${padY + Math.round(blur * 0.9)}" width="${cw}" height="${ch}" rx="${radius}" fill="rgb(8,24,80)" fill-opacity="0.30" filter="url(#s)"/>
</svg>`);

const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}"><rect width="${cw}" height="${ch}" rx="${radius}" fill="#fff"/></svg>`);
const shot = await sharp(input)
  .extract({ left: cx, top: cy, width: cw, height: ch })
  .flatten({ background: "#ffffff" })
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

const stroke = Math.max(5, Math.round(cw / 330));
const ringSvg = rings.length
  ? Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${rings
    .map(([x, y, w, h]) => {
      const left = x - cx + padX;
      const top = y - cy + padY;
      return `<rect x="${left}" y="${top}" width="${w}" height="${h}" rx="16" fill="none" stroke="#ff5a36" stroke-opacity="0.22" stroke-width="${stroke * 3}"/>
  <rect x="${left}" y="${top}" width="${w}" height="${h}" rx="16" fill="none" stroke="#ff5a36" stroke-width="${stroke}"/>`;
    })
    .join("\n  ")}
</svg>`)
  : null;

// Pages are at most ~800px wide, so 2000px stays sharp on retina screens.
const maxWidth = Number(option("--max-width") ?? 2000);
const framed = await sharp(background)
  .composite([
    { input: shadow, left: 0, top: 0 },
    { input: shot, left: padX, top: padY },
    ...(ringSvg ? [{ input: ringSvg, left: 0, top: 0 }] : []),
  ])
  .png()
  .toBuffer();

// Round the outer corners too, to match Mintlify's rounded callouts and cards.
const outerRadius = Math.round(W * 0.014);
const outerMask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${outerRadius}" fill="#fff"/></svg>`);
const rounded = await sharp(framed).composite([{ input: outerMask, blend: "dest-in" }]).png().toBuffer();

const info = await sharp(rounded)
  .resize({ width: Math.min(W, maxWidth), withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: false })
  .toFile(output);

console.log(`${output}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
