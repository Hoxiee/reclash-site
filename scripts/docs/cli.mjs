import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { compileDocument, contentRoot, makeCatalogue, makeDigests, markdownFiles, readLibrary } from './engine.mjs'

const [command, ...rest] = process.argv.slice(2)
const draft = rest.includes('--draft')
const source = rest.find(argument => !argument.startsWith('--'))

async function writeChanged(file, text) {
  if (existsSync(file) && readFileSync(file, 'utf8') === text) return
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, text)
}

function verify(library, catalogue) {
  for (const document of library.documents.values()) compileDocument(document, library, catalogue)
}

if (command === 'sync') {
  assert.ok(source, 'Usage: npm run docs:sync -- /path/to/ReClash [--draft]')
  const repository = resolve(source)
  const commit = execFileSync('git', ['-C', repository, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  const dirty = execFileSync('git', ['-C', repository, 'status', '--porcelain', '--', 'docs'], { encoding: 'utf8' }).trim()
  assert.ok(draft || !dirty, 'Commit the documentation source before synchronizing it (or pass --draft for a local preview)')
  const library = readLibrary(join(repository, 'docs'))
  await rm(contentRoot, { recursive: true, force: true })
  await writeChanged(join(contentRoot, 'manifest.json'), readFileSync(join(repository, 'docs/manifest.json'), 'utf8'))
  for (const [key, document] of library.documents) await writeChanged(join(contentRoot, key), document.source)
  const catalogue = makeCatalogue(library, commit)
  await writeChanged(join(contentRoot, 'catalogue.json'), `${JSON.stringify(catalogue, null, 2)}\n`)
  await writeChanged(join(contentRoot, 'digests.json'), `${JSON.stringify(makeDigests(library), null, 2)}\n`)
  console.log(`Synchronized ${library.documents.size} documents in ${library.languages.join(', ')} from ${commit.slice(0, 8)}${draft && dirty ? ' (draft: uncommitted source)' : ''}.`)
  try { verify(library, catalogue) } catch (error) { console.warn(`Warning: ${error.message}`) }
} else if (command === 'check') {
  const catalogue = JSON.parse(readFileSync(join(contentRoot, 'catalogue.json'), 'utf8'))
  assert.match(catalogue.source.commit, /^[a-f0-9]{40}$/)
  const library = readLibrary()
  assert.deepEqual(makeCatalogue(library, catalogue.source.commit), catalogue, 'Documentation catalogue is stale; synchronize the documentation')
  assert.deepEqual(makeDigests(library), JSON.parse(readFileSync(join(contentRoot, 'digests.json'), 'utf8')), 'Documentation digests are stale; synchronize the documentation')
  for (const language of library.languages) assert.equal(markdownFiles(join(contentRoot, language)).length, library.pages.length)
  verify(library, catalogue)
  console.log(`Verified ${library.documents.size} documents (${library.languages.join(', ')}): links, anchors, translated headings and diagrams.`)
} else {
  throw new Error(`Expected sync <ReClash checkout> [--draft] or check; got ${command ?? 'nothing'}`)
}
