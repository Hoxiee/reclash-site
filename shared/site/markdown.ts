// GitHub-flavoured Markdown for release notes, parsed into a small typed tree.
// Pure and bounded: no DOM and no HTML output. Raw HTML stays text, only http(s) links survive,
// and input length, nesting depth and node count are capped.

export type MdInline =
  | { type: 'text', text: string }
  | { type: 'code', text: string }
  | { type: 'break' }
  | { type: 'strong', children: MdInline[] }
  | { type: 'em', children: MdInline[] }
  | { type: 'del', children: MdInline[] }
  | { type: 'link', href: string, children: MdInline[] }

/** `checked` is set only for task-list items. */
export type MdListItem = { checked?: boolean, blocks: MdBlock[] }
export type MdList = { type: 'list', ordered: boolean, start: number, items: MdListItem[] }
export type MdAlert = 'note' | 'tip' | 'important' | 'warning' | 'caution'

export type MdBlock =
  | { type: 'heading', level: number, content: MdInline[] }
  | { type: 'paragraph', content: MdInline[] }
  | { type: 'code', lang: string, text: string }
  | { type: 'quote', alert?: MdAlert, children: MdBlock[] }
  | { type: 'rule' }
  | MdList

export type MdDocument = { blocks: MdBlock[], truncated: boolean }
export type MdOptions = {
  /** Characters read from the source; the rest is dropped and `truncated` is set. */
  maxLength?: number,
  /** Blocks plus inline nodes; parsing stops once the budget is spent. */
  maxNodes?: number,
  /** `owner/name` for short GitHub links and bare `#123` references. */
  repo?: string,
}

export const MD_MAX_LENGTH = 20000
export const MD_MAX_NODES = 3000
const MAX_DEPTH = 4

type Context = { nodes: number, max: number, truncated: boolean, repo: string }

function spend(ctx: Context) {
  if (ctx.nodes >= ctx.max) { ctx.truncated = true; return false }
  ctx.nodes++
  return true
}

/* ---------- blocks ---------- */

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)/
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/
const QUOTE = /^ {0,3}> ?(.*)$/
const ITEM = /^( *)([-*+]|\d{1,9}[.)])(?:([ \t]+)(.*))?$/
const TASK = /^\[([ xX])\](?:[ \t]+|$)/
const ALERT = /^\[!(note|tip|important|warning|caution)\]$/i

