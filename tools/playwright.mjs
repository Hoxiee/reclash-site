/* The site itself needs no npm, so there is no node_modules to import from.
   Playwright lives wherever npx cached it — find a copy whose browser was
   actually downloaded, since several cached copies may exist without one. */
import { createRequire } from 'node:module';
import { globSync } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';

function load() {
  const req = createRequire(import.meta.url);
  try {
    const pw = req('playwright');
    if (fs.existsSync(pw.chromium.executablePath())) return pw;
  } catch {}
  const home = process.env.HOME || '';
  const cands = [
    process.env.PLAYWRIGHT_PATH,
    ...globSync(home + '/.npm/_npx/*/node_modules/playwright/package.json'),
    ...globSync(home + '/.npm-global/lib/node_modules/playwright/package.json'),
  ].filter(Boolean);
  for (const c of cands.reverse()) {
    try {
      const pw = createRequire(c)(path.dirname(c));
      if (fs.existsSync(pw.chromium.executablePath())) return pw;
    } catch {}
  }
  throw new Error('playwright not found; run: npx playwright@latest install chromium');
}

export const { chromium } = load();
