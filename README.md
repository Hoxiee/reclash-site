# ReClash

A bilingual Nuxt 4 site generated for Cloudflare Pages. The home, quick start,
download and provider tools describe the current ReClash application in Russian
and English; the documentation engine also supports Simplified Chinese once it is published.
Fonts and styles are hosted locally.

## Local development

Use Node.js 24.22.1 (pinned in `.node-version`) or a newer version supported by
Nuxt. Install dependencies using the lockfile:

```sh
npm ci
npm run dev
```

For joint development, keep this checkout at `../reclash-site/` beside the
`ReClash/` application checkout. The application's `site` symlink points here;
Git history, branches, commits and deployment stay independent. From this
repository, `node ../ReClash/tool/site_docs.mjs --check` checks shared exports and
the documentation snapshot; `--sync` copies the app's provider standard and JSON schemas.

The root page redirects before first paint: an explicit language switch stored
in `localStorage` wins, otherwise the browser's preferred languages decide
(Russian-reading locales go to `/ru`, everything else to `/en`). Without
JavaScript it shows plain language links. Each language has `start`, `download`,
`docs` (with page paths), `reference`, `builder`, `mock-subs`, `report`, `gallery` and
`motion` routes. Report, mock subscriptions and motion are excluded from the
sitemap. The provider builder, reference and documentation share the same routes
and metadata registry. The report page shows a bilingual coming-soon placeholder.

The manifest builder lives in `shared/provider/builder/`: types, enums and limits
come from `public/schemas/provider-config.schema.json`, and `form.ts` adds only
labels, help, grouping and order (`npm run builder:test` keeps both in step). The
app's parser is `public/runtime/kernel.js`, copied from the app build like the
schemas and loaded lazily. The live preview is the app's web build in
`public/runtime/preview/`, git-ignored. Both runtime loads have deadlines and
can be retried without clearing the form. Preview images stay same-origin or
inline; provider image hosts are never requested. The phone preview is a native
modal that contains keyboard focus and restores its trigger on close. Drafts
live only in the compressed URL fragment, with a 1 MiB decoded JSON limit and
bounded nesting; an older save cannot overwrite a newer edit or reset. The workspace
searches field keys and labels in both languages and opens the exact field, card or
label variant. Templates fill only missing fields and never replace existing values
or lists. Undo and redo keep complete draft snapshots in memory, grouping typing
and respecting native text-field undo; the history is capped at 50 entries and an
8 MiB string budget; oversized snapshots are not retained for redo. Fields and sections can be cleared individually. Explicit
empty lists remain distinct from omitted fields. New cards start with valid example
content and can be duplicated with a unique ID; power-label variants can be copied
and reordered. Import results stay visible after the import panel closes, unsupported
file versions are rejected, and the 512 KiB file limit is checked before reading.
Malformed card entries stay in the draft until replaced or removed individually;
editing through a malformed parent repairs its mapping/list container.
`shared/site/gallery.ts` contains
the gallery items; add `src` or `video` to replace a placeholder with local media.
The download page requests release metadata from GitHub only in the browser,
with a ten-minute session cache. File hashing stays on the device.

The provider reference consumes `shared/provider/standard.json`, copied unchanged
from the app repository's generated `provider_standard.g.json`. Bilingual prose
is keyed by field path in `shared/provider/reference.ts`. Refresh the snapshot
when the app standard changes; do not restore the archived header schema.
Provider accent colors use `ReClash-View: app.color:RRGGBB`, not `ReClash-Hex`.
Mock responses, builder output and documentation must agree with that snapshot.
The display-only `test`, `promo` or `dev` badge comes from `provider.type` in the manifest.
Mock import links carry an encoded profile name as well as the subscription URL.
The client reads native response metadata during import, including YAML responses.
FlClashX headers require the app's explicit compatibility mode; they are not
unconditional aliases in the native standard.

`shared/provider/mocks.json` defines seven deliberately different mock subscriptions.
Each record holds an authored manifest (no `version`, no `routing`), the raw
`routing:` YAML, a few standard response headers, a quota and the mihomo body:

- **Halo:** the curated showcase: theme, wallpaper, three cards and power-button captions.
- **Ember Line:** every manifest section except `policy`, eight cards and all eight power-label states.
- **Nimbus:** only `Profile-Title` and two fake nodes; no manifest or quota.
- **Aurora Pass:** a name, light and dark logos and a violet accent.
- **Sentinel Trial:** a nearly exhausted promotional quota, renew and top-up offers,
  reminders, a Global-mode restriction, and support and website links sent as headers.