const indentOf = (line: string) => line.length - line.trimStart().length
const blank = (line: string) => !line.trim()
const ordered = (marker: string) => /\d/.test(marker)
const language = (info = '') => info.replace(/[^\w+#.-]/g, '').slice(0, 24).toLowerCase()

/** Lines that end a paragraph: CommonMark lets only non-empty bullets or `1.` interrupt one. */
function interrupts(line: string) {
  if (FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line)) return true
  const item = ITEM.exec(line)
  return !!item && !!item[4]?.trim() && (!ordered(item[2]!) || Number.parseInt(item[2]!, 10) === 1)
}

function parseBlocks(lines: string[], ctx: Context, depth: number): MdBlock[] {
  const blocks: MdBlock[] = []
  if (depth > MAX_DEPTH) {
    const content = paragraph(lines, ctx, depth)
    if (content.length) blocks.push({ type: 'paragraph', content })
    return blocks
  }
  const push = (block: MdBlock) => { if (spend(ctx)) blocks.push(block) }
  let i = 0
  while (i < lines.length && !ctx.truncated) {
    const line = lines[i]!
    if (blank(line)) { i++; continue }
    let match: RegExpExecArray | null

    if ((match = FENCE.exec(line))) {
      const marker = match[1]!, indent = indentOf(line), body: string[] = []
      i++
      while (i < lines.length) {
        const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(lines[i]!)
        if (close && close[1]![0] === marker[0] && close[1]!.length >= marker.length) { i++; break }
        body.push(lines[i]!.slice(Math.min(indent, indentOf(lines[i]!))))
        i++
      }
      push({ type: 'code', lang: language(match[2]), text: body.join('\n') })
      continue
    }

    if ((match = HEADING.exec(line))) {
      const content = paragraph([match[2] ?? ''], ctx, depth)
      if (content.length) blocks.push({ type: 'heading', level: match[1]!.length, content })
      i++
      continue
    }

    if (RULE.test(line)) { push({ type: 'rule' }); i++; continue }

    if (QUOTE.test(line)) {
      const inner: string[] = []
      while (i < lines.length && !blank(lines[i]!)) {
        const quoted = QUOTE.exec(lines[i]!)
        if (quoted) inner.push(quoted[1]!)
        else if (!interrupts(lines[i]!)) inner.push(lines[i]!)  // lazy continuation
        else break
        i++
      }
      const alert = ALERT.exec(inner[0]?.trim() ?? '')
      if (alert) inner.shift()
      if (!spend(ctx)) break
      const quote: MdBlock = { type: 'quote', children: parseBlocks(inner, ctx, depth + 1) }
      if (alert) quote.alert = alert[1]!.toLowerCase() as MdAlert
      blocks.push(quote)
      continue
    }

    if (ITEM.test(line)) {
      const { list, next } = parseList(lines, i, ctx, depth)
      if (list.items.length) blocks.push(list)
      i = next
      continue
    }

    const para: string[] = []
    let level = 0
    while (i < lines.length && !blank(lines[i]!)) {
      const setext = para.length ? SETEXT.exec(lines[i]!) : null
      if (setext) { level = setext[1]![0] === '=' ? 1 : 2; i++; break }
      if (para.length && interrupts(lines[i]!)) break
      para.push(lines[i]!)
      i++
    }
    const content = paragraph(para, ctx, depth)
    if (content.length) blocks.push(level ? { type: 'heading', level, content } : { type: 'paragraph', content })
  }
  return blocks
}

/**
 * Inline content of a paragraph or heading, with the block's own node spent first so a long
 * paragraph keeps the content that fits. Empty when only stripped HTML or breaks remain.
 */
function paragraph(lines: string[], ctx: Context, depth: number): MdInline[] {
  if (!spend(ctx)) return []
  const content = inline(lines.map(line => line.trim().replace(/\\$/, '')).join('\n'), ctx, depth)
  const empty = (node?: MdInline) => node?.type === 'break' || (node?.type === 'text' && !node.text.trim())
  while (content.length && empty(content[0])) content.shift()
  while (content.length && empty(content.at(-1))) content.pop()
  return content
}

/*
 * One list and its items. Sibling markers may drift by a space; anything indented two or more
 * columns past the marker belongs to the item and is parsed as blocks, which gives nested lists.
 */
function parseList(lines: string[], start: number, ctx: Context, depth: number) {
  const head = ITEM.exec(lines[start]!)!
  const isOrdered = ordered(head[2]!)
  const list: MdList = { type: 'list', ordered: isOrdered, start: isOrdered ? Number.parseInt(head[2]!, 10) : 1, items: [] }
  const sources: Array<{ base: number, width: number, checked?: boolean, lines: string[] }> = []
  let current: (typeof sources)[number] | undefined
  let gap = false, i = start
  while (i < lines.length) {
    const line = lines[i]!
    if (blank(line)) { gap = true; i++; continue }
    const indent = indentOf(line)
    const item = RULE.test(line) ? null : ITEM.exec(line)
    if (item && (!current || indent <= current.base + 1)) {
      if (ordered(item[2]!) !== isOrdered) break
      const spaces = item[3]?.length ?? 0
      const width = indent + item[2]!.length + (spaces >= 1 && spaces <= 4 ? spaces : 1)
      let text = item[4] ?? ''
      current = { base: indent, width, lines: [] }
      const task = TASK.exec(text)
      if (task) { current.checked = task[1] !== ' '; text = text.slice(task[0].length) }
      current.lines.push(text)
      sources.push(current)
      gap = false
      i++
      continue
    }
    if (current && indent >= current.base + 2) {
      if (gap) current.lines.push('')
      current.lines.push(line.slice(Math.min(indent, current.width)))
    } else if (current && !gap && !interrupts(line)) {
      current.lines.push(line.trim())
    } else break
    gap = false
    i++
  }
  for (const source of sources) {
    if (!spend(ctx)) break
    const entry: MdListItem = { blocks: parseBlocks(source.lines, ctx, depth + 1) }
    if (source.checked !== undefined) entry.checked = source.checked
    list.items.push(entry)
  }
  return { list, next: i }
}

/* ---------- inline ---------- */

const PUNCT = /[!-/:-@[-`{-~]/
const WORD = /[\p{L}\p{N}_]/u
const ALNUM = /[\p{L}\p{N}]/u
const SPACE = /\s/
const URL_START = /^https?:\/\/[^\s<]+/i
const MENTION = /^@([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})(?![\w/-])/i
const REFERENCE = /^#(\d{1,7})(?![\w-])/
const AUTOLINK = /^<(https?:\/\/[^\s<>]+)>/i
const ENTITY = /^&(?:#x[\da-f]{1,6}|#\d{1,7}|[a-z]{2,8});/i
const COMMENT = /^<!--[\s\S]*?-->/
const TAG = /^<(\/?)([a-z][\w-]*)((?:\s[^<>]*)?)\/?>/i
const STRIPPED = new Set(['a', 'b', 'blockquote', 'center', 'code', 'del', 'details', 'div', 'em', 'font', 'g-emoji', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'i', 'ins', 'kbd', 'li', 'ol', 'p', 'picture', 'pre', 's', 'small', 'source', 'span', 'strike', 'strong', 'sub', 'summary',
  'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul', 'video'])
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', copy: '©' }

const wordBefore = (src: string, i: number) => i > 0 && WORD.test(src[i - 1]!)
const runOf = (src: string, i: number, char: string) => { let end = i; while (src[end] === char) end++; return end - i }

function decode(text: string) {
  return text.replace(/&(#x[\da-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, (entity, name: string) => {
    if (name[0] !== '#') return ENTITIES[name.toLowerCase()] ?? entity
    const code = name[1] === 'x' || name[1] === 'X' ? Number.parseInt(name.slice(2), 16) : Number.parseInt(name.slice(1), 10)
    return code > 0 && code < 0x110000 && (code < 0xd800 || code > 0xdfff) ? String.fromCodePoint(code) : entity
  })
}

/** The URL if it is an absolute http(s) address, otherwise null. */
export function safeUrl(raw: string): string | null {
  const value = raw.trim()
  if (!/^https?:\/\//i.test(value)) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch { return null }
}

/** GitHub pull, issue, compare and commit URLs as GitHub shows them: `#12`, `v1.2.2...v1.2.3`. */
export function shortGitHubLabel(href: string, repo = ''): string | null {
  const match = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(pull|issues|compare|commit)\/([^?#/\s]+)\/?(?:[?#].*)?$/i.exec(href)
  if (!match) return null
  const [, owner, kind, id] = match
  const prefix = owner!.toLowerCase() === repo.toLowerCase() ? '' : owner!
  if (kind === 'pull' || kind === 'issues') return /^\d+$/.test(id!) ? `${prefix}#${id}` : null
  if (kind === 'commit') return /^[\da-f]{7,40}$/i.test(id!) ? `${prefix ? `${prefix}@` : ''}${id!.slice(0, 7)}` : null
  let range = id!
  try { range = decodeURIComponent(id!) } catch { /* Keep the raw range. */ }
  return prefix ? `${prefix}@${range}` : range
}

/** `[text](url "title")` starting at `src[i] === '['`. */
function linkAt(src: string, i: number) {
  let depth = 0, j = i
  for (; j < src.length && j - i < 1000; j++) {
    const char = src[j]
    if (char === '\\') { j++; continue }
    if (char === '[') depth++
    else if (char === ']' && --depth === 0) break
  }
  if (src[j] !== ']' || src[j + 1] !== '(') return null
  let k = j + 2
  while (src[k] === ' ') k++
  let url = ''
  if (src[k] === '<') {
    const end = src.indexOf('>', k)
    if (end < 0 || src.slice(k, end).includes('\n')) return null
    url = src.slice(k + 1, end)
    k = end + 1
  } else {
    let parens = 0, from = k
    for (; k < src.length && k - from < 2000; k++) {
      const char = src[k]!
      if (char === '\\') { k++; continue }
      if (SPACE.test(char)) break
      if (char === '(') parens++
      else if (char === ')' && parens-- === 0) break
    }
    url = src.slice(from, k)
  }
  while (src[k] === ' ') k++
  const quote = src[k]
  if (quote === '"' || quote === '\'') {
    const end = src.indexOf(quote, k + 1)
    if (end < 0) return null
    k = end + 1
    while (src[k] === ' ') k++
  }
  if (src[k] !== ')') return null
  return { text: src.slice(i + 1, j), url: url.replace(/\\([!-/:-@[-`{-~])/g, '$1'), end: k + 1 }
}

/**
 * The closing delimiter for emphasis opened before `from`, or -1. Whether a run can close does not
 * depend on the opener, so `misses` remembers where a delimiter has none left and keeps this linear.
 */
function closer(src: string, from: number, delim: string, misses: Map<string, number>) {
  if (from >= (misses.get(delim) ?? Infinity)) return -1
  const char = delim[0]!
  let k = from
  while ((k = src.indexOf(delim, k)) !== -1) {
    const run = runOf(src, k, char)
    const start = k
    k += run
    if (char === '~' ? run !== delim.length : delim.length === 1 ? run === 2 : false) continue
    const end = start + run - delim.length  // `***x***` closes on the last pair
    if (end <= from - 1 || SPACE.test(src[end - 1] ?? ' ')) continue
    if (char === '_' && ALNUM.test(src[end + delim.length] ?? '')) continue
    return end
  }
  misses.set(delim, from)
  return -1
}

function inline(src: string, ctx: Context, depth: number, links = true): MdInline[] {
  const out: MdInline[] = []
  let text = ''
  const flush = () => {
    const last = out.at(-1)
    if (text && last?.type === 'text') last.text += decode(text)
    else if (text && spend(ctx)) out.push({ type: 'text', text: decode(text) })
    text = ''
  }
  const push = (node: MdInline) => { flush(); if (spend(ctx)) out.push(node) }
  const link = (href: string, label: MdInline[]) => push({ type: 'link', href, children: label })
  const nested = (part: string, noLinks = !links) => depth < MAX_DEPTH + 2 ? inline(part, ctx, depth + 1, !noLinks) : [{ type: 'text', text: decode(part) } as MdInline]

  const ahead = (at: number) => src.slice(at, at + 2048)
  const misses = new Map<string, number>()
  let i = 0
  while (i < src.length && !ctx.truncated) {
    const char = src[i]!
    let match: RegExpExecArray | null

    if (char === '\\' && i + 1 < src.length && PUNCT.test(src[i + 1]!)) { text += src[i + 1]; i += 2; continue }
    if (char === '\n') { push({ type: 'break' }); i++; continue }
    if (char === '&' && (match = ENTITY.exec(ahead(i)))) { text += match[0]; i += match[0].length; continue }

    if (char === '`') {
      const run = runOf(src, i, '`')
      let k = i + run, close = -1
      while ((k = src.indexOf('`'.repeat(run), k)) !== -1) {
        const length = runOf(src, k, '`')
        if (length === run) { close = k; break }
        k += length
      }
      if (close < 0) { text += '`'.repeat(run); i += run; continue }
      let code = src.slice(i + run, close).replace(/\n/g, ' ')
      if (code.length > 2 && code.startsWith(' ') && code.endsWith(' ') && code.trim()) code = code.slice(1, -1)
      push({ type: 'code', text: code })
      i = close + run
      continue
    }

    if (char === '!' && src[i + 1] === '[') {
      const image = linkAt(src, i + 1)
      if (image) {
        // Images are never loaded: they become a link labelled with their alt text.
        const href = links ? safeUrl(image.url) : null
        const alt = decode(image.text.replace(/\\([!-/:-@[-`{-~])/g, '$1')).trim() || href || ''
        if (href) link(href, [{ type: 'text', text: alt }])
        else text += alt
        i = image.end
        continue
      }
    }

    if (char === '[' && links) {
      const target = linkAt(src, i)
      if (target) {
        const href = safeUrl(target.url)
        const label = nested(target.text, true)
        if (href) link(href, label.length ? label : [{ type: 'text', text: href }])
        else {
          flush()
          for (const node of label) {
            const last = out.at(-1)
            if (node.type === 'text' && last?.type === 'text') last.text += node.text
            else out.push(node)
          }
        }
        i = target.end
        continue
      }
    }

    if (char === '<') {
      if (links && (match = AUTOLINK.exec(ahead(i)))) {
        const href = safeUrl(match[1]!)
        if (href) { link(href, [{ type: 'text', text: shortGitHubLabel(href, ctx.repo) ?? match[1]! }]); i += match[0].length; continue }
      }
      if ((match = COMMENT.exec(src.slice(i, i + 20000)))) { i += match[0].length; continue }
      if ((match = TAG.exec(ahead(i)))) {
        const name = match[2]!.toLowerCase()
        if (name === 'br') { push({ type: 'break' }); i += match[0].length; continue }
        if (name === 'img' || name === 'hr') {
          const attr = (key: string) => new RegExp(`\\s${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(match![3]!)?.slice(1).find(value => value !== undefined) ?? ''
          const href = name === 'img' && links ? safeUrl(decode(attr('src'))) : null
          const alt = decode(attr('alt')).trim()
          if (href) link(href, [{ type: 'text', text: alt || href }])
          else text += alt
          i += match[0].length
          continue
        }
        if (STRIPPED.has(name)) { i += match[0].length; continue }
      }
    }

    if ((char === '*' || char === '_' || char === '~') && !(char === '_' && wordBefore(src, i))) {
      const run = runOf(src, i, char)
      const size = char === '~' ? (run <= 2 ? run : 0) : Math.min(run, 2)
      const open = i + size
      if (size && src[open] && !SPACE.test(src[open]!)) {
        const delim = char.repeat(size)
        const end = closer(src, open + 1, delim, misses)
        if (end > open) {
          const children = nested(src.slice(open, end))
          push(char === '~' ? { type: 'del', children } : size === 2 ? { type: 'strong', children } : { type: 'em', children })
          i = end + size
          continue
        }
      }
      // Without a closer the run is text; a shorter run inside it may still pair up.
      const literal = char === '~' ? run : 1
      text += char.repeat(literal)
      i += literal
      continue
    }

    if (links && (char === 'h' || char === 'H') && !wordBefore(src, i) && (match = URL_START.exec(ahead(i)))) {
      let raw = match[0]
      // Trailing punctuation and unbalanced closing parentheses stay outside the link.
      for (;;) {
        const trimmed = raw.replace(/[.,:;!?'"*_~]+$/, '')
        const extra = trimmed.endsWith(')') && (trimmed.match(/\)/g)?.length ?? 0) > (trimmed.match(/\(/g)?.length ?? 0)
        const next = extra ? trimmed.slice(0, -1) : trimmed
        if (next === raw) break
        raw = next
      }
      const href = safeUrl(raw)
      if (href) { link(href, [{ type: 'text', text: shortGitHubLabel(href, ctx.repo) ?? raw }]); i += raw.length; continue }
    }

    if (links && char === '@' && !wordBefore(src, i) && (match = MENTION.exec(ahead(i)))) {
      link(`https://github.com/${match[1]}`, [{ type: 'text', text: match[0] }])
      i += match[0].length
      continue
    }

    if (links && char === '#' && ctx.repo && !wordBefore(src, i) && (match = REFERENCE.exec(ahead(i)))) {
      link(`https://github.com/${ctx.repo}/issues/${match[1]}`, [{ type: 'text', text: match[0] }])
      i += match[0].length
      continue
    }

    text += char
    i++
  }
  flush()
  return out
}

/** Parses a release body. The result holds only typed nodes; render it as text, never as HTML. */
export function parseMarkdown(source: string, options: MdOptions = {}): MdDocument {
  const maxLength = options.maxLength ?? MD_MAX_LENGTH
  const ctx: Context = { nodes: 0, max: options.maxNodes ?? MD_MAX_NODES, truncated: false, repo: options.repo ?? '' }
  let text = source.slice(0, maxLength)
  if (/[\ud800-\udbff]$/.test(text)) text = text.slice(0, -1)
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/^\t+/, tabs => '    '.repeat(tabs.length)))
  const blocks = parseBlocks(lines, ctx, 0)
  return { blocks, truncated: ctx.truncated || source.length > maxLength }
}
