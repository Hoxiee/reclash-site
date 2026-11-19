import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isTranslated, languages, legacyPath, pageLanguages, pagePath, privatePages, sitePages } from '../shared/site/routes'
import { docLanguages, docPages, docPath, docRoutes } from '../shared/docs/catalogue'
import { mockBody, mockConfig, mockConfigPath, mockHeaders, mockPath, mockProfiles, mockTransportHeaders } from '../shared/provider/mocks'
import { mockPage, mockPagePath, mockPreview, mockPreviewPath } from '../shared/provider/mockpreview'

export async function writeStaticFiles(output: string, origin: string): Promise<void> {
  const headers = ['/*', '  X-Content-Type-Options: nosniff', '/_nuxt/*', '  Cache-Control: public, max-age=31536000, immutable']
  const redirects: string[] = []
  // Mock subscriptions are plain static files; their response headers live here.
  const now = Date.now()
  await mkdir(join(output, 'mock'), { recursive: true })
  await mkdir(join(output, 'mock-page'), { recursive: true })
  await mkdir(join(output, 'mock-preview'), { recursive: true })
  await mkdir(join(output, 'mock-config'), { recursive: true })
  await Promise.all(mockProfiles.flatMap(profile => [
    writeFile(join(output, 'mock', profile.key), mockBody(profile)),
    writeFile(join(output, 'mock-page', profile.key), mockPage(profile)),
    writeFile(join(output, 'mock-preview', `${profile.key}.json`), `${JSON.stringify(mockPreview(profile), null, 2)}\n`),
    ...(mockConfig(profile, origin, now) ? [writeFile(join(output, 'mock-config', `${profile.key}.yaml`), mockConfig(profile, origin, now)!)] : []),
  ]))
  for (const profile of mockProfiles) {
    headers.push(mockPath(profile.key), ...[...mockTransportHeaders, ...mockHeaders(profile, origin, now)].map(([key, value]) => `  ${key}: ${value}`))
    // The page and the preview JSON are what ReClash's confirmation reads before a stand is added.
    headers.push(mockPagePath(profile.key), '  Content-Type: text/html; charset=utf-8', '  Cache-Control: no-store', '  X-Robots-Tag: noindex')
    if (mockConfig(profile, origin, now)) headers.push(mockConfigPath(profile.key), '  Content-Type: text/yaml; charset=utf-8', '  Access-Control-Allow-Origin: *', '  Cache-Control: no-store', '  X-Robots-Tag: noindex')
    headers.push(mockPreviewPath(profile.key), '  Content-Type: application/json; charset=utf-8', '  Cache-Control: no-store', '  X-Robots-Tag: noindex')
  }
  for (const language of languages) {
    redirects.push(`/${language}/gallery ${pagePath(language)} 301`, `/${language}/gallery.html ${pagePath(language)} 301`)
    for (const page of sitePages) {
      if (!isTranslated(language, page.key)) {
        // Documentation has its own fallback below; every other untranslated page sends visitors to English.
        if (page.key !== 'docs') redirects.push(`/${language}/${page.key} ${pagePath('en', page.key)} 302`, `/${language}/${page.key}.html ${pagePath('en', page.key)} 302`)
        continue
      }
      const canonical = pagePath(language, page.key)
      const legacy = legacyPath(language, page.key)
      // A proxy preserves query/fragment state and avoids rendering home twice.
      redirects.push(`${legacy} ${canonical} 200`)
      headers.push(legacy, `  Link: <${origin}${canonical}>; rel="canonical"`)
    }
  }
  // Cloudflare reads at most 100 header rules; Chinese pages have no legacy .html URLs to keep alive.
  for (const canonical of docRoutes.filter(route => !route.startsWith('/zh-CN/'))) {
    const legacy = `${canonical}.html`
    if (!redirects.includes(`${legacy} ${canonical} 200`)) {
      redirects.push(`${legacy} ${canonical} 200`)
      headers.push(legacy, `  Link: <${origin}${canonical}>; rel="canonical"`)
    }
  }
  // The RCX handbook moved under the documentation; Chinese pages wait for a new translation.
  for (const language of ['ru', 'en', 'zh-CN'] as const) {
    const target = docLanguages.includes(language) ? language : 'en'
    for (const page of docPages.filter(item => item.section === 'rcx')) {
      const old = page.slug.replace(/^rcx/, `/${language}/rcx`)
      redirects.push(`${old} ${docPath(target, page.slug)} 301`, `${old}.html ${docPath(target, page.slug)} 301`)
    }
    redirects.push(`/${language}/rcx/* ${docPath(target, 'rcx')} 301`)
    redirects.push(`${docPath(language, 'rcx/editor')} ${docPath(target, 'rcx')} 301`, `${docPath(language, 'rcx/editor')}/* ${docPath(target, 'rcx')} 301`)
    if (target !== language) redirects.push(`${docPath(language)} ${docPath(target)} 301`, `${docPath(language)}/* ${docPath(target)}/:splat 301`)
  }
  const publicPages = sitePages.filter(page => !privatePages.includes(page.key))
  const entries = new Map<string, string>()
  for (const page of publicPages) {
    const available = pageLanguages(page.key)
    const alternates = [...available, 'x-default'].map(hreflang => `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${origin}${pagePath(hreflang === 'x-default' ? 'en' : hreflang as typeof languages[number], page.key)}"/>`).join('')
    for (const language of available) entries.set(`${origin}${pagePath(language, page.key)}`, alternates)
  }
  for (const path of docRoutes) if (!entries.has(`${origin}${path}`)) entries.set(`${origin}${path}`, '')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...entries].map(([url, alternates]) => `  <url><loc>${url}</loc>${alternates}</url>`).join('\n')}\n</urlset>\n`
  await Promise.all([
    writeFile(join(output, '_headers'), `${headers.join('\n')}\n`),
    writeFile(join(output, '_redirects'), `${redirects.join('\n')}\n`),
    writeFile(join(output, 'sitemap.xml'), sitemap),
    writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`),
  ])
}
