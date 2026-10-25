/* Site wiring for ReClash. Everything here is progressive: without JS the page is complete. */
const query = (root) => [(s, r = root) => r.querySelector(s), (s, r = root) => Array.from(r.querySelectorAll(s))];

function magnetGroups(scope, M, groups) {
  for (const g of groups) {
    const api = M.magnetGroup(g, {
      items: g.dataset.items || '[data-mg]',
      sticky: g.hasAttribute('data-sticky'),
      contentPull: +(g.dataset.cpull ?? 0.08),
    });
    g._mg = api;
    const sel = g.querySelector('[aria-current="true"], [aria-current="page"], [aria-pressed="true"]');
    if (sel && g.hasAttribute('data-sticky')) scope.frame(() => api.select(sel));
  }
  document.fonts?.ready.then(() => !scope.disposed && groups.forEach((g) => g._mg?.refresh()));
}

/* The brand glyph's capsules on springs: 0.8 is the drawn length, 0 a dot, 1 the longest stretch. */
function glyphBars(scope, M, svg) {
  const bars = $all(svg, '.bm-bar').map((path) => {
    const s = M.spring(0.8, { preset: 'jelly', precision: 0.001 });
    s.onUpdate = (v) => {
      const l = M.clamp(v, 0.0001, 1);
      path.style.strokeDasharray = `${l.toFixed(4)} 2`;
      path.style.strokeDashoffset = (-(1 - l) / 2).toFixed(4);
    };
    return s;
  });
  return {
    bars,
    /** A ripple from the short capsule to the long one: each dips, then overshoots and settles. */
    wave(strength = 1) {
      bars.forEach((s, i) => scope.timeout(() => s.kick(-4.2 * strength), i * 70));
    },
  };
}
const $all = (root, s) => Array.from(root.querySelectorAll(s));

/* Helpers shared by the chrome and every page. */
export function createHelpers(scope, M) {
  'use strict';
  const helpers = {};
  const EASE = {
    bouncy: M.cssEase('bouncy'),
    smooth: M.cssEase('smooth'),
    gentle: M.cssEase('gentle'),
  };

  /* FLIP-style width morph on a spring: buttons stretch to their new label */
  function morphWidth(el, mutate, ease = EASE.bouncy) {
    const w0 = el.getBoundingClientRect().width;
    mutate();
    const w1 = el.getBoundingClientRect().width;
    if (M.reduced || Math.abs(w1 - w0) < 1) return;
    scope.animate(el, [{ width: w0 + 'px' }, { width: w1 + 'px' }], { duration: ease.duration, easing: ease.easing });
  }
  helpers.morphWidth = morphWidth;

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      if (scope.disposed) return false;
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) {}
      ta.remove();
      return ok;
    }
  }
  helpers.copyText = copyText;
  return helpers;
}

