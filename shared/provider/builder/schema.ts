import data from '../../../public/schemas/provider-config.schema.json' with { type: 'json' }

// A walker over the synced provider-config schema: the form takes every type, enum and limit from here.
export type SchemaNode = {
  $ref?: string, type?: string, const?: unknown, enum?: unknown[], default?: unknown, description?: string,
  pattern?: string, format?: string, minLength?: number, maxLength?: number, minimum?: number, maximum?: number,
  minItems?: number, maxItems?: number, uniqueItems?: boolean, minProperties?: number, required?: string[],
  properties?: Record<string, SchemaNode>, additionalProperties?: boolean | SchemaNode, propertyNames?: SchemaNode,
  items?: SchemaNode, anyOf?: SchemaNode[], oneOf?: SchemaNode[], allOf?: SchemaNode[], not?: SchemaNode,
}

export const providerSchema = data as unknown as SchemaNode & { $defs: Record<string, SchemaNode> }
export const excludedRoot = 'routing'

export function resolve(node: SchemaNode | undefined): SchemaNode | undefined {
  let current = node
  for (let depth = 0; current?.$ref && depth < 16; depth++) current = providerSchema.$defs[current.$ref.replace('#/$defs/', '')]
  return current
}

const branchesOf = (node: SchemaNode) => [...node.anyOf ?? [], ...node.oneOf ?? []].map(resolve).filter((item): item is SchemaNode => !!item)

/** Every property path of the schema, arrays transparent: `cards.when.from`, `power-labels.on.title`. */
export function schemaPaths(): string[] {
  const out = new Set<string>()
  const walk = (raw: SchemaNode | undefined, prefix: string, depth: number) => {
    const node = resolve(raw)
    if (!node || depth > 24) return
    for (const [key, child] of Object.entries(node.properties ?? {})) {
      const path = prefix ? `${prefix}.${key}` : key
      out.add(path)
      walk(child, path, depth + 1)
    }
    if (node.items) walk(node.items, prefix, depth + 1)
    for (const branch of [...node.anyOf ?? [], ...node.oneOf ?? [], ...node.allOf ?? []]) walk(branch, prefix, depth + 1)
  }
  walk(providerSchema, '', 0)
  return [...out]
}

export function typeOf(value: unknown): string {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number'
  return typeof value
}

/** Whether a branch could describe this value, so errors come from the branch the author meant. */
export function compatible(raw: SchemaNode, value: unknown): boolean {
  const node = resolve(raw)
  if (!node) return false
  const kind = typeOf(value)
  if (node.type && node.type !== kind && !(node.type === 'number' && kind === 'integer')) return false
  if (node.type && node.type !== 'object') return true
  if (node.enum) return node.enum.some(item => typeOf(item) === kind || (typeof item === typeof value))
  if ('const' in node) return typeof node.const === typeof value
  if (node.properties || node.required || node.type === 'object') {
    if (kind !== 'object') return false
    const record = value as Record<string, unknown>
    const fixed = Object.entries(node.properties ?? {}).filter(([, child]) => resolve(child) && 'const' in resolve(child)!)
    if (fixed.length) return fixed.every(([key, child]) => record[key] === undefined || record[key] === resolve(child)!.const)
    // Without a discriminator, `{title, hint}` and a locale map differ only by their keys.
    return (node.required ?? []).every(key => key in record)
      && (node.additionalProperties !== false || Object.keys(record).every(key => key in (node.properties ?? {})))
  }
  const branches = branchesOf(node)
  return !branches.length || branches.some(branch => compatible(branch, value))
}

/** The node that describes `value`, picking among `anyOf`/`oneOf` branches by shape. */
export function select(raw: SchemaNode | undefined, value: unknown): SchemaNode | undefined {
  const node = resolve(raw)
  if (!node) return undefined
  const branches = branchesOf(node)
  if (!branches.length || node.type || node.properties) return node
  const fitting = value === undefined ? [] : branches.filter(branch => compatible(branch, value))
  return fitting.length === 1 ? select(fitting[0], value) : node
}

/** Child schema of an object node by key, across branches when the object is a union (a card). */
export function childOf(raw: SchemaNode | undefined, key: string, value?: unknown): SchemaNode | undefined {
  const node = select(raw, value)
  if (!node) return undefined
  if (node.properties?.[key]) return node.properties[key]
  for (const branch of branchesOf(node)) {
    const found = childOf(branch, key, value)
    if (found) return found
  }
  return undefined
}