- **Bastion:** all four `policy` limits, with a `GLOBAL` group that lists a subset of the
  nodes and `tun.exclude-package` in the body, plus apps, transport and support.
- **Atlas:** three auto-routing profiles, two scenarios and group bindings with chips.

Manifest strings may use tokens that `mockManifest` resolves at build time:
`asset:<file>` (under `/assets/mock/`), `origin:<path>`, `host:` (the serving host, so
fallback hosts never point away from the site) and `time:+3d` / `time:-1d` / `time:+12h`
(unix seconds from the start of the current UTC day, emitted as integers). The hosted
file is served at `/mock-config/<key>.yaml`. `npm run mocks:test` validates every
config against the schema and runs it through the app's own parser
(`public/runtime/kernel.js`); `dart run tool/rcx.dart lint` checks the routing in the app repository.

All nodes use loopback addresses with a port and password unique across stands, and the
first select group lists `DIRECT` first so importing a stand does not cut the user's
traffic. All account links are examples. The page, YAML responses, response headers and
pre-import previews share these records. Missing quota metadata is not represented as an
unlimited plan.

`shared/motion/core.ts` contains the original spring presets, integration,
CSS easing simulation and blob geometry without browser dependencies.
`app/motion/` adapts the original interactions to a single lazy scheduler.
`useSiteMotion` mounts the nav, menu, footer and brand theme once per document;
every rendered page gets a child scope that shares the scheduler and disposes
its listeners, observers, animations and timers on the next route. Hero
choreography loads lazily and responds to live reduced-motion changes and
document visibility.

An inline head script (`shared/site/boot.ts`) marks the document before first
paint, applies the saved brand colour and decides between the full and short
loader. The loader grows the three-capsule glyph out of dots and pulses it like
a signal meter, then reveals the page through a mask in the glyph's shape while
page reveals start; it falls back to static content after eight seconds. The
glyph (`app/components/BrandMark.vue`) and the favicon take their colours from
the brand hue, so a recolor moves the logo with the rest of the site. Route
changes run inside a same-document view transition: the old page recedes and
the new one opens from the pointer, while the nav keeps its own layer. Reduced
motion, hidden documents and browsers without the API switch instantly.

The imported motion adapter exposes the following operations within the mounted
page; it does not install global `window.Motion`, `Theme` or `Hero` objects.

| Operation | Behavior |
| --- | --- |
| `spring(value, options)` | Interruptible spring; `to` preserves velocity, `kick` adds impulse, `set` jumps. |
| `presets` | `gentle`, `smooth`, `snappy`, `bouncy`, `jelly`, and near-critical `scroll`. |
| `cssEase` / `installEasings` | Simulate spring physics into CSS `linear()` and duration variables. |
| `magnetGroup` | Shared spring indicator with pointer pull, content pull and sticky selection. |
| `morph` | Spring interpolation between SVG paths with matching command layouts. |
| `blobPath` | Smooth closed path through polar radii. |
| `splitWords` / `reveal` | Word splitting and once-only intersection reveals. |
| `onScroll` / `tick` | Coalesced scroll updates and a shared frame loop that sleeps when idle. |

The home keeps the pinned jelly ring, platform choreography, rotating verb slot,
lineage slabs, scroll-filled setup rail, provider studio, hover blobs and footer
letter springs. Inner pages keep the smaller jelly ring, accordion height
springs, deep-link opening, copy feedback and gallery FLIP filtering. Reduced
motion snaps springs and removes hero pinning.

## Documentation

`/{lang}/docs` is one handbook with a page per Markdown file: provider standard
and RCX auto routing. The source of truth is `docs/` in ReClash:
`docs/manifest.json` sets sections, sidebar groups, slugs and published languages,
and `docs/<lang>/` holds the pages. An unpublished language redirects to English.
English heading IDs are stable across translations; localized anchors remain
aliases. Former `/{lang}/rcx/...` paths and `/{lang}/docs#section` fragments lead
to the new pages.

Refresh the committed snapshot in `content/docs/` from a clean application
checkout (`--draft` accepts uncommitted prose for a local preview only):

```sh
npm run docs:sync -- ../ReClash
npm run docs:diagrams
npm run check
```

