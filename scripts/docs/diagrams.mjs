import { readdirSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { diagramPath, digest, publicRoot, readLibrary } from './engine.mjs'

const sources = new Map()
for (const document of readLibrary().documents.values()) {
  for (const token of document.tokens) if (token.type === 'code' && token.lang?.split(/\s/)[0] === 'mermaid') sources.set(diagramPath(token.text), token.text)
}
const directory = join(publicRoot, 'assets/docs/diagrams')
await mkdir(directory, { recursive: true })
const existing = new Set(readdirSync(directory).map(file => `/assets/docs/diagrams/${file}`))
for (const file of existing) if (!sources.has(file)) await rm(join(publicRoot, file))
const pending = [...sources].filter(([file]) => !existing.has(file))

const mermaidRoot = dirname(fileURLToPath(import.meta.resolve('mermaid')))
const browser = pending.length ? await chromium.launch() : undefined
try {
  const page = await browser?.newPage()
  if (page) {
    await page.route('**/*', async route => {
      const url = new URL(route.request().url())
      if (url.origin !== 'http://docs-diagrams.invalid') return route.abort()
      if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><script type="module">import mermaid from "/mermaid.esm.min.mjs"; window.mermaid = mermaid;</script></body></html>' })
      const file = join(mermaidRoot, decodeURIComponent(url.pathname))
      if (relative(mermaidRoot, file).startsWith('..')) return route.abort()
      try { await route.fulfill({ contentType: ['.mjs', '.js'].includes(extname(file)) ? 'text/javascript' : 'application/octet-stream', body: await readFile(file) }) }
      catch { await route.abort() }
    })
    await page.goto('http://docs-diagrams.invalid')
    await page.waitForFunction(() => Boolean(window.mermaid))
  }
  for (const [file, source] of pending) {
    const id = `d-${basename(file, '.svg')}`
    const svg = await page.evaluate(async ({ source, id }) => {
      window.mermaid.initialize({
        startOnLoad: false, securityLevel: 'strict', htmlLabels: false, theme: 'base', deterministicIds: true, deterministicIDSeed: id,
        flowchart: { htmlLabels: false, curve: 'basis', useMaxWidth: false, padding: 16 },
        themeVariables: {
          darkMode: true, background: 'transparent', primaryColor: '#25212b', primaryTextColor: '#f2ede3',
          primaryBorderColor: '#5d5666', lineColor: '#a39bac', secondaryColor: '#2c2834', tertiaryColor: '#1d1a22',
          edgeLabelBackground: '#1d1a22', textColor: '#f2ede3', fontFamily: 'Arial, sans-serif', fontSize: '15px',
        },
      })
      return (await window.mermaid.render(id, source)).svg
    }, { source, id })
    await writeFile(join(publicRoot, file), `${svg.replace(/(<svg\b[^>]*>)/, `$1<metadata id="docs-source-sha256">${digest(source)}</metadata>`)}\n`)
  }
  console.log(`Diagrams: ${sources.size} referenced, ${pending.length} rendered, ${[...existing].filter(file => !sources.has(file)).length} removed.`)
} finally {
  await browser?.close()
}
