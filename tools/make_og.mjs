/* Renders the Open Graph card — one per language — into assets/img/.

   It is drawn in the browser rather than with a rasteriser because the site's
   display face is a self-hosted woff2 that is not installed on this machine:
   only something that can read @font-face can set the wordmark in Unbounded.
   Run it after ./build.py, then run ./build.py again to copy the result in. */
import { chromium } from './playwright.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const IMG = path.join(ROOT, 'assets', 'img');
const W = 1200;
const H = 630;

const COPY = {
  ru: {
    file: 'og.png',
    eyebrow: 'форк flclash · ядро mihomo · gpl-3.0',
    lines: ['ВАШ ТРАФИК', '— ВАШИ', 'ПРАВИЛА'],
    lede: 'Клиент mihomo со встроенным обходом DPI, живой темой от провайдера и настройками, которые не приходится искать.',
  },
  en: {
    file: 'og-en.png',
    eyebrow: 'a fork of flclash · mihomo core · gpl-3.0',
    lines: ['YOUR TRAFFIC', 'IS YOURS', 'TO ROUTE'],
    lede: 'A mihomo client with built-in DPI bypass, a live provider theme and settings you do not have to hunt for.',
  },
};

/* The three strokes of the mark, verbatim from assets/img/logo-mark.svg. */
const MARK = `<svg viewBox="0 0 512 512" aria-hidden="true">
  <defs><linearGradient id="og" x1="106" y1="95" x2="398" y2="417" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#7C5CFF"/><stop offset=".52" stop-color="#3686ED"/><stop offset="1" stop-color="#2FD3B6"/>
  </linearGradient></defs>
  <g fill="none" stroke="url(#og)" stroke-width="62.1" stroke-linecap="round">
    <path d="M137.3,225.8 L184.5,355.5"/><path d="M208.8,126.3 L303.2,385.7"/><path d="M335.3,178.1 L366.7,264.6"/>
  </g>
</svg>`;

function card(c) {
  const head = c.lines
    .map((l, i) => `<span class="hl${i === 2 ? ' grad' : ''}" style="--i:${i}">${l}</span>`)
    .join('');
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<link rel="stylesheet" href="assets/css/fonts.css">
<style>
  :root{
    --violet:#7c5cff; --blue:#3686ed; --cyan:#2fd3b6; --amber:#ffd45f;
    /* Kept in step with base.css :root by hand — the card is rendered from a
       standalone document, so it cannot import the site's tokens. */
    --ink:#0d090f; --line:#453a4e;
    --text:#f1eaf2; --text-dim:#baaabf; --text-faint:#9b88a1;
    --tan:0.36397;
  }
  *{box-sizing:border-box;margin:0}
  html,body{width:${W}px;height:${H}px}
  body{
    background:var(--ink); color:var(--text);
    font-family:'Onest',system-ui,sans-serif;
    position:relative; overflow:hidden;
    display:grid; grid-template-columns:minmax(0,1fr) 258px;
    align-items:center; gap:44px;
    padding:64px 68px;
  }
  /* the same two glows that sit behind the hero */
  .glow{position:absolute;pointer-events:none;aspect-ratio:1;border-radius:50%}
  .glow--v{width:720px;right:-190px;top:-260px;
    background:radial-gradient(closest-side,rgba(124,92,255,.34),transparent 70%)}
  .glow--c{width:560px;left:-180px;bottom:-300px;
    background:radial-gradient(closest-side,rgba(47,211,182,.22),transparent 70%)}
  /* faint hatch on the logo's own 20 degrees, so the empty half is not a hole */
  .hatch{position:absolute;inset:0;pointer-events:none;opacity:.5;
    background:repeating-linear-gradient(70deg,transparent 0 68px,rgba(69,58,78,.6) 68px 69px)}
  /* the two corner slugs read as a pair and give the empty bottom band a job */
  .foot{position:absolute;bottom:40px;font-family:'JetBrains Mono',monospace;
    font-size:13px;letter-spacing:.1em;color:var(--text-faint);
    display:flex;align-items:center;gap:11px}
  .foot--l{left:68px} .foot--r{right:68px}
  /* the only amber on the card: one hard diagonal tick, on the logo's angle */
  .foot i{width:3px;height:15px;background:var(--amber);transform:skewX(-20deg);flex:none}
  .col{position:relative;min-width:0}
  .eyebrow{
    font-family:'JetBrains Mono',monospace; font-size:15px; letter-spacing:.19em;
    text-transform:uppercase; color:var(--text-faint);
    display:flex; align-items:center; gap:12px; margin-bottom:26px;
  }
  .eyebrow i{width:7px;height:7px;background:var(--violet);transform:rotate(45deg);flex:none}
  h1{
    font-family:'Unbounded',sans-serif; font-weight:800; font-size:80px;
    line-height:.86; letter-spacing:-.045em; text-transform:uppercase;
    display:flex; flex-direction:column; align-items:flex-start;
  }
  /* each line steps right by tan(20deg) x line-height, as on the site */
  .hl{display:block;white-space:nowrap;margin-left:calc(var(--i) * var(--tan) * .86em)}
  .grad{background:linear-gradient(96deg,var(--violet) 8%,var(--blue) 48%,var(--cyan) 92%);
    -webkit-background-clip:text;background-clip:text;color:transparent}
  .lede{margin-top:26px;max-width:37ch;font-size:21px;line-height:1.45;color:var(--text-dim)}
  .chips{display:flex;gap:9px;margin-top:30px;font-family:'JetBrains Mono',monospace;
    font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint)}
  .chips span{border:1px solid var(--line);padding:5px 10px}
  .mark{position:relative;display:grid;place-items:center;width:258px;aspect-ratio:1}
  .mark svg{width:100%;height:100%;overflow:visible;position:relative}
  .mark .halo{position:absolute;inset:12%;border-radius:50%;filter:blur(16px);
    background:radial-gradient(closest-side,rgba(124,92,255,.4),transparent 72%)}
