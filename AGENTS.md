# AskFunnel Help Center: how to write and edit pages

This is the public help center for AskFunnel customers, built with [Mintlify](https://mintlify.com). Pages are MDX files with YAML frontmatter; the site config and navigation live in `docs.json`. Preview locally with `npm run dev` (http://localhost:3333).

The reference page for tone, structure and images is `integrations/highlevel.mdx`. When in doubt, copy what it does.

## Who reads this

Business owners, marketers and agencies, not developers. Many are in the middle of a task and scanning for the next click. Write for them: plain words, short sentences, one idea per sentence.

## Terminology

- The product is **AskFunnel** (capital A and F). The dashboard is at dash.askfunnel.com.
- Use "funnel", "lead", "workspace", "organization owner", "team member" as the product does.
- HighLevel: say "HighLevel" in prose; the AskFunnel card and buttons say "GoHighLevel", so quote the UI exactly when naming them.
- Support: support@askfunnel.com. Never hello@.

## Copy rules

- No em dashes, en dashes or " - " used as punctuation. Use a period, comma, colon or parentheses.
- Active voice, second person ("you"), sentence case headings.
- Bold every on-screen label the reader clicks or looks for, in quotes when it is a button or menu item: Click **"Funnel Settings"**. Bold field names and status labels too (**Connected**, **Delivered**). Also bold list lead-ins ("**Pause it for one funnel:** ..."). Keep explanatory sentences plain.
- Quote UI labels exactly as they appear in the product. Check the dashboard source (`askfunnel-monorepo/apps/dashboard/src`) when unsure.
- Never promise what the product does not do. If an old article claims a feature or behavior you cannot confirm in the code, leave it out and note it for review.
- Do not mention internal details (databases, emulators, API names, test accounts).

## Page structure

1. Frontmatter: `title` (the question or task, in the reader's words), `sidebarTitle` (short, 1 to 4 words), `description` (one sentence), `icon` (a Font Awesome name).
2. If the feature depends on the plan, start with the plan badge:
   `<Callout icon="star" color="#155DFC">Available on: **the Growth plan and above**.</Callout>`
3. One or two short paragraphs: what it is and why it helps.
4. Optional "What you can do" bullets with bold lead-ins.
5. `## Important to note` with one `<Warning>` holding a bullet list, only when there are real caveats.
6. Procedures in `<Steps>` with one `<Step title="...">` per stage. Numbered sub-steps inside are fine. Put the screenshot for a stage inside that stage.
7. `## How do I know it is working?` when there is an outcome to check.
8. `## Troubleshooting` as an `<AccordionGroup>` of questions.
9. End with: `Need help? Email [support@askfunnel.com](mailto:support@askfunnel.com).`

Callouts: `<Warning>` for caveats, `<Tip>` for helpful extras, `<Note>` for neutral context, `<Danger>` only for data loss. Group related points into one callout with bullets instead of stacking several callouts. Do not add horizontal rules; Mintlify spacing is enough. Link related pages with normal Markdown links (`[Connect your custom domain](/funnel-settings/custom-domain)`).

## Images

Images make or break the page. Choose each one deliberately.

- Every screenshot is framed on the AskFunnel gradient with `tools/frame.mjs` (rounded corners, shadow, optional orange ring around what to click). Never publish a raw white screenshot.
- Keep raw captures in `source/raw/<section>/<page>/` (not committed) and list every framed image in a manifest `tools/images/<section>-<page>.json` as `[{ "out", "src", "args" }]`. Rebuild with `node tools/build-images.mjs <filter>`.
- After adding or changing images, run `npm run images` (or `node tools/embed-images.mjs`). It turns each embed into an `<img>` tag with the image's width and height, makes every image except the first on a page load lazily, and writes the tiny blurred preview (`<name>.blur.webp`) that `lazy-images.js` shows while the image loads. You can write a new embed as Markdown; the tool converts it. Do not edit `width`, `height` or `loading` by hand. `npm run check` fails when a page needs this step.
- Framed images go to `images/<section>/<page>/<what-it-shows>.png` and are embedded with alt text that says what the image shows: `![The Integrations menu and the GoHighLevel Settings link, highlighted](/images/integrations/highlevel/connect-card.png)`.
- Crop to what matters. Use `--ring x,y,w,h` (source pixels) to point at the button or menu item the step talks about.
- Show realistic data (for example Summit Realty Group, Sofia Alvarez, sofia.alvarez@example.com). Never show test names ("Test Location", "webhook.site"), the development app, localhost URLs, personal data or half-cut UI.
- Show the full result when the step is about a result (for example the whole HighLevel contact page, not only the note).

## Files and navigation

- One folder per section: `getting-started/`, `funnels/`, `funnel-settings/`, `leads/`, `analytics/`, `integrations/`, `messages/`, `workspaces/`, `billing/`.
- File names are short kebab-case task names (`custom-domain.mdx`), never old article IDs.
- Add every page to `navigation` in `docs.json`.
