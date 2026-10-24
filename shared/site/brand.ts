/*
 * The brand glyph as a standalone SVG, coloured from a brand band (OKLCH). The offsets
 * mirror the --mk-* tokens in app/assets/css/brand.css; the theme writes the result into
 * the favicon, so the browser tab recolors together with the page.
 */
type Band = { l: number, c: number, h: number }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

function oklchToHex(l: number, c: number, h: number) {
  const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return '#' + linear.map((v) => {
    const g = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.abs(v) ** (1 / 2.4) - 0.055
    return Math.round(clamp(g, 0, 1) * 255).toString(16).padStart(2, '0')
  }).join('')
}

/** Top and bottom gradient stops of the three capsules, left to right. */
export function markColors({ l, c, h }: Band): Array<[string, string]> {
  return [
    [oklchToHex(Math.min(0.94, l + 0.014), c * 1.04, h + 34), oklchToHex(l - 0.128, c * 1.43, h + 25)],
    [oklchToHex(l, c, h), oklchToHex(l - 0.121, c * 1.29, h + 4)],
    [oklchToHex(Math.min(0.95, l + 0.127), c * 0.75, h - 34), oklchToHex(Math.min(0.9, l + 0.025), c * 0.9, h - 25)],
  ]
}

const bars = 'M-101.2 69V-69|M0 138V-138|M101.2 46V-46'.split('|')

export function glyphSvg(band: Band) {
  const colors = markColors(band)
  const stops = colors.map(([top, bottom], i) => `<linearGradient id="g${i}" gradientUnits="userSpaceOnUse" x1="0" y1="-184" x2="0" y2="184"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`)
  const paths = bars.map((d, i) => `<path d="${d}" stroke="url(#g${i})"/>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-166 -166 332 332"><defs>${stops.join('')}</defs><g transform="translate(4 0) rotate(-20)" fill="none" stroke-width="62.1" stroke-linecap="round">${paths.join('')}</g></svg>`
}
