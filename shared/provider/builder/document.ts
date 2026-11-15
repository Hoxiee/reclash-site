import { excludedRoot, nodeAt, propertyOrder, providerSchema, type SchemaNode } from './schema.ts'
import { formSections } from './form.ts'
import { parseYaml, rawSection, stringifyYaml } from './yaml.ts'

export type Manifest = Record<string, unknown>
export type Path = Array<string | number>
export const manifestLimit = 512 * 1024
export const draftLimit = manifestLimit * 2

export const splitPath = (path: string): Path => path ? path.split('.').map(segment => /^\d+$/.test(segment) ? Number(segment) : segment) : []

export function getAt(root: unknown, path: Path): unknown {
  let value = root
  for (const segment of path) value = value && typeof value === 'object' ? (value as Record<string | number, unknown>)[segment] : undefined
  return value
}

const isEmpty = (value: unknown) => value === undefined || value === '' || (value !== null && typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length)

/** Sets a value; `undefined`, an empty string or an empty object removes the key and prunes empty parents. List items stay. */
export function setAt(root: Manifest, path: Path, value: unknown): void {
  const chain: unknown[] = [root]
  let node: unknown = root
  for (const segment of path.slice(0, -1)) {
    const holder = node as Record<string | number, unknown>
    if (holder[segment] === undefined || holder[segment] === null || typeof holder[segment] !== 'object') {
      if (isEmpty(value)) return
      holder[segment] = {}
    }
    node = holder[segment]
    chain.push(node)
  }
  const last = path.at(-1)!
  const holder = node as Record<string | number, unknown>
  const empty = isEmpty(value) || (Array.isArray(value) && !value.length && typeof last === 'string')
  if (!empty) { holder[last] = value; return }
  if (Array.isArray(holder)) return
  delete holder[last]
  for (let index = chain.length - 1; index > 0; index--) {
    const parent = chain[index - 1] as Record<string | number, unknown>
    const key = path[index - 1]!
    if (Array.isArray(parent) || !isEmpty(chain[index])) break
    delete parent[key]
  }
}

/** Copies a value with object keys in schema order, unknown keys last. */
function ordered(value: unknown, node: SchemaNode | undefined, path: Path, root: unknown): unknown {
  if (Array.isArray(value)) return value.map((item, index) => ordered(item, nodeAt([...path, index], root), [...path, index], root))
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  const keys = propertyOrder(node, value)
  const names = [...keys.filter(key => key in record), ...Object.keys(record).filter(key => !keys.includes(key))]
  return Object.fromEntries(names.map(key => [key, ordered(record[key], nodeAt([...path, key], root), [...path, key], root)]))
}

export const schemaCommentLine = '# yaml-language-server: $schema=https://reclash.pages.dev/schemas/provider-config.schema.json'
const sectionOrder = formSections.map(section => section.key)

/** `reclash.yaml` text: `version: 1`, filled sections in manifest order, and imported routing kept verbatim. */
export function emitManifest(manifest: Manifest, routing = '', schemaComment = false): string {
  const document: Manifest = { version: 1 }
  const keys = [...sectionOrder.filter(key => key !== 'version' && key in manifest), ...Object.keys(manifest).filter(key => !sectionOrder.includes(key) && key !== excludedRoot)]
  for (const key of keys) {
    const value = key === labelsKey && typeof manifest[key] === 'object' ? compactLabels(manifest[key] as Record<string, unknown>) : manifest[key]
    if (isEmpty(value)) continue
    document[key] = ordered(value, providerSchema.properties?.[key], [key], manifest)
  }
  const head = schemaComment ? `${schemaCommentLine}\n` : ''
  return head + stringifyYaml(document) + (routing.trim() ? `${routing.replace(/\s+$/, '')}\n` : '')
}

export type LabelEntry = { title: unknown, hint?: unknown }
const labelsKey = 'power-labels'

/** A power-label state in the builder's one shape: a list of `{title, hint}`. */
export function labelEntries(value: unknown): LabelEntry[] {
  const list = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return list.map(item => item && typeof item === 'object' && 'title' in item ? item as LabelEntry : { title: item })
}

