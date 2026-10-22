import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { languages, legacyPath, pagePath, privatePages, sitePages } from '../shared/site/routes'

const reportPolicy = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
}

export async function writeStaticFiles(output: string, origin: string): Promise<void> {
  const headers = ['/*', '  X-Content-Type-Options: nosniff', '/_nuxt/*', '  Cache-Control: public, max-age=31536000, immutable']
  const redirects: string[] = []
  for (const language of languages) {
    for (const page of sitePages) {
      const canonical = pagePath(language, page.key)
      const legacy = legacyPath(language, page.key)
      // A proxy preserves query/fragment state and avoids rendering home twice.
      redirects.push(`${legacy} ${canonical} 200`)
      headers.push(legacy, `  Link: <${origin}${canonical}>; rel="canonical"`)
    }
    for (const path of [pagePath(language, 'report'), `${pagePath(language, 'report')}/`, legacyPath(language, 'report')]) {
      headers.push(path, ...Object.entries(reportPolicy).map(([key, value]) => `  ${key}: ${value}`))
    }
  }
  const routes = languages.flatMap(language => sitePages
    .filter(page => !privatePages.includes(page.key))
    .map(page => `${origin}${pagePath(language, page.key)}`))
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`
  await Promise.all([
    writeFile(join(output, '_headers'), `${headers.join('\n')}\n`),
    writeFile(join(output, '_redirects'), `${redirects.join('\n')}\n`),
    writeFile(join(output, 'sitemap.xml'), sitemap),
    writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`),
  ])
}
