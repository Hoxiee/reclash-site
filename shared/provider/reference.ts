import type { BilingualText, Language } from '../site/routes'
import { providerStandard, readOrderFor, standardHeaderFor, transformFor, type HeaderTransform } from './standard'

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
  { key: 'alias', label: bi('Псевдонимы', 'Aliases'), badge: bi('Псевдоним', 'Alias'), title: bi('Псевдонимы FlClashX', 'FlClashX aliases'),
    lede: bi('Заголовки flclashx-*, которые ReClash читает ради совместимости, — чтобы вам не пришлось ничего переделывать. Побеждает первый непустой заголовок в порядке чтения.',
      'The flclashx-* headers ReClash reads for compatibility, so you need not redo anything. The first non-empty header in the read order wins.') },
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

// ---- token vocabularies (structure from the fork standard, prose here) ------

const platformLabel = (platforms: readonly string[]): BilingualText => {
  const set = new Set(platforms)
  if (['Windows', 'MacOS', 'Linux', 'Android'].every(p => set.has(p))) return bi('все платформы', 'all platforms')
  if (set.size === 1 && set.has('Android')) return bi('Android', 'Android')
  if (!set.has('Android')) return bi('Windows, macOS, Linux', 'Windows, macOS, Linux')
  return bi(platforms.join(', '), platforms.join(', '))
}

const widgetProse: Record<string, [string, string, boolean]> = {
  networkSpeed: ['Скорость сети', 'Network speed', true],
  trafficUsage: ['Расход трафика', 'Traffic usage', true],
  networkDetection: ['Определение сети', 'Network detection', false],
  connectionPath: ['Путь соединения', 'Connection path', false],
  tunButton: ['Кнопка TUN', 'TUN button', false],
  vpnButton: ['Кнопка VPN', 'VPN button', false],
  systemProxyButton: ['Системный прокси', 'System proxy', false],
  intranetIp: ['Внутренний IP', 'Intranet IP', false],
  memoryInfo: ['Память', 'Memory info', false],
  goroutineInfo: ['Горутины', 'Goroutines', false],
  metaInfo: ['Подписка: срок и квота', 'Subscription: term and quota', false],
  announce: ['Объявление', 'Announcement', false],
  serviceInfo: ['Карточка сервиса', 'Service card', true],
  changeServerButton: ['Смена сервера', 'Change server', true],
  smartRouting: ['Умная маршрутизация', 'Smart routing', false],
  serviceStatus: ['Статус сервисов', 'Service status', false],
  connections: ['Соединения', 'Connections', false],
  dnsQueries: ['DNS-запросы', 'DNS queries', false],
  requests: ['Запросы', 'Requests', false],
  runTime: ['Старт', 'Start', false],
  proxyGroups: ['Группа прокси', 'Proxy group', false],
  profiles: ['Профили', 'Profiles', false],
  overrideDnsButton: ['Переопределить DNS', 'Override DNS', false],
}

export type WidgetInfo = { id: string, label: BilingualText, platform: BilingualText, defaultOn: boolean }

/** Dashboard widgets a provider may list in reclash-widgets (byedpi-only tools excluded). */
export const widgetCatalog: readonly WidgetInfo[] = providerStandard.widgets
  .filter(widget => !(widget.modes.length === 1 && widget.modes[0] === 'byedpi'))
  .map((widget) => {
    const [ru, en, defaultOn] = widgetProse[widget.id] ?? [widget.id, widget.id, false]
    return { id: widget.id, label: bi(ru, en), platform: platformLabel(widget.platforms), defaultOn }
  })

const viewProse: Record<string, BilingualText> = {
  type: bi('Форма страницы прокси', 'Proxy page shape'),
  sort: bi('Сортировка узлов', 'Node sorting'),
  layout: bi('Плотность сетки', 'Grid density'),
  icon: bi('Иконки узлов', 'Node icons'),
  card: bi('Размер карточки', 'Card size'),
}

