# Project

The website for [ReClash](https://github.com/Hoxiee/ReClash), a mihomo client: landing page, an interactive
reference and builder for the provider HTTP headers, downloads, a quick-start guide, a gallery, mock subscriptions
and a subscription-report decoder. Bilingual (RU/EN), live at **https://reclash.pages.dev** (Cloudflare Pages).

## Constraints

- **Static by construction.** No npm, no bundler, no runtime CDN, no network at build time. The generator is a single
  Python 3 stdlib program; everything under `dist/` is disposable and regenerated from `gen/` and `assets/`.
- **Node is for checks only.** `tools/e2e.mjs` and the screenshot helpers drive Chromium via a vendored Playwright;
  they never produce shipped output.
- **The fork is not present in CI.** Cloudflare Pages has no clone, so anything that reads the fork
  (`--sync`, `check_widgets.py`'s enum read, the freshness leg of `check_fork_headers.py`) is a skip in CI, not a
  failure. `RECLASH_FORK` overrides the default checkout path.

## Layout

- `build.py` — renders every page × language into `dist/`; `RENDERERS` maps page ids to `gen/` render functions.
- `gen/` — one module per page (`page_*.py`), plus shared pieces: `layout.py`/`ui.py` (skeleton, `Ctx`, components),
  `spec.py` (the provider standard for the docs and builder), `mocks.py`/`mockhdr.py` (mock subscriptions),
  `remnawave.py`, `seo.py`, the report demo/copy modules.
- `gen/provider_standard.g.json` — vendored from the fork; the structural source for `spec.py`.
- `assets/` — CSS, JS (`builder.js`, `report.js`), fonts, images; served as-is.
- `tools/` — the checks (see [commands.md](commands.md)).
- `dist/` — build output, committed so Pages serves it directly.

The header pages read one spec (`gen/spec.py`); the mock subscriptions read one source (`gen/mocks.py`).
