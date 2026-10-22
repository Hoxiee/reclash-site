# ReClash

Bilingual Nuxt 4 static site with browser-local tools and a dependency-free
TypeScript animation engine.

- Canonical routes are `/ru`, `/en` and each language's `start`, `download`,
  `docs`, `reference`, `builder`, `mock-subs` and `report`. Keep legacy `.html`
  aliases and query/fragment state usable. The lab is `/{lang}/motion`.
- Keep routes and SEO in `shared/site/`; prerender all supported destinations.
  Home and `index.html` share an output file: do not render it twice.
- `shared/provider/` owns the provider standard, header aliases, fields, tokens,
  validation, exports and mock profiles. Do not invent a competing schema.
- Reference, builder, preview and generated mock responses use shared data.
  Sample quotas are not static per-user Remnawave headers.
- Reports stay in browser memory. Never fetch pasted links, upload content,
  store reports, log them or add analytics. Keep decoding and node limits.
- Report canonical and legacy responses need CSP, no-referrer and no-store.
  Use document navigation to enter or leave reports; do not prefetch them.
- Fetch releases only on the download page. Stub the API in browser tests;
  do not download real builds for verification. SHA-256 stays local.
- `shared/motion/` is pure TypeScript. No Vue, DOM or browser globals at import.
- `app/motion/` contains browser adapters; `useMotion` owns component disposal.
  Dispose timers, observers, requests and listeners on unmount.
- Keep one lazy frame scheduler. No idle loops or unbounded particles.
- Respect live reduced-motion changes, visibility, keyboard input and cancellation.
- User-facing copy uses `t("Russian", "English")` in place or bilingual data.
  Render rich content through components, not `v-html`.
- Repository text is English; chat is Russian. No emoji.
- No rotary lever controls, runtime animation libraries, UI kits, remote fonts
  or CDN dependencies. Keep preview themes scoped to the preview.
- Keep 25 KiB gzip motion-core and 120 KiB per-route initial-JS budgets.
  Heavy tools, fixtures and effect demos remain lazy.
- Run `npm run check`, `npm run build` and `npm run test:e2e` before committing.
- Generated output is `.output/public`; do not commit it or test screenshots.
  Keep `_headers` with static output so mocks and report policies work.
- Commits use Conventional Commits, lowercase subject, at most 100 characters.
  Never add a coding-agent co-author trailer. No plans or roadmaps in the repo.
- The old site lives on `archive/current-site-2026-10-19`. Do not change that
  branch or rewrite its history. Do not publish previews externally.
