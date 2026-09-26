# ReClash site

*[Русская версия](README.ru.md)*

The website for [ReClash](https://github.com/Hoxiee/ReClash), the mihomo client:
landing page, an interactive reference and builder for the provider HTTP headers,
downloads, a quick-start guide, a gallery, mock subscriptions and a
subscription-report decoder. Bilingual (RU/EN), live at
**https://reclash.pages.dev**.

Static by construction — no npm, no bundler, no runtime CDN. The generator is a
single Python 3 stdlib script; everything served is regenerated into `dist/`
from `gen/` and `assets/`.

```
python3 build.py            # build into dist/
python3 build.py --serve    # build and serve http://127.0.0.1:8000
```

Text is bilingual in place — `t("текст", "text")` — so a missing translation is a
missing argument, not a silent gap. The header pages read one spec (`gen/spec.py`);
the mock subscriptions read one source (`gen/mocks.py`).

## Checks

```
python3 tools/verify.py         # dist/ layout, JS<->HTML contracts, links, RU/EN parity
python3 tools/check_headers.py  # builder field / id / string coverage
node   tools/e2e.mjs            # Chromium: console errors, overflow, clipped text
```

## Deploy

Cloudflare Pages, served from the root of `dist/`. The mock subscriptions need the
`ReClash-*` response headers in `dist/_headers`, which Pages applies as-is.

## License

GPL-3.0, matching ReClash. Font faces ship under the SIL Open Font License.