/* Nav, menu and footer: mounted once, they survive route changes. */
export function initChrome(scope, M, Theme, t, helpers) {
  'use strict';
  const [$, $$] = query(scope.root);
  const parts = ['.nav', '.menu', '.foot'].map((s) => $(s)).filter(Boolean);
  magnetGroups(scope, M, parts.flatMap((part) => $$('[data-group]', part)));
  /* ---------- nav: hides going down, returns going up ---------- */
  const nav = $('.nav');
  let lastY = scrollY;
  M.onScroll((y) => {
    if (!nav || document.documentElement.classList.contains('menu-open')) return;
    const down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > 160) nav.classList.add('is-hidden');
    else if (up || y < 160) nav.classList.remove('is-hidden');
    if (down || up) lastY = y;
  });

  /* ---------- nav glyph: the capsules ripple on hover, on every route and on a recolor ---------- */
  const navGlyph = $('.nav .bm') && glyphBars(scope, M, $('.nav .bm'));
  const logo = $('.nav .logo');
  if (navGlyph && logo) {
    scope.listen(logo, 'pointerenter', (e) => e.pointerType === 'mouse' && navGlyph.wave());
    scope.listen(logo, 'focus', () => navGlyph.wave(0.7));
    scope.listen(window, 'brandchange', () => navGlyph.wave(1.3));
  }

  /* dropdown */
  for (const dd of $$('.dd')) {
    const btn = $('button', dd);
    let closeTimer = 0;
    const set = (open) => {
      scope.clearTimeout(closeTimer);
      dd.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
    };
    scope.listen(btn, 'click', () => set(!dd.classList.contains('is-open')));
    scope.listen(dd, 'pointerenter', (e) => e.pointerType === 'mouse' && set(true));
    scope.listen(dd, 'pointerleave', (e) => { if (e.pointerType === 'mouse') closeTimer = scope.timeout(() => set(false), 160); });
    scope.listen(dd, 'keydown', (e) => { if (e.key === 'Escape') { set(false); btn.focus(); } });
    scope.listen(dd, 'focusout', (e) => { if (!dd.contains(e.relatedTarget)) set(false); });
    scope.listen(document, 'click', (e) => { if (!dd.contains(e.target)) set(false); });
  }

  /* burger → full-screen menu that grows out of the button */
  const burger = $('.burger');
  const menu = $('.menu');
  let menuApi = null;
  if (burger && menu) {
    const path = $('path', burger);
    const morph = M.morph(path, 'bouncy');
    const OPEN = 'M6 6L18 18M6 18L18 6', SHUT = 'M4 8L20 8M4 16L20 16';
    $$('a', menu).forEach((a, i) => a.style.setProperty('--i', i));
    const set = (open) => {
      const r = burger.getBoundingClientRect();
      menu.style.setProperty('--ox', r.left + r.width / 2 + 'px');
      menu.style.setProperty('--oy', r.top + r.height / 2 + 'px');
      menu.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('menu-open', open);
      document.documentElement.style.overflow = open ? 'hidden' : '';
      burger.setAttribute('aria-expanded', open);
      menu.inert = !open;
      morph.to(open ? OPEN : SHUT);
      if (open) scope.timeout(() => $('a', menu)?.focus({ preventScroll: true }), 120);
    };
    menu.inert = true;
    menuApi = { set, isOpen: () => menu.classList.contains('is-open') };
    scope.listen(burger, 'click', () => set(!menu.classList.contains('is-open')));
    scope.listen(menu, 'click', (e) => e.target.closest('a') && set(false));
    scope.listen(window, 'keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); burger.focus(); } });
  }

  /* ---------- footer wordmark: letters and the glyph's capsules stretch toward the pointer ---------- */
  const wm = $('.wordmark');
  if (wm && !M.reduced) {
    const text = $('.wordmark-text', wm);
    const letters = Array.from(text.textContent.trim());
    text.replaceChildren(...letters.map(c => { const span = document.createElement('span'); span.textContent = c; return span; }));
    const spans = $$('span', text);
    const glyph = $('.bm', wm) && glyphBars(scope, M, $('.bm', wm));
    const S = spans.map((sp) => {
      const s = M.spring(1, { preset: 'jelly', precision: 0.001 });
      s.onUpdate = (v) => { sp.style.transform = `scaleY(${v.toFixed(4)}) scaleX(${(1 - (v - 1) * 0.25).toFixed(4)})`; };
      return s;
    });
    const foot = wm.closest('footer');
    scope.listen(foot, 'pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      spans.forEach((sp, i) => {
        const r = sp.getBoundingClientRect();
        const d = e.clientX - (r.left + r.width / 2);
        const near = Math.exp(-(d * d) / (2 * 110 * 110));
        const vert = M.clamp(1 - Math.abs(e.clientY - r.bottom) / 520, 0, 1);
        S[i].to(1 + 0.32 * near * vert);
      });
      if (glyph) {
        const r = wm.firstElementChild.getBoundingClientRect();
        const d = e.clientX - (r.left + r.width / 2);
        const near = Math.exp(-(d * d) / (2 * 160 * 160)) * M.clamp(1 - Math.abs(e.clientY - r.bottom) / 520, 0, 1);
        // the capsule nearest the pointer reaches furthest, like a meter following a voice
        glyph.bars.forEach((bar, i) => bar.to(0.8 + 0.2 * near * (1 - Math.abs(M.clamp((d + 60) / 60, 0, 2) - i) * 0.35)));
      }
    });
    scope.listen(foot, 'pointerleave', () => { S.forEach((s) => s.to(1)); glyph?.bars.forEach((bar) => bar.to(0.8)); });
  }

  /* footer: year */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  /* Route changes keep the chrome: close overlays, show the nav and move sticky indicators. */
  return {
    route() {
      if (menuApi?.isOpen()) menuApi.set(false);
      for (const dd of $$('.dd.is-open')) { dd.classList.remove('is-open'); $('button', dd)?.setAttribute('aria-expanded', 'false'); }
      nav?.classList.remove('is-hidden');
      navGlyph?.wave(0.8);
      scope.frame(() => {
        for (const g of parts.flatMap((part) => $$('[data-group][data-sticky]', part))) {
          g._mg?.select(g.querySelector('[aria-current="true"], [aria-current="page"], [aria-pressed="true"]'));
        }
      });
    },
  };
}

