import type { BilingualText, Language } from '../site/routes'
import { providerStandard, readOrderFor, standardHeaderFor, subscriptionTypes, transformFor, type HeaderTransform } from './standard'

// The header reference: every header ReClash reads, with bilingual format,
// purpose, details, example and search terms. The page, the docs and the
// builder link into entries by `id` (`h-<lowercase wire name>`).
//
// Prose is light markup: `code` and **strong**. Render it with
// <ReferenceRich>, never as HTML; `plainText` strips it for search.

export type HeaderCategory = 'common' | 'reclash' | 'hwid' | 'alias'
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
  /** Provider-standard setting this header feeds, when it is part of the standard. */
  canonical?: string
  transform: HeaderTransform
  /** Every wire name that feeds the same setting, in priority order (includes `name`). */
  readOrder: readonly string[]
  /** Other wire names for the same setting, shown as alias chips. */
  aliases: readonly string[]
  /** For compatibility aliases: the reclash-* header they stand in for. */
  aliasOf?: string
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
  { key: 'reclash', label: bi('ReClash', 'ReClash'), badge: bi('ReClash', 'ReClash'), title: bi('Заголовки ReClash', 'ReClash headers'),
    lede: bi('Заголовки, которые понимает только ReClash. Все необязательны.',
      'Headers only ReClash understands. Every one is optional.') },
  { key: 'hwid', label: bi('HWID', 'HWID'), badge: bi('HWID', 'HWID'), title: bi('Устройства и HWID', 'Devices and HWID'),
    lede: bi('Заголовки запроса от клиента и ответы на них.',
      'Request headers from the client and the responses to them.') },
  { key: 'alias', label: bi('Псевдонимы', 'Aliases'), badge: bi('Псевдоним', 'Alias'), title: bi('Общие псевдонимы', 'Common aliases'),
    lede: bi('Общие имена заголовков, которые принимает стандарт подписок. Заголовки FlClashX преобразуются отдельно, только в соответствующем режиме совместимости.',
      'Common header names accepted by the subscription standard. FlClashX headers are adapted separately, only in the corresponding compatibility mode.') },
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


