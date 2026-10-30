import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { compileDocument, contentRoot, digest, makeCatalogue, markdownFiles, rcxLanguages, readDocuments, screenshotManifest, siteRoot } from './rcx-content.mjs'

const [command, source] = process.argv.slice(2)

async function writeChanged(file, text) {
  if (existsSync(file) && readFileSync(file, 'utf8') === text) return
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, text)
}

if (command === 'sync') {
  assert.ok(source, 'Usage: npm run docs:sync -- /path/to/ReClash')
  const repository = resolve(source)
  const commit = execFileSync('git', ['-C', repository, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  const dirty = execFileSync('git', ['-C', repository, 'status', '--porcelain', '--', 'docs/en/auto-routing', 'docs/ru/auto-routing', 'docs/zh-CN/auto-routing'], { encoding: 'utf8' }).trim()
  assert.equal(dirty, '', 'Commit the source RCX documentation before synchronizing it')
  const library = readDocuments(join(repository, 'docs'), true)
  for (const [key, document] of library.documents) await writeChanged(join(contentRoot, key), document.source)
  for (const language of rcxLanguages) {
    for (const entry of screenshotManifest(library, language).values()) {
      const image = join(repository, 'docs', language, 'auto-routing', entry.file)
      if (existsSync(image)) {
        const destination = join(siteRoot, 'public/assets/rcx/screenshots', language, `${entry.id}.png`)
        await mkdir(dirname(destination), { recursive: true })
        await copyFile(image, destination)
      }
    }
  }
  await writeChanged(join(contentRoot, 'catalogue.json'), `${JSON.stringify(makeCatalogue(library, commit), null, 2)}\n`)
  console.log(`Synchronized ${library.documents.size} RCX documents from ${commit.slice(0, 8)}. Run npm run docs:diagrams after changing diagrams.`)
} else if (command === 'check') {
  const catalogue = JSON.parse(readFileSync(join(contentRoot, 'catalogue.json'), 'utf8'))
  assert.match(catalogue.source.commit, /^[a-f0-9]{40}$/)
  const library = readDocuments()
  assert.deepEqual(makeCatalogue(library, catalogue.source.commit), catalogue, 'RCX catalogue is stale; synchronize the documentation')
  const slots = []
  for (const language of rcxLanguages) {
    assert.equal(markdownFiles(join(contentRoot, language)).length, catalogue.pages.length)
    slots.push([...screenshotManifest(library, language).keys()].sort())
  }
  assert.deepEqual(slots[0], slots[1], 'Russian screenshot manifest differs')
  assert.deepEqual(slots[1], slots[2], 'Chinese screenshot manifest differs')
  for (const [key, document] of library.documents) {
    assert.equal(digest(document.source), catalogue.files[key])
    compileDocument(document, library, catalogue)
  }
  console.log(`Verified ${library.documents.size} complete documents, local links, translated anchors, ${slots[0].length} screenshot slots per language and all diagrams.`)
} else {
  throw new Error('Expected sync <ReClash checkout> or check')
}
