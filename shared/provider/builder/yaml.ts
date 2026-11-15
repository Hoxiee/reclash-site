// A small YAML reader and writer for the manifest: block and flow collections, quoted and block
// scalars. Anchors, aliases and tags are refused, as the app refuses them.
export class YamlError extends Error {
  readonly line: number
  constructor(message: string, line: number) { super(`${message} (line ${line + 1})`); this.line = line }
}

export type YamlParse = { value: unknown, spans: Map<string, [number, number]> }

const indentOf = (line: string) => line.length - line.trimStart().length

function stripComment(line: string): string {
  let quote = ''
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quote) {
      if (c === '\\' && quote === '"') i++
      else if (c === quote) quote = ''
    } else if (c === '"' || c === '\'') {
      if (i === 0 || /[\s[{,:-]/.test(line[i - 1]!)) quote = c
    } else if (c === '#' && (i === 0 || /\s/.test(line[i - 1]!))) return line.slice(0, i).trimEnd()
  }
  return line.trimEnd()
}

function plain(text: string): unknown {
  if (/^(?:~|null|Null|NULL)?$/.test(text)) return null
  if (/^(?:true|True|TRUE)$/.test(text)) return true
  if (/^(?:false|False|FALSE)$/.test(text)) return false
  if (/^[-+]?\d+$/.test(text)) return Number(text)
  if (/^0x[0-9a-fA-F]+$/.test(text)) return Number.parseInt(text.slice(2), 16)
  if (/^0o[0-7]+$/.test(text)) return Number.parseInt(text.slice(2), 8)
  if (/^[-+]?(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][-+]?\d+)?$/.test(text)) return Number(text)
  if (/^[-+]?\.(?:inf|Inf|INF)$/.test(text)) return text.startsWith('-') ? -Infinity : Infinity
  if (/^\.(?:nan|NaN|NAN)$/.test(text)) return Number.NaN
  return text
}

const escapes: Record<string, string> = { '0': '\0', a: '\x07', b: '\b', t: '\t', '\t': '\t', n: '\n', v: '\v', f: '\f', r: '\r', e: '\x1b', ' ': ' ', '"': '"', '/': '/', '\\': '\\', N: '\x85', _: '\xa0', L: '\u2028', P: '\u2029' }

/** Reads a quoted scalar at `start`; returns the value and the index after the closing quote. */
function quoted(text: string, start: number, line: number): [string, number] {
  const quote = text[start]
  let out = ''
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i]!
    if (quote === '\'') {
      if (c === '\'') { if (text[i + 1] === '\'') { out += '\''; i++; continue } return [out, i + 1] }
      out += c
    } else if (c === '"') return [out, i + 1]
    else if (c === '\\') {
      const next = text[++i]!
      const width = next === 'x' ? 2 : next === 'u' ? 4 : next === 'U' ? 8 : 0
      if (width) { out += String.fromCodePoint(Number.parseInt(text.slice(i + 1, i + 1 + width), 16)); i += width }
      else if (next in escapes) out += escapes[next]
      else throw new YamlError(`Unknown escape \\${next}`, line)
    } else out += c
  }
  throw new YamlError('Unclosed quote', line)
}

function guard(text: string, line: number): void {
  if (/^[&*!]/.test(text)) throw new YamlError('Anchors, aliases and tags are not supported', line)
}

function scalar(text: string, line: number): unknown {
  guard(text, line)
  if (text.startsWith('"') || text.startsWith('\'')) {
    const [value, end] = quoted(text, 0, line)
    if (text.slice(end).trim()) throw new YamlError('Unexpected text after a quoted value', line)
    return value
  }
  if (text.startsWith('|') || text.startsWith('>')) throw new YamlError('Unexpected block scalar', line)
  return plain(text)
}

function flow(text: string, line: number): unknown {
  let i = 0
  const space = () => { while (i < text.length && /\s/.test(text[i]!)) i++ }
  const item = (): unknown => {
    space()
    const c = text[i]
    if (c === '[') {
      i++
      const list: unknown[] = []
      for (space(); text[i] !== ']'; space()) {
        if (i >= text.length) throw new YamlError('Unclosed [', line)
        list.push(item()); space()
        if (text[i] === ',') i++
        else if (text[i] !== ']') throw new YamlError('Expected , or ]', line)
      }
      i++
      return list
    }
    if (c === '{') {
      i++
      const map: Record<string, unknown> = {}
      for (space(); text[i] !== '}'; space()) {
        if (i >= text.length) throw new YamlError('Unclosed {', line)
        const key = item()
        space()
        let value: unknown = null
        if (text[i] === ':') { i++; value = item() }
        const name = String(key)
        if (Object.hasOwn(map, name)) throw new YamlError(`Duplicate key ${name}`, line)
        map[name] = value
        space()
        if (text[i] === ',') i++
        else if (text[i] !== '}') throw new YamlError('Expected , or }', line)
      }
      i++
      return map
    }
    if (c === '"' || c === '\'') { const [value, end] = quoted(text, i, line); i = end; return value }
    const start = i
    while (i < text.length && !/[,\]}]/.test(text[i]!) && !(text[i] === ':' && (i + 1 === text.length || /[\s,\]}]/.test(text[i + 1]!)))) i++
    const raw = text.slice(start, i).trim()
    guard(raw, line)
    return plain(raw)
  }
  const value = item()
  space()
  if (i < text.length) throw new YamlError('Unexpected text after a flow collection', line)
  return value
}

