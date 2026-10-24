# ReClash

A bilingual Nuxt 4 site generated for Cloudflare Pages. The home, quick start,
download, gallery and draft header builder port the supplied static site, with
English translations of the same content. Fonts and styles are hosted locally.

## Local development

Use Node.js 24.22.1 (pinned in `.node-version`) or a newer version supported by
Nuxt. Install dependencies using the lockfile:

```sh
npm ci
npm run dev
```

The root page redirects before first paint: an explicit language switch stored
in `localStorage` wins, otherwise the browser's preferred languages decide
(Russian-reading locales go to `/ru`, everything else to `/en`). Without
JavaScript it shows plain language links. Each language has `start`,
`download`, `docs`, `reference`, `builder`, `mock-subs`, `report`, `gallery`
and `motion` sections; report and motion keep their placeholders. The builder
shares the site shell and developer tabs, emits raw headers and nginx lines,
and colours only its preview card. Gallery media retain their eight placeholders.
Routes live in `shared/site/routes.ts`; SEO lives in `shared/site/seo.ts` and
`app/composables/usePageMeta.ts`.

`shared/provider/builder.ts` contains the imported field schema, validation and
emitters. Preview quotas are sample values. `shared/site/gallery.ts` contains
the gallery items; add `src` or `video` to replace a placeholder with local media.
The download page requests release metadata from GitHub only in the browser,
with a ten-minute session cache. File hashing stays on the device.

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

Configure the existing Pages project with these build settings:

| Setting | Value |
| --- | --- |
| Framework preset | None (static Nuxt generation) |
| Root directory | Repository root |
| Build command | `npm run build` |
| Build output directory | `.output/public` |
| Node.js version | `24.22.1`, read from `.node-version` |
| `NUXT_PUBLIC_SITE_ORIGIN` | `https://reclash.pages.dev` or the production origin |

The v3 build image reads `.node-version`. If `NODE_VERSION` is already set in the
Pages dashboard, set it to the same version or remove the override.
`wrangler.toml` sets the Pages project name and output directory. The generated
`_headers`, `_redirects`, `robots.txt` and `sitemap.xml` must ship with the output.
Environment variables affecting static pages must be set before the build.

Cloudflare documentation:
[Nuxt](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nuxt-site/),
[build image](https://developers.cloudflare.com/pages/configuration/build-image/),
[headers](https://developers.cloudflare.com/pages/configuration/headers/),
[redirects](https://developers.cloudflare.com/pages/configuration/redirects/).

The previous site remains on `archive/current-site-2026-10-19`.