</style></head><body>
<div class="glow glow--v"></div><div class="glow glow--c"></div>
<div class="hatch"></div>
<div class="col">
  <p class="eyebrow"><i></i>${c.eyebrow}</p>
  <h1>${head}</h1>
  <p class="lede">${c.lede}</p>
  <p class="chips"><span>Windows</span><span>macOS</span><span>Linux</span><span>Android</span></p>
</div>
<div class="mark"><span class="halo"></span>${MARK}</div>
<p class="foot foot--l"><i></i>reclash://install-config</p>
<p class="foot foot--r">github.com/Hoxiee/ReClash</p>
</body></html>`;
}

if (!fs.existsSync(path.join(DIST, 'assets', 'css', 'fonts.css'))) {
  console.error('run ./build.py first — the card loads the built fonts.css');
  process.exit(1);
}

const tmp = path.join(DIST, '_og.html');
const browser = await chromium.launch();
try {
  for (const [lang, c] of Object.entries(COPY)) {
    fs.writeFileSync(tmp, card(c), 'utf-8');
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.goto('file://' + tmp);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);

    /* Two ways this card can go wrong without anyone noticing: the headline
       runs past the frame and the social preview crops it, or a decorative
       diagonal lands on top of the text. Both are cheap to assert. */
    const bad = await page.evaluate(() => {
      const out = [];
      const h = document.querySelector('h1');
      const over = Math.round(h.scrollWidth - h.clientWidth);
      if (over > 2) out.push(`headline overflows the card by ${over}px`);

      const text = [...document.querySelectorAll('.eyebrow, h1, .lede, .chips, .foot')];
      for (const el of text) {
        const r = el.getBoundingClientRect();
        if (r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight) {
          out.push(`${el.className || el.tagName} leaves the frame`);
        }
      }
      const hit = (a, b) =>
        a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      for (const d of document.querySelectorAll('.foot i')) {
        const dr = d.getBoundingClientRect();
        for (const el of text) {
          if (el.contains(d)) continue;
          if (hit(dr, el.getBoundingClientRect())) out.push(`accent overlaps ${el.className}`);
        }
      }
      return out;
    });
    if (bad.length) {
      bad.forEach((m) => console.error(`${lang}: ${m}`));
      process.exitCode = 1;
    }

    const out = path.join(IMG, c.file);
    await page.screenshot({ path: out });
    await page.close();
    console.log(`${c.file}  ${W}x${H}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  }
} finally {
  await browser.close();
  fs.rmSync(tmp, { force: true });
}
