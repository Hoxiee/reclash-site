---
name: provider-sync
description: Use when the ReClash fork gains or changes a provider response header, dashboard widget, or appearance token and the site must follow — re-vendoring the standard, adding RU/EN prose, and wiring the builder.
---

# provider-sync

The fork is the single source of truth for the provider standard; this site vendors its JSON and layers bilingual
prose plus an interactive builder. Follow these steps whenever the fork's provider standard changes.

## 1. Re-vendor the standard

```
python3 tools/check_fork_headers.py --sync
```

This regenerates the standard in the fork and copies `gen/provider_standard.g.json` in. Never hand-edit that file.
If the fork lives elsewhere, set `RECLASH_FORK`.

## 2. Add prose in gen/spec.py

`spec.py`'s `_cover()` / `_cover_headers()` will now fail for any new header, widget or token that has no RU/EN
prose. Add a paired `("русский", "english")` entry keyed by the same id. Removing a fork entry means deleting its
prose too — stale keys fail the same guard.

## 3. Wire the builder (headers only)

For a new provider-authorable header, `check_fork_headers.py`'s `check_builder` fails until the builder emits it:

- add a form control in `gen/page_headers.py` with a stable `f_*` id, its label/error `s('key')` strings, and place
  it in the right block (`group`/`grid`);
- in `assets/js/builder.js`, read it with `val('f_*')`/`on('f_*')`, validate, and `push('Header-Name', value)`.

Serialization is generic — no `#cfg=` list to edit. HWID runtime verdicts are not authorable and are excluded.

## 4. Rebuild and revert date noise

```
python3 build.py
git checkout -- dist/_headers dist/mock/_headers.json dist/*/mock-subs.html dist/sitemap.xml
```

## 5. Green every guard

```
python3 tools/check_fork_headers.py
python3 tools/check_headers.py
python3 tools/check_widgets.py
python3 tools/verify.py
node   tools/e2e.mjs
```

Then commit spec, builder, assets and the real `dist/` changes together, English Conventional-Commits subject, no
agent trailer.
