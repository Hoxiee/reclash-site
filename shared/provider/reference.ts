import type { BilingualText, Language } from '../site/routes'
import { providerStandard, type HeaderTransform } from './standard'

// The header reference: every header ReClash reads, with bilingual format,
// purpose, details, example and search terms. The page, the docs and the
// builder link into entries by `id` (`h-<lowercase wire name>`).
//
// Prose is light markup: `code` and **strong**. Render it with
// <ReferenceRich>, never as HTML; `plainText` strips it for search.

export type HeaderCategory = 'common' | 'reclash' | 'hwid'
export type HeaderDirection = 'response' | 'request'

export type TokenRow = {
  token: string
  values?: readonly string[]
  text: BilingualText
  /** Optional trailing column, e.g. platform availability. */
  note?: BilingualText
}

export type TokenTable = {
  caption: BilingualText
  columns: readonly BilingualText[]
  rows: readonly TokenRow[]
}

export type HeaderEntry = {
  /** Anchor id: `h-` plus the lowercase wire name. */
  id: string
  /** Lowercase wire name. Header names are case-insensitive. */
  name: string
  category: HeaderCategory
  direction: HeaderDirection
  transform: HeaderTransform
  /** Value format; empty for request headers the client sends itself. */
  format?: BilingualText
  /** One line, shown while the entry is collapsed. */
  summary: BilingualText
  /** Full description, shown when expanded. */
  body: BilingualText
  example?: string
  table?: TokenTable
  /** Extra search terms in both languages. */
  keywords: BilingualText
}

export type CategoryInfo = {
  key: HeaderCategory
  /** Filter label (plural). */
  label: BilingualText
  /** Card badge (singular). */
  badge: BilingualText
  title: BilingualText
  lede: BilingualText
}

const bi = (ru: string, en: string): BilingualText => ({ ru, en })

export const headerCategories: readonly CategoryInfo[] = [
  { key: 'common', label: bi('Общие', 'Common'), badge: bi('Общий', 'Common'), title: bi('Общие заголовки', 'Common headers'),
    lede: bi('Стандартные заголовки Clash. Отдаёте их уже — ReClash подхватит без изменений.',
      'Standard Clash headers. If you already send them, ReClash picks them up unchanged.') },
  { key: 'reclash', label: bi('ReClash', 'ReClash'), badge: bi('ReClash', 'ReClash'), title: bi('Заголовок ReClash', 'ReClash header'),
    lede: bi('Единственный заголовок, который понимает только ReClash: `reclash-config` указывает на манифест провайдера. Всё остальное (имя, логотип, объявления, кнопки, политика, внешний вид) лежит в разделах манифеста; подробности в документации «Манифест провайдера».',
      'The only header only ReClash understands: `reclash-config` points to the provider manifest. Everything else (name, logo, announcements, buttons, policy, appearance) lives in manifest sections; see the Provider manifest documentation.') },
  { key: 'hwid', label: bi('HWID', 'HWID'), badge: bi('HWID', 'HWID'), title: bi('Устройства и HWID', 'Devices and HWID'),
    lede: bi('Заголовки запроса от клиента и ответы на них.',
      'Request headers from the client and the responses to them.') },
]

export const transformLabels: Record<Exclude<HeaderTransform, 'none'>, { short: BilingualText, long: BilingualText }> = {
  'base64': {
    short: bi('base64', 'base64'),
    long: bi('Префикс `base64:` или `base64,` декодируется в UTF-8.', 'A `base64:` or `base64,` prefix is decoded to UTF-8.'),
  },
  'base64-trimmed': {
    short: bi('base64 + обрезка', 'base64 + trim'),
    long: bi('Префикс `base64:` или `base64,` декодируется, пробелы по краям обрезаются.', 'A `base64:` or `base64,` prefix is decoded, then surrounding whitespace is trimmed.'),
  },
  'hours-to-minutes': {
    short: bi('ч → мин', 'h → min'),
    long: bi('Значение в часах, клиент переводит его в минуты.', 'The value is in hours; the client converts it to minutes.'),
  },
}


export const referenceAnchor = (name: string): string => `h-${name.toLowerCase()}`

