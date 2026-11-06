import data from './standard.json' with { type: 'json' }
import type { BilingualText } from '../site/routes'

export type HeaderTransform = 'none' | 'base64' | 'base64-trimmed' | 'hours-to-minutes'
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
