# Pill Engine Website

This repository builds and deploys the Pill landing page and documentation:

- **https://pillengine.org** → the landing page (`landing_page/`)
- **https://docs.pillengine.org** → the VitePress documentation (`docs_page/`), with
  the guide at `/guide/` and the generated API reference at `/reference/`

And

- **https://pill.rocks** → the landing page (`landing_page/`)
- **https://docs.pill.rocks** → the VitePress documentation (`docs_page/`), with
  the guide at `/guide/` and the generated API reference at `/reference/`

## Development

- `npm run dev` - Start both the landing page and docs development servers.
- `npm run build` - Build the landing page into `dist/` and the docs into
  `dist-docs/` (this is what CI runs before deploying).
- `npm run preview` - Preview the landing page production build.
- `npm run install:all` - Install dependencies for both workspace projects.

## Documentation generation

`docs_page/` builds the VitePress site from two sources:

- **Guide** - authored in this repository, under `docs_page/pages/guide/`.
- **API reference** - authored in [`Pillware/Pill-Docs`](https://github.com/Pillware/Pill-Docs)
  (`reference/` and `reference-sidebar.ts`), not here. It has ~3,450 generated pages.

`npm run docs:update-reference` (run in `docs_page/`) mirrors it into
`docs_page/pages/reference/` and records the source commit and date in
`docs_page/.vitepress/content-version.json`. These targets are generated and git
ignored, and `docs:dev`/`docs:build` never sync on their own. Every build publishes
that record as `build-info.json` at the site root, which is also what the deploy
workflow reads to decide whether anything changed.

| Trigger | How |
| --- | --- |
| Local | In `docs_page`: `npm run docs:update-reference` and `npm run docs:build`; then from the repository root: `node build-script.js docs` |
| Site change | push to `main` touching `docs_page/**`, `pill_style.css` or `build-script.js` |
| Content change | Pill-Docs sends the `pill-docs-updated` `repository_dispatch` |
| Daily | scheduled run at 04:17 UTC, skipped when the live `build-info.json` already matches Pill-Docs `main` |
| Manual | Actions → **Deploy Docs** → **Run workflow** (`content_ref`, `refresh_content`, `deploy`) |

When Pill-Docs cannot be read, the last cached content is reused; when nothing is
cached, the workflow leaves the live docs untouched instead of deploying an
incomplete site.

For documentation structure and generation details, see `docs_page/README.md`.

