# Commands

## Build

```
python3 build.py            # build into dist/
python3 build.py --serve    # build and serve http://127.0.0.1:8000
```

Rebuilding always touches a few `dist/` files with timestamp-only changes — revert them before committing (see
[rules.md](rules.md)).

## Checks

Run these before committing; all must be green.

```
python3 tools/verify.py           # dist/ layout, JS<->HTML contracts, dead links, RU/EN parity
python3 tools/check_headers.py    # builder.js val()/on() ids exist as form controls
python3 tools/check_fork_headers.py   # spec prose + builder coverage vs the vendored standard
python3 tools/check_widgets.py    # spec.WIDGETS vs the fork DashboardWidget enum (skips without the fork)
node   tools/e2e.mjs              # Chromium: console errors, overflow, clipped text
python3 tools/report_roundtrip.py # subscription-report R1 envelope encode/decode
```

`check_fork_headers.py` has two extra jobs:

```
python3 tools/check_fork_headers.py --sync   # regenerate in the fork and re-vendor gen/provider_standard.g.json
```

Freshness (vendored JSON vs the fork's own copy) runs only when the fork is checked out; it is a skip in CI.

## Preview

Open built HTML locally with `xdg-open dist/<lang>/<page>.html`. Never publish site output to external hosts to
preview it.