const fieldProse: Record<string, [string, string, string]> = {
  'provider.name': ['Имя сервиса на панели.', 'Provider name on the dashboard.', 'Nebula'],
  'provider.logo': ['Логотип сервиса. Используйте абсолютный HTTPS-URL изображения.', 'Provider logo. Use an absolute HTTPS image URL.', 'https://nebula.example/logo.png'],
  'provider.supportUrl': ['Ссылка на поддержку.', 'Support link.', 'https://nebula.example/help'],
  'provider.webUrl': ['Ссылка на личный кабинет.', 'Account page link.', 'https://nebula.example/account'],
  'provider.buyPlanUrl': ['Продление тарифа. Необязательный суффикс задаёт порог в днях.', 'Plan renewal. An optional suffix sets the days-before-expiry threshold.', 'https://nebula.example/renew,3'],
  'provider.buyTrafficUrl': ['Покупка трафика. Необязательный суффикс задаёт порог остатка в процентах.', 'Traffic top-up. An optional suffix sets the remaining-traffic percentage threshold.', 'https://nebula.example/traffic,10'],
  'provider.announce': ['Объявление провайдера. Для не-ASCII используйте base64:.', 'Provider announcement. Use base64: for non-ASCII text.', 'Maintenance tonight'],
  'provider.announceUrl': ['Ссылка объявления.', 'Announcement link.', 'https://nebula.example/news'],
  'provider.notice': ['Дополнительное уведомление провайдера.', 'Additional provider notice.', 'Check your account'],
  'provider.noticeUrl': ['Ссылка дополнительного уведомления.', 'Additional notice link.', 'https://nebula.example/account'],
  'subscription.type': ['Тип подписки для бейджа: test, promo или dev. Только отображение; неизвестные значения не показывают бейдж. HTTP-заголовок также читается в предпросмотре YAML, а в теле допустим начальный комментарий # ReClash-SubscriptionType: test.', 'Subscription badge type: test, promo or dev. Display only; unknown values show no badge. The HTTP header is also read in the YAML import preview; a leading # ReClash-SubscriptionType: test body comment is supported.', 'test'],
  'account.title': ['Имя профиля подписки.', 'Subscription profile name.', 'Nebula subscription'],
  'update.intervalMinutes': ['Интервал обновления в минутах. Общий псевдоним profile-update-interval задаётся в часах.', 'Update interval in minutes. The common profile-update-interval alias uses hours.', '60'],
  'routing.bundleUrl': ['URL набора профилей маршрутизации RCX. Это подсказка: доверие к проверочным хостам остаётся под контролем пользователя.', 'URL of an RCX routing profile bundle. This is a hint: trust in probe hosts remains under user control.', 'https://nebula.example/routing.json'],
  'presentation.hideUrl': ['Скрывает URL подписки в интерфейсе, но не делает его секретным для сервера.', 'Hides the subscription URL in the interface; it does not hide it from the server.', 'true'],
  'presentation.serverGroup': ['Имя группы, из которой панель берёт активный сервер.', 'Group used by the dashboard to resolve the active server.', 'Proxy'],
  'presentation.widgets': ['Предлагает набор виджетов панели. Неизвестные имена игнорируются.', 'Suggests dashboard widgets. Unknown names are ignored.', 'currentOutbound,networkSpeed,profiles,proxyGroups'],
  'presentation.background': ['Фоновое изображение и необязательная непрозрачность 1–100. Без суффикса — 8 %.', 'Background image and optional opacity from 1 to 100. Without a suffix: 8%.', 'https://nebula.example/background.png,8'],
  'presentation.view': ['Предлагает оформление приложения и страницы прокси. Цвет задаётся app.color, стиль — app.style.', 'Suggests app and proxy-page appearance. Set color with app.color and style with app.style.', 'app.color:2FD3B6;app.style:vivid;proxies.type:list;proxies.sort:delay'],
  'reminder.expireDays': ['Пороги напоминаний до окончания подписки, в днях.', 'Reminder thresholds before subscription expiry, in days.', '7,3,1'],
  'reminder.trafficPercent': ['Пороги напоминаний по израсходованному трафику, в процентах.', 'Reminder thresholds for used traffic, in percent.', '80,95'],
  'settings.flags': ['Предлагает настройки приложения. Перечисленные флаги включаются, остальные из этого набора выключаются; пользовательские решения имеют приоритет.', 'Suggests app settings. Listed flags are enabled and other flags in this set disabled; user decisions take precedence.', 'minimize,autoupdate'],
  'settings.restrictions': ['Ограничения профиля: noGlobal, androidSecure, denyWidgets.', 'Profile restrictions: noGlobal, androidSecure, denyWidgets.', 'noGlobal'],
  'transport.fallbackHosts': ['Запасные адреса сервера подписки для повторной попытки после ошибки.', 'Fallback subscription server addresses for retry after failure.', 'backup.nebula.example'],
  'transport.newDomain': ['Предлагает перенос подписки на другой домен. Не передавайте полный URL с токеном.', 'Suggests moving the subscription to another domain. Do not send a full URL containing the token.', 'new.nebula.example'],
  'apps.exclude': ['Пакеты Android, исключаемые из VPN.', 'Android packages excluded from the VPN.', 'org.example.local'],
  'apps.include': ['Пакеты Android, включаемые в VPN.', 'Android packages included in the VPN.', 'org.example.browser'],
  'apps.routing': ['Региональное исключение приложений Android: domestic или domestic:<cc>.', 'Regional Android app bypass: domestic or domestic:<cc>.', 'domestic:ru'],
}

export const widgetCatalog = [
  ['currentOutbound', 'Текущий узел', 'Current outbound'],
  ['networkSpeed', 'Скорость сети', 'Network speed'],
  ['outboundMode', 'Режим маршрутизации', 'Outbound mode'],
  ['vpnButton', 'Кнопка VPN (Android)', 'VPN button (Android)'],
  ['networkTakeover', 'Перехват трафика (компьютер)', 'Traffic capture (desktop)'],
  ['serviceStatus', 'Статус сервисов', 'Service status'],
  ['profiles', 'Профили', 'Profiles'],
  ['proxyGroups', 'Группы прокси', 'Proxy groups'],
  ['connectionStats', 'Статистика соединений', 'Connection statistics'],
  ['intranetIp', 'Локальный IP', 'Local IP'],
  ['memoryInfo', 'Память', 'Memory'],
  ['announcement', 'Объявление', 'Announcement'],
] as const

