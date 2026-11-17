import { mockBuilderState, mockManifest, type MockProfile } from '~~/shared/provider/mocks'
import { mockText } from '~~/shared/provider/mockview'
import type { Language } from '~~/shared/site/routes'

// Manifest readers for the mock page. The preview resolves asset: tokens against a placeholder origin
// (mockManifest cannot take an empty one) and strips it again, so images stay same-origin paths.

export type Rec = Record<string, unknown>
export const rec = (value: unknown): Rec | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Rec : undefined
export const list = (value: unknown): unknown[] => Array.isArray(value) ? value : []
export const str = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined

const placeholder = 'https://mock.invalid'
const local = (value: unknown): string | undefined => {
  const text = str(value)
  return text?.startsWith(placeholder) ? text.slice(placeholder.length) : text
}

export const previewManifest = (profile: MockProfile, now: number): Rec => mockManifest(profile, placeholder, now) ?? {}

export function plural(count: number, language: Language, ru: [string, string, string], en: [string, string]): string {
  if (language === 'en') return count === 1 ? en[0] : en[1]
  const m10 = count % 10, m100 = count % 100
  return m10 === 1 && m100 !== 11 ? ru[0] : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? ru[1] : ru[2]
}

export const countLabel = (count: number, language: Language, ru: [string, string, string], en: [string, string]) =>
  `${count} ${plural(count, language, ru, en)}`

export const scenariosLabel = (count: number, language: Language) => countLabel(count, language, ['сценарий', 'сценария', 'сценариев'], ['scenario', 'scenarios'])
export const lineCount = (text: string) => text.trimEnd().split('\n').length

export type PreviewCard = {
  id: string, type: string, layout: string, tone: string, level: string
  title?: string, text?: string, image?: string, countdown?: number, button?: string
  items: Array<{ icon: string, label: string }>
}

/** Cards as the preview draws them; images prefer the dark variant because every preview frame is dark. */
export function previewCards(manifest: Rec, language: Language): PreviewCard[] {
  return list(manifest.cards).flatMap((raw): PreviewCard[] => {
    const card = rec(raw)
    if (!card) return []
    return [{
      id: str(card.id) ?? '',
      type: str(card.type) ?? 'banner',
      layout: str(card.layout) ?? ((str(card.type) ?? 'banner') === 'banner' ? 'hero' : ''),
      tone: str(card.tone) ?? 'primary',
      level: str(card.level) ?? 'info',
      title: mockText(card.title, language),
      text: mockText(card.text, language),
      image: local(card['image-dark'] ?? card.image),
      countdown: typeof card.countdown === 'number' ? card.countdown : undefined,
      button: mockText(rec(card.button)?.label, language),
      items: list(card.items).flatMap((item) => {
        const entry = rec(item)
        const label = entry && mockText(entry.label, language)
        return entry && label ? [{ icon: str(entry.icon) ?? '', label }] : []
      }),
    }]
  })
}

export function providerLogo(manifest: Rec): string | undefined {
  const provider = rec(manifest.provider)
  return local(provider?.['logo-dark'] ?? provider?.logo)
}

export function wallpaperOf(manifest: Rec): { url: string, opacity: number } | undefined {
  const wallpaper = rec(manifest.wallpaper)
  const url = local(wallpaper?.url)
  return url ? { url, opacity: typeof wallpaper?.opacity === 'number' ? wallpaper.opacity : 8 } : undefined
}

/** Time left until a unix-seconds deadline, in days and hours. */
export function countdownText(until: number, now: number, language: Language): string {
  const hours = Math.max(0, Math.floor((until * 1000 - now) / 3_600_000))
  const days = Math.floor(hours / 24), rest = hours % 24
  if (language === 'ru') return days ? `${days} дн ${rest} ч` : `${rest} ч`
  return days ? `${days}d ${rest}h` : `${rest}h`
}

