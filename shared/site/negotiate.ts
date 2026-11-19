// Language-neutral entry links (/download, /docs/...) redirect to the visitor's language. Search engines keep
// indexing the prefixed pages; the neutral address only exists so a link can be shared without a language.
import { isTranslated, type Language } from './languages.ts'

export const neutralPages = ['start', 'download', 'docs', 'reference', 'builder', 'mock-subs'] as const

// Languages whose speakers usually read Russian; anything else falls back to English.
const russianFamily = /^(ru|be|kk|ky|tg|uz|tt|ba|cv|sah|os)(-|$)/

export function pickLanguage(acceptLanguage: string | null, cookie: string | null): Language {
  const stored = /(?:^|;\s*)reclash-lang=(ru|en|zh-CN)(?:;|$)/.exec(cookie ?? '')?.[1]
  if (stored === 'ru' || stored === 'en' || stored === 'zh-CN') return stored
  const ranked = (acceptLanguage ?? '').split(',').map((part, index) => {
    const [tag, ...params] = part.trim().toLowerCase().split(';')
    const quality = Number(/^\s*q=([\d.]+)/.exec(params.join(';'))?.[1] ?? 1)
    return { tag: tag!.trim(), quality: Number.isFinite(quality) ? quality : 0, index }
  }).filter(item => item.tag && item.quality > 0).sort((a, b) => b.quality - a.quality || a.index - b.index)
  for (const { tag } of ranked) {
    if (russianFamily.test(tag)) return 'ru'
    if (/^zh(-|$)/.test(tag)) return 'zh-CN'
    if (/^en(-|$)/.test(tag)) return 'en'
  }
  return 'en'
}

export function neutralRedirect(request: Request): Response | undefined {
  if (request.method !== 'GET' && request.method !== 'HEAD') return undefined
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  if (path !== '/' && !(neutralPages as readonly string[]).includes(path.split('/')[1]!)) return undefined
  const picked = pickLanguage(request.headers.get('Accept-Language'), request.headers.get('Cookie'))
  const language = isTranslated(picked, path === '/' ? 'index' : path.split('/')[1]!) ? picked : 'en'
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/${language}${path === '/' ? '' : path}${url.search}`,
      Vary: 'Accept-Language, Cookie',
      'Cache-Control': 'no-store',
    },
  })
}