export const viewTokens: readonly TokenRow[] = Object.entries(providerStandard.tokens.view)
  .map(([key, values]) => ({ token: key, values, text: viewProse[key] ?? bi(key, key) }))

const themeProse: Record<string, BilingualText> = {
  tonalspot: bi('Сбалансированный, по умолчанию', 'Balanced, the default'),
  fidelity: bi('Ближе к исходному цвету', 'Closer to the source colour'),
  monochrome: bi('Оттенки серого', 'Greyscale'),
  neutral: bi('Почти без насыщенности', 'Nearly desaturated'),
  vibrant: bi('Максимальная насыщенность', 'Maximum saturation'),
  expressive: bi('Смещённый оттенок', 'Shifted hue'),
  content: bi('От контента, живее fidelity', 'Content-driven, livelier than fidelity'),
}

export const themeVariants: readonly TokenRow[] = providerStandard.tokens.themeVariants
  .map(variant => ({ token: variant, text: themeProse[variant] ?? bi(variant, variant) }))

export const settingsTokens: readonly TokenRow[] = [
  { token: 'minimize', text: bi('Сворачивать вместо выхода', 'Minimize instead of exiting') },
  { token: 'autorun', text: bi('Подключаться при запуске ReClash', 'Start the connection when ReClash opens') },
  { token: 'shadowstart', text: bi('Запускаться в фоне', 'Launch in the background') },
  { token: 'autostart', text: bi('Запускаться вместе с системой', 'Launch at OS startup') },
  { token: 'autoupdate', text: bi('Проверять обновления ReClash', 'Check for ReClash updates') },
  { token: 'openlogs', text: bi('Открывать логи вместе с подключением', 'Open logs with the connection') },
  { token: 'closeconnections', text: bi('Закрывать соединения при паузе', 'Close connections when the VPN pauses') },
]

const tables: Record<'view' | 'theme' | 'widgets' | 'settings', TokenTable> = {
  view: { caption: bi('Ключи вида', 'View keys'), columns: [bi('Ключ', 'Key'), bi('Значения', 'Values'), bi('Что задаёт', 'What it sets')], rows: viewTokens },
  theme: { caption: bi('Варианты палитры', 'Palette variants'), columns: [bi('Вариант', 'Variant'), bi('Что даёт', 'What it does')], rows: themeVariants },
  widgets: {
    caption: bi('Виджеты', 'Widgets'),
    columns: [bi('Имя', 'Name'), bi('Виджет', 'Widget'), bi('Доступен', 'Available on')],
    rows: widgetCatalog.map(widget => ({ token: widget.id, text: widget.label, note: widget.platform })),
  },
  settings: { caption: bi('Токены настроек', 'Setting tokens'), columns: [bi('Токен', 'Token'), bi('Что включает', 'What it turns on')], rows: settingsTokens },
}

// ---- entries -----------------------------------------------------------------

type Draft = {
  name: string
  category: Exclude<HeaderCategory, 'alias'>
  direction?: HeaderDirection
  format?: BilingualText
  summary: BilingualText
  body?: BilingualText
  example?: string
  table?: TokenTable
  keywords: BilingualText
}

