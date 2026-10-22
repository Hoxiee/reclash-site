/* Page wiring for ReClash. Everything here is progressive: without JS the page is complete. */
export function initSite(scope, M, Theme, t, helpers) {
  'use strict';
  const $ = (s, r = scope.root) => r.querySelector(s);
  const $$ = (s, r = scope.root) => Array.from(r.querySelectorAll(s));

  M.installEasings();
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

  /* ---------- magnet groups ---------- */
  for (const g of $$('[data-group]')) {
    const api = M.magnetGroup(g, {
      items: g.dataset.items || '[data-mg]',
      sticky: g.hasAttribute('data-sticky'),
      pull: +(g.dataset.pull || 0.12),
      contentPull: +(g.dataset.cpull ?? 0.08),
    });
    g._mg = api;
    const sel = g.querySelector('[aria-current="true"], [aria-pressed="true"]');
    if (sel && g.hasAttribute('data-sticky')) scope.frame(() => api.select(sel));
  }
  document.fonts?.ready.then(() => !scope.disposed && $$('[data-group]').forEach((g) => g._mg?.refresh()));

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
    scope.listen(burger, 'click', () => set(!menu.classList.contains('is-open')));
    scope.listen(menu, 'click', (e) => e.target.closest('a') && set(false));
    scope.listen(window, 'keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); burger.focus(); } });
  }

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

  /* ---------- import-link builder ---------- */
  const imp = $('#importer');
  if (imp) {
    const input = $('input', imp);
    const btn = $('.copy-btn', imp);
    const label = $('.btn-label', btn);
    const out = $('.out', imp);
    const code = $('code', out);
    const cap = $('.out .lbl', imp);
    const err = $('.err', imp);
    const build = (u) => 'reclash://install-config?url=' + encodeURIComponent(u);
    const show = (u) => {
      const enc = encodeURIComponent(u);
      const span = document.createElement('span'); span.className = 'hl'; span.textContent = enc;
      code.replaceChildren('reclash://install-config?url=', span);
    };
    const fail = (msg) => {
      err.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      if (!M.reduced) scope.animate(input,
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }],
        { duration: 420, easing: 'ease-out' });
    };
    scope.listen(input, 'input', () => { err.textContent = ''; input.removeAttribute('aria-invalid'); });
    const go = async () => {
      const v = input.value.trim();
      if (!v) return fail(t("Вставьте ссылку на подписку — её выдаёт провайдер.", "Paste your subscription link from your provider."));
      let url;
      try { url = new URL(v); } catch (_) { return fail(t("Это не похоже на ссылку. Нужен адрес вида https://…", "This does not look like a link. Use an address starting with https://\u2026")); }
      if (!/^https?:$/.test(url.protocol)) return fail(t("Подойдёт только ссылка, которая начинается с https:// или http://", "The link must start with https:// or http://"));
      show(url.href);
      cap.textContent = t("Ваша ссылка-импорт", "Your import link");
      out.classList.remove('flash'); void out.offsetWidth; out.classList.add('flash');
      const ok = await copyText(build(url.href));
      if (scope.disposed) return;
      morphWidth(btn, () => { btn.classList.add('is-done'); label.textContent = ok ? t("Скопировано", "Copied") : t("Готово, скопируйте вручную", "Ready: copy it manually"); });
      scope.clearTimeout(btn._t);
      btn._t = scope.timeout(() => morphWidth(btn, () => { btn.classList.remove('is-done'); label.textContent = t("Собрать и скопировать", "Build and copy"); }), 2200);
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
      lines.hex.textContent = h;
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

    lines.hex.textContent = Theme.get();
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

  /* ---------- footer wordmark: letters stretch toward the pointer ---------- */
  const wm = $('.wordmark');
  if (wm && !M.reduced) {
    const letters = Array.from(wm.textContent.trim());
    wm.replaceChildren(...letters.map(c => { const span = document.createElement('span'); span.textContent = c; return span; }));
    const spans = $$('span', wm);
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
    });
    scope.listen(foot, 'pointerleave', () => S.forEach((s) => s.to(1)));
  }

  /* footer: year */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
}
