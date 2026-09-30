# AskFunnel Help Center

Source of the AskFunnel customer help center, published with [Mintlify](https://mintlify.com) from the `main` branch.

## Work on it

- Preview: `npm install`, then `HOME=$PWD/.home npx mint dev --port 3333` and open http://localhost:3333.
- Writing rules, page structure and image rules: [AGENTS.md](AGENTS.md). The reference page is `integrations/highlevel.mdx`.
- Navigation and site settings: `docs.json`. Site-wide style fixes: `style.css`.
- Screenshots: raw captures go in `source/raw/` (not committed); each framed image is listed in a manifest in `tools/images/` and rebuilt with `node tools/build-images.mjs <filter>` (uses `tools/frame.mjs`).

Pushing to `main` publishes the site.
