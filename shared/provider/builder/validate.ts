import { actionKeys, compatible, providerSchema, resolve, typeOf, type SchemaNode } from './schema.ts'
import type { BilingualText } from '../../site/routes.ts'

// Field-level checks against the schema subset the manifest uses. What the app itself makes of the
// whole document comes from the Dart kernel instead; this only explains a single field early.
export type Issue = { path: string, code: string, params?: Record<string, unknown> }

const join = (path: string, key: string | number) => path ? `${path}.${key}` : String(key)
const length = (text: string) => Array.from(text).length

function check(raw: SchemaNode | undefined, value: unknown, path: string, out: Issue[]): void {
  const node = resolve(raw)
  if (!node) return
  if ('const' in node && value !== node.const) out.push({ path, code: 'const', params: { value: node.const } })
  if (node.enum && !node.enum.includes(value as never)) out.push({ path, code: 'enum', params: { values: node.enum } })
  const kind = typeOf(value)
  if (node.type && node.type !== kind && !(node.type === 'number' && kind === 'integer')) {
    out.push({ path, code: 'type', params: { type: node.type } })
    return
  }
  if (typeof value === 'string') {
    if (node.minLength !== undefined && length(value) < node.minLength) out.push({ path, code: 'empty' })
    if (node.maxLength !== undefined && length(value) > node.maxLength) out.push({ path, code: 'maxLength', params: { max: node.maxLength } })
    if (node.pattern && !new RegExp(node.pattern).test(value)) out.push({ path, code: 'pattern', params: { pattern: node.pattern } })
    if (node.format === 'uri' && !URL.canParse(value)) out.push({ path, code: 'uri' })
  }
  if (typeof value === 'number') {
    if (node.minimum !== undefined && value < node.minimum) out.push({ path, code: 'range', params: { min: node.minimum, max: node.maximum } })
    if (node.maximum !== undefined && value > node.maximum) out.push({ path, code: 'range', params: { min: node.minimum, max: node.maximum } })
  }
  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems) out.push({ path, code: 'minItems', params: { min: node.minItems } })
    if (node.maxItems !== undefined && value.length > node.maxItems) out.push({ path, code: 'maxItems', params: { max: node.maxItems } })
    if (node.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) out.push({ path, code: 'unique' })
    value.forEach((item, index) => check(node.items, item, join(path, index), out))
  }
  if (kind === 'object') {
    const record = value as Record<string, unknown>
    for (const key of node.required ?? []) if (record[key] === undefined) out.push({ path: join(path, key), code: 'required' })
    if (node.minProperties !== undefined && Object.keys(record).length < node.minProperties) out.push({ path, code: 'empty' })
    for (const [key, item] of Object.entries(record)) {
      if (node.propertyNames?.pattern && !new RegExp(node.propertyNames.pattern).test(key)) out.push({ path: join(path, key), code: 'tag' })
      if (node.properties?.[key]) check(node.properties[key], item, join(path, key), out)
      else if (typeof node.additionalProperties === 'object') check(node.additionalProperties, item, join(path, key), out)
      else if (node.additionalProperties === false && (node.properties || node.type === 'object')) out.push({ path: join(path, key), code: 'unknown' })
    }
  }
  for (const part of node.allOf ?? []) check(part, value, path, out)
  if (node.not) {
    const inner: Issue[] = []
    check(node.not, value, path, inner)
    if (!inner.length) out.push({ path, code: 'not' })
  }
  const union = node.oneOf ?? node.anyOf
  if (union) {
    const results = union.map(branch => { const issues: Issue[] = []; check(branch, value, path, issues); return issues })
    const passing = results.filter(issues => !issues.length).length
    const actions = actionKeys({ allOf: [node] })
    if (actions) {
      if (passing > 1) out.push({ path, code: 'oneAction', params: { keys: actions.keys } })
      else if (!passing) out.push({ path, code: 'needAction', params: { keys: actions.keys } })
    } else if (node.oneOf ? passing !== 1 : !passing) {
      const fitting = union.map((branch, index) => ({ branch, issues: results[index]! })).filter(item => compatible(item.branch, value))
      const best = (fitting.length ? fitting : union.map((branch, index) => ({ branch, issues: results[index]! })))
        .sort((a, b) => a.issues.length - b.issues.length)[0]
      if (best?.issues.length) out.push(...best.issues)
      else if (!fitting.length) out.push({ path, code: 'shape' })
    }
  }
}