const viewTokens: TokenRow[] = [
  { token: 'proxies.type', values: ['tab', 'list'], text: bi('Вид списка прокси', 'Proxy list presentation') },
  { token: 'proxies.sort', values: ['none', 'delay', 'name'], text: bi('Сортировка', 'Sorting') },
  { token: 'proxies.layout', values: ['loose', 'standard', 'tight'], text: bi('Плотность', 'Density') },
  { token: 'proxies.icon', values: ['filled', 'plain', 'hidden'], text: bi('Иконки узлов', 'Node icons') },
  { token: 'proxies.card', values: ['loose', 'standard', 'compact'], text: bi('Карточки', 'Cards') },
  { token: 'app.color', values: ['RRGGBB', 'AARRGGBB'], text: bi('Цвет акцента', 'Accent color') },
  { token: 'app.style', values: ['vivid', 'tinted', 'soft', 'monochrome'], text: bi('Стиль палитры', 'Palette style') },
  { token: 'app.black', values: ['true', 'false'], text: bi('Чёрный фон', 'Black background') },
  { token: 'app.navbar', values: ['floating', 'docked'], text: bi('Навигация', 'Navigation') },
  { token: 'app.tabs', values: ['slide', 'fade'], text: bi('Анимация вкладок', 'Tab animation') },
  { token: 'app.glass', values: ['none', 'standard', 'ultra'], text: bi('Эффект стекла', 'Glass effect') },
]
const tables: Record<string, TokenTable> = {
  'subscription.type': { caption: bi('Типы подписки', 'Subscription types'), columns: [bi('Значение', 'Value'), bi('Бейдж', 'Badge')], rows: Object.entries(subscriptionTypes).map(([token, text]) => ({ token, text })) },
  'presentation.view': { caption: bi('Ключи вида', 'View keys'), columns: [bi('Ключ', 'Key'), bi('Значения', 'Values'), bi('Назначение', 'Purpose')], rows: viewTokens },
  'presentation.widgets': { caption: bi('Виджеты панели', 'Dashboard widgets'), columns: [bi('Токен', 'Token'), bi('Назначение', 'Purpose')], rows: widgetCatalog.map(([token, ru, en]) => ({ token, text: bi(ru, en) })) },
}
export const referenceAnchor = (name: string): string => `h-${name.toLowerCase()}`

const primaries: HeaderEntry[] = providerStandard.fields.map(field => {
  const [ru, en, example] = fieldProse[field.path]!
  const readOrder = readOrderFor(field.name)
  const format = `${field.encoding}; limit: ${field.limit}${'unit' in field ? ` ${field.unit}` : ''}`
  return {
    id: referenceAnchor(field.name), name: field.name,
    category: field.name.startsWith('reclash-') ? 'reclash' : 'common',
    direction: 'response', canonical: field.path, transform: transformFor(field.name),
    readOrder, aliases: readOrder.slice(1), format: bi(format, format),
    summary: bi(ru, en), body: bi(ru, en), example: `${field.name}: ${example}`,
    table: tables[field.path], keywords: bi(field.path, field.path),
  }
})
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
}
const wireEntries: HeaderEntry[] = providerStandard.headers.map(header => {
  const [ru, en, example] = wireProse[header.name]!
  const name = header.name.toLowerCase()
  return { id: referenceAnchor(name), name, category: name.startsWith('x-hwid') || ['x-device-os', 'x-ver-os', 'x-device-model', 'x-device-locale'].includes(name) ? 'hwid' : 'common',
    direction: header.direction as HeaderDirection, transform: 'none', readOrder: [name], aliases: [],
    format: bi(header.encoding, header.encoding), summary: bi(ru, en), body: bi(ru, en),
    example: `${header.name}: ${example}`, keywords: bi(ru, en) }
})
const aliasEntries: HeaderEntry[] = primaries.flatMap(primary => primary.aliases.map(name => ({
  ...primary, id: referenceAnchor(name), name, category: 'alias' as const,
  aliasOf: primary.name, aliases: [], transform: transformFor(name),
  summary: bi(`Общее имя для \`${primary.name}\`.`, `Common name for \`${primary.name}\`.`),
  example: name === 'profile-update-interval' ? `${name}: 1` : primary.example?.replace(/^[^:]+:/, `${name}:`),
})))
export const headerReference: readonly HeaderEntry[] = [...primaries, ...wireEntries, ...aliasEntries]
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
    entry.name, ...entry.readOrder, entry.canonical ?? '',
    entry.keywords.ru, entry.keywords.en,
    entry.format ? plainText(entry.format[language]) : '',
    plainText(entry.summary[language]), plainText(entry.body[language]),
    ...(entry.table?.rows.map(row => `${row.token} ${row.values?.join(' ') ?? ''} ${row.text[language]}`) ?? []),
  ].join(' ').toLowerCase()
}