/** Index of the `key: value` colon outside quotes and brackets, or -1. */
function colonAt(text: string): number {
  let quote = '', depth = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) { if (c === '\\' && quote === '"') i++; else if (c === quote) quote = ''; continue }
    if ((c === '"' || c === '\'') && i === 0) quote = c
    else if (c === '[' || c === '{') depth++
    else if (c === ']' || c === '}') depth--
    else if (c === ':' && !depth && (i + 1 === text.length || text[i + 1] === ' ')) return i
  }
  return -1
}

export function parseYaml(source: string): YamlParse {
  const raw = source.replace(/^\ufeff/, '').split(/\r?\n/)
  const lines = raw.map(stripComment)
  const spans = new Map<string, [number, number]>()
  let at = 0
  const skip = () => { while (at < lines.length && !lines[at]!.trim()) at++ }
  skip()
  if (lines[at]?.trim() === '---') { at++; skip() }
  for (const [index, line] of lines.entries()) if (line.trim() && /\t/.test(line.slice(0, indentOf(line)))) throw new YamlError('Tabs are not allowed for indentation', index)

  const block = (style: string, parent: number): string => {
    const header = /^([|>])([+-]?)(\d?)([+-]?)$/.exec(style)
    if (!header) throw new YamlError('Bad block scalar header', at - 1)
    const chomp = header[2] || header[4]
    const body: string[] = []
    let width = header[3] ? parent + Number(header[3]) : -1
    while (at < raw.length) {
      const text = raw[at]!
      if (text.trim()) {
        if (width < 0) width = indentOf(text)
        if (indentOf(text) < width || width <= parent) break
        body.push(text.slice(width))
      } else body.push('')
      at++
    }
    while (body.length && !body.at(-1)) { body.pop(); at-- }
    skip()
    let text = header[1] === '|' ? body.join('\n') : body.reduce((acc, item, index) => {
      const previous = body[index - 1]
      if (!index) return item
      if (!item) return `${acc}\n`
      return acc + (previous === '' ? '' : /^\s/.test(item) || /^\s/.test(previous!) ? '\n' : ' ') + item
    }, '')
    if (chomp !== '-') text += '\n'
    return text
  }

  const value = (rest: string, indent: number, line: number): unknown => {
    if (!rest) {
      skip()
      const next = lines[at]
      if (next === undefined) return null
      const nested = indentOf(next)
      if (nested > indent || (nested === indent && /^-(?:\s|$)/.test(next.trimStart()))) return node(nested)
      return null
    }
    if (rest.startsWith('|') || rest.startsWith('>')) return block(rest, indent)
    if (rest.startsWith('[') || rest.startsWith('{')) {
      let text = rest
      let balance = (s: string) => [...s].reduce((n, c) => n + (c === '[' || c === '{' ? 1 : c === ']' || c === '}' ? -1 : 0), 0)
      let depth = balance(text)
      while (depth > 0 && at < lines.length) { const more = lines[at++]!.trim(); text += ' ' + more; depth += balance(more) }
      skip()
      return flow(text, line)
    }
    skip()
    return scalar(rest, line)
  }

  const node = (indent: number): unknown => {
    const first = lines[at]!
    const isList = /^-(?:\s|$)/.test(first.trimStart())
    if (isList) {
      const list: unknown[] = []
      while (at < lines.length && indentOf(lines[at]!) === indent && /^-(?:\s|$)/.test(lines[at]!.trimStart())) {
        const line = at
        const rest = lines[at]!.slice(indent + 1).trimStart()
        if (!rest) { at++; list.push(value('', indent, line)); continue }
        const inner = indent + (lines[at]!.length - indent - rest.length)
        if (colonAt(rest) > 0 && !rest.startsWith('[') && !rest.startsWith('{')) {
          lines[at] = ' '.repeat(inner) + rest
          list.push(node(inner))
        } else { at++; list.push(value(rest, indent, line)) }
      }
      return list
    }
    if (colonAt(first.trim()) <= 0) {
      const line = at++
      skip()
      return scalar(first.trim(), line)
    }
    const map: Record<string, unknown> = {}
    while (at < lines.length && indentOf(lines[at]!) === indent) {
      const text = lines[at]!.trim()
      if (/^-(?:\s|$)/.test(text)) break
      const colon = colonAt(text)
      if (colon <= 0) throw new YamlError('Expected key: value', at)
      const keyText = text.slice(0, colon).trim()
      guard(keyText, at)
      const key = keyText.startsWith('"') || keyText.startsWith('\'') ? quoted(keyText, 0, at)[0] : keyText
      if (Object.hasOwn(map, key)) throw new YamlError(`Duplicate key ${key}`, at)
      const line = at++
      map[key] = value(text.slice(colon + 1).trim(), indent, line)
      if (!indent) spans.set(key, [line, at])
    }
    if (at < lines.length && indentOf(lines[at]!) > indent) throw new YamlError('Unexpected indentation', at)
    return map
  }

  if (at >= lines.length) return { value: null, spans }
  const result = node(indentOf(lines[at]!))
  skip()
  if (lines[at]?.trim() === '...') { at++; skip() }
  if (at < lines.length) throw new YamlError('Unexpected content', at)
  return { value: result, spans }
}

