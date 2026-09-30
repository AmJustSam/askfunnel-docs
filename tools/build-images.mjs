#!/usr/bin/env node
// Rebuilds framed help center images from the manifests in tools/images/*.json.
// Each manifest lists { out, src, args } entries: the framed output, its raw
// capture (source/raw, kept out of Git) and the tools/frame.mjs arguments.
// Usage: node tools/build-images.mjs [substring of the output path]
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const filter = process.argv[2] ?? "";
const dir = new URL("./images/", import.meta.url);
const images = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(readFileSync(new URL(f, dir))));

for (const image of images.filter((i) => i.out.includes(filter))) {
  if (!existsSync(image.src)) {
    console.warn(`skip ${image.out}: missing ${image.src}`);
    continue;
  }
  mkdirSync(dirname(image.out), { recursive: true });
  execFileSync("node", [join("tools", "frame.mjs"), image.src, image.out, ...image.args], { stdio: "inherit" });
}
