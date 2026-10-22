import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { prerenderRoutes } from '../shared/site/routes.ts'

const output = resolve('.output/public')
const routes = prerenderRoutes
const manifests = ['.nuxt/dist/server/client.manifest.mjs', 'node_modules/.cache/nuxt/.nuxt/dist/server/client.manifest.mjs']
const manifestPath = await Promise.any(manifests.map(async path => { await stat(path); return path }))
const { default: manifest } = await import(pathToFileURL(resolve(manifestPath)).href)
const byFile = new Map(Object.entries(manifest).map(([key, chunk]) => [chunk.file, key]))
let largest = 0

for (const route of routes) {
  const file = route === '/' ? 'index.html' : `${route.slice(1)}/index.html`
  const html = await readFile(resolve(output, file), 'utf8')
  assert.match(html, /<h1[ >]/, `${route} lacks prerendered content`)
  const files = new Set()
  function follow(key) {
    const chunk = manifest[key]
    if (!chunk || files.has(chunk.file)) return
    files.add(chunk.file)
    for (const dependency of chunk.imports || []) follow(dependency)
  }
  for (const tag of html.matchAll(/<(?:script|link)\b[^>]*>/g)) {
    const match = /(?:src|href)="\/?_nuxt\/([^"?#]+\.js)"/.exec(tag[0])
    if (match) follow(byFile.get(match[1]))
    assert.ok(!tag[0].includes('rel="prefetch"'), `${route} has eager prefetching`)
  }
  assert.ok(files.size, `${route} has no initial JavaScript`)
  let bytes = 0
  for (const file of files) bytes += gzipSync(await readFile(resolve(output, '_nuxt', file))).length
  assert.ok(bytes <= 120 * 1024, `${route} exceeds its 120 KiB initial JavaScript budget`)
  largest = Math.max(largest, bytes)
}
for (const file of ['_headers', '_redirects', 'robots.txt', 'sitemap.xml', '404.html']) {
  assert.ok((await stat(resolve(output, file))).size, `Missing static host artifact: ${file}`)
}
const sitemap = await readFile(resolve(output, 'sitemap.xml'), 'utf8')
assert.ok(!/\/(report|mock-subs|motion)<\/loc>/.test(sitemap), 'Private sections must not enter the sitemap')
await assert.rejects(stat(resolve(output, '_worker.js')), 'Static build must not require a Worker')
console.log(`Verified ${routes.length} prerendered routes and Pages artifacts; largest initial JS: ${(largest / 1024).toFixed(2)} KiB gzip.`)