const labelStates = ['ending', 'exhausted', 'off'] as const
export type PowerState = typeof labelStates[number] | 'on' | 'connecting' | 'paused' | 'expired' | 'grace'

/** One power-label state: a string, a locale map, a title/hint pair, or a list of variants of those. */
export function powerLabel(manifest: Rec, state: PowerState, language: Language, vars: Record<string, string> = {}): { title: string, hint?: string } | undefined {
  const labels = rec(manifest['power-labels'])
  let value = labels?.[state]
  if (Array.isArray(value)) value = value[0]
  if (value === undefined) return undefined
  const pair = rec(value)
  const fill = (text: string | undefined) => text?.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match)
  const title = fill(pair && 'title' in pair ? mockText(pair.title, language) : mockText(value, language))
  return title ? { title, hint: fill(pair && 'hint' in pair ? mockText(pair.hint, language) : undefined) } : undefined
}

/** The label that tells the most about a stand: a running-out state if it has one, else the idle caption. */
export function relevantLabel(manifest: Rec, language: Language, vars: Record<string, string>) {
  for (const state of labelStates) {
    const label = powerLabel(manifest, state, language, vars)
    if (label) return { state, ...label }
  }
  return undefined
}

export const widgetsOf = (manifest: Rec): string[] =>
  list(manifest.widgets).flatMap(item => typeof item === 'string' ? [item.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())] : [])

const policyNames: Record<string, [string, string]> = {
  'global:off': ['Global отключён', 'Global mode off'], 'global:listed': ['Global: только список узлов', 'Global: listed nodes only'],
  'apps:required': ['Приложения обязательны', 'Apps required'], 'local-ports:closed': ['Локальные порты закрыты', 'Local ports closed'],
  'dashboard:locked': ['Панель заблокирована', 'Dashboard locked'],
}
export const policyBadges = (manifest: Rec, language: Language): string[] =>
  Object.entries(rec(manifest.policy) ?? {}).map(([key, value]) => policyNames[`${key}:${String(value)}`]?.[language === 'ru' ? 0 : 1] ?? `${key}: ${String(value)}`)

/** Routing profile titles, translated through the profile's own l10n lines when the language is Russian. */
export function routingTitles(profile: MockProfile, language: Language): string[] {
  const source = profile.routing
  if (!source) return []
  const profiles = source.split(/^ {2}scenarios:/m)[0]!
  const titles = [...profiles.matchAll(/^\s+title:\s*(.+?)\s*$/gm)].map(match => match[1]!.replace(/^['"]|['"]$/g, ''))
  if (language === 'en') return titles
  const ru = new Map([...source.matchAll(/^\s+'(.+)':\s*'(.+)'\s*$/gm)].map(match => [match[1]!, match[2]!] as const))
  return titles.map(title => ru.get(title) ?? title)
}

const iconPaths: Record<string, string> = {
  support: 'M4 13v-1a8 8 0 0 1 16 0v1M4 13h3v5H4zM17 13h3v5h-3zM17 18c0 1.5-2 2.5-5 2.5',
  telegram: 'M21 4 3 11l6 2.2L11 20l3-4 5 3.5zM9 13.2 21 4',
  share: 'M12 15V4m0 0L8 8m4-4 4 4M5 12v7h14v-7',
  speed: 'M4 17a8 8 0 1 1 16 0M12 17l4-6',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  doctor: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM12 8v8M8 12h8',
}
export const iconPath = (name: string) => iconPaths[name] ?? 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z'
export const powerPath = 'M12 3v8.5M7.2 6.6a7.5 7.5 0 1 0 9.6 0'

/** The builder opens this state from the URL fragment; the builder chunk loads only when somebody asks for it. */
export async function builderFragment(profile: MockProfile, origin: string, now: number): Promise<string> {
  const { encodeFragment } = await import('~~/shared/provider/builder/document')
  return encodeFragment(mockBuilderState(profile, origin, now) as Parameters<typeof encodeFragment>[0])
}
