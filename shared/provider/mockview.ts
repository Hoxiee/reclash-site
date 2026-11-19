import { hexToOklch, normHex } from './theme.ts'
import { mockExpire, mockNodeCount, type MockProfile } from './mocks.ts'
import type { ToolLanguage as Language } from '../site/routes'

// Display helpers for the mock-subs page: readable facts and a preview-only brand scope.

/** ReClash's own seed, used when a stand sends no app.color. */
export const stockSeed = '7C5CFF'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const manifestSection = (profile: MockProfile, key: string) => record(profile.manifest?.[key])
const provider = (profile: MockProfile) => manifestSection(profile, 'provider')
const appView = (profile: MockProfile) => record(manifestSection(profile, 'view')?.app)

/** A string or a locale map (exact tag, then language, then en, then the first entry); undefined when there is none. */
export function mockText(value: unknown, language: string): string | undefined {
  if (typeof value === 'string') return value
  const map = record(value)
  if (!map) return undefined
  const entries = Object.entries(map).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  const lower = (tag: string) => tag.toLowerCase()
  const find = (tag: string) => entries.find(([key]) => lower(key) === lower(tag))?.[1]
  return find(language) ?? find(language.split('-')[0]!) ?? find('en') ?? entries[0]?.[1]
}

/** The provider name as the app would show it: the manifest, else the profile-title header, else the stand name. */
export function mockName(profile: MockProfile, language: Language): string {
  return mockText(provider(profile)?.name, language) ?? profile.headers?.title ?? profile.name[language]
}

/** File name of an `asset:` token under /assets/mock/, or undefined for any other value. */
export const mockAssetFile = (value: unknown): string | undefined =>
  typeof value === 'string' && value.startsWith('asset:') ? value.slice(6) : undefined

/** Brand variables for a `.theme-scope` element, clamped like the site theme so text stays readable. */
export function mockTheme(profile: MockProfile) {
  const app = appView(profile)
  const seed = normHex(app?.color)
  const { l, c, h } = hexToOklch(seed ?? stockSeed)
  const wallpaper = manifestSection(profile, 'wallpaper')
  const file = mockAssetFile(wallpaper?.url)
  return {
    seed,
    seedDark: normHex(app?.['color-dark']),
    pureBlack: app?.black === true,
    wallpaper: file ? { file, opacity: typeof wallpaper?.opacity === 'number' ? wallpaper.opacity : 8 } : null,
    style: { '--bl': clamp(l, 0.68, 0.84).toFixed(4), '--bc': Math.min(c, 0.19).toFixed(4), '--bh': h.toFixed(2) },
  }
}

/** Human-readable quota, expiry, node and refresh facts. Dates are formatted in UTC for stable rendering. */
export function mockFacts(profile: MockProfile, now: number, language: Language) {
  const ru = language === 'ru'
  const q = profile.quota
  const minutes = (profile.headers?.updateHours ?? 0) * 60
  let traffic: string | null = null
  let expires: string | null = null
  let share: number | null = null
  if (q) {
    const used = q.uploadGb + q.downloadGb
    traffic = ru ? `${used} / ${q.totalGb} ГБ` : `${used} / ${q.totalGb} GB`
    share = q.totalGb ? Math.min(1, used / q.totalGb) : null
    if (q.expireAt) {
      const date = new Date(mockExpire(q, now) * 1000)
      const day = date.getUTCDate(), month = date.getUTCMonth(), year = date.getUTCFullYear()
      expires = ru
        ? `до ${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`
        : `until ${months[month]} ${day}, ${year}`
    }
    else {
      const days = q.expireInDays ?? 0
      expires = ru ? `через ${days} дн.` : `in ${days} days`
    }
  }
  const refresh = !minutes
    ? null
    : minutes % 60
      ? (ru ? `${minutes} мин` : `${minutes} min`)
      : (ru ? `${minutes / 60} ч` : `${minutes / 60} h`)
  return { name: mockName(profile, language), traffic, expires, share, refresh, nodes: mockNodeCount(profile) }
}

/** Decorative ring for the schematic preview, not a provider-controlled app element. */
export const stockRing = ['10EDF8', '2A8BFD', '6C58FC']

/**
 * What the client's subscription strip shows for a stand, following its rules: free traffic of the
 * total (or used of infinity), a days-left pill that turns urgent at three days, a bar that warns
 * past 70% and alarms past 90%, and buy offers only when they are due.
 */
export function mockStrip(profile: MockProfile, now: number, language: Language) {
  const ru = language === 'ru'
  const q = profile.quota
  const renew = record(provider(profile)?.renew)
  const topUp = record(provider(profile)?.['top-up'])
  const gb = (value: number) => ru ? `${value} ГБ` : `${value} GB`
  const used = q ? q.uploadGb + q.downloadGb : 0
  const total = q?.totalGb ?? 0
  const unlimited = total <= 0
  const share = unlimited ? 0 : Math.min(1, used / total)
  const expire = q ? mockExpire(q, now) * 1000 : 0
  const days = expire ? Math.max(0, Math.floor((expire - now) / 86_400_000)) : null
  const expired = expire > 0 && expire <= now
  const word = (n: number) => {
    if (!ru) return n === 1 ? 'day' : 'days'
    const m10 = n % 10, m100 = n % 100
    return m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дня' : 'дней'
  }
  const pill = expired
    ? { tone: 'error', text: ru ? 'Подписка истекла' : 'Subscription expired' }
    : days !== null
      ? { tone: days <= 3 ? 'error' : 'primary', text: ru ? `Осталось ${days} ${word(days)}` : `Remaining ${days} ${word(days)}` }
      : { tone: 'muted', text: ru ? 'Бессрочно' : 'Never expires' }
  const offers = [
    ...(renew?.url && days !== null && days <= (typeof renew.days === 'number' ? renew.days : 3) ? [ru ? 'Продлить подписку' : 'Renew subscription'] : []),
    ...(topUp?.url && !unlimited && share * 100 >= (typeof topUp.percent === 'number' ? topUp.percent : 90) ? [ru ? 'Докупить трафик' : 'Top up traffic'] : []),
  ]
  return {
    value: unlimited ? gb(used) : gb(Math.max(0, total - used)),
    of: unlimited ? '/ ∞' : ru ? `свободно из ${gb(total)}` : `free of ${gb(total)}`,
    unlimited,
    share,
    bar: share > 0.9 ? 'error' : share > 0.7 ? 'caution' : 'primary',
    pill,
    offers,
  }
}