const drafts: Draft[] = [
  // ---- common ----------------------------------------------------------------
  { name: 'subscription-userinfo', category: 'common',
    format: bi('`upload=<байты>; download=<байты>; total=<байты>; expire=<unix-секунды>`', '`upload=<bytes>; download=<bytes>; total=<bytes>; expire=<unix-seconds>`'),
    summary: bi('Показывает расход трафика и дату окончания.', 'Shows traffic usage and the expiry date.'),
    body: bi('Расход и лимит трафика в байтах и дата окончания в unix-секундах. `total=0` — безлимит, `expire=0` — бессрочно. Клиент показывает остаток, полосу расхода и число дней до конца.',
      'Traffic usage and quota in bytes, plus the expiry as unix-seconds. `total=0` means unlimited, `expire=0` perpetual. The client shows the remaining amount, a usage bar and days left.'),
    example: 'Subscription-Userinfo: upload=13421772800; download=83994443776; total=214748364800; expire=1798761600',
    keywords: bi('трафик остаток квота срок лимит байты', 'traffic quota remaining expiry limit bytes') },
  { name: 'profile-title', category: 'common',
    format: bi('Имя профиля, UTF-8 или Base64', 'Profile name, plain UTF-8 or Base64'),
    summary: bi('Именует импортированный профиль, пока пользователь не переименовал его вручную. Для не-ASCII используйте `base64:`.',
      'Names the imported profile unless the user has renamed it. Use `base64:` for non-ASCII text.'),
    example: 'Profile-Title: Nebula VPN\nProfile-Title: base64:0J3QtdCx0YPQu9CwIFZQTg==',
    keywords: bi('имя профиля название', 'profile name title') },
  { name: 'content-disposition', category: 'common',
    format: bi('Имя файла в ответе', 'A response filename'),
    summary: bi('Запасной источник имени профиля.', 'Used as a profile-name fallback.'),
    example: 'Content-Disposition: attachment; filename="nebula.yaml"',
    keywords: bi('имя файла', 'filename') },
  { name: 'profile-update-interval', category: 'common',
    format: bi('Целое > 0, в часах', 'Positive integer, in hours'),
    summary: bi('Интервал обновления профиля.', 'Sets the profile update interval.'),
    example: 'Profile-Update-Interval: 24',
    keywords: bi('интервал обновления часы', 'update interval hours') },
  { name: 'support-url', category: 'common',
    format: bi('URL поддержки', 'Provider support URL'),
    summary: bi('Добавляет действие «Поддержка». Абсолютный HTTPS-адрес.', 'Adds a support action. Use an absolute HTTPS URL.'),
    example: 'Support-Url: https://nebula.example/help',
    keywords: bi('поддержка ссылка', 'support link') },
  { name: 'announce', category: 'common',
    format: bi('Текст или Base64', 'Plain text or Base64'),
    summary: bi('Показывает объявление провайдера.', 'Shows a provider announcement.'),
    example: 'Announce: base64:0J/RgNC+0YTQuNC70LDQutGC0LjQutCw',
    keywords: bi('объявление новость', 'announcement news') },
  { name: 'report-url', category: 'common',
    format: bi('URL для сообщения о проблеме', 'Issue-report URL'),
    summary: bi('Совместимое имя для `reclash-reporturl`. Добавляет действие «Сообщить о проблеме» с подпиской.',
      'Compatibility name for `reclash-reporturl`. Adds a “report an issue” action for the subscription.'),
    example: 'Report-Url: https://nebula.example/report',
    keywords: bi('отчёт проблема жалоба', 'report issue problem') },
  { name: 'profile-web-page-url', category: 'common',
    format: bi('URL личного кабинета', 'Provider account URL'),
    summary: bi('Совместимое имя для `reclash-webpageurl`, которое уже шлют marzban и 3x-ui.',
      'Compatibility name for `reclash-webpageurl`, already emitted by marzban and 3x-ui.'),
    example: 'Profile-Web-Page-Url: https://nebula.example/account',
    keywords: bi('личный кабинет аккаунт marzban 3x-ui', 'account personal cabinet marzban 3x-ui') },

  // ---- reclash ---------------------------------------------------------------
  { name: 'reclash-announce', category: 'reclash',
    format: bi('Текст или Base64', 'Plain text or Base64'),
    summary: bi('Объявление провайдера. Приоритетнее `announce`.', 'Provider announcement. Takes priority over `announce`.'),
    example: 'ReClash-Announce: base64:0J/RgNC+0YTQuNC70LDQutGC0LjQutCw 14.04',
    keywords: bi('объявление баннер', 'announcement banner') },
  { name: 'reclash-announceurl', category: 'reclash',
    format: bi('URL объявления', 'Provider announcement URL'),
    summary: bi('Делает объявление ссылкой: открывается вместо кнопки закрытия на листе и карточке объявления. Абсолютный HTTPS.',
      'Turns the announcement into a link: opens instead of the dismiss button on the announcement sheet and card. Use an absolute HTTPS URL.'),
    example: 'ReClash-AnnounceURL: https://nebula.example/news',
    keywords: bi('объявление ссылка новости', 'announcement link news') },
  { name: 'reclash-supporturl', category: 'reclash',
    format: bi('URL поддержки', 'Provider support URL'),
    summary: bi('Страница поддержки. Абсолютный HTTPS.', 'Support page. Use an absolute HTTPS URL.'),
    example: 'ReClash-SupportURL: https://nebula.example/help',
    keywords: bi('поддержка помощь', 'support help') },
  { name: 'reclash-autoupdateinterval', category: 'reclash',
    format: bi('Целое > 0, в минутах', 'Positive integer, in minutes'),
    summary: bi('Интервал обновления профиля.', 'Profile update interval.'),
    example: 'ReClash-AutoUpdateInterval: 60',
    keywords: bi('интервал обновления минуты', 'update interval minutes') },
  { name: 'reclash-expiredays', category: 'reclash',
    format: bi('Дни через запятую', 'Comma-separated days'),
    summary: bi('За сколько дней до конца подписки напоминать. Переопределяет значение по умолчанию 3,2,1.',
      'Days-before-expiry the client reminds at. Overrides the default 3,2,1.'),
    example: 'ReClash-ExpireDays: 7,3,1',
    keywords: bi('дни окончания напоминание срок', 'expiry days reminder') },
  { name: 'reclash-trafficpercent', category: 'reclash',
    format: bi('Проценты через запятую', 'Comma-separated percents'),
    summary: bi('На каких процентах израсходованного трафика напоминать на тарифах с лимитом. Переопределяет значение по умолчанию 90.',
      'Used-traffic percents the client reminds at on metered plans. Overrides the default 90.'),
    example: 'ReClash-TrafficPercent: 80,95',
    keywords: bi('трафик проценты напоминание лимит', 'traffic percent reminder quota') },
  { name: 'reclash-servicename', category: 'reclash',
    format: bi('Текст или Base64', 'Plain text or Base64'),
    summary: bi('Имя сервиса на панели.', 'Provider name shown in the dashboard.'),
    example: 'ReClash-ServiceName: Nebula VPN',
    keywords: bi('имя сервиса бренд', 'service name brand') },
  { name: 'reclash-activetext', category: 'reclash',
    format: bi('Текст или Base64', 'Plain text or Base64'),
    summary: bi('Надпись под кольцом подключения и в уведомлении Android вместо «Вы защищены».',
      'The caption under the hero orb and in the Android notification, in place of “You are protected”.'),
    body: bi('Надпись под кольцом подключения и в уведомлении Android — вместо стандартного «Вы защищены». Для не-ASCII используйте `base64:`.',
      'The caption under the connection ring and in the Android notification — in place of the default “You are protected”. Use `base64:` for non-ASCII.'),
    example: 'ReClash-ActiveText: Nebula has you covered',
    keywords: bi('надпись подключение защита', 'caption connected protected') },
  { name: 'reclash-servicelogo', category: 'reclash',
    format: bi('Абсолютный HTTPS-URL картинки', 'Absolute HTTPS image URL'),
    summary: bi('Логотип на панели и в контроле подключения.', 'Provider logo shown in the dashboard and connection control.'),
    body: bi('Логотип на панели и в контроле подключения. Абсолютный HTTPS-адрес, PNG или SVG, квадрат 256–512 px, прозрачный фон; значимую часть держите в центральных 80 % — края обрезаются под скругление.',
      'The logo on the dashboard and connection control. An absolute HTTPS URL, PNG or SVG, square 256–512 px, transparent background; keep the meaningful part inside the central 80 % — edges get rounded off.'),
    example: 'ReClash-ServiceLogo: https://nebula.example/logo-512.png',
    keywords: bi('логотип картинка бренд', 'logo image brand') },
  { name: 'reclash-serverinfo', category: 'reclash',
    format: bi('Имя прокси-группы, текст или Base64', 'Proxy-group name, plain text or Base64'),
    summary: bi('Группа, из которой берётся активный сервер для панели.', 'Group used to resolve the active server shown in the dashboard.'),
    example: 'ReClash-ServerInfo: Auto',
    keywords: bi('группа сервер активный', 'group server active') },
  { name: 'reclash-buyplan', category: 'reclash',
    format: bi('URL', 'URL'),
    summary: bi('Действие «Продлить / купить тариф».', 'Subscription renewal or plan purchase action.'),
    example: 'ReClash-BuyPlan: https://nebula.example/billing',
    keywords: bi('тариф продление оплата биллинг', 'plan renew billing purchase') },
  { name: 'reclash-buytraffic', category: 'reclash',
    format: bi('URL', 'URL'),
    summary: bi('Действие «Докупить трафик».', 'Extra-traffic purchase action.'),
    example: 'ReClash-BuyTraffic: https://nebula.example/billing/traffic',
    keywords: bi('трафик докупить оплата', 'traffic top up purchase') },
  { name: 'reclash-reporturl', category: 'reclash',
    format: bi('URL', 'URL'),
    summary: bi('Действие «Сообщить о проблеме с подпиской».', 'Subscription issue-report action.'),
    example: 'ReClash-ReportURL: https://nebula.example/report',
    keywords: bi('отчёт проблема жалоба', 'report issue problem') },
  { name: 'reclash-webpageurl', category: 'reclash',
    format: bi('URL личного кабинета', 'Provider account URL'),
    summary: bi('Ссылка на личный кабинет в деталях подписки. Также читается из заголовка `profile-web-page-url`, который уже шлют marzban и 3x-ui. Абсолютный HTTPS.',
      'Personal-account link in the subscription details. Also read from the `profile-web-page-url` header that marzban and 3x-ui already emit. Use an absolute HTTPS URL.'),
    example: 'ReClash-WebPageURL: https://nebula.example/account',
    keywords: bi('личный кабинет аккаунт профиль', 'account personal cabinet profile') },
  { name: 'reclash-view', category: 'reclash',
    format: bi('`type:… sort:… layout:… icon:… card:…`', '`type:… sort:… layout:… icon:… card:…`'),
    summary: bi('Предлагает вид страницы прокси для этого профиля.', 'Suggests the proxy-page presentation for this profile.'),
    body: bi('Токены вида `ключ:значение` через запятую или точку с запятой. Неизвестные ключи и значения отбрасываются, остальные применяются. Это предложение, а не приказ: пользователь может переключить вид сам.',
      'Tokens of the form `key:value`, comma- or semicolon-separated. Unknown keys and values are dropped, the rest apply. It is a suggestion, not an order: the user can switch the view back.'),
    table: tables.view,
    example: 'ReClash-View: type:tab; sort:delay; layout:tight; icon:standard; card:shrink',
    keywords: bi('вид страница прокси сортировка сетка', 'view proxy page sort grid layout') },
  { name: 'reclash-hex', category: 'reclash',
    format: bi('`RRGGBB[:variant][:pureblack]`', '`RRGGBB[:variant][:pureblack]`'),
    summary: bi('Применяет тему, пока профиль активен.', 'Applies a theme while this profile is active.'),
    body: bi('Цвет `RRGGBB` или `AARRGGBB`, за ним необязательный вариант палитры и необязательный `pureblack` (чёрный AMOLED-фон). Разделители — `:`, `;` или `,`. Тема действует, пока профиль активен.',
      'An `RRGGBB` or `AARRGGBB` colour, then an optional palette variant and an optional `pureblack` (an AMOLED black background). Separators are `:`, `;` or `,`. The theme applies while the profile is active.'),
    table: tables.theme,
    example: 'ReClash-Hex: 2FD3B6\nReClash-Hex: 2FD3B6:vibrant\nReClash-Hex: FF7C5CFF;expressive;pureblack',
    keywords: bi('тема цвет палитра pureblack amoled', 'theme colour color palette pureblack amoled') },
  { name: 'reclash-background', category: 'reclash',
    format: bi('`url[,opacity]`', '`url[,opacity]`'),
    summary: bi('Фон панели, пока профиль активен.', 'Applies a dashboard background while this profile is active.'),
    body: bi('Абсолютный `http`- или `https`-адрес картинки и необязательная непрозрачность 1–100. По умолчанию 10 — фон должен оставаться фоном. Действует, пока профиль активен.',
      'An absolute `http` or `https` image URL and an optional opacity from 1 to 100. The default is 10 — a background should stay a background. Applies while the profile is active.'),
    example: 'ReClash-Background: https://nebula.example/bg.webp,14',
    keywords: bi('фон картинка обои прозрачность', 'background image wallpaper opacity') },
  { name: 'reclash-heroring', category: 'reclash',
    format: bi('`c1;c2;c3`', '`c1;c2;c3`'),
    summary: bi('Градиент кольца в подключённом состоянии.', 'Sets the connected-state hero-ring gradient.'),
    body: bi('Ровно три цвета — градиент кольца вокруг кнопки подключения. Меньше или больше трёх значений игнорируется целиком. Псевдонима у этого заголовка нет.',
      'Exactly three colours — the gradient of the ring around the connect button. Fewer or more than three values are ignored entirely. This header has no alias.'),
    example: 'ReClash-HeroRing: 7C5CFF;3686ED;2FD3B6',
    keywords: bi('кольцо градиент подключение', 'ring gradient hero connection') },
  { name: 'reclash-heroeffect', category: 'reclash',
    format: bi('`aurora`', '`aurora`'),
    summary: bi('Живой эффект за кольцом подключения. Пока поддерживается только `aurora`; любое другое значение выключает эффект.',
      'A living effect behind the connection ring. Only `aurora` is supported for now; any other value turns the effect off.'),
    body: bi('Живой эффект за кольцом подключения. Пока поддерживается только `aurora` — мягкое северное сияние; любое другое значение выключает эффект. Псевдонима у этого заголовка нет.',
      'A living effect behind the connection ring. Only `aurora` — a soft aurora glow — is supported for now; any other value turns the effect off. This header has no alias.'),
    example: 'ReClash-HeroEffect: aurora',
    keywords: bi('эффект сияние aurora кольцо анимация', 'effect aurora glow ring animation') },
  { name: 'reclash-widgets', category: 'reclash',
    format: bi('имена через запятую', 'comma-separated names'),
    summary: bi('Предлагает набор и порядок виджетов панели.', 'Suggests dashboard widgets and their order.'),
    body: bi('Имена виджетов через запятую — порядок в списке становится порядком на панели. Виджеты, недоступные на платформе, просто не появятся. `reclash-custom` управляет тем, как список сливается с пользовательским.',
      'Comma-separated widget names — their order becomes the order on the dashboard. Widgets unavailable on a platform simply do not appear. `reclash-custom` controls how the list merges with the user\'s own.'),
    table: tables.widgets,
    example: 'ReClash-Widgets: serviceInfo,networkSpeed,trafficUsage,changeServerButton',
    keywords: bi('виджеты панель карточки порядок', 'widgets dashboard cards order') },
  { name: 'reclash-custom', category: 'reclash',
    format: bi('`add` | `update`', '`add` | `update`'),
    summary: bi('Как сливать список виджетов с пользовательским.', 'Controls how `reclash-widgets` is merged.'),
    body: bi('Как `reclash-widgets` сливается с уже собранным пользователем набором: `add` добавляет недостающие виджеты в конец, `update` заменяет набор целиком. Без этого заголовка набор предлагается только при первом добавлении профиля.',
      'How `reclash-widgets` merges with the set the user already assembled: `add` appends the missing widgets, `update` replaces the whole set. Without this header the set is suggested only when the profile is first added.'),
    example: 'ReClash-Widgets: serviceInfo,networkSpeed,trafficUsage,changeServerButton\nReClash-Custom: update',
    keywords: bi('слияние виджеты добавить заменить', 'merge widgets add update replace') },
  { name: 'reclash-settings', category: 'reclash',
    format: bi('токены через запятую', 'comma-separated tokens'),
    summary: bi('Настройки по умолчанию при первом добавлении профиля — после подтверждения пользователем.',
      'Application defaults offered when the profile is first added — applied only after the user confirms.'),
    body: bi('Настройки по умолчанию. Предлагаются **один раз** — при первом добавлении профиля: ReClash покажет запрошенные изменения и применит их только после подтверждения. Не перечисленные настройки остаются как есть, дальше настройками владеет пользователь.',
      'Application defaults. Offered **once** — when the profile is first added: ReClash shows the requested changes and applies them only after the user confirms. Unlisted settings keep their values; after that the settings belong to the user.'),
    table: tables.settings,
    example: 'ReClash-Settings: minimize,autoupdate',
    keywords: bi('настройки умолчания автозапуск', 'settings defaults autostart autorun') },
  { name: 'reclash-newdomain', category: 'reclash',
    format: bi('`хост[:порт]`', '`host[:port]`'),
    summary: bi('Предлагает миграцию домена подписки — после проверок.', 'Proposes a subscription-domain migration subject to checks.'),
    body: bi('Только имя хоста и необязательный порт — без схемы, пути и параметров. Клиент не переключается вслепую: он проверяет, что новый адрес действительно отдаёт вашу подписку, и только потом переносит профиль.',
      'A hostname and an optional port only — no scheme, path or query. The client does not switch blindly: it verifies that the new address really serves your subscription, and only then migrates the profile.'),
    example: 'ReClash-NewDomain: sub.nebula.example\nReClash-NewDomain: sub.nebula.example:8443',
    keywords: bi('смена домен миграция переезд', 'domain migration move switch') },
  { name: 'reclash-fallbackhosts', category: 'reclash',
    format: bi('до 4 хостов через запятую', 'up to 4 comma-separated hosts'),
    summary: bi('Запасные хосты при временных сбоях загрузки.', 'Supplies fallback hosts for transient fetch failures.'),
    body: bi('До четырёх имён хостов через запятую — без портов и схемы. Имена приводятся к нижнему регистру, дубликаты убираются, лишнее отбрасывается. Клиент идёт к ним, когда основной адрес временно недоступен. Псевдонима нет.',
      'Up to four comma-separated hostnames — no ports, no scheme. Names are lowercased, duplicates removed, the excess dropped. The client falls back to them when the main address is temporarily unreachable. No alias.'),
    example: 'ReClash-FallbackHosts: sub2.nebula.example,sub3.nebula.example',
    keywords: bi('запасные хосты резерв отказоустойчивость', 'fallback hosts backup failover') },

  // ---- hwid: request, then response ----------------------------------------------
  { name: 'x-hwid', category: 'hwid', direction: 'request',
    summary: bi('Стабильный 16-символьный хеш устройства', 'Stable 16-character device hash'),
    example: 'X-HWID: 3f7a9c2e5b1d8046',
    keywords: bi('устройство хеш идентификатор', 'device hash identifier') },
  { name: 'x-device-os', category: 'hwid', direction: 'request',
    summary: bi('Название ОС', 'Operating-system name'),
    example: 'X-Device-OS: Android',
    keywords: bi('ос платформа', 'os platform') },
  { name: 'x-ver-os', category: 'hwid', direction: 'request',
    summary: bi('Версия ОС', 'Operating-system version'),
    example: 'X-Ver-OS: 14',
    keywords: bi('версия ос', 'os version') },
  { name: 'x-device-model', category: 'hwid', direction: 'request',
    summary: bi('Модель устройства или имя хоста', 'Device model or host name'),
    example: 'X-Device-Model: Pixel 8',
    keywords: bi('модель устройство хост', 'model device host') },
  { name: 'x-hwid-max-devices-reached', category: 'hwid',
    format: bi('`true`', '`true`'),
    summary: bi('Показывает сообщение о лимите устройств и предлагает `reclash-supporturl`, если он есть.',
      'Shows the device-limit message and offers `reclash-supporturl` when available.'),
    example: 'X-HWID-Max-Devices-Reached: true',
    keywords: bi('лимит устройств превышен', 'device limit reached') },
  { name: 'x-hwid-not-supported', category: 'hwid',
    format: bi('`true`', '`true`'),
    summary: bi('Показывает, что выбранный режим клиента или устройства не поддерживается.', 'Shows that the selected client/device mode is unsupported.'),
    example: 'X-HWID-Not-Supported: true',
    keywords: bi('режим не поддерживается', 'mode unsupported') },
]

