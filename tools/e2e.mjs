/* Load every page in a real browser: console errors, horizontal overflow,
   contrast-critical rendering, and the interactive bits actually working. */
import { chromium } from './playwright.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PAGES = ['index.html', 'headers.html', 'download.html', 'start.html'];
const LANGS = ['ru', 'en'];
const SIZES = [
  { name: '360', width: 360, height: 780 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];

/* Boxes whose content is allowed to run past their own edges. Both are
   deliberate parts of the diagonal layout and both were confirmed by eye;
   the document-level check below is what keeps them on screen. */
const CLIP_OK = [
  // the headline overhangs its grid column towards the mark
  'h1.hero__title',
  // "ReClash" at display size runs a few px past its footer track, into the gap
  'p.footer__word',
];

const fails = [];
const note = (m) => fails.push(m);

const browser = await chromium.launch();

for (const size of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
  });
  for (const lang of LANGS) {
    for (const file of PAGES) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      page.on('requestfailed', (r) => {
        const u = r.url();
        if (u.startsWith('file://')) errors.push('missing file: ' + u.replace(DIST, ''));
      });

      const url = 'file://' + path.join(DIST, lang, file);
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(450);

      const tag = `${size.name}/${lang}/${file}`;

      // GitHub API is unreachable offline; that failure is the page's own path.
      const real = errors.filter((e) => !/api\.github\.com|Failed to load resource/.test(e));
      if (real.length) note(`${tag}: console ${JSON.stringify(real.slice(0, 3))}`);

      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        const over = de.scrollWidth - de.clientWidth;
        if (over <= 1) return null;
        const bad = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0) return;
          if (r.right > de.clientWidth + 1 || r.left < -1) {
            const cs = getComputedStyle(el);
            if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return;
            if (cs.position === 'fixed' || cs.position === 'absolute') return;
            bad.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);
          }
        });
        return { over, bad: [...new Set(bad)].slice(0, 6) };
      });
      if (overflow) note(`${tag}: horizontal overflow ${overflow.over}px ${JSON.stringify(overflow.bad)}`);

      /* The check above only watches the document scroller, so a heading sliced
         off inside a panel that clips it passes silently. This one asks every
         box whether its own content fits. */
      const clipped = await page.evaluate((ok) => {
        const out = [];
        document.querySelectorAll('body *').forEach((el) => {
          const over = el.scrollWidth - el.clientWidth;
          if (over <= 2 || el.clientWidth === 0) return;
          const cs = getComputedStyle(el);
          if (cs.overflowX !== 'visible') return;
          if (cs.position === 'fixed' || cs.position === 'absolute') return;
          // a wrapper inherits the overflow of the child that causes it, so it is
          // excused only when an allowed descendant accounts for the whole amount
          const excused = ok.some((s) => {
            if (el.matches(s)) return true;
            const d = el.querySelector(s);
            return d && d.scrollWidth - d.clientWidth >= over - 2;
          });
          if (excused) return;
          const cls = (el.className || '').toString().trim().split(/\s+/)[0];
          out.push(`${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} +${over}`);
        });
        return [...new Set(out)].slice(0, 6);
      }, CLIP_OK);
      if (clipped.length) note(`${tag}: content clipped inside its box ${JSON.stringify(clipped)}`);

      // nothing invisible-on-invisible
      // an icon wrapper that lost its box blows the layout apart silently
      const fatIcons = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('svg').forEach((sv) => {
          const q = sv.getBoundingClientRect();
          if (q.width < 90 && q.height < 90) return;
          if (sv.closest('.hero__mark, .phone')) return;
          const p = sv.parentElement;
          out.push(`${p.tagName.toLowerCase()}.${p.className} ${Math.round(q.width)}x${Math.round(q.height)}`);
        });
        return [...new Set(out)].slice(0, 4);
      });
      if (fatIcons.length) note(`${tag}: oversized icon ${JSON.stringify(fatIcons)}`);

      const invisible = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('h1,h2,h3,p,a,li,td,th,label,button,legend').forEach((el) => {
          if (!el.textContent.trim()) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.opacity === '0') return;
          if (cs.color === 'rgba(0, 0, 0, 0)' && !el.className.includes('grad')) {
            out.push(el.tagName + '.' + el.className);
          }
        });
        return out.slice(0, 5);
      });
      if (invisible.length) note(`${tag}: transparent text ${JSON.stringify(invisible)}`);

      await page.close();
    }
  }
  await ctx.close();
}

/* ---------------- interaction probes on the widest viewport ---------------- */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });

for (const lang of LANGS) {
  // ---- builder ----
  {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto('file://' + path.join(DIST, lang, 'headers.html'));
    await page.waitForTimeout(400);

    const initial = await page.textContent('#out-http');
    if (!initial || !/Subscription-Userinfo/i.test(initial)) {
      note(`${lang}/builder: no default output (${JSON.stringify((initial || '').slice(0, 80))})`);
    }

    /* The form is an accordion now: one block open at a time, the rest shut, so
       a field in a shut block is not visible until its <details> is opened. */
    const reveal = (sel) => page.evaluate((s) => {
      const el = document.querySelector(s);
      const det = el && el.closest('details');
      if (det) det.open = true;
    }, sel);

    await reveal('#f_svcname');
    await page.fill('#f_svcname', 'Небула VPN');
    await page.waitForTimeout(200);
    const b64 = await page.textContent('#out-http');
    if (!/ReClash-ServiceName: base64:/.test(b64)) {
      note(`${lang}/builder: non-ASCII name was not Base64-encoded`);
    }

    // plain http and credentials in a URL must surface as hard warnings
    await reveal('#f_support');
    await page.fill('#f_support', 'http://insecure.example');
    await page.waitForTimeout(220);
    let hard = await page.locator('#builder-warnings .warnline--err').count();
    if (hard < 1) note(`${lang}/builder: plain http URL raised no hard warning`);
    await page.fill('#f_support', 'https://user:pw@ok.example/help');
    await page.waitForTimeout(220);
    hard = await page.locator('#builder-warnings .warnline--err').count();
    if (hard < 1) note(`${lang}/builder: credentials in URL raised no hard warning`);
    await page.fill('#f_support', 'https://ok.example/help');
    await page.waitForTimeout(220);
    if (await page.locator('#builder-warnings .warnline--err').count()) {
      note(`${lang}/builder: hard warning stuck after fixing the URL`);
    }

    // widget list rendered
    const wrows = await page.locator('#widget-order .orderitem').count();
    if (wrows !== 15) note(`${lang}/builder: ${wrows} widget rows, expected 15`);

    // preview follows the theme colour
    await reveal('#f_hex');
    await page.fill('#f_hex', 'FF2FD3B6');
    await page.waitForTimeout(250);
    const accent = await page.evaluate(() =>
      getComputedStyle(document.getElementById('pv-phone')).getPropertyValue('--accent').trim());
    if (!accent) note(`${lang}/builder: preview --accent not set`);

    // presets
    for (const p of ['minimal', 'brand', 'full']) {
      await page.click(`[data-preset="${p}"]`);
      await page.waitForTimeout(220);
      const out = await page.textContent('#out-nginx');
      if (!out || out.length < 40) note(`${lang}/builder: preset ${p} produced ${out?.length ?? 0} chars`);
    }

    // every output tab produces something
    for (const k of ['http', 'nginx', 'caddy', 'php', 'go', 'py']) {
      const v = await page.textContent('#out-' + k);
      if (!v || v.trim().length < 20) note(`${lang}/builder: #out-${k} is empty`);
    }

    // header count reported
    const count = await page.textContent('#builder-count');
    if (!count || !/\d/.test(count)) note(`${lang}/builder: no header count`);

    // preview screen switch
    await page.click('[data-pv="proxy"]');
    await page.waitForTimeout(200);
    const screen = await page.innerHTML('#pv-screen');
    if (!screen || screen.length < 50) note(`${lang}/builder: proxy preview empty`);

    if (errs.length) note(`${lang}/builder: pageerror ${JSON.stringify(errs.slice(0, 2))}`);
    await page.close();
  }

  // ---- FAQ + deeplink ----
  {
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(DIST, lang, 'start.html'));
    await page.waitForTimeout(300);

    // A stuck no-js class pins every FAQ answer open, which reads as "the whole
    // section is broken": the +/- toggles but nothing ever collapses. Guard both
    // the class and the collapsed height of a shut item, since an open-only
    // height check passes right through that bug.
    if (await page.evaluate(() => document.documentElement.classList.contains('no-js'))) {
      note(`${lang}/faq: html still carries no-js after load (deferred core.js handshake broke)`);
    }
    const q = page.locator('.faq__q').nth(3);
    const panelId = await q.getAttribute('aria-controls');
    const shut = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().height, panelId);
    if (shut > 10) note(`${lang}/faq: a closed answer is ${shut}px tall, not collapsed`);
    await q.click();
    await page.waitForTimeout(600);
    const open = await q.getAttribute('aria-expanded');
    if (open !== 'true') note(`${lang}/faq: item did not open`);
    const h = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().height, panelId);
    if (h < 20) note(`${lang}/faq: panel height ${h} after opening`);
    await q.click();
    await page.waitForTimeout(600);
    const reshut = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().height, panelId);
    if (reshut > 10) note(`${lang}/faq: answer did not collapse again (${reshut}px)`);

    await page.fill('.deeplink input', 'https://sub.example/x?token=1');
    await page.waitForTimeout(200);
    const out = await page.textContent('.deeplink__out');
    if (!out.startsWith('reclash://install-config?url=')) {
      note(`${lang}/deeplink: got ${JSON.stringify(out)}`);
    }
    await page.close();
  }

  // ---- home: first-run tool + dashboard demo ----
  {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto('file://' + path.join(DIST, lang, 'index.html'));
    await page.waitForTimeout(700);

    /* The landing mounts its own deep-link converter, wired by the same core.js
       code as the one on the quick-start page. It is the section's whole reason
       to exist, so it is probed here and not only there. */
    const sample = await page.textContent('#get-started .deeplink__out');
    if (!/^reclash:\/\/install-config\?url=/.test(sample || '')) {
      note(`${lang}/home: first-run sample link is ${JSON.stringify((sample || '').slice(0, 60))}`);
    }
    await page.fill('#get-started .deeplink input', 'https://sub.example/x?token=1');
    await page.waitForTimeout(200);
    const built = await page.textContent('#get-started .deeplink__out');
    if (built !== 'reclash://install-config?url=' + encodeURIComponent('https://sub.example/x?token=1')) {
      note(`${lang}/home: first-run link got ${JSON.stringify(built)}`);
    }
    if ((await page.getAttribute('#get-started .deeplink', 'data-state')) !== 'ok') {
      note(`${lang}/home: first-run link still marked as the sample after typing`);
    }

    /* Garbage in the field must not silently become a deeplink to nowhere: the
       plate clears and the widget says why. */
    await page.fill('#get-started .deeplink input', 'просто текст');
    await page.locator('#get-started .deeplink [data-make]').click();
    await page.waitForTimeout(200);
    if ((await page.getAttribute('#get-started .deeplink', 'data-state')) !== 'bad') {
      note(`${lang}/home: junk input was accepted as a link`);
    }
    if ((await page.textContent('#get-started .deeplink__out')) !== '') {
      note(`${lang}/home: junk input still produced a link`);
    }
    if (!(await page.textContent('#get-started .deeplink__msg')).trim()) {
      note(`${lang}/home: junk input drew no message`);
    }

    const seenServices = new Set();
    const seenThemes = new Set();
    for (const preset of ['default', 'nebula', 'mono']) {
      await page.click(`[data-demo-preset="${preset}"]`);
      await page.waitForTimeout(120);

      const state = await page.evaluate((key) => {
        const root = document.querySelector('[data-dashboard-demo]');
        const visible = [...root.querySelectorAll('[data-demo-panel]')]
          .filter((panel) => !panel.hidden);
        const pressed = [...root.querySelectorAll('[data-demo-preset]')]
          .filter((button) => button.getAttribute('aria-pressed') === 'true');
        const panel = visible[0];
        const css = panel ? getComputedStyle(panel) : null;
        return {
          visible: visible.map((el) => el.dataset.demoPanel),
          pressed: pressed.map((el) => el.dataset.demoPreset),
          service: panel?.querySelector('[data-demo-service]')?.textContent.trim() || '',
          widgets: panel?.querySelectorAll('[data-widget]').length || 0,
          label: root.querySelector('.live-panel__viewport')?.getAttribute('aria-label') || '',
          status: root.querySelector('[data-demo-status]')?.textContent.trim() || '',
          theme: css ? [
            css.getPropertyValue('--demo-accent').trim(),
            css.getPropertyValue('--demo-ring-a').trim(),
            css.getPropertyValue('--demo-ring-b').trim(),
            css.getPropertyValue('--demo-ring-c').trim(),
          ].join('|') : '',
          key,
        };
      }, preset);
      if (state.visible.length !== 1 || state.visible[0] !== preset) {
        note(`${lang}/home: preset ${preset} visible panels ${JSON.stringify(state.visible)}`);
      }
      if (state.pressed.length !== 1 || state.pressed[0] !== preset) {
        note(`${lang}/home: preset ${preset} pressed buttons ${JSON.stringify(state.pressed)}`);
      }
      if (state.widgets < 3 || state.widgets > 4) {
        note(`${lang}/home: preset ${preset} has ${state.widgets} widgets`);
      }
      if (!state.service || !state.label || !state.status) {
        note(`${lang}/home: preset ${preset} has incomplete accessible state`);
      }
      if (state.theme.split('|').some((value) => !value)) {
        note(`${lang}/home: preset ${preset} has incomplete theme properties`);
      }
      seenServices.add(state.service);
      seenThemes.add(state.theme);
    }
    if (seenServices.size !== 3) note(`${lang}/home: dashboard service names do not vary`);
    if (seenThemes.size !== 3) note(`${lang}/home: dashboard themes do not vary`);

    if (errs.length) note(`${lang}/home: pageerror ${JSON.stringify(errs.slice(0, 2))}`);
    await page.close();
  }

  // ---- masthead burger on mobile ----
  {
    const mob = await browser.newContext({ viewport: { width: 360, height: 780 } });
    const page = await mob.newPage();
    await page.goto('file://' + path.join(DIST, lang, 'index.html'));
    await page.waitForTimeout(300);
    const burger = page.locator('.burger');
    if (await burger.isVisible()) {
      await burger.click();
      await page.waitForTimeout(300);
      const open = await page.getAttribute('.masthead', 'data-open');
      if (open !== 'true') note(`${lang}/mobile: burger did not open the nav`);
      const navVisible = await page.locator('.nav a').first().isVisible();
      if (!navVisible) note(`${lang}/mobile: nav links still hidden after opening`);
    } else {
      note(`${lang}/mobile: burger not visible at 360px`);
    }
    await page.close();
    await mob.close();
  }
}

await ctx.close();
await browser.close();

if (fails.length) {
  console.log(`\nFAILURES (${fails.length}):`);
  fails.forEach((f) => console.log('  -', f));
  process.exit(1);
}
console.log('e2e: all probes passed');