`scripts/docs/engine.mjs` validates the inventory against the manifest, heading
parity, links, anchors, code languages and screenshot slots, then compiles each
page into typed blocks through a Vite plugin; Markdown and Mermaid never enter
the browser bundle. Pages and each language's search index load on demand, and
search stays in the browser. Code spans that name a provider header link to the
reference.

Diagrams are content-addressed SVGs in `public/assets/docs/diagrams/`, rendered
by Playwright's Chromium from local modules; the check rejects missing ones.
Install Chromium with `npx playwright install chromium` if needed.

### Screenshot slots

`auto-routing/images/README.md` owns screenshot IDs, dimensions, captions and
capture notes. A slot without an image renders a labelled placeholder. Put the
image at `docs/<lang>/auto-routing/images/<id>.png` in ReClash; `docs:sync`
copies it to `public/assets/docs/screenshots/<lang>/`. Images never fall back to
another language.

## Build and verify

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

`build` generates prerendered HTML in `.output/public`. `generate` runs the same
build. `check` validates TypeScript, builds the site and checks static output,
including the 120 KiB gzip initial JavaScript budget per route. `test:e2e` uses
Wrangler's local Pages server to check navigation, legacy URLs, HTTP headers,
404 responses and responsive rendering. It does not publish a deployment.

Legacy `/{lang}/index.html` and section `.html` URLs proxy to canonical pages.
Pages may normalize these to extensionless paths with a trailing slash. Query
and fragment state survive this normalization; Nuxt aliases also support client navigation.
Home and its `index.html` alias share one generated file. Unknown routes return
404. Reports use document navigation, no-prefetch, CSP with `connect-src 'none'`,
no-referrer and no-store on canonical and legacy URLs. Private sections are
noindex and excluded from the sitemap.

## Cloudflare Pages

GitHub Actions in `.github/workflows/ci.yml` owns production deployments to
https://reclash.pages.dev. Every push and pull request runs TypeScript, static
output and Chromium browser checks. Only a successful push to `main`, or a
manual workflow run on `main`, can deploy. Pull requests and other branches
never publish external previews.

The deployment job downloads the exact static artifact produced by the verified
job and uses the lockfile-pinned Wrangler to upload it with the repository's
`functions/`. The mock subscription content-negotiation function must ship along
with `_headers`, `_redirects`, `robots.txt` and `sitemap.xml`. A deployment marker
records the commit; post-deployment checks wait for that commit and verify both
languages, report privacy headers, mock YAML/HTML negotiation and 404 responses.
Failed checks fail the workflow; they do not automatically roll back production.

Repository configuration:

| Setting | Value |
| --- | --- |
| Actions secret `CLOUDFLARE_API_TOKEN` | API token with Account / Cloudflare Pages / Edit, scoped to the target account |
| Account ID | `2adf62c1e0b34e7455eabdde6ee1c817` (workflow) |
| Pages project / production branch | `reclash` / `main` |
| Node.js version | `.node-version` |
| Build origin | `NUXT_PUBLIC_SITE_ORIGIN=https://reclash.pages.dev` (workflow) |
| GitHub environment | `production` |

Set the token without putting it in shell history or committing it:

```sh
gh secret set CLOUDFLARE_API_TOKEN --repo Hoxiee/reclash-site
```

Disable Cloudflare's Git-triggered production and preview builds for this project:
GitHub Actions is the sole publisher, so an old dashboard build cannot overwrite
its deployment. Keep the existing Pages project and deployment history. The
obsolete dashboard build command is not used by Direct Upload.

To publish again, rerun the CI workflow on `main` from GitHub Actions or run
`gh workflow run ci.yml --repo Hoxiee/reclash-site --ref main`.
For an emergency rollback, select a previous successful production deployment
in the Cloudflare Pages dashboard. The next successful `main` deployment replaces
that rollback.

`wrangler.toml` sets the project name and static output directory. Environment
variables affecting static pages must be set before the build. No Cloudflare
credential is included in the build artifact or exposed to pull request code.

Cloudflare documentation:
[Nuxt](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nuxt-site/),
[build image](https://developers.cloudflare.com/pages/configuration/build-image/),
[headers](https://developers.cloudflare.com/pages/configuration/headers/),
[redirects](https://developers.cloudflare.com/pages/configuration/redirects/).

The previous site remains on `archive/current-site-2026-10-19`.
