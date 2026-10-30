import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { diagramName, digest, readDocuments, siteRoot } from './rcx-content.mjs'

const mermaidRoot = dirname(fileURLToPath(import.meta.resolve('mermaid')))
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.origin !== 'http://rcx-diagrams.invalid') return route.abort()
    if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><script type="module">import mermaid from "/mermaid.esm.min.mjs"; window.mermaid = mermaid;</script></body></html>' })
    const file = join(mermaidRoot, decodeURIComponent(url.pathname))
    if (relative(mermaidRoot, file).startsWith('..')) return route.abort()
    try { await route.fulfill({ contentType: extname(file) === '.mjs' || extname(file) === '.js' ? 'text/javascript' : 'application/octet-stream', body: await readFile(file) }) }
    catch { await route.abort() }
  })
  await page.goto('http://rcx-diagrams.invalid')
  await page.waitForFunction(() => Boolean(window.mermaid))
  const library = readDocuments()
  let count = 0
  for (const document of library.documents.values()) {
    let index = 0
    for (const token of document.tokens) {
      if (token.type !== 'code' || token.lang !== 'mermaid') continue
      const name = diagramName(document.language, document.file, ++index)
      const id = `rcx-${digest(`${name}:${token.text}`).slice(0, 12)}`
      const svg = await page.evaluate(async ({ source, id }) => {
        window.mermaid.initialize({
          startOnLoad: false, securityLevel: 'strict', htmlLabels: false, theme: 'base', deterministicIds: true, deterministicIDSeed: id,
          flowchart: { htmlLabels: false, curve: 'linear', useMaxWidth: false, padding: 18 },
          themeVariables: {
            darkMode: true, background: '#18161d', primaryColor: '#2c2834', primaryTextColor: '#f2ede3',
            primaryBorderColor: '#938c9e', lineColor: '#b7afc0', secondaryColor: '#2c2834', tertiaryColor: '#2c2834',
            edgeLabelBackground: '#18161d', textColor: '#f2ede3', fontFamily: 'Arial, sans-serif', fontSize: '15px',
          },
        })
        return (await window.mermaid.render(id, source)).svg
      }, { source: token.text, id })
      const output = svg.replace(/(<svg\b[^>]*>)/, `$1<metadata id="rcx-source-sha256">${digest(token.text)}</metadata>`)
      const destination = join(siteRoot, 'public/assets/rcx/diagrams', name)
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, `${output}\n`)
      count++
    }
  }
  console.log(`Rendered ${count} local RCX diagrams; no runtime Mermaid or external requests.`)
} finally {
  await browser.close()
}
