# Pill Engine Docs

This project builds the Pill Engine guide and generated API reference. It is built with
[VitePress](https://vitepress.dev).

## Scripts

| Command                         | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `npm run docs:dev`              | Start the local dev server with hot reload               |
| `npm run docs:build`            | Build the static site into `.vitepress/dist/`            |
| `npm run docs:preview`          | Serve the last build locally                             |
| `npm run docs:update-reference` | Download the guide and API reference from Pill-Docs |

## Content source

The API reference and the experimental guide are not authored here.
`npm run docs:update-reference` mirrors them from
[`Pillware/Pill-Docs`](https://github.com/Pillware/Pill-Docs):

| From Pill-Docs                   | To this repo                      |
| -------------------------------- | --------------------------------- |
| `reference/`                     | `pages/reference/`                |
| `reference/reference-sidebar.ts` | `.vitepress/reference-sidebar.ts` |
| `guide/`                         | `pages/guide/`                    |
| `guide/guide-sidebar.ts`         | `.vitepress/guide-sidebar.ts`     |
| commit hash and date             | `.vitepress/content-version.json` |

All targets are generated and git ignored; a sync replaces them entirely, so
edits made here are lost on the next run. Change content in Pill-Docs instead.
Each sidebar lives beside its content (`guide/guide-sidebar.ts` and
`reference/reference-sidebar.ts`); the sync copies them into `.vitepress/` and
leaves them out of the published page folders.
The current guide (`pages/guide_current/`) is authored in this repository and is
never overwritten by a sync.

`docs:dev` and `docs:build` never sync on their own: they use whatever was last
downloaded, so content is only fetched when you ask for it. Without a sync the
site builds with the current guide only; the experimental `/guide/` sidebar and
the Reference link are hidden.

To keep `docs:dev` starting in about two seconds, the dev server does not watch
`pages/reference/` and leaves reference pages out of its search index (production
builds index everything). Restart the dev server after updating the reference.

To work against a local checkout instead of the remote repository:

```bash
npm run docs:update-reference -- D:\Programming\Pill-Docs
# or, with full flag support:
node scripts/mirror-pill-docs-content.mjs --from D:\Programming\Pill-Docs
node scripts/mirror-pill-docs-content.mjs --repo https://github.com/you/fork --ref v1.2.0
```

The same knobs exist as `PILL_DOCS_SOURCE`, `PILL_DOCS_REF`, `PILL_DOCS_REPO`
and `PILL_DOCS_TOKEN` (needed only while the content repository is private).
The remote clone is cached in `.content/`, so repeat runs only fetch the tip.

`docs:build` runs the VitePress CLI with an 8 GB heap. The API reference is
about 3,850 pages, so two guards keep the build in the minutes range:

- Every reference page renders only its own crate's sidebar
  (`.vitepress/flatten-reference-sidebar.ts`). Handing VitePress one shared
  sidebar key puts the whole ~3,400-entry tree into the markup of every page,
  which triples the build and ships roughly 2 MB of HTML per page.
- Constants that embed fonts or images arrive from rustdoc as multi-megabyte
  byte-string literals; `.vitepress/truncate-huge-code-blocks.ts` caps code
  blocks, and `scripts/generate-llm-documentation-artifacts.mjs` applies the same cap to the Markdown
  mirrors.

A full build takes about 3 minutes (3,921 pages measured in 2 min 42 s; it was
about 14 minutes before those two guards).

## Deployment

`.github/workflows/deploy-docs.yml` deploys the docs separately from the
landing page, and only rebuilds when the docs site changes, Pill-Docs sends a
`pill-docs-updated` dispatch, or the workflow is started by hand. The daily
scheduled run compares the latest Pill-Docs commit with the one in the live
`build-info.json` and skips when they match. Synced content is cached per
Pill-Docs commit, so a build reuses the last cached content when Pill-Docs
cannot be read, and leaves the live docs untouched when nothing is cached.

A manual run (Actions → Deploy Docs → Run workflow) always rebuilds and takes
three inputs: `content_ref` (Pill-Docs branch or tag, default `main`),
`refresh_content` (ignore the content cache and sync again) and `deploy`
(build only when false).

Every page ends with the Pill-Docs commit it was built from, its date and
whether it is still the latest commit (checked in the browser against the
GitHub API).

## Layout

- `pages/` — all content as markdown files. Subdirectories become navigation
  sections (configured in `.vitepress/config.mts`).
- `pages/guide_current/` — the current guide, authored in this repository.
- `pages/guide/` — the experimental guide, generated by
  `npm run docs:update-reference`, do not edit.
- `pages/reference/` — the API reference, generated by
  `npm run docs:update-reference`, do not edit.
- `pages/public/` — static assets served from the site root (favicons, fonts).
- `.vitepress/config.mts` — site config, sidebar, head metadata.
- `.vitepress/theme/` — custom theme:
  - `styles.css` — VitePress-specific styling built on the shared tokens.
  - `index.ts` — theme entry point (route handling, scroll progress bar).
  - `mermaid.ts` — click-to-enlarge lightbox for Mermaid diagrams.

## Shared styling with rustdoc

`pill_style.css` (repository root) is the single source of truth for colors,
syntax accents, and typography. The Rust workspace consumes the same file
via `Rust-Hybrid-ECS/.cargo/config.toml`:

```toml
[build]
rustdocflags = ["--extend-css", "../Pill-Engine-Website/pill_style.css"]
```

so the `cargo doc` output for `pill_engine`/`pill_host` matches this site.
When changing `pill_style.css`, verify both sides:

- docs: `npm run docs:build`
- API docs: `cargo doc -p pill_engine --no-deps` in the Rust workspace