export const referenceAnchor = (name: string): string => `h-${name.toLowerCase()}`

function entryFromDraft(draft: Draft): HeaderEntry {
  const readOrder = readOrderFor(draft.name)
  const aliases = draft.category === 'reclash' ? readOrder.filter(wire => wire.startsWith('flclashx-')) : []
  return {
    id: referenceAnchor(draft.name),
    name: draft.name,
    category: draft.category,
    direction: draft.direction ?? 'response',
    canonical: standardHeaderFor(draft.name)?.canonical,
    transform: transformFor(draft.name),
    readOrder,
    aliases,
    format: draft.format,
    summary: draft.summary,
    body: draft.body ?? draft.summary,
    example: draft.example,
    table: draft.table,
    keywords: draft.keywords,
  }
}

const primaries = drafts.map(entryFromDraft)

// Compatibility aliases: one entry per flclashx-* wire name, derived from the
// reclash-* header it stands in for, so the two can never disagree.
const aliasEntries: HeaderEntry[] = primaries
  .filter(entry => entry.category === 'reclash')
  .flatMap(primary => primary.aliases.map((name): HeaderEntry => {
    const hours = transformFor(name) === 'hours-to-minutes'
    const example = primary.example?.split('\n')[0]?.replace(/^[^:]+:/, `${name}:`)
    return {
      id: referenceAnchor(name),
      name,
      category: 'alias',
      direction: 'response',
      canonical: standardHeaderFor(name)?.canonical,
      transform: transformFor(name),
      readOrder: primary.readOrder,
      aliases: [],
      aliasOf: primary.name,
      format: hours ? bi('Целое > 0, в часах', 'Positive integer, in hours') : primary.format,
      summary: bi(`Совместимое имя FlClashX для \`${primary.name}\`.`, `FlClashX compatibility name for \`${primary.name}\`.`),
      body: bi(
        `Совместимое имя FlClashX для \`${primary.name}\`: читается, только если заголовки раньше в порядке чтения пусты. ${primary.summary.ru}`,
        `FlClashX compatibility name for \`${primary.name}\`: read only when the headers earlier in the read order are empty. ${primary.summary.en}`,
      ),
      example: hours ? `${name}: 24` : example,
      keywords: bi(`flclashx псевдоним совместимость ${primary.keywords.ru}`, `flclashx alias compatibility ${primary.keywords.en}`),
    }
  }))

/** Every header ReClash reads, grouped by category in display order. */
export const headerReference: readonly HeaderEntry[] = [...primaries, ...aliasEntries]

const byName = new Map(headerReference.map(entry => [entry.name, entry]))

/** Look up an entry by wire name (case-insensitive). */
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
