import { hexToOklch, normHex } from './theme.ts'
import { mockExpire, type MockProfile } from './mocks.ts'
import type { Language } from '../site/routes'

// Display helpers for the mock-subs page: readable facts and a preview-only brand scope.

/** ReClash's own seed, used when a stand sends no ReClash-Hex. */
export const stockSeed = '7C5CFF'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Brand variables for a `.theme-scope` element, clamped like the site theme so text stays readable. */
export function mockTheme(profile: MockProfile) {
  const [hex, ...variant] = (profile.response.hex ?? '').split(':')
  const seed = normHex(hex)
  const { l, c, h } = hexToOklch(seed ?? stockSeed)
  return {
    seed,
    pureBlack: variant.includes('pureblack'),
    style: { '--bl': clamp(l, 0.68, 0.84).toFixed(4), '--bc': Math.min(c, 0.19).toFixed(4), '--bh': h.toFixed(2) },
  }
}

/** Human-readable quota, expiry, node and refresh facts. Dates are formatted in UTC for stable rendering. */
export function mockFacts(profile: MockProfile, now: number, language: Language) {
  const ru = language === 'ru'
  const q = profile.quota
  const minutes = profile.response.updateMinutes
  let traffic = ru ? 'без лимита' : 'unlimited'
  let expires = ru ? 'бессрочно' : 'never'
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
    ? (ru ? 'по умолчанию' : 'default')
    : minutes % 60
      ? (ru ? `${minutes} мин` : `${minutes} min`)
      : (ru ? `${minutes / 60} ч` : `${minutes / 60} h`)
  return { traffic, expires, share, refresh, nodes: profile.nodes }
}

/** The client's default hero ring, used when a stand sends no ReClash-HeroRing. */
export const stockRing = ['10EDF8', '2A8BFD', '6C58FC']

/**
 * What the client's subscription strip shows for a stand, following its rules: free traffic of the
 * total (or used of infinity), a days-left pill that turns urgent at three days, a bar that warns
 * past 70% and alarms past 90%, and buy offers only when they are due.
 */
export function mockStrip(profile: MockProfile, now: number, language: Language) {
  const ru = language === 'ru'
  const q = profile.quota
  const r = profile.response
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
    ...(r.buyPlan && days !== null && days <= 3 ? [ru ? 'Продлить подписку' : 'Renew subscription'] : []),
    ...(r.buyTraffic && !unlimited && total - used < total * 0.1 ? [ru ? 'Докупить трафик' : 'Top up traffic'] : []),
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
