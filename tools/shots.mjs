/* Screenshots for eyeballing the design: one full-page image per page, plus
   viewport-sized slices, because a 9000px-tall PNG scaled to fit tells you
   nothing about whether the type is the right size.

   usage: node tools/shots.mjs [dist] [outdir] [lang] */
import { chromium } from './playwright.mjs';
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || path.resolve('dist');
const OUT = process.argv[3] || '/tmp/shots';
const LANG = process.argv[4] || 'ru';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const [tag, w, h] of [['desk', 1440, 900], ['phone', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  for (const f of ['index.html', 'builder.html', 'download.html', 'start.html']) {
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(DIST, LANG, f));
    await page.waitForTimeout(700);
    // reveal-on-scroll only fires for what the observer sees, so walk the page
    const tall = await page.evaluate(async () => {
      const step = Math.round(innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 130));
      }
      scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
      return document.documentElement.scrollHeight;
    });
    await page.waitForTimeout(500);

    const name = `${tag}-${f.replace('.html', '')}`;
    await page.screenshot({ path: path.join(OUT, `${name}-full.png`), fullPage: true });

    /* The slices are real scrolled viewports, not crops of the full-page image:
       a full-page capture paints sticky and fixed boxes at their static offset,
       so a pinned sidebar looks like a hole where it scrolled past. */
    const stride = Math.round(h * 0.9);
    let i = 0;
    for (let y = 0; y < tall; y += stride, i++) {
      await page.evaluate((to) => scrollTo(0, to), y);
      await page.waitForTimeout(220);
      await page.screenshot({ path: path.join(OUT, `${name}-${String(i).padStart(2, '0')}.png`) });
      if (y + h >= tall) { i++; break; }
    }
    await page.evaluate(() => scrollTo(0, 0));
    console.log(`${name}  ${tall}px  ${i} slices`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log('shots →', OUT);
