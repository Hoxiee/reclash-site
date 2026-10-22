/* Inner pages: start, download, gallery. Each block runs only if its markup is present. */
export function initPages(scope, M, Theme, t, helpers) {
  'use strict';
  const $ = (s, r = scope.root) => r.querySelector(s);
  const $$ = (s, r = scope.root) => Array.from(r.querySelectorAll(s));

  /* ---------- page ring: small sibling of the hero jelly ---------- */
  const ringSvg = $('.ph-ring');
  if (ringSvg) {
    const path = $('.rg', ringSvg);
    const N = 48, C = 200, R = 128;
    const off = new Float32Array(N), vel = new Float32Array(N), radii = new Float32Array(N);
    let pointer = null, t = 0, visible = true, running = false;
    const draw = (dt) => {
      t += dt;
      let pa = 0, pull = 0;
      if (pointer) {
        const dx = pointer.x - C, dy = pointer.y - C, d = Math.hypot(dx, dy);
        pa = Math.atan2(dy, dx);
        pull = M.clamp((d - R) * 0.3, -18, 26) * (Math.abs(d - R) < 140 ? 1 : 0);
      }
      const n = Math.ceil(dt * 240), h = dt / n;
      for (let s = 0; s < n; s++) {
        for (let i = 0; i < N; i++) {
          const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
          let target = 7 * Math.sin(3 * a + t * 0.6) + 4 * Math.sin(5 * a - t * 0.45);
          if (pull) { const da = Math.atan2(Math.sin(a - pa), Math.cos(a - pa)); target += pull * Math.exp(-(da * da) / 0.2); }
          const l = off[(i - 1 + N) % N], r = off[(i + 1) % N];
          vel[i] += (150 * (target - off[i]) - 10 * vel[i] + 60 * (l + r - 2 * off[i])) * h;
        }
        for (let i = 0; i < N; i++) off[i] += vel[i] * h;
      }
      for (let i = 0; i < N; i++) radii[i] = R + off[i];
      path.setAttribute('d', M.blobPath(C, C, radii));
    };
    const loop = () => {
      if (running || M.reduced || !visible) return;
      running = true;
      M.tick((dt) => { if (!visible || M.reduced) { running = false; return false; } draw(dt); });
    };
    draw(0);
    {
      scope.observe((e) => { visible = e[0].isIntersecting; if (visible) loop(); }).observe(ringSvg);
      const toLocal = (e) => {
        const r = ringSvg.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * 400, y: ((e.clientY - r.top) / r.height) * 400 };
      };
      scope.listen(window, 'pointermove', (e) => { if (e.pointerType !== 'touch') pointer = toLocal(e); }, { passive: true });
      scope.listen(document, 'pointerleave', () => (pointer = null));
      scope.listen(ringSvg, 'click', () => { const ph = Math.random() * 6.28; for (let i = 0; i < N; i++) vel[i] += Math.sin(4 * ((i / N) * 6.28) + ph) * 380; });
      for (let i = 0; i < N; i++) vel[i] = Math.sin(3 * (i / N) * 6.28) * 300; // lands with a wobble
      loop();
      M.onReduced(reduced => { if (reduced) { off.fill(0); vel.fill(0); draw(0); } else loop(); });
    }
  }

  /* ---------- accordion: height on a spring; deep links open their item ---------- */
  for (const acc of $$('[data-acc]')) {
    const items = $$('.acc-item', acc);
    const ctl = new Map();
    for (const it of items) {
      const btn = $('.acc-btn', it), panel = $('.acc-panel', it), body = $('.acc-body', it);
      const s = M.spring(it.hasAttribute('data-open') ? 1 : 0, { preset: 'smooth', precision: 0.002 });
      let full = 0;
      s.onUpdate = (v) => { panel.style.height = v >= 1 && s.target === 1 ? 'auto' : Math.max(0, v * full) + 'px'; };
      const set = (open) => {
        if (open === it.hasAttribute('data-open')) return;
        full = body.getBoundingClientRect().height;
        if (!open) s.set(1);
        it.toggleAttribute('data-open', open);
        btn.setAttribute('aria-expanded', open);
        s.to(open ? 1 : 0);
      };
      scope.listen(btn, 'click', () => set(!it.hasAttribute('data-open')));
      ctl.set(it.id, set);
    }
    const openHash = () => {
      const id = location.hash.slice(1);
      if (!ctl.has(id)) return;
      ctl.get(id)(true);
      scope.timeout(() => document.getElementById(id).scrollIntoView({ block: 'center', behavior: M.reduced ? 'auto' : 'smooth' }), 60);
    };
    scope.listen(window, 'hashchange', openHash);
    openHash();
  }

  /* ---------- copy buttons (deep links, terminal snippets) ---------- */
  for (const b of $$('[data-copy]')) {
    scope.listen(b, 'click', async () => {
      const src = b.dataset.copy.startsWith('#') ? $(b.dataset.copy).innerText : b.dataset.copy;
      const ok = await helpers.copyText(src.trim());
      if (scope.disposed) return;
      b.classList.toggle('is-done', ok);
      const lbl = $('.btn-label', b);
      if (lbl) helpers.morphWidth(b, () => (lbl.textContent = ok ? t("Скопировано", "Copied") : t("Не вышло", "Could not copy")));
      scope.clearTimeout(b._t);
      b._t = scope.timeout(() => {
        b.classList.remove('is-done');
        if (lbl) helpers.morphWidth(b, () => (lbl.textContent = b.dataset.label || t("Копировать", "Copy")));
      }, 1800);
    });
  }

}
