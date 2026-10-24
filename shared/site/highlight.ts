/*
 * A small line tokenizer for the snippets the site shows: HTTP response headers, YAML
 * profiles, shell and PowerShell commands, nginx directives and bare URLs. It only colours
 * text; the output joins back to the input exactly, so copying stays byte-for-byte.
 */
export type CodeLanguage = 'http' | 'yaml' | 'shell' | 'powershell' | 'nginx' | 'url' | 'text'
export type TokenKind = 'key' | 'brand' | 'str' | 'num' | 'com' | 'kw' | 'fn' | 'var' | 'url' | 'punc' | 'text'
export type Token = { kind: TokenKind, text: string }
type Rule = [RegExp, TokenKind | ((match: RegExpExecArray) => Token[])]

const MAX = 40_000

/** Picks a language from a label such as `nebula.yaml` or from the snippet itself. */
export function detectLanguage(code: string, hint = ''): CodeLanguage {
  const label = hint.toLowerCase()
  if (/\.ya?ml\b|\byaml\b/.test(label)) return 'yaml'
  if (/nginx/.test(label)) return 'nginx'
  if (/powershell/.test(label)) return 'powershell'
  const lines = code.split('\n').map(line => line.trimEnd()).filter(Boolean)
  if (!lines.length) return 'text'
  if (lines.length === 1 && /^[a-z][\w+.-]*:\/\/\S+$/i.test(lines[0]!)) return 'url'
  if (/^HTTP\/\d/.test(lines[0]!)) return 'http'
  if (lines.some(line => /^\s*add_header\s|^\s*(?:location|server)\b.*\{$/.test(line))) return 'nginx'
  if (lines.some(line => /^\s*[A-Z][a-z]+-[A-Z][A-Za-z]+\b/.test(line) && !/:\s/.test(line))) return 'powershell'
  if (lines.some(line => /^\s*(?:\$\s|#\s|curl|git|cd|npm|npx|dart|flutter|sha256sum|wget|chmod|sudo)\b/.test(line))) return 'shell'
  if (lines.some(line => /^\s+\S|^\s*- /.test(line))) return 'yaml'
  if (lines.every(line => /^[A-Za-z][\w-]*:\s/.test(line))) return 'http'
  if (lines.every(line => /^\s*(?:#.*|[\w.-]+:(?:\s.*)?)$/.test(line))) return 'yaml'
  return 'text'
}

// Runs the rules left to right at every position; text between matches stays plain.
function scan(text: string, rules: Rule[]): Token[] {
  const out: Token[] = []
  let at = 0, plain = ''
  outer: while (at < text.length) {
    for (const [pattern, kind] of rules) {
      pattern.lastIndex = at
      const match = pattern.exec(text)
      if (!match || match.index !== at || !match[0]) continue
      if (plain) { out.push({ kind: 'text', text: plain }); plain = '' }
      if (typeof kind === 'function') out.push(...kind(match))
      else out.push({ kind, text: match[0] })
      at += match[0].length
      continue outer
    }
    plain += text[at++]
  }
  if (plain) out.push({ kind: 'text', text: plain })
  return out
}

const sticky = (source: string) => new RegExp(source, 'y')
const url = sticky(String.raw`[a-z][\w+.-]*:\/\/[^\s"'<>;]+`)
const number = sticky(String.raw`(?<![\w.-])-?\d+(?:\.\d+)?\b`)
const quoted = sticky(String.raw`"(?:[^"\\]|\\.)*"?|'[^']*'?`)

// Header values: URLs, key=value pairs, numbers, `base64:` and palette suffixes.
const valueRules: Rule[] = [
  [url, 'url'],
  [sticky(String.raw`[\w-]+(?==)`), 'var'],
  [sticky(String.raw`base64:`), 'kw'],
  [sticky(String.raw`[=;,]`), 'punc'],
  [sticky(String.raw`#?[0-9A-Fa-f]{6}\b`), 'num'],
  [number, 'num'],
  [quoted, 'str'],
]

function http(line: string): Token[] {
  const status = /^(HTTP\/[\d.]+)(\s+)(\d{3})(.*)$/.exec(line)
  if (status) return [{ kind: 'kw', text: status[1]! }, { kind: 'text', text: status[2]! }, { kind: 'num', text: status[3]! }, { kind: 'text', text: status[4]! }]
  const header = /^([A-Za-z][\w-]*)(:)(.*)$/.exec(line)
  if (!header) return scan(line, valueRules)
  const name = header[1]!
  return [{ kind: /^(?:reclash|flclashx)-/i.test(name) ? 'brand' : 'key', text: name }, { kind: 'punc', text: ':' }, ...scan(header[3]!, valueRules)]
}

const yamlValue: Rule[] = [
  [sticky(String.raw`\s+#.*$`), 'com'],
  [quoted, 'str'],
  [url, 'url'],
  [sticky(String.raw`\b(?:true|false|null|yes|no|on|off)\b(?=\s*(?:#|,|\]|\}|$))`), 'kw'],
  [number, 'num'],
  [sticky(String.raw`[&*][\w-]+`), 'var'],
  [sticky(String.raw`[[\]{},]`), 'punc'],
]

function yaml(line: string): Token[] {
  const comment = /^(\s*)(#.*)$/.exec(line)
  if (comment) return [{ kind: 'text', text: comment[1]! }, { kind: 'com', text: comment[2]! }]
  const entry = /^(\s*)(-\s+)?((?:"[^"]*"|'[^']*'|[^\s#:'"][^:#]*?))(:)(?=\s|$)(.*)$/.exec(line)
  if (entry) {
    const out: Token[] = [{ kind: 'text', text: entry[1]! }]
    if (entry[2]) out.push({ kind: 'punc', text: entry[2] })
    out.push({ kind: 'key', text: entry[3]! }, { kind: 'punc', text: ':' }, ...scan(entry[5]!, yamlValue))
    return out
  }
  const item = /^(\s*)(-)(\s.*|$)/.exec(line)
  if (item) return [{ kind: 'text', text: item[1]! }, { kind: 'punc', text: item[2]! }, ...scan(item[3]!, yamlValue)]
  return scan(line, yamlValue)
}

// The first word of every command (after a pipe, && or ;) is the program.
const shellRules: Rule[] = [
  [sticky(String.raw`(?:^|(?<=\s))#.*$`), 'com'],
  [quoted, 'str'],
  [url, 'url'],
  [sticky(String.raw`\$\{?[\w]+\}?`), 'var'],
  [sticky(String.raw`(?<=^\s*|[|;&]\s*)(?:sudo\s+)?[\w./-]+`), 'fn'],
  [sticky(String.raw`(?<=\s)--?[\w-]+`), 'kw'],
  [sticky(String.raw`\|\||&&|[|;<>]`), 'punc'],
  [number, 'num'],
]

const powershellRules: Rule[] = [
  [sticky(String.raw`#.*$`), 'com'],
  [quoted, 'str'],
  [sticky(String.raw`\$[\w:]+`), 'var'],
  [sticky(String.raw`\b[A-Z][a-z]+-[A-Z][A-Za-z]+\b`), 'fn'],
  [sticky(String.raw`(?<=\s)-[A-Za-z]+`), 'kw'],
  [sticky(String.raw`[|;]`), 'punc'],
]

const nginxRules: Rule[] = [
  [sticky(String.raw`#.*$`), 'com'],
  [sticky(String.raw`(?<=^\s*)[a-z_]+`), 'fn'],
  [sticky(String.raw`(?<=^\s*(?:add_header|proxy_hide_header)\s+)[\w-]+`), m => [{ kind: /^(?:reclash|flclashx)-/i.test(m[0]) ? 'brand' : 'key', text: m[0] }]],
  [quoted, 'str'],
  [sticky(String.raw`\$\w+`), 'var'],
  [sticky(String.raw`\b(?:always|on|off)\b`), 'kw'],
  [sticky(String.raw`[{};]`), 'punc'],
  [number, 'num'],
]

const urlRules: Rule[] = [
  [sticky(String.raw`^[a-z][\w+.-]*:(?:\/\/)?`), 'kw'],
  [sticky(String.raw`(?<=[?&])[^=&#]+(?==)`), 'var'],
  [sticky(String.raw`[?&=#]`), 'punc'],
  [sticky(String.raw`%[0-9A-F]{2}`), 'num'],
]

const byLanguage: Record<Exclude<CodeLanguage, 'text'>, (line: string) => Token[]> = {
  http, yaml,
  shell: line => scan(line, shellRules),
  powershell: line => scan(line, powershellRules),
  nginx: line => scan(line, nginxRules),
  url: line => scan(line, urlRules),
}

/** Tokens per line. Very long snippets fall back to plain text instead of slowing the page. */
export function highlight(code: string, language: CodeLanguage = detectLanguage(code)): Token[][] {
  const lines = code.split('\n')
  if (language === 'text' || code.length > MAX) return lines.map(text => text ? [{ kind: 'text', text }] : [])
  return lines.map(byLanguage[language])
}
