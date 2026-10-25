import { normHex, hexToOklch } from '../../shared/provider/theme.ts'
import { glyphSvg } from '../../shared/site/brand.ts'
/*
 * Brand theme for the website and its schematic previews, independent of the app palette.
 * The seed goes to OKLCH, lightness and chroma get clamped into a band that stays readable
 * on the dark background, then hue/chroma/lightness spring to the new value — so a recolor
 * is a short physical sweep, not a flash. The brand glyph and the favicon follow the same band.
 */
export function createTheme(scope, M) {
  'use strict';
  const root = document.documentElement;
  const KEY = 'reclash-brand';
  const DEFAULT = 'FF7A2F';

  const norm = normHex;

  // readable band on #0d0a14-ish background
  const ui = ({ l, c, h }) => ({ l: M.clamp(l, 0.68, 0.84), c: Math.min(c, 0.19), h });

  const cur = { l: 0.7247, c: 0.1822, h: 46.04 };
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
    // The resolved band is stored too, so the head script can paint the brand before hydration.
    if (persist) try {
      localStorage.setItem(KEY, v);
      localStorage.setItem(KEY + '-ui', [t.l.toFixed(4), t.c.toFixed(4), (((h % 360) + 360) % 360).toFixed(2)].join(' '));
    } catch (_) {}
    meta()?.setAttribute('content', '#' + v);
    // the tab icon is the glyph in the same colours; the default stays the static file
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.setAttribute('href', v === DEFAULT ? '/favicon.svg' : 'data:image/svg+xml,' + encodeURIComponent(glyphSvg({ l: t.l, c: t.c, h: t.h })));
    window.dispatchEvent(new CustomEvent('brandchange', { detail: { hex: v } }));
    return true;
  }

  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (_) {}
  set(saved || DEFAULT, { animate: false, persist: false });

  return { set, get: () => seed, DEFAULT, norm, hexToOklch };
}