const wireProse: Record<string, [string, string, string]> = {
  'x-hwid': ['Идентификатор устройства: 32 шестнадцатеричных символа.', 'Device identifier: 32 hexadecimal characters.', '0123456789abcdef0123456789abcdef'],
  'x-device-os': ['Операционная система устройства.', 'Device operating system.', 'android'],
  'x-ver-os': ['Версия ОС.', 'OS version.', '16'],
  'x-device-model': ['Модель устройства или имя хоста.', 'Device model or host name.', 'Example device'],
  'x-hwid-not-supported': ['Режим устройства не поддерживается сервером.', 'Device mode is not supported by the server.', 'true'],
  'x-hwid-max-devices-reached': ['Достигнут лимит устройств.', 'Device limit reached.', 'true'],
  'Subscription-Userinfo': ['Расход и лимит в байтах, окончание в Unix-секундах. total=0 — безлимит.', 'Usage and quota in bytes, expiry in Unix seconds. total=0 means unlimited.', 'upload=0; download=66571993088; total=214748364800; expire=1924992000'],
  'Content-Disposition': ['Имя файла профиля; используется как запасное название.', 'Profile filename; used as a fallback title.', 'attachment; filename="profile.yaml"'],
  'User-Agent': ['Клиент запроса; зависит от режима совместимости.', 'Request client; depends on the compatibility mode.', 'ReClash'],
  'Accept-Language': ['Языки клиента.', 'Client languages.', 'ru, en'],
  'x-client': ['Идентификатор клиента запроса.', 'Request client identifier.', 'ReClash'],
  'x-app-version': ['Версия приложения.', 'App version.', '0.1.0-pre.1'],
  'x-device-locale': ['Локаль устройства; чувствительные данные.', 'Device locale; sensitive data.', 'ru-RU'],
  'support-url': ['Ссылка на поддержку. Манифест перекрывает её значением `provider.support-url`.', 'Support link. The manifest overrides it with `provider.support-url`.', 'https://nebula.example/help'],
  'profile-web-page-url': ['Ссылка на личный кабинет. Манифест перекрывает её значением `provider.web-url`.', 'Account page link. The manifest overrides it with `provider.web-url`.', 'https://nebula.example/account'],
  'announce': ['Объявление провайдера. Для не-ASCII используйте `base64:`. Манифест перекрывает его значением `provider.announce.text`.', 'Provider announcement. Use `base64:` for non-ASCII text. The manifest overrides it with `provider.announce.text`.', 'base64:0J/RgNC40LLQtdGC'],
  'profile-title': ['Имя профиля подписки.', 'Subscription profile name.', 'Nebula subscription'],
  'profile-update-interval': ['Интервал обновления профиля в часах.', 'Profile update interval in hours.', '12'],
  'hide-url': ['Скрывает URL подписки в интерфейсе, но не делает его секретным для сервера. Манифест перекрывает его значением `provider.hide-url`.', 'Hides the subscription URL in the interface without making it secret from the server. The manifest overrides it with `provider.hide-url`.', 'true'],
  'reclash-config': ['HTTPS-адрес манифеста провайдера: YAML-файла, который описывает всё остальное. Подробности — в разделе «Манифест провайдера».', 'HTTPS address of the provider manifest, the YAML file that describes everything else. See the Provider manifest guide.', 'https://nebula.example/reclash.yaml'],
}
const transforms: Record<string, HeaderTransform> = { 'announce': 'base64', 'profile-title': 'base64', 'profile-update-interval': 'hours-to-minutes' }
const wireEntries: HeaderEntry[] = providerStandard.headers.map(header => {
  const [ru, en, example] = wireProse[header.name]!
  const name = header.name.toLowerCase()
  return { id: referenceAnchor(name), name,
    category: name === 'reclash-config' ? 'reclash' : name.startsWith('x-hwid') || ['x-device-os', 'x-ver-os', 'x-device-model', 'x-device-locale'].includes(name) ? 'hwid' : 'common',
    direction: header.direction as HeaderDirection, transform: transforms[name] ?? 'none',
    format: bi(header.encoding, header.encoding), summary: bi(ru, en), body: bi(ru, en),
    example: `${header.name}: ${example}`, keywords: bi(ru, en) }
})
export const headerReference: readonly HeaderEntry[] = wireEntries
const byName = new Map(headerReference.map(entry => [entry.name, entry]))
export function findHeaderEntry(name: string): HeaderEntry | undefined {
  return byName.get(name.toLowerCase())
}

/** Strip the `code` / **strong** markup for search and plain contexts. */
export function plainText(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')
}

/** Lowercased haystack for search: names, both-language keywords and the prose in `language`. */
export function searchText(entry: HeaderEntry, language: Language): string {
  return [
    entry.name,
    entry.keywords.ru, entry.keywords.en,
    entry.format ? plainText(entry.format[language]) : '',
    plainText(entry.summary[language]), plainText(entry.body[language]),
    ...(entry.table?.rows.map(row => `${row.token} ${row.values?.join(' ') ?? ''} ${row.text[language]}`) ?? []),
  ].join(' ').toLowerCase()
}
