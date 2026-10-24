import data from './standard.json' with { type: 'json' }

// Typed view of the provider standard vendored from the ReClash fork
// (tool/gen_provider_standard.dart). The fork owns the structure: which wire
// names map to which setting, how values are transformed, the widget set and
// the token vocabularies. Site prose lives beside it, keyed by the same ids.

export type HeaderTransform = 'none' | 'base64' | 'base64-trimmed' | 'hours-to-minutes'

export type StandardHeader = {
  canonical: string
  /** Wire names in priority order: the first non-empty value wins. */
  sourceKeys: readonly string[]
  transform: HeaderTransform
  value: string
  purpose: string
}

export type StandardWidget = {
  id: string
  platforms: readonly string[]
  modes: readonly string[]
}

export type ProviderStandard = {
  headers: readonly StandardHeader[]
  /** Standard Clash headers ReClash reads that are not part of the fork standard. */
  externalCommon: readonly string[]
  widgets: readonly StandardWidget[]
  tokens: {
    view: Record<string, readonly string[]>
    themeVariants: readonly string[]
    themeFlags: readonly string[]
    heroEffect: readonly string[]
    constraints: {
      heroRingColours: number
      backgroundOpacityMin: number
      backgroundOpacityMax: number
      hexDigits: readonly number[]
    }
  }
}

export const providerStandard = data as unknown as ProviderStandard

const byWire = new Map<string, StandardHeader>()
for (const header of providerStandard.headers) {
  for (const wire of header.sourceKeys) byWire.set(wire, header)
}

/** The standard entry that reads this wire name, if any. */
export function standardHeaderFor(wire: string): StandardHeader | undefined {
  return byWire.get(wire.toLowerCase())
}

/** Value transform the client applies to this wire name. */
export function transformFor(wire: string): HeaderTransform {
  return standardHeaderFor(wire)?.transform ?? 'none'
}

/** Every wire name that feeds the same setting, in priority order. */
export function readOrderFor(wire: string): string[] {
  const canonical = standardHeaderFor(wire)?.canonical
  if (!canonical) return [wire.toLowerCase()]
  return providerStandard.headers.filter(header => header.canonical === canonical).flatMap(header => [...header.sourceKeys])
}
