/*
 * Hero choreography.
 *
 * The ring is the provider-themable "hero ring" from the client, rendered as a jelly:
 * 96 radial vertices, each a damped spring coupled to its neighbours (so a poke travels
 * around the ring as a wave). The pointer attracts the surface; a click sends a wobble.
 *
 * Scroll (pinned stage, ~170vh of travel), progress p is a near-critical spring of
 * the raw scroll position — it can lag a little, it can never wobble:
 *   0.00–0.32  headline lines part ways, ring glides to centre and calms into a circle
 *   0.30–0.55  ring thins into an orbit, the four platforms land on it
 *   0.52–0.95  manifesto inside the orbit is read word by word
 */
export function initHero(scope, M, Theme, t, helpers) {
  'use strict';
  const hero = scope.root.querySelector('.hero');
  if (!hero) return;

  const stage = hero.querySelector('.hero-stage');
  const svg = hero.querySelector('.hero-svg');
  const ring = svg.querySelector('.ring');
  const orbit = svg.querySelector('.orbit');
  const ticks = svg.querySelector('.ticks');
  const grad = svg.querySelector('#ringG');
  const glow = hero.querySelector('.hero-glow');
  const copy = hero.querySelector('.hero-copy');
  const lines = Array.from(hero.querySelectorAll('.hl'));
  const cue = hero.querySelector('.hero-cue');
  const nodes = Array.from(svg.querySelectorAll('.pnode'));
  const words = Array.from(hero.querySelectorAll('.hero-manifesto .mw'));
  const manifesto = hero.querySelector('.hero-manifesto');

  /* ---------- geometry ---------- */
  let W = 0, H = 0, R0 = 0, mobile = false;
  function measure() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    mobile = W < 760;
    R0 = mobile ? Math.min(W * 0.4, H * 0.2) : Math.min(W, H) * 0.29;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }

  /* ---------- jelly ---------- */
  const N = 96;
  const off = new Float32Array(N);
  const vel = new Float32Array(N);
  const tgt = new Float32Array(N);
  const radii = new Float32Array(N);
  const K = 150, C = 10, COUPLE = 700;
  let pointer = null; // {x,y} in stage coords
  let time = 0;

  function jellyStep(dt, amp, cx, cy, R) {
    const t = time;
    let pa = 0, pd = 0, pull = 0;
    if (pointer) {
      const dx = pointer.x - cx, dy = pointer.y - cy;
      pd = Math.hypot(dx, dy);
      pa = Math.atan2(dy, dx);
      // attraction only in a band around the surface, strongest right on it
      const band = R * 0.85;
      pull = Math.abs(pd - R) < band ? (pd - R) * 0.32 * (1 - Math.abs(pd - R) / band) : 0;
      pull = M.clamp(pull, -R * 0.12, R * 0.16);
    }
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
      let v = amp * (0.55 * Math.sin(3 * a + t * 0.55) + 0.3 * Math.sin(5 * a - t * 0.42 + 1.3) + 0.15 * Math.sin(2 * a + t * 0.23 + 0.4));
      if (pull) {
        let da = Math.atan2(Math.sin(a - pa), Math.cos(a - pa));
        v += pull * Math.exp(-(da * da) / (2 * 0.32 * 0.32));
      }
      tgt[i] = v;
    }
    const n = Math.ceil(dt * 240), h = dt / n;
    for (let s = 0; s < n; s++) {
      for (let i = 0; i < N; i++) {
        const l = off[(i - 1 + N) % N], r = off[(i + 1) % N];
        const acc = K * (tgt[i] - off[i]) - C * vel[i] + COUPLE * (l + r - 2 * off[i]) / 10;
        vel[i] += acc * h;
      }
      for (let i = 0; i < N; i++) off[i] += vel[i] * h;
    }
  }

  function wobble(strength = 1, at = null) {
    if (M.reduced) return;
    const phase = Math.random() * 6.28;
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
      let k = Math.sin(4 * a + phase);
      if (at !== null) {
        const da = Math.atan2(Math.sin(a - at), Math.cos(a - at));
        k = -Math.exp(-(da * da) / 0.18) * 2.2 + 0.35 * Math.sin(3 * a + phase);
      }
      vel[i] += k * 420 * strength;
    }
  }

  /* ---------- scroll ---------- */
  const P = M.spring(0, { preset: 'scroll', precision: 0.0004 });
  const skew = M.spring(0, { stiffness: 180, damping: 26, precision: 0.01 });
  let lastY = scrollY;
  let lastT = performance.now();
  function rawProgress() {
    const r = hero.getBoundingClientRect();
    const travel = r.height - innerHeight;
    return travel > 0 ? M.clamp(-r.top / travel, 0, 1) : 0;
  }

  /* platform nodes pop with their own bouncy springs */
  const nodeS = nodes.map(() => M.spring(0, { preset: 'bouncy', precision: 0.002 }));
  const ANG_WIDE = [-150, -32, 36, 148].map((d) => (d * Math.PI) / 180);
  const ANG_TALL = [-118, -62, 62, 118].map((d) => (d * Math.PI) / 180); // phones: keep labels on screen

  /* ---------- render ---------- */
  let visible = true;
  let gradA = 0;
  function render(dt) {
    const p = P.x;
    time += dt;

    const e1 = M.smooth(M.range(p, 0, 0.32));
    const e2 = M.smooth(M.range(p, 0.28, 0.56));

    const cx0 = mobile ? W * 0.62 : W * 0.75;
    const cy0 = mobile ? H * 0.99 : H * 0.53;
    const cx = M.lerp(cx0, W / 2, e1);
    const cy = M.lerp(cy0, H / 2, e1);
    // on phones the orbit (1.18R) must stay inside the screen width
    const R = M.lerp(R0, mobile ? W * 0.29 : R0 * 1.24, e1) * M.lerp(1, mobile ? 1 : 1.05, e2);
    const sw = M.lerp(R0 * 0.16, 2.2, M.smooth(M.range(p, 0.08, 0.5)));
    const amp = R0 * 0.055 * (1 - e1);

    if (!M.reduced) jellyStep(dt, amp, cx, cy, R);
    for (let i = 0; i < N; i++) radii[i] = R + off[i] * (1 - e2 * 0.85);
    ring.setAttribute('d', M.blobPath(cx, cy, radii));
    ring.setAttribute('stroke-width', sw.toFixed(2));

    gradA += dt * 14;
    const ga = ((gradA + (pointer ? (pointer.x / W) * 60 : 0)) * Math.PI) / 180;
    grad.setAttribute('x1', (cx + Math.cos(ga) * R).toFixed(1));
    grad.setAttribute('y1', (cy + Math.sin(ga) * R).toFixed(1));
    grad.setAttribute('x2', (cx - Math.cos(ga) * R).toFixed(1));
    grad.setAttribute('y2', (cy - Math.sin(ga) * R).toFixed(1));

    orbit.setAttribute('cx', cx); orbit.setAttribute('cy', cy);
    orbit.setAttribute('r', (R * 1.18).toFixed(1));
    orbit.style.opacity = (0.25 + 0.75 * e2).toFixed(3);
    ticks.setAttribute('cx', cx); ticks.setAttribute('cy', cy);
    ticks.setAttribute('r', (R * 0.82).toFixed(1));
    ticks.style.opacity = (e2 * 0.8).toFixed(3);
    ticks.style.transform = `rotate(${(time * 6).toFixed(2)}deg)`;
    ticks.style.transformOrigin = `${cx}px ${cy}px`;

    glow.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(${(R / 300).toFixed(3)})`;
    glow.style.opacity = (0.95 - 0.45 * e2).toFixed(3);

    // headline: lines part ways, velocity adds a little shear (never more than 5°)
    const sk = M.clamp(skew.x, -5, 5);
    const away = M.easeOut(M.range(p, 0.02, 0.3));
    lines.forEach((ln, i) => {
      const dir = i % 2 ? 1 : -1;
      const x = dir * away * W * (0.18 + i * 0.06);
      ln.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${(sk * (i % 2 ? -1 : 1)).toFixed(2)}deg)`;
    });
    copy.style.opacity = (1 - M.range(p, 0.06, 0.26)).toFixed(3);
    copy.style.visibility = p > 0.3 ? 'hidden' : '';
    if (cue) cue.style.opacity = (1 - M.range(p, 0, 0.06)).toFixed(3);

    // platforms
    const orbitR = R * 1.18;
    nodes.forEach((g, i) => {
      const s = nodeS[i];
      s.to(p > 0.34 + i * 0.045 ? 1 : 0);
      const a = (mobile ? ANG_TALL : ANG_WIDE)[i] + (mobile ? 0 : time * 0.04);
      const x = cx + Math.cos(a) * orbitR, y = cy + Math.sin(a) * orbitR;
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${Math.max(0, s.x).toFixed(3)})`);
      const label = g.querySelector('text');
      const right = Math.cos(a) >= 0;
      label.setAttribute('text-anchor', right ? 'start' : 'end');
      label.setAttribute('x', right ? 16 : -16);
    });

    // manifesto: scrubbed by scroll, word by word
    const n = words.length;
    words.forEach((w, i) => {
      const a = 0.54 + (i / n) * 0.34;
      w.style.setProperty('--o', (0.12 + 0.88 * M.range(p, a, a + 0.06)).toFixed(3));
    });
    manifesto.style.opacity = M.range(p, 0.42, 0.54).toFixed(3);
    manifesto.style.transform = `scale(${M.lerp(0.94, 1, M.smooth(M.range(p, 0.42, 0.7))).toFixed(4)})`;
  }

  /* ---------- verb slot: letters drop in, the pill stretches between word widths ---------- */
  const slot = hero.querySelector('.slot');
  const slotIn = slot?.querySelector('.slot-in');
  const verbs = (slot?.dataset.words || '').split('|').filter(Boolean);
  let verbIdx = 0;
  let measurer = null;
  const slotW = M.spring(0, { stiffness: 260, damping: 16, precision: 0.1 });
  slotW.onUpdate = (v) => { slot.style.width = v.toFixed(1) + 'px'; };

  function wordWidth(word) {
    if (!measurer) {
      measurer = document.createElement('span');
      measurer.className = 'slot slot-measure';
      measurer.setAttribute('aria-hidden', 'true');
      slot.parentElement.append(measurer);
    }
    measurer.textContent = word;
    return measurer.getBoundingClientRect().width;
  }
  function chars(word, cls) {
    return Array.from(word).map((c, i) => {
      const span = document.createElement('span'); span.className = `ch ${cls}`;
      span.style.setProperty('--i', i); span.textContent = c; return span;
    });
  }
  function setVerb(word, animate) {
    const w = wordWidth(word);
    if (!animate || M.reduced) {
      slotIn.replaceChildren(...chars(word, ''));
      slotW.set(w);
      return;
    }
    // old letters fall out
    const old = document.createElement('span');
    old.className = 'slot-out';
    old.setAttribute('aria-hidden', 'true');
    old.replaceChildren(...Array.from(slotIn.childNodes, node => node.cloneNode(true)));
    slot.append(old);
    scope.frame(() => old.querySelectorAll('.ch').forEach((c) => c.classList.add('gone')));
    scope.timeout(() => old.remove(), 900);
    // new letters drop in
    slotIn.replaceChildren(...chars(word, 'from-top'));
    slotIn.getBoundingClientRect();
    scope.frame(() => slotIn.querySelectorAll('.ch').forEach((c) => c.classList.remove('from-top')));
    slotW.to(w);
    slotW.kick(Math.sign(w - slotW.x) * 260);
  }
  let verbTimer = 0;
  function cycle() {
    scope.clearTimeout(verbTimer);
    if (M.reduced || !visible || document.hidden) return;
    verbTimer = scope.timeout(() => {
      if (visible && P.x < 0.15 && !document.hidden) {
        verbIdx = (verbIdx + 1) % verbs.length;
        setVerb(verbs[verbIdx], true);
      }
      cycle();
    }, 2600);
  }

  /* ---------- wiring ---------- */
  let stop = null;
  function start() {
    if (stop || M.reduced || !visible || document.hidden) return;
    stop = M.tick((dt) => {
      if (!visible || M.reduced) { stop = null; return false; }
      render(dt);
    });
  }

  measure();
  if (slot && verbs.length) {
    document.fonts?.ready.then(() => !scope.disposed && setVerb(verbs[0], false));
    setVerb(verbs[0], false);
    if (!M.reduced) cycle();
  }

  scope.observe((es) => {
    visible = es[0].isIntersecting;
    if (visible) { start(); cycle(); } else { scope.clearTimeout(verbTimer); }
  }).observe(hero);

  M.onScroll((y) => {
    if (M.reduced) { P.set(0); render(0); return; }
    const now = performance.now();
    const v = ((y - lastY) / Math.max(8, now - lastT)) * 1000; // px/s
    lastY = y; lastT = now;
    skew.to(M.clamp(v / 900, -5, 5));
    scope.clearTimeout(skew._t);
    skew._t = scope.timeout(() => skew.to(0), 90);
    P.to(rawProgress());
  });
  scope.listen(window, 'resize', () => { measure(); if (M.reduced) render(0); });

  scope.listen(stage, 'pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = stage.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  scope.listen(stage, 'pointerleave', () => { pointer = null; });
  scope.listen(stage, 'click', (e) => {
    if (e.target.closest('a, button')) return;
    const r = stage.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    // find ring centre roughly from current path bbox
    const b = ring.getBBox();
    const at = Math.atan2(y - (b.y + b.height / 2), x - (b.x + b.width / 2));
    wobble(1, at);
  });
  // gentle entrance: the ring "lands"
  wobble(0.5);
  if (M.reduced) { P.set(0); render(0); } else start();
  M.onReduced(reduced => {
    scope.clearTimeout(verbTimer); stop?.(); stop = null;
    if (reduced) { P.set(0); skew.set(0); off.fill(0); vel.fill(0); render(0); }
    else { P.to(rawProgress()); start(); cycle(); }
  });
  scope.listen(document, 'visibilitychange', () => {
    scope.clearTimeout(verbTimer); if (!document.hidden) { start(); cycle(); }
  });

  helpers.hero = { wobble };
}
