# ReClash site

The ReClash website: a bilingual (ru/en) Nuxt 4 static site on Cloudflare Pages,
served at https://reclash.pages.dev.

## Development

Node.js from `.node-version`.

```sh
npm ci
npm run dev
```

Keep this checkout at `../reclash-site/` beside the `ReClash/` app checkout; the
repositories are committed and deployed independently.

## What lives where

- `content/docs/`: snapshot of the app's `docs/`, refreshed with
  `npm run docs:sync -- ../ReClash` and `npm run docs:diagrams`. Do not edit by hand.
- `shared/provider/standard.json`, `public/schemas/`, `public/runtime/kernel.js`:
  copied from the app (`node ../ReClash/tool/site_docs.mjs --sync`, `--check` to verify).
- `shared/provider/builder/`: the manifest builder; types come from the schema,
  `form.ts` adds only labels and layout (`npm run builder:test`).
- `shared/provider/mocks.json`: the seven mock subscriptions behind `/mock-subs`,
  `/mock/<key>` and `/mock-config/<key>.yaml`. Nodes are loopback, links are examples.
  `npm run mocks:test` checks every manifest against the schema and the app's parser.
- `app/motion/`, `shared/motion/`: spring motion, the loader and route transitions.

## Verify

```sh
npm run check      # typecheck, build, static output and the 120 KiB JS budget per route
npm run test:e2e   # Playwright against a local Wrangler Pages server
```

## Deploy

`.github/workflows/ci.yml` is the only publisher: a green push to `main` (or a manual
run on `main`) uploads the verified build with `functions/`, then checks the live site.
It needs the `CLOUDFLARE_API_TOKEN` Actions secret; Cloudflare's own Git builds stay off.
Roll back from the Pages dashboard.
