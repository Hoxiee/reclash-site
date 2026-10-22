import { normHex, hexToOklch } from '../../shared/provider/theme.ts'
/*
 * Brand theme. The site recolors exactly the way the client does: from one ReClash-Hex.
 * The seed goes to OKLCH, lightness and chroma get clamped into a band that stays readable
 * on the dark background, then hue/chroma/lightness spring to the new value — so a recolor
 * is a short physical sweep, not a flash.
 */
export function createTheme(scope, M) {
  'use strict';
  const root = document.documentElement;
  const KEY = 'reclash-brand';
  const DEFAULT = '7C5CFF';

  const norm = normHex;

  // readable band on #0d0a14-ish background
  const ui = ({ l, c, h }) => ({ l: M.clamp(l, 0.68, 0.84), c: Math.min(c, 0.19), h });

  const cur = { l: 0.7, c: 0.17, h: 286 };
  const write = () => {
    root.style.setProperty('--bl', cur.l.toFixed(4));
    root.style.setProperty('--bc', cur.c.toFixed(4));
    root.style.setProperty('--bh', cur.h.toFixed(2));
  };
  const springs = {
    l: M.spring(cur.l, { stiffness: 140, damping: 20, precision: 0.0005 }),
    c: M.spring(cur.c, { stiffness: 140, damping: 18, precision: 0.0005 }),
    h: M.spring(cur.h, { stiffness: 120, damping: 15, precision: 0.05 }),
  };
  for (const k of ['l', 'c', 'h']) springs[k].onUpdate = (v) => { cur[k] = v; M.write('theme', write); };

  let seed = DEFAULT;
  const meta = () => document.querySelector('meta[name="theme-color"]');

  function set(hex, { animate = true, persist = true } = {}) {
    const v = norm(hex);
    if (!v) return false;
    seed = v;
    const t = ui(hexToOklch(v));
    // greys carry no hue: keep the current one and just drain the chroma
    if (t.c < 0.025) t.h = springs.h.target;
    // shortest way around the hue wheel
    let dh = ((t.h - springs.h.target + 540) % 360) - 180;
    const h = springs.h.target + dh;
    if (animate && !M.reduced) {
      springs.l.to(t.l); springs.c.to(t.c); springs.h.to(h);
    } else {
      springs.l.set(t.l); springs.c.set(t.c); springs.h.set(h);
    }
    if (persist) try { localStorage.setItem(KEY, v); } catch (_) {}
    meta()?.setAttribute('content', '#' + v);
    window.dispatchEvent(new CustomEvent('brandchange', { detail: { hex: v } }));
    return true;
  }

  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (_) {}
  set(saved || DEFAULT, { animate: false, persist: false });

  return { set, get: () => seed, DEFAULT, norm, hexToOklch };
}