/** The shortest equivalent YAML shape: a bare title for an entry without a hint, a bare entry for a list of one. */
function compactLabels(states: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(states).flatMap(([state, value]) => {
    const entries = labelEntries(value).filter(entry => !isEmpty(entry.title) || !isEmpty(entry.hint)).map(entry => isEmpty(entry.hint) ? entry.title : entry)
    return entries.length ? [[state, entries.length === 1 ? entries[0] : entries]] : []
  }))
}

export type Imported = { manifest: Manifest, routing: string, dropped: string[] }

/** Reads an existing manifest. Keys outside the schema are dropped and listed; routing stays as written. */
export function importManifest(source: string): Imported {
  const { value, spans } = parseYaml(source)
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The file is not a YAML mapping')
  const record = value as Manifest
  const dropped: string[] = []
  const known = providerSchema.properties ?? {}
  const manifest: Manifest = {}
  for (const [key, item] of Object.entries(record)) {
    if (key === 'version' || key === excludedRoot) continue
    if (!known[key]) { dropped.push(key); continue }
    manifest[key] = prune(item, [key], record, dropped)
  }
  const labels = manifest[labelsKey]
  if (labels && typeof labels === 'object' && !Array.isArray(labels)) {
    manifest[labelsKey] = Object.fromEntries(Object.entries(labels).map(([state, value]) => [state, labelEntries(value)]))
  }
  const span = spans.get(excludedRoot)
  return { manifest, routing: span && record[excludedRoot] !== undefined ? rawSection(source, span) : '', dropped }
}

function prune(value: unknown, path: Path, root: unknown, dropped: string[]): unknown {
  if (Array.isArray(value)) return value.map((item, index) => prune(item, [...path, index], root, dropped))
  if (!value || typeof value !== 'object') return value
  const node = nodeAt(path, root)
  const keys = propertyOrder(node, value)
  const free = node && !keys.length
  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (free || keys.includes(key)) out[key] = prune(item, [...path, key], root, dropped)
    else dropped.push([...path, key].join('.'))
  }
  return out
}

export type Fragment = { manifest: Manifest, routing: string, url: string }
const fragmentKey = 'm='

function toBase64Url(bytes: Uint8Array): string {
  let text = ''
  for (let index = 0; index < bytes.length; index += 0x8000) text += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit: number): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(stream).getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) {
        await reader.cancel()
        throw new Error('Builder draft is too large')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const output = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength }
  return output
}

function checkManifest(value: unknown): asserts value is Manifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Unsupported builder link')
  const queue: Array<{ value: unknown, depth: number }> = [{ value, depth: 0 }]
  while (queue.length) {
    const item = queue.pop()!
    if (!item.value || typeof item.value !== 'object') continue
    if (item.depth > 64) throw new Error('Builder draft is too deeply nested')
    for (const child of Object.values(item.value)) queue.push({ value: child, depth: item.depth + 1 })
  }
}

export async function encodeFragment(state: Fragment): Promise<string> {
  checkManifest(state.manifest)
  const json = JSON.stringify({ v: 1, m: state.manifest, r: state.routing || undefined, u: state.url || undefined })
  const bytes = new TextEncoder().encode(json)
  if (bytes.byteLength > draftLimit) throw new Error('Builder draft is too large')
  return fragmentKey + toBase64Url(await pipe(bytes, new CompressionStream('deflate'), draftLimit * 2))
}

/** Undefined for a fragment that is not builder state, so unrelated anchors are left alone. */
export async function decodeFragment(hash: string): Promise<Fragment | undefined> {
  const text = hash.replace(/^#/, '')
  if (!text.startsWith(fragmentKey)) return undefined
  const payload = text.slice(fragmentKey.length)
  if (payload.length > draftLimit * 2) throw new Error('Builder draft is too large')
  if (!/^[\w-]+$/.test(payload)) throw new Error('Unsupported builder link')
  const base = payload.replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(base + '='.repeat((4 - base.length % 4) % 4)), c => c.charCodeAt(0))
  const decoded = await pipe(bytes, new DecompressionStream('deflate'), draftLimit)
  const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decoded))
  if (!data || data.v !== 1 || (data.r !== undefined && typeof data.r !== 'string') || (data.u !== undefined && typeof data.u !== 'string')) throw new Error('Unsupported builder link')
  checkManifest(data.m)
  return { manifest: data.m, routing: data.r ?? '', url: data.u ?? '' }
}

export const isBuilderFragment = (hash: string) => hash.replace(/^#/, '').startsWith(fragmentKey)
