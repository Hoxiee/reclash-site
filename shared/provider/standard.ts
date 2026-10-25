import data from './standard.json' with { type: 'json' }
import type { BilingualText } from '../site/routes'

export type HeaderTransform = 'none' | 'base64' | 'base64-trimmed' | 'hours-to-minutes'
export type StandardField = typeof data.fields[number]
export const providerStandard = data

export const subscriptionTypes = {
  test: { ru: 'Тестовая', en: 'Test' },
  promo: { ru: 'Промо', en: 'Promo' },
  dev: { ru: 'Разработка', en: 'Dev' },
} as const
export type SubscriptionType = keyof typeof subscriptionTypes

export function subscriptionTypeText(value: string): BilingualText | undefined {
  return Object.hasOwn(subscriptionTypes, value) ? subscriptionTypes[value as SubscriptionType] : undefined
}

export function standardHeaderFor(wire: string): StandardField | undefined {
  const name = wire.toLowerCase()
  return data.fields.find(field => field.name === name || field.aliases?.some(alias => alias.name === name))
}

export function transformFor(wire: string): HeaderTransform {
  const field = standardHeaderFor(wire)
  if (field?.aliases?.some(alias => alias.name === wire.toLowerCase() && 'scale' in alias && alias.scale === 60)) return 'hours-to-minutes'
  return field?.type === 'text' ? 'base64' : 'none'
}

export function readOrderFor(wire: string): string[] {
  const field = standardHeaderFor(wire)
  return field ? [field.name, ...(field.aliases?.map(alias => alias.name) ?? [])] : [wire.toLowerCase()]
}
