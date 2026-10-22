# ReClash

A bilingual Nuxt 4 static site for Cloudflare Pages. This repository contains the
base site shell and placeholder sections. The application uses Vue, TypeScript
and local assets.

## Local development

Use Node.js 24.22.1 (pinned in `.node-version`) or a newer version supported by
Nuxt. Install dependencies using the lockfile:

```sh
npm ci
npm run dev
```

The root page selects a language. `/ru` and `/en` contain the site shell. Each
language has `start`, `download`, `docs`, `reference`, `builder`, `mock-subs`,
`report`, `gallery` and `motion` sections. Page content and tools are placeholders.
Routes live in `shared/site/routes.ts`; SEO lives in `shared/site/seo.ts` and
`app/composables/usePageMeta.ts`.

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