export function validateManifest(document: Record<string, unknown>): Issue[] {
  const out: Issue[] = []
  check(providerSchema, { version: 1, ...document }, '', out)
  const seen = new Set<string>()
  return out.filter(issue => {
    const key = `${issue.path}|${issue.code}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Friendly names for the schema's recurring patterns; anything else falls back to showing the pattern.
const patternText: Array<[string, BilingualText]> = [
  ['^https?://', { ru: 'Нужна ссылка http:// или https://', en: 'Use an http:// or https:// link' }],
  ['^https://', { ru: 'Нужна ссылка https://', en: 'Use an https:// link' }],
  ['^(https?://|tg://)', { ru: 'Нужна ссылка http(s):// или tg://', en: 'Use an http(s):// or tg:// link' }],
  ['\\S', { ru: 'Не может быть пустым', en: 'Cannot be blank' }],
  ['^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$', { ru: 'RRGGBB или AARRGGBB, # по желанию', en: 'RRGGBB or AARRGGBB, # optional' }],
  ['^[a-z0-9._:#-]{1,64}$', { ru: 'Строчные латинские буквы, цифры и . _ : # -, до 64', en: 'Lowercase letters, digits and . _ : # -, up to 64' }],
  ['^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+$', { ru: 'Имя пакета Android, например com.example.app', en: 'An Android package name, such as com.example.app' }],
  ['^ed25519:[A-Za-z0-9_-]{43}$', { ru: 'ed25519: и 43 символа base64url', en: 'ed25519: followed by 43 base64url characters' }],
  ['^domestic(:[A-Za-z]{2})?$', { ru: 'domestic или domestic:<код страны>', en: 'domestic or domestic:<country code>' }],
]

export function issueText(issue: Issue, language: 'ru' | 'en'): string {
  const t = (ru: string, en: string) => language === 'ru' ? ru : en
  const p = issue.params ?? {}
  const list = (values: unknown) => (values as unknown[]).map(String).join(', ')
  switch (issue.code) {
    case 'required': return t('Обязательное поле', 'Required')
    case 'empty': return t('Не может быть пустым', 'Cannot be empty')
    case 'maxLength': return t(`Не длиннее ${p.max} символов`, `At most ${p.max} characters`)
    case 'pattern': return patternText.find(([pattern]) => pattern === p.pattern)?.[1][language] ?? t(`Формат: ${p.pattern}`, `Format: ${p.pattern}`)
    case 'uri': return t('Это не похоже на ссылку', 'This does not look like a link')
    case 'range': return p.max === undefined ? t(`Не меньше ${p.min}`, `At least ${p.min}`) : t(`От ${p.min} до ${p.max}`, `From ${p.min} to ${p.max}`)
    case 'type': return ({ integer: t('Нужно целое число', 'Use a whole number'), boolean: t('Нужно да или нет', 'Use yes or no'), string: t('Нужен текст', 'Use text'), array: t('Нужен список', 'Use a list'), object: t('Нужен набор полей', 'Use a group of fields') } as Record<string, string>)[String(p.type)] ?? t('Неверный тип', 'Wrong type')
    case 'enum': return t(`Одно из: ${list(p.values)}`, `One of: ${list(p.values)}`)
    case 'const': return t(`Должно быть ${p.value}`, `Must be ${p.value}`)
    case 'minItems': return t(`Не меньше ${p.min} элементов`, `At least ${p.min} entries`)
    case 'maxItems': return t(`Не больше ${p.max} элементов`, `At most ${p.max} entries`)
    case 'unique': return t('Значения повторяются', 'Values repeat')
    case 'tag': return t('Код языка, например ru, en или pt-BR', 'A language tag, such as ru, en or pt-BR')
    case 'unknown': return t('Неизвестный ключ', 'Unknown key')
    case 'oneAction': return t(`Только одно действие из: ${list(p.keys)}`, `Only one action of: ${list(p.keys)}`)
    case 'needAction': return t(`Нужно одно действие: ${list(p.keys)}`, `Needs one action: ${list(p.keys)}`)
    default: return t('Значение не подходит', 'This value does not fit')
  }
}
