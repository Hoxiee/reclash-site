import * as core from '../../shared/motion/core'

export function createMotion(scope) {
  const root = document.documentElement
  const mq = matchMedia('(prefers-reduced-motion: reduce)')
  const springs = new Set(), changes = new Set()
  /** @type {import('./types').BrowserMotion} */
  const M = { ...core, reduced: mq.matches }
  root.classList.toggle('rm', M.reduced)
  M.onReduced = fn => { changes.add(fn); return scope.own(() => changes.delete(fn)) }
  scope.listen(mq, 'change', e => {
    M.reduced = e.matches; root.classList.toggle('rm', e.matches)
    if (e.matches) { for (const spring of springs) spring.set(spring.target); scope.root.getAnimations({ subtree: true }).forEach(animation => animation.cancel()) }
    for (const fn of changes) fn(e.matches)
  })
  M.tick = fn => scope.scheduler.tick(fn)
  M.spring = (value = 0, options = {}) => {
    const spring = new core.Spring(value, scope.scheduler, () => M.reduced, options)
    springs.add(spring); scope.own(() => spring.dispose()); return spring
  }
  const { clamp } = core
  M.installEasings = (names = Object.keys(core.presets)) => {
    if (!CSS.supports('transition-timing-function', 'linear(0, 1)')) return
    for (const name of names) {
      const ease = core.cssEase(name)
      root.style.setProperty(`--ease-${name}`, ease.easing)
      root.style.setProperty(`--dur-${name}`, ease.duration + 'ms')
    }
  }
  /* ---------- batched style writes ---------- */
  const writes = new Map();
  let writeQueued = false;
  M.write = (key, fn) => {
    writes.set(key, fn);
    if (!writeQueued) {
      writeQueued = true;
      queueMicrotask(() => {
        writeQueued = false;
        const list = Array.from(writes.values());
        writes.clear();
        if (!scope.disposed) for (const f of list) f();
      });
    }
  };

  /* ---------- magnet group ----------
     One indicator per group. It springs to the hovered item, gets pulled a bit toward the
     pointer, and stretches along its direction of travel. Items' inner content gets a
     smaller pull via --mx/--my. `sticky` groups keep a selected item highlighted. */
  let uid = 0;
  M.magnetGroup = (group, opts = {}) => {
    const {
      items = '[data-mg]',
      pull = 0.12,
      contentPull = 0.08,
      preset = 'smooth',
      className = 'mg-ind',
      stretch = 1,
      sticky = false,
    } = opts;
    const key = 'mg' + ++uid;
    const ind = document.createElement('span');
    ind.className = className;
    ind.setAttribute('aria-hidden', 'true');
    group.prepend(ind);

    const S = {};
    for (const k of ['x', 'y', 'w', 'h']) S[k] = M.spring(0, { preset, precision: 0.05 });
    S.o = M.spring(0, { preset: 'snappy', precision: 0.003 });
    S.s = M.spring(0.9, { preset: 'bouncy', precision: 0.002 });

    const render = () => {
      const vx = Math.abs(S.x.v), vy = Math.abs(S.y.v);
      const sx = clamp(vx / 2600, 0, 0.22) * stretch;
      const sy = clamp(vy / 2600, 0, 0.22) * stretch;
      const w = S.w.x * (1 + sx - sy * 0.35);
      const h = S.h.x * (1 + sy - sx * 0.35);
      const s = S.s.x;
      ind.style.width = w + 'px';
      ind.style.height = h + 'px';
      ind.style.transform = `translate3d(${S.x.x - (w - S.w.x) / 2}px, ${S.y.x - (h - S.h.x) / 2}px, 0) scale(${s})`;
      ind.style.opacity = S.o.x;
    };
    for (const s of Object.values(S)) s.onUpdate = () => M.write(key, render);

    let active = null;
    let selected = null;

    function rel(el) {
      const g = group.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - g.left - group.clientLeft, y: r.top - g.top - group.clientTop, w: r.width, h: r.height, gx: g.left, gy: g.top };
    }

    function go(el, e) {
      const r = rel(el);
      let dx = 0, dy = 0;
      if (e && !M.reduced) {
        dx = (e.clientX - (r.gx + r.x + r.w / 2)) * pull;
        dy = (e.clientY - (r.gy + r.y + r.h / 2)) * pull;
      }
      const hidden = S.o.x < 0.04 && S.o.target === 0;
      if (hidden) {
        S.x.set(r.x + dx); S.y.set(r.y + dy); S.w.set(r.w); S.h.set(r.h);
        S.s.set(0.86);
      }
      S.x.to(r.x + dx); S.y.to(r.y + dy); S.w.to(r.w); S.h.to(r.h);
      S.o.to(1); S.s.to(1);
      if (active !== el) {
        active?.classList.remove('is-mg');
        active?.style.removeProperty('--mx');
        active?.style.removeProperty('--my');
        el.classList.add('is-mg');
        active = el;
      }
      if (e && contentPull) {
        el.style.setProperty('--mx', (dx / pull) * contentPull + 'px');
        el.style.setProperty('--my', (dy / pull) * contentPull + 'px');
      }
    }

    function leave() {
      if (active) {
        active.classList.remove('is-mg');
        active.style.removeProperty('--mx');
        active.style.removeProperty('--my');
        active = null;
      }
      if (sticky && selected) return go(selected);
      S.o.to(0); S.s.to(0.9);
    }

    const pick = (e) => {
      const it = e.target.closest?.(items);
      return it && group.contains(it) ? it : null;
    };
    scope.listen(group, 'pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const it = pick(e);
      if (it) go(it, e);
      else if (active && !sticky) leave();
    });
    scope.listen(group, 'pointerleave', leave);
    scope.listen(group, 'focusin', (e) => {
      const it = pick(e);
      if (it) go(it);
    });
    scope.listen(group, 'focusout', (e) => {
      if (!group.contains(e.relatedTarget)) leave();
    });
    scope.listen(window, 'resize', () => (active || selected) && go(active || selected));

    return {
      el: ind,
      select(el) {
        selected = el;
        if (el && !active) go(el);
      },
      refresh() {
        if (active || selected) go(active || selected);
      },
    };
  };

  /* Morph between two paths with the same command layout. The spring may overshoot,
     which is exactly what gives shapes their bounce. */
  const NUM = /-?\d*\.?\d+(?:e-?\d+)?/gi;
  M.morph = (pathEl, preset = 'bouncy') => {
    let from = null, to = null, tpl = null;
    const s = M.spring(1, { preset, precision: 0.001 });
    s.onUpdate = (t) => {
      if (!to) return;
      let i = 0;
      pathEl.setAttribute('d', tpl.replace(NUM, () => {
        const v = from[i] + (to[i] - from[i]) * t;
        i++;
        return v.toFixed(2);
      }));
    };
    return {
      to(d) {
        const next = d.match(NUM).map(Number);
        const cur = (pathEl.getAttribute('d') || d).match(NUM).map(Number);
        if (cur.length !== next.length) {
          pathEl.setAttribute('d', d);
          return;
        }
        from = cur; to = next; tpl = d;
        s.set(0);
        s.to(1);
      },
    };
  };

  /* ---------- text ---------- */
  M.splitWords = (el) => {
    if (el.dataset.split) return el;
    el.dataset.split = '1';
    let i = 0;
    const walk = (node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { frag.append(' '); continue; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'wi';
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            w.append(inner);
            frag.append(w);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.matches('br')) {
          walk(child);
        }
      }
    };
    walk(el);
    return el;
  };

  /* once-only reveal; callback gets the element */
  M.reveal = (targets, fn = (el) => el.classList.add('is-in'), opts = {}) => {
    const list = typeof targets === 'string' ? scope.root.querySelectorAll(targets) : targets;
    if (M.reduced || !('IntersectionObserver' in window)) {
      list.forEach((el) => fn(el));
      return;
    }
    const io = scope.observe((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        fn(e.target);
      }
    }, { threshold: opts.threshold ?? 0.2, rootMargin: opts.rootMargin ?? '0px 0px -8% 0px' });
    list.forEach((el) => io.observe(el));
    M.onReduced(reduced => { if (reduced) { io.disconnect(); list.forEach(el => fn(el)); } });
  };

  /* coalesced scroll/resize hook */
  M.onScroll = (fn) => {
    let q = false;
    const run = () => { q = false; fn(scrollY); };
    const req = () => { if (!q) { q = true; scope.frame(run); } };
    scope.listen(window, 'scroll', req, { passive: true });
    scope.listen(window, 'resize', req);
    req();
  };


  return M
}