/* Page content: reveals, home sections and tools. Runs in the page's own scope. */
export function initSite(scope, M, Theme, t, helpers) {
  'use strict';
  const [$, $$] = query(scope.root);
  const EASE = { bouncy: M.cssEase('bouncy') };
  const { morphWidth, copyText } = helpers;
  magnetGroups(scope, M, $$('[data-group]'));

  /* ---------- reveals ---------- */
  $$('[data-words]').forEach((el) => M.splitWords(el));
  M.reveal('[data-words], [data-fade], [data-reveal]');

  /* ---------- lineage: three slabs stack up, list hover lifts its slab ---------- */
  const stack = $('.stack');
  if (stack) {
    const slabs = $$('.slab', stack).map((g) => {
      const s = { g, y: M.spring(-90, { preset: 'bouncy', precision: 0.05 }), o: M.spring(0, { preset: 'smooth', precision: 0.004 }), lift: 0 };
      const draw = () => { g.style.transform = `translateY(${(s.y.x - s.lift).toFixed(2)}px)`; g.style.opacity = s.o.x.toFixed(3); };
      s.y.onUpdate = draw; s.o.onUpdate = draw; s.draw = draw;
      draw();
      return s;
    });
    M.reveal([stack], () => {
      slabs.forEach((s, i) => scope.timeout(() => { s.o.to(1); s.y.to(0); }, i * 170));
    }, { threshold: 0.35 });
    const lifts = slabs.map((s) => { const sp = M.spring(0, { preset: 'jelly', precision: 0.05 }); sp.onUpdate = (v) => { s.lift = v; s.draw(); }; return sp; });
    $$('.stack-list li', stack).forEach((li) => {
      const i = +li.dataset.layer;
      const on = () => { lifts[i].to(16); };
      const off = () => lifts[i].to(0);
      scope.listen(li, 'pointerenter', on);
      scope.listen(li, 'pointerleave', off);
      scope.listen(li, 'focusin', on);
      scope.listen(li, 'focusout', off);
    });
  }

  /* ---------- setup steps: the rail fills with scroll, steps light up as it passes ---------- */
  const steps = $('.steps');
  if (steps) {
    const items = $$('.step', steps);
    const P = M.spring(0, { preset: 'scroll', precision: 0.0005 });
    P.onUpdate = (p) => {
      steps.style.setProperty('--p', p.toFixed(4));
      const rr = steps.getBoundingClientRect();
      const top = rr.top + 22, len = rr.height - 44;
      items.forEach((st) => {
        const n = $('.step-n', st).getBoundingClientRect();
        const at = (n.top + n.height / 2 - top) / len;
        st.classList.toggle('is-on', p >= at - 0.02);
      });
    };
    M.onScroll(() => {
      const r = steps.getBoundingClientRect();
      const line = innerHeight * 0.62;
      P.to(M.clamp((line - r.top) / r.height, 0, 1));
    });
  }

  /* ---------- import-link builder ----------
     The link rebuilds on every keystroke and only the changed characters pop in. While the field
     is empty and idle, a demo types sample links into a ghost layer and builds them the same way;
     it never touches the input's value and stops the moment the visitor focuses or types. */
  const imp = $('#importer');
  if (imp) {
    const input = $('input', imp);
    const ghost = $('.imp-ghost', imp);
    const btn = $('.copy-btn', imp);
    const label = $('.btn-label', btn);
    const out = $('.out', imp);
    const hl = $('code .hl', out);
    const cap = $('.out .lbl', imp);
    const state = $('.out-state span', imp);
    const status = $('[data-imp-status]', imp);
    const err = $('.err', imp);
    const build = (u) => 'reclash://install-config?url=' + encodeURIComponent(u);
    const sampleText = hl.textContent;
    const samples = ['https://sub.example/link/abc123', 'https://panel.example.net/s/9fK2', 'https://vpn.example/api/sub?id=7'];
    let shown = sampleText;

    // Cuts the rendered link back to the shared prefix, then appends the new tail as animated tokens.
    const render = (enc, animate = true) => {
      let same = 0;
      while (same < shown.length && same < enc.length && shown[same] === enc[same]) same++;
      if (!animate || M.reduced) { hl.textContent = enc; shown = enc; return; }
      let left = same;
      for (const node of Array.from(hl.childNodes)) {
        const len = node.textContent.length;
        if (left >= len) { left -= len; continue; }
        if (left > 0) node.replaceWith(node.textContent.slice(0, left));
        else node.remove();
        left = 0;
      }
      const tokens = enc.slice(same).match(/%[0-9A-F]{2}|[^]/g) || [];
      tokens.forEach((token, i) => {
        const ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = token;
        if (tokens.length > 1) ch.style.animationDelay = Math.min(i, 40) * 14 + 'ms';
        hl.append(ch);
      });
      shown = enc;
    };
    const mode = (name) => {
      out.classList.toggle('is-building', name === 'building');
      out.classList.toggle('is-valid', name === 'ready' || name === 'yours');
      state.textContent = {
        sample: t("пример", "sample"),
        building: t("собираем…", "building…"),
        ready: t("готово", "ready"),
        yours: t("готово", "ready"),
        waiting: t("ждём https://", "waiting for https://"),
      }[name];
      cap.textContent = name === 'yours' || name === 'waiting' ? t("Ваша ссылка-импорт", "Your import link") : t("Пример ссылки-импорта", "Example import link");
    };
    const parse = (v) => {
      try { const url = new URL(v); return /^https?:$/.test(url.protocol) && url.hostname ? url : null; } catch (_) { return null; }
    };

    /* demo typing */
    let timer = 0, visible = false, sample = 0, text = '', typed = 0, phase = 'erase';
    const idle = () => !input.value && document.activeElement !== input && !M.reduced;
    const wait = (fn, ms) => { timer = scope.timeout(() => { timer = 0; fn(); }, ms); };
    const stopDemo = () => {
      scope.clearTimeout(timer); timer = 0;
      ghost.textContent = ''; imp.classList.remove('is-typing');
    };
    const step = () => {
      if (!visible || document.hidden || !idle()) { timer = 0; return; }
      imp.classList.add('is-typing');
      if (phase === 'erase') {
        typed = Math.max(0, typed - 2);
        ghost.textContent = text.slice(0, typed);
        ghost.classList.toggle('is-over', ghost.scrollWidth > ghost.clientWidth);
        render(shown.slice(0, Math.max(0, shown.length - 4)));
        mode('building');
        if (typed || shown) return wait(step, 22);
        text = samples[sample++ % samples.length];
        phase = 'type';
        return wait(step, 380);
      }
      typed++;
      ghost.textContent = text.slice(0, typed);
      // A long sample keeps its tail in view, like a real input does.
      ghost.classList.toggle('is-over', ghost.scrollWidth > ghost.clientWidth);
      render(encodeURIComponent(text.slice(0, typed)));
      if (typed < text.length) return wait(step, 38 + Math.random() * 70);
      mode('ready');
      phase = 'erase';
      wait(step, 2600);
    };
    const resume = (delay = 700) => { if (!timer && idle() && visible) wait(step, delay); };
    // The demo shares the gate with page entrances, so it never types under the loader.
    M.whenReady().then(() => {
      if (scope.disposed) return;
      const io = scope.observe((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) resume(900);
      }, { threshold: 0.35 });
      io.observe(imp);
    });
    scope.listen(document, 'visibilitychange', () => { if (!document.hidden) resume(); });
    M.onReduced((reduced) => {
      if (!reduced || input.value) return;
      stopDemo(); render(sampleText, false); mode('sample');
    });

    const fail = (msg) => {
      err.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      if (!M.reduced) scope.animate(input,
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }],
        { duration: 420, easing: 'ease-out' });
    };
    scope.listen(input, 'focus', stopDemo);
    scope.listen(input, 'blur', () => { if (!input.value) { phase = 'erase'; typed = 0; text = ''; resume(1200); } });
    scope.listen(input, 'input', () => {
      err.textContent = ''; input.removeAttribute('aria-invalid');
      stopDemo();
      const v = input.value.trim();
      if (!v) { render(sampleText, false); mode('sample'); return; }
      const url = parse(v);
      render(encodeURIComponent(url && url.href.startsWith(v) ? url.href : v));
      mode(url ? 'yours' : 'waiting');
    });
    const go = async () => {
      const v = input.value.trim();
      if (!v) return fail(t("Вставьте ссылку на подписку — её выдаёт провайдер.", "Paste your subscription link from your provider."));
      let url;
      try { url = new URL(v); } catch (_) { return fail(t("Это не похоже на ссылку. Нужен адрес вида https://…", "This does not look like a link. Use an address starting with https://\u2026")); }
      if (!/^https?:$/.test(url.protocol)) return fail(t("Подойдёт только ссылка, которая начинается с https:// или http://", "The link must start with https:// or http://"));
      render(encodeURIComponent(url.href));
      mode('yours');
      out.classList.remove('flash'); void out.offsetWidth; out.classList.add('flash');
      const ok = await copyText(build(url.href));
      if (scope.disposed) return;
      const done = ok ? t("Скопировано", "Copied") : t("Готово, скопируйте вручную", "Ready: copy it manually");
      status.textContent = done;
      morphWidth(btn, () => { btn.classList.add('is-done'); label.textContent = done; });
      scope.clearTimeout(btn._t);
      btn._t = scope.timeout(() => morphWidth(btn, () => { btn.classList.remove('is-done'); label.textContent = t("Скопировать", "Copy"); }), 2200);
    };
    scope.listen(btn, 'click', go);
    scope.listen(input, 'keydown', (e) => e.key === 'Enter' && go());
  }

  /* ---------- provider studio: one hex recolors the preview and the whole site ---------- */
  const studio = $('#studio');
  if (studio) {
    const sws = $$('.sw[data-hex]', studio);
    const custom = $('.sw-custom', studio);
    const picker = $('input[type=color]', custom);
    const group = $('.swatches', studio);
    const nameIn = $('#svc-name', studio);
    const lines = {
      name: $('[data-line=name] .v', studio),
      hex: $('[data-line=hex] .v', studio),
    };
    const scName = $('.sc-name', studio);
    const scLogo = $('.sc-logo', studio);
    const ripple = $('.ripple', studio);

    const tick = (key) => {
      const l = lines[key]?.closest('.line');
      if (!l) return;
      l.classList.remove('tick'); void l.offsetWidth; l.classList.add('tick');
    };
    const mark = (hex) => {
      let hit = null;
      for (const b of sws) {
        const on = b.dataset.hex === hex;
        b.setAttribute('aria-pressed', on);
        if (on) hit = b;
      }
      custom.setAttribute('aria-pressed', !hit);
      group._mg?.select(hit || custom);
      if (!hit) picker.value = '#' + hex.toLowerCase();
    };
    const splash = (from) => {
      if (M.reduced || !from) return;
      const s = studio.getBoundingClientRect(), f = from.getBoundingClientRect();
      const x = f.left + f.width / 2 - s.left, y = f.top + f.height / 2 - s.top;
      const far = Math.hypot(Math.max(x, s.width - x), Math.max(y, s.height - y));
      ripple.style.left = x - 10 + 'px';
      ripple.style.top = y - 10 + 'px';
      scope.animate(ripple, [{ transform: 'scale(0)', opacity: 0.28 }, { transform: `scale(${far / 10})`, opacity: 0 }],
        { duration: 1000, easing: 'cubic-bezier(.2,.7,.2,1)' });
    };
    const apply = (hex, from) => {
      if (!Theme.set(hex)) return;
      const h = Theme.get();
      lines.hex.textContent = 'app.color:' + h;
      tick('hex');
      mark(h);
      splash(from);
    };
    sws.forEach((b) => scope.listen(b, 'click', () => apply(b.dataset.hex, b)));
    let pickT = 0;
    scope.listen(picker, 'input', () => { scope.clearTimeout(pickT); pickT = scope.timeout(() => apply(picker.value, custom), 40); });
    const reset = $('[data-reset]', studio);
    if (reset) scope.listen(reset, 'click', () => apply(Theme.DEFAULT, sws[0]));

    scope.listen(nameIn, 'input', () => {
      const v = nameIn.value.trim().slice(0, 32) || 'ReClash';
      lines.name.textContent = v;
      scName.textContent = v;
      const first = Array.from(v)[0].toUpperCase();
      if (scLogo.textContent !== first) {
        scLogo.textContent = first;
        if (!M.reduced) scope.animate(scLogo, [{ transform: 'scale(.6) rotate(-12deg)' }, { transform: 'none' }], { duration: EASE.bouncy.duration, easing: EASE.bouncy.easing });
      }
      tick('name');
    });

    lines.hex.textContent = 'app.color:' + Theme.get();
    scope.frame(() => mark(Theme.get()));
  }

  /* ---------- "what next" blobs re-shape on hover ---------- */
  const blobR = (n, r, j) => Array.from({ length: n }, () => r * (1 - j / 2 + Math.random() * j));
  for (const p of $$('.path')) {
    const path = $('.blob path', p);
    if (!path) continue;
    path.setAttribute('d', M.blobPath(75, 75, blobR(8, 52, 0.4)));
    const m = M.morph(path, 'jelly');
    scope.listen(p, 'pointerenter', () => m.to(M.blobPath(75, 75, blobR(8, 64, 0.5))));
    scope.listen(p, 'pointerleave', () => m.to(M.blobPath(75, 75, blobR(8, 50, 0.35))));
  }

}