/** Schema for a concrete instance path such as `cards.2.button.label`, using the document to pick branches. */
export function nodeAt(path: Array<string | number>, root: unknown): SchemaNode | undefined {
  let node: SchemaNode | undefined = providerSchema
  let value: unknown = root
  for (const segment of path) {
    if (typeof segment === 'number') {
      const resolved = select(node, value)
      const list = resolved?.items ? resolved : branchesOf(resolved ?? {}).find(branch => branch.type === 'array')
      node = list?.items
    } else node = childOf(node, segment, value)
    value = value && typeof value === 'object' ? (value as Record<string | number, unknown>)[segment] : undefined
    if (!node) return undefined
  }
  return node
}

export function propertyOrder(raw: SchemaNode | undefined, value: unknown): string[] {
  const node = select(raw, value)
  if (!node) return []
  const keys = Object.keys(node.properties ?? {})
  for (const branch of branchesOf(node)) for (const key of propertyOrder(branch, value)) if (!keys.includes(key)) keys.push(key)
  return keys
}

/** Options of an enum node, flattening `anyOf` enum groups such as the power-button shapes. */
export function enumOptions(raw: SchemaNode | undefined): string[] {
  const node = resolve(raw)
  if (!node) return []
  if (node.enum) return node.enum.map(String)
  return branchesOf(node).flatMap(enumOptions)
}

/** The localized-text shape: a plain string or a map of locale tags to strings. */
export function textLimits(raw: SchemaNode | undefined): { maxLength?: number, tag?: string } | undefined {
  const node = resolve(raw)
  if (!node) return undefined
  const branches = branchesOf(node)
  const plain = branches.find(branch => branch.type === 'string')
  const map = branches.find(branch => branch.type === 'object' && typeof branch.additionalProperties === 'object' && !branch.properties)
  if (!plain || !map) return undefined
  return { maxLength: plain.maxLength, tag: map.propertyNames?.pattern }
}

/** Keys that carry the one action of a card, a button or an item (`url`, `copy`, `share`, `app`). */
export function actionKeys(raw: SchemaNode | undefined, value?: unknown): { keys: string[], required: boolean } | undefined {
  const node = select(raw, value)
  for (const part of (node?.allOf ?? []).map(resolve)) {
    const branches = part?.oneOf?.map(resolve) ?? []
    const keys = branches.flatMap(branch => branch?.required?.length === 1 && !branch.not ? branch.required : [])
    if (keys.length && branches.every(branch => branch?.required?.length === 1 || branch?.not)) {
      return { keys, required: !branches.some(branch => branch?.not) }
    }
  }
  return undefined
}

export type FieldKind = 'const' | 'boolean' | 'integer' | 'string' | 'enum' | 'text' | 'enum-list' | 'enum-pool'
  | 'int-list' | 'string-list' | 'object-list' | 'group' | 'labels'

export function kindOf(raw: SchemaNode | undefined): FieldKind {
  const node = resolve(raw)
  if (!node) return 'string'
  if ('const' in node) return 'const'
  if (node.enum || (!node.type && enumOptions(node).length && branchesOf(node).every(branch => branch.enum))) return 'enum'
  if (textLimits(node)) return 'text'
  const branches = branchesOf(node)
  if (branches.length && !node.type) {
    const list = branches.find(branch => branch.type === 'array')
    const single = branches.find(branch => branch.type !== 'array')
    if (list && single) return kindOf(single) === 'enum' ? 'enum-pool' : 'labels'
    if (branches.every(branch => branch.type === 'object' || branch.properties)) return 'group'
  }
  if (node.type === 'boolean') return 'boolean'
  if (node.type === 'integer') return 'integer'
  if (node.type === 'array') {
    const item = kindOf(node.items)
    return item === 'enum' ? 'enum-list' : item === 'integer' ? 'int-list' : item === 'string' ? 'string-list' : 'object-list'
  }
  if (node.type === 'object' || node.properties) return 'group'
  return 'string'
}

/** Constraints of a list's items, for hints such as "0–365". */
export const itemsOf = (raw: SchemaNode | undefined) => resolve(resolve(raw)?.items)
