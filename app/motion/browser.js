import * as core from '../../shared/motion/core'

export function createMotion(scope, gate) {
  const root = document.documentElement
  const mq = matchMedia('(prefers-reduced-motion: reduce)')
  const springs = new Set(), changes = new Set()
  /** @type {import('./types').BrowserMotion} */
  const M = { ...core, reduced: mq.matches }
  root.classList.toggle('rm', M.reduced)
  /** Resolves when page entrances may play (after the loader or a route transition). */
  M.whenReady = () => gate ? gate() : Promise.resolve()
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
     One plate per group. Each edge rides its own spring, so the plate stays glued to the
     hovered item: the leading edge arrives first, the trailing one follows, and the plate
     never scales or leans toward the pointer. Corners keep their radius because only width
     and height change. Items' inner content may get a small pull via --mx/--my.
     `sticky` groups keep a selected item highlighted. */
  let uid = 0;
  M.magnetGroup = (group, opts = {}) => {
    const {
      items = '[data-mg]',
      contentPull = 0.08,
      className = 'mg-ind',
      sticky = false,
    } = opts;
    const key = 'mg' + ++uid;
    const ind = document.createElement('span');
    ind.className = className;
    ind.setAttribute('aria-hidden', 'true');
    group.prepend(ind);

    const edge = () => M.spring(0, { stiffness: 260, damping: 20, precision: 0.05 });
    const E = { l: edge(), r: edge(), t: edge(), b: edge() };
    const O = M.spring(0, { preset: 'snappy', precision: 0.003 });

    const render = () => {
      ind.style.width = Math.max(0, E.r.x - E.l.x) + 'px';
      ind.style.height = Math.max(0, E.b.x - E.t.x) + 'px';
      ind.style.transform = `translate3d(${E.l.x}px, ${E.t.x}px, 0)`;
      ind.style.opacity = O.x;
    };
    for (const s of [...Object.values(E), O]) s.onUpdate = () => M.write(key, render);

    let active = null;
    let selected = null;
    let hovered = false;

    function rect(el) {
      const g = group.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const x = r.left - g.left - group.clientLeft + group.scrollLeft;
      const y = r.top - g.top - group.clientTop + group.scrollTop;
      return { l: x, r: x + r.width, t: y, b: y + r.height };
    }

    // Leading edges are stiff, trailing ones soft: the plate travels without inflating.
    function travel(a, b, from, to) {
      const forward = to > from;
      const lead = { stiffness: 420, damping: 2 * Math.sqrt(420) * 0.72 };
      const tail = { stiffness: 170, damping: 2 * Math.sqrt(170) * 0.72 };
      a.config(forward ? tail : lead);
      b.config(forward ? lead : tail);
    }

    function go(el, e, instant = false) {
      const r = rect(el);
      const hidden = O.x < 0.04 && O.target === 0;
      if (hidden || instant) {
        for (const k in E) E[k].set(r[k]);
      } else {
        travel(E.l, E.r, E.l.target, r.l);
        travel(E.t, E.b, E.t.target, r.t);
        for (const k in E) E[k].to(r[k]);
      }
      O.to(1);
      if (active !== el) {
        active?.classList.remove('is-mg');
        active?.style.removeProperty('--mx');
        active?.style.removeProperty('--my');
        el.classList.add('is-mg');
        active = el;
      }
      if (e && contentPull && !M.reduced) {
        const box = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - box.left - box.width / 2) * contentPull + 'px');
        el.style.setProperty('--my', (e.clientY - box.top - box.height / 2) * contentPull + 'px');
      }
    }

    function leave() {
      hovered = false;
      if (active) {
        active.classList.remove('is-mg');
        active.style.removeProperty('--mx');
        active.style.removeProperty('--my');
        active = null;
      }
      if (sticky && selected?.isConnected) return go(selected);
      O.to(0);
    }

    const pick = (e) => {
      const it = e.target.closest?.(items);
      return it && group.contains(it) ? it : null;
    };
    scope.listen(group, 'pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const it = pick(e);
      if (it) { hovered = true; go(it, e); }
      else if (active && !sticky) leave();
    });
    scope.listen(group, 'pointerleave', leave);
    scope.listen(group, 'focusin', (e) => {
      const it = pick(e);
      if (it) { hovered = true; go(it); }
    });
    scope.listen(group, 'focusout', (e) => {
      if (!group.contains(e.relatedTarget)) leave();
    });
    // Layout changes (fonts, wrapping, async content) snap the plate back onto its item.
    const snap = () => { const el = active || selected; if (el?.isConnected && O.target) go(el, null, true); };
    scope.listen(window, 'resize', snap);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => scope.frame(snap));
      ro.observe(group);
      scope.own(() => ro.disconnect());
    }

    return {
      el: ind,
      select(el) {
        selected = el;
        // A pointer or focus on the group keeps the plate; it returns to the selection on leave.
        if (hovered) return;
        if (el) go(el);
        else leave();
      },
      refresh() {
        const el = active || selected;
        if (el?.isConnected) go(el);
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
    // Page reveals wait for the gate (the loader or a route transition), then run as usual.
    if (gate) { gate().then(() => { if (!scope.disposed) observeReveal(list, fn, opts); }); return; }
    observeReveal(list, fn, opts);
  };
  const observeReveal = (list, fn, opts) => {
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
