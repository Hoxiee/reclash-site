# Architecture

Read this when a change touches the generator, the provider spec, the builder, or the guards.

## Build flow

`build.py` holds `RENDERERS`, a map from page id to a `gen/` render function, and `LANGS = ("ru", "en")`. It builds
every page in both languages into `dist/`, copies `assets/`, and writes SEO artefacts. Each `gen/page_*.py` returns
HTML for one page; shared skeleton, the `Ctx` object (carries `lang` and `t()`), and reusable components live in
`gen/layout.py` and `gen/ui.py`.

## The provider spec seam

`gen/spec.py` loads the vendored `provider_standard.g.json` into `STANDARD` and derives the structural lists —
widgets, view tokens, theme variants, header set — straight from it. Alongside each it holds RU/EN prose keyed by the
same ids, and `_cover()` / `_cover_headers()` raise on any mismatch between derived keys and prose keys. This is why a
new fork header cannot ship without site prose, and stale prose for a removed header cannot linger.

`page_docs.py` renders the reference tables from this spec; `page_headers.py` renders the interactive builder from the
same header set.

## The builder

`gen/page_headers.py` emits the form via small helpers (`fld`, `txt`, `area`, `chk`, `grid`, `group`); each control
has a stable `f_*` id and each label/error is a `s('key')` string. `assets/js/builder.js` reads the controls with
`val('f_*')`/`on('f_*')`, validates, and `push('Header-Name', value)`s the wire lines; `push` skips empty values,
`checkUrl` validates URLs. Config serialization is generic: `syncHash` enumerates every form control with an id and
`loadHash` restores by id, so a new field auto-persists in `#cfg=` share links, snapshots and undo with no JS list to
maintain.

## Guards

- `tools/check_fork_headers.py` — prose coverage (spec vs standard), builder coverage (`check_builder`: every
  provider-authorable header is `push`ed in `builder.js`, HWID runtime verdicts excluded), and, with the fork present,
  JSON freshness; `--sync` re-vendors.
- `tools/check_headers.py` — every `val()/on()` id in `builder.js` exists as a form control, and every `s()` key
  exists as a string.
- `tools/check_widgets.py` — `spec` widgets vs the fork `DashboardWidget` enum (needs the fork).
- `tools/verify.py` — `dist/` layout, JS↔HTML contracts, links, RU/EN parity.
- `tools/e2e.mjs` — Chromium pass for console errors, overflow and clipped text.
- `tools/report_roundtrip.py` — subscription-report R1 envelope encode/decode.

When adding a builder field, the field, its strings and its `push` must all land together or `check_headers.py` and
`check_fork_headers.py` will fail.