/** The original text of a top-level key and its block, without the blank lines after it. */
export function rawSection(source: string, span: [number, number]): string {
  const lines = source.replace(/^\ufeff/, '').split(/\r?\n/).slice(span[0], span[1])
  while (lines.length && !lines.at(-1)!.trim()) lines.pop()
  return lines.join('\n')
}

const reserved = /^(?:~|null|true|false|yes|no|on|off|y|n)$/i
const numeric = /^[-+]?(?:\d[\d_]*(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$|^0[xXoObB]|^[-+]?\.(?:inf|nan)$|^\d{4}-\d\d-\d\d/i

export function yamlString(text: string): string {
  const safe = text !== '' && text === text.trim() && !reserved.test(text) && !numeric.test(text)
    && !/^[-?:,[\]{}#&*!|>'"%@`]/.test(text) && !/: |\s#|:$/.test(text) && !/[\x00-\x1f\x7f\u0085\u2028\u2029\ufeff]/.test(text)
  return safe ? text : JSON.stringify(text).replace(/[\u0085\u2028\u2029]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

const keyText = (key: string) => yamlString(key)

function scalarText(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return yamlString(value)
  return String(value)
}

const isBlock = (value: unknown) => typeof value === 'string' && value.includes('\n') && !/[\x00-\x09\x0b-\x1f\x7f]/.test(value) && !/^\s/.test(value) && !/ \n|\s$/.test(value.replace(/\n+$/, ''))

function blockLines(text: string, indent: string): string[] {
  const chomp = text.endsWith('\n') ? (text.endsWith('\n\n') ? '+' : '') : '-'
  const body = text.replace(/\n$/, '').split('\n')
  return [`|${chomp}`, ...body.map(line => line ? indent + line : '')]
}

function emit(value: unknown, indent: string): string[] {
  if (Array.isArray(value)) {
    if (!value.length) return [`${indent}[]`]
    return value.flatMap(item => {
      if (item && typeof item === 'object' && (Array.isArray(item) ? item.length : Object.keys(item).length)) {
        const inner = emit(item, `${indent}  `)
        return [`${indent}- ${inner[0]!.trimStart()}`, ...inner.slice(1)]
      }
      if (isBlock(item)) { const [head, ...rest] = blockLines(item as string, `${indent}  `); return [`${indent}- ${head}`, ...rest] }
      return [`${indent}- ${item && typeof item === 'object' ? (Array.isArray(item) ? '[]' : '{}') : scalarText(item)}`]
    })
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined)
    if (!entries.length) return [`${indent}{}`]
    return entries.flatMap(([key, item]) => {
      const name = `${indent}${keyText(key)}:`
      if (item && typeof item === 'object') {
        const empty = Array.isArray(item) ? !item.length : !Object.keys(item).length
        if (empty) return [`${name} ${Array.isArray(item) ? '[]' : '{}'}`]
        return [name, ...emit(item, `${indent}  `)]
      }
      if (isBlock(item)) { const [head, ...rest] = blockLines(item as string, `${indent}  `); return [`${name} ${head}`, ...rest] }
      return [`${name} ${scalarText(item)}`]
    })
  }
  return [`${indent}${scalarText(value)}`]
}

/** Plain block YAML with no anchors; key order is the caller's. */
export function stringifyYaml(value: unknown): string {
  return `${emit(value, '').join('\n')}\n`
}
