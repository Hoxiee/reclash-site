// Provider documentation: the narrative guide read front to back.
// Content is bilingual data; inline markup is a tiny typed dialect parsed below:
//   `name`            inline code (links to the reference card when it names a documented header)
//   [text](page:key)  another site page
//   [text](#section)  a section of this page
//   [text](https://…) an external link
import type { Language, PageKey } from './routes'
import { findHeaderEntry } from '../provider/reference'

export type Inline =
  | { kind: 'text', text: string }
  | { kind: 'code', text: string, header?: string }
  | { kind: 'page', text: string, page: PageKey }
  | { kind: 'anchor', text: string, anchor: string }
  | { kind: 'external', text: string, href: string }
export type Rich = Inline[]

type Bi<T = string> = Record<Language, T>

export type DocBlock =
  | { kind: 'p', text: Rich }
  | { kind: 'h3', text: string }
  | { kind: 'code', code: string, label: string }
  | { kind: 'layers', items: Array<{ term: string, tag: string, body: Rich }> }
  | { kind: 'rules', items: Array<{ term: string, body: Rich }> }
  | { kind: 'problems', items: Array<{ term: string, body: Rich }> }
  | { kind: 'note', tone: 'info' | 'warn', text: Rich }
  | { kind: 'aliases', head: [string, string], rows: Array<{ label: string, chain: Inline[] }> }
  | { kind: 'table', direction: string, head: [string, string], rows: Array<[Rich, Rich]> }
  | { kind: 'steps', items: Rich[] }

export type DocSection = { id: string, title: string, keys: string, blocks: DocBlock[] }

export const providerHeadersSource = 'https://github.com/Hoxiee/ReClash/blob/main/PROVIDER_HEADERS.md'

// A header in inline code links to its card when the shared reference catalogue has one.
export function referenceAnchor(name: string): string | undefined {
  return findHeaderEntry(name.trim())?.id
}

function code(text: string): Inline {
  const header = referenceAnchor(text) ? text.toLowerCase() : undefined
  return header ? { kind: 'code', text, header } : { kind: 'code', text }
}

const token = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g

export function rich(source: string): Rich {
  const out: Rich = []
  let last = 0
  for (const match of source.matchAll(token)) {
    const at = match.index ?? 0
    if (at > last) out.push({ kind: 'text', text: source.slice(last, at) })
    if (match[1] !== undefined) out.push(code(match[1]))
    else {
      const text = match[2]!
      const target = match[3]!
      if (target.startsWith('page:')) out.push({ kind: 'page', text, page: target.slice(5) as PageKey })
      else if (target.startsWith('#')) out.push({ kind: 'anchor', text, anchor: target.slice(1) })
      else out.push({ kind: 'external', text, href: target })
    }
    last = at + match[0].length
  }
  if (last < source.length) out.push({ kind: 'text', text: source.slice(last) })
  return out
}

const b = (ru: string, en: string): Bi => ({ ru, en })

// ---------------------------------------------------------------- sources

const overviewExample = [
  'HTTP/1.1 200 OK',
  'Content-Type: application/yaml; charset=utf-8',
  'Subscription-Userinfo: upload=13421772800; download=83994443776; total=214748364800; expire=1798761600',
  'Profile-Title: Nebula VPN',
  'ReClash-ServiceName: Nebula VPN',
  'ReClash-Hex: 2FD3B6:vibrant',
  'ReClash-SupportURL: https://nebula.example/help',
].join('\n')

const curlTest = (language: Language) => [
  `# ${language === 'ru' ? 'что реально уходит клиенту' : 'what actually reaches the client'}`,
  `curl -sSI 'https://sub.nebula.example/sub/TOKEN' | grep -i 'reclash\\|subscription\\|profile\\|content-disposition'`,
  '',
  `# ${language === 'ru' ? 'тело подписки, без заголовков' : 'the subscription body, without headers'}`,
  `curl -s 'https://sub.nebula.example/sub/TOKEN' | head -20`,
].join('\n')

// Priority chains: the first non-empty value wins. {m} and {h} are unit placeholders.
const aliasChains: Array<{ label: Bi, chain: string[] }> = [
  { label: b('Объявление', 'Announcement'), chain: ['reclash-announce', 'announce'] },
  { label: b('URL поддержки', 'Support URL'), chain: ['reclash-supporturl', 'support-url', 'flclashx-supporturl'] },
  { label: b('Интервал обновления', 'Update interval'), chain: ['reclash-autoupdateinterval ({m})', 'profile-update-interval ({h})', 'flclashx-autoupdateinterval ({h})'] },
  { label: b('Имя сервиса', 'Service name'), chain: ['reclash-servicename', 'flclashx-servicename'] },
  { label: b('Логотип сервиса', 'Service logo'), chain: ['reclash-servicelogo', 'flclashx-servicelogo'] },
  { label: b('Группа сервера', 'Server-info group'), chain: ['reclash-serverinfo', 'flclashx-serverinfo'] },
  { label: b('URL тарифа', 'Plan URL'), chain: ['reclash-buyplan', 'flclashx-buyplan'] },
  { label: b('URL трафика', 'Traffic URL'), chain: ['reclash-buytraffic', 'flclashx-buytraffic'] },
  { label: b('URL отчёта', 'Report URL'), chain: ['reclash-reporturl', 'report-url'] },
  { label: b('Вид прокси', 'Proxy view'), chain: ['reclash-view', 'flclashx-view'] },
  { label: b('Тема', 'Theme'), chain: ['reclash-hex', 'flclashx-hex'] },
  { label: b('Фон', 'Background'), chain: ['reclash-background', 'flclashx-background'] },
  { label: b('Новый домен', 'New domain'), chain: ['reclash-newdomain', 'flclashx-newdomain'] },
]

const hwidRequest: Array<[string, Bi]> = [
  ['x-hwid', b('Стабильный 16-символьный хеш устройства', 'Stable 16-character device hash')],
  ['x-device-os', b('Название ОС', 'Operating-system name')],
  ['x-ver-os', b('Версия ОС', 'Operating-system version')],
  ['x-device-model', b('Модель устройства или имя хоста', 'Device model or host name')],
]

const hwidResponse: Array<[string, Bi]> = [
  ['x-hwid-max-devices-reached', b(
    'Показывает сообщение о лимите устройств и предлагает `reclash-supporturl`, если он есть.',
    'Shows the device-limit message and offers `reclash-supporturl` when available.')],
  ['x-hwid-not-supported', b(
    'Показывает, что выбранный режим клиента или устройства не поддерживается.',
    'Shows that the selected client/device mode is unsupported.')],
]

type SourceBlock =
  | { kind: 'p', text: Bi }
  | { kind: 'h3', text: Bi }
  | { kind: 'code', code: (language: Language) => string, label: Bi }
  | { kind: 'layers', items: Array<{ term: Bi, tag: Bi, body: Bi }> }
  | { kind: 'rules' | 'problems', items: Array<{ term: Bi, body: Bi }> }
  | { kind: 'note', tone: 'info' | 'warn', text: Bi }
  | { kind: 'aliases', head: [Bi, Bi] }
  | { kind: 'table', direction: Bi, head: [Bi, Bi], rows: Array<[string, Bi]> }
  | { kind: 'steps', items: Bi[] }

type SourceSection = { id: string, title: Bi, keys: string, blocks: SourceBlock[] }

const sections: SourceSection[] = [
  {
    id: 'overview',
    title: b('Как это работает', 'How it works'),
    keys: 'overview обзор three tiers слои начало',
    blocks: [
      { kind: 'p', text: b(
        'Клиент забирает подписку обычным HTTP-запросом. Тело ответа — конфиг mihomo, а заголовки ответа — всё остальное: имя сервиса, остаток трафика, тема, набор виджетов, ссылки на биллинг. Ни SDK, ни плагина, ни договорённости с нами не требуется.',
        'The client fetches the subscription with a plain HTTP request. The body is a mihomo config; the response headers carry everything else: service name, remaining traffic, theme, widget set, billing links. No SDK, no plugin and no agreement with us is required.') },
      { kind: 'p', text: b(
        'Заголовки перечитываются при каждом обновлении профиля — по кнопке или по интервалу. Значения привязаны к профилю, а не к приложению: тему задаёт тот профиль, который сейчас активен.',
        'Headers are re-read on every profile update — manual or scheduled. Values belong to the profile, not to the application: the theme comes from whichever profile is currently active.') },
      { kind: 'code', code: () => overviewExample, label: b('Ответ подписки', 'Subscription response') },
      { kind: 'h3', text: b('Три слоя заголовков', 'Three layers of headers') },
      { kind: 'p', text: b(
        'Заголовки, которые читает ReClash, делятся на три группы — стоит понимать, какая за что отвечает. Полный список каждого слоя — в [справочнике](page:reference).',
        'The headers ReClash reads fall into three groups — it helps to know which does what. The full list of each layer is in the [reference](page:reference).') },
      { kind: 'layers', items: [
        { term: b('Общие', 'Common'), tag: b('стандарт Clash', 'Clash standard'), body: b(
          'Стандартные заголовки Clash — `subscription-userinfo`, `profile-title` и другие. Если вы их уже отдаёте, менять ничего не нужно.',
          'Standard Clash headers — `subscription-userinfo`, `profile-title` and the rest. If you already send them, nothing changes.') },
        { term: b('ReClash', 'ReClash'), tag: b('reclash-*', 'reclash-*'), body: b(
          'Заголовки `reclash-*` — всё, что делает панель фирменной: тема, кольцо, виджеты, объявления. Понимает только ReClash.',
          'The `reclash-*` headers — everything that makes the dashboard yours: theme, ring, widgets, announcements. Only ReClash reads them.') },
        { term: b('Псевдонимы', 'Aliases'), tag: b('flclashx-*', 'flclashx-*'), body: b(
          'Заголовки `flclashx-*`, которые ReClash читает ради совместимости — чтобы вам не пришлось ничего переделывать. См. [«Совместимость»](#compat).',
          'The `flclashx-*` headers ReClash reads for compatibility — so you need not redo anything. See [“Compatibility”](#compat).') },
      ] },
      { kind: 'note', tone: 'info', text: b(
        'Заголовки — это подсказки оформления, а не механизм доверия. Пользователь может переопределить почти всё, что вы прислали.',
        'Headers are presentation hints, not a trust mechanism. The user can override nearly everything you send.') },
    ],
  },
  {
    id: 'rules',
    title: b('Правила разбора', 'Parsing rules'),
    keys: 'case base64 приоритет priority регистр',
    blocks: [
      { kind: 'p', text: b(
        'Эти правила действуют для всех заголовков сразу — держите их в голове, читая [справочник](page:reference).',
        'These rules hold for every header at once — keep them in mind as you read the [reference](page:reference).') },
      { kind: 'rules', items: [
        { term: b('Регистр не важен', 'Case does not matter'), body: b(
          'Имена заголовков сравниваются без учёта регистра: `ReClash-Hex`, `reclash-hex` и `RECLASH-HEX` — одно и то же.',
          'Header names are compared case-insensitively: `ReClash-Hex`, `reclash-hex` and `RECLASH-HEX` are the same header.') },
        { term: b('Приоритет у reclash-*', 'reclash-* wins'), body: b(
          'Если пришли и `reclash-*`, и псевдоним, и общий заголовок — побеждает `reclash-*`.',
          'When `reclash-*`, an alias and a common header all arrive, `reclash-*` wins.') },
        { term: b('Повторы склеиваются', 'Repeats are joined'), body: b(
          'Несколько одинаковых заголовков соединяются через запятую — так же, как это делает HTTP.',
          'Several identical headers are joined with commas, exactly as HTTP does.') },
        { term: b('Пустое игнорируется', 'Empty is ignored'), body: b(
          'Пустые значения и неизвестные токены просто отбрасываются: сломать приложение опечаткой нельзя.',
          'Empty values and unknown tokens are dropped: a typo cannot break the app.') },
        { term: b('Base64 для не-ASCII', 'Base64 for non-ASCII'), body: b(
          'Текстовые заголовки принимают префикс `base64:` или `base64,`. Для кириллицы и эмодзи это обязательно — в HTTP-заголовке им не место.',
          'Text headers accept a `base64:` or `base64,` prefix. For Cyrillic and emoji it is mandatory — an HTTP header is no place for them.') },
        { term: b('Только HTTPS в ссылках', 'HTTPS only in links'), body: b(
          'Все URL — абсолютные и по HTTPS. Исключение — фон, который допускает и `http`. Логин и пароль в URL запрещены.',
          'All URLs are absolute and HTTPS. The one exception is the background, which also accepts `http`. Credentials in URLs are rejected.') },
      ] },
    ],
  },
  {
    id: 'compat',
    title: b('Совместимость', 'Compatibility'),
    keys: 'flclashx алиасы aliases приоритет псевдонимы',
    blocks: [
      { kind: 'p', text: b(
        'ReClash читает часть заголовков FlClashX, чтобы провайдерам не пришлось ничего переделывать. Порядок в таблице — порядок приоритета: побеждает первый непустой. В [справочнике](page:reference) псевдоним показан прямо на карточке своего заголовка.',
        'ReClash reads some FlClashX headers so providers do not have to redo anything. The order in the table is the priority order: the first non-empty value wins. In the [reference](page:reference) the alias is shown right on its header\'s card.') },
      { kind: 'aliases', head: [b('Что задаётся', 'What it sets'), b('Приоритет', 'Priority')] },
      { kind: 'note', tone: 'info', text: b(
        'У надписи подключения, кольца, виджетов, `reclash-custom`, `reclash-settings` и запасных хостов псевдонимов нет — это возможности ReClash.',
        'The active-protection text, hero ring, widgets, `reclash-custom`, `reclash-settings` and fallback hosts have no aliases — they are ReClash features.') },
    ],
  },
  {
    id: 'delivery',
    title: b('Доставка и отладка', 'Delivery and debugging'),
    keys: 'curl proxy cdn cache troubleshooting отладка прокси кэш не доходят nginx caddy',
    blocks: [
      { kind: 'p', text: b(
        'Самая частая проблема — заголовки правильные на источнике, но клиент их не видит. Начните с того, чтобы посмотреть, что реально уходит по сети:',
        'The most common problem is that the headers are right at the origin but the client never sees them. Start by looking at what actually goes over the wire:') },
      { kind: 'code', code: curlTest, label: b('Проверка из терминала', 'Check from a terminal') },
      { kind: 'p', text: b(
        'В выводе должны быть ваши `reclash-*` и `subscription-userinfo`. Если их нет — дело в том, что между панелью и клиентом, а не в самих значениях.',
        'The output should carry your `reclash-*` and `subscription-userinfo`. If they are missing, the problem is between the panel and the client, not in the values themselves.') },
      { kind: 'problems', items: [
        { term: b('Заголовки не доходят до клиента', 'Headers never reach the client'), body: b(
          'Почти всегда их срезает обратный прокси или CDN. nginx по умолчанию не пробрасывает произвольные заголовки апстрима — проверьте, что перед `location` подписки нет `proxy_hide_header` на `reclash-*`, а панель отдаёт их до прокси. Соберите готовый фрагмент для nginx или Caddy в [конструкторе](page:builder).',
          'A reverse proxy or CDN is almost always stripping them. nginx does not forward arbitrary upstream headers by default — check that nothing `proxy_hide_header`s `reclash-*` before the subscription `location`, and that the panel emits them upstream of the proxy. Grab a ready nginx or Caddy snippet in the [builder](page:builder).') },
        { term: b('Кириллица приходит мусором', 'Cyrillic arrives as garbage'), body: b(
          'HTTP-заголовок несёт только ASCII. Любой не-латинский текст — имя сервиса, объявление, надпись подключения — кодируйте префиксом `base64:`. Конструктор делает это автоматически.',
          'An HTTP header carries ASCII only. Encode any non-Latin text — service name, announcement, connection headline — with a `base64:` prefix. The builder does this for you.') },
        { term: b('Значения задвоились', 'Values show up twice'), body: b(
          'Панель уже отдаёт заголовок, а ваш прокси добавляет его ещё раз: `add_header` в nginx дописывает, а не заменяет. Спрячьте исходный через `proxy_hide_header` либо задавайте значение в одном месте.',
          'The panel already sends a header and your proxy adds it again: nginx\'s `add_header` appends rather than replaces. Hide the original with `proxy_hide_header`, or set the value in one place only.') },
        { term: b('CDN кэширует старый ответ', 'The CDN caches a stale response'), body: b(
          'Если подписка идёт через CDN, он может отдавать закэшированный ответ с прежними заголовками. Исключите путь подписки из кэша или отдавайте `Cache-Control: no-store` на нём.',
          'If the subscription goes through a CDN, it may serve a cached response with the old headers. Exclude the subscription path from the cache, or send `Cache-Control: no-store` on it.') },
        { term: b('Заголовок игнорируется, хотя дошёл', 'The header arrives but is ignored'), body: b(
          'Проверьте написание и значение по [справочнику](page:reference): неизвестные токены и пустые значения молча отбрасываются. Регистр имени роли не играет, а вот `reclash-view` и `reclash-hex` разбираются по строгим правилам — см. [«Правила разбора»](#rules).',
          'Check the spelling and value against the [reference](page:reference): unknown tokens and empty values are dropped silently. The name\'s case does not matter, but `reclash-view` and `reclash-hex` parse by strict rules — see [“Parsing rules”](#rules).') },
      ] },
    ],
  },
  {
    id: 'hwid',
    title: b('Устройства и HWID', 'Devices and HWID'),
    keys: 'x-hwid x-device-os лимит limit устройства',
    blocks: [
      { kind: 'p', text: b(
        'Если пользователь включил передачу идентификатора устройства, запрос подписки несёт несколько дополнительных заголовков. Они нужны, чтобы вы могли показать понятный список устройств и лимит по тарифу.',
        'When the user enables device-identifier sharing, the subscription request carries a few extra headers. They exist so you can show a sensible device list and a plan device limit.') },
      { kind: 'table', direction: b('Клиент → панель', 'Client → panel'), head: [b('Заголовок запроса', 'Request header'), b('Значение', 'Value')],
        rows: hwidRequest.map(([name, text]) => [`\`${name}\``, text]) },
      { kind: 'h3', text: b('Ответ клиенту', 'Responding to the client') },
      { kind: 'table', direction: b('Панель → клиент', 'Panel → client'), head: [b('Заголовок ответа', 'Response header'), b('Что покажет клиент', 'What the client shows')],
        rows: hwidResponse.map(([name, text]) => [`\`${name}\``, text]) },
    ],
  },
  {
    id: 'checklist',
    title: b('Чеклист внедрения', 'Rollout checklist'),
    keys: 'checklist проверка testing шаги',
    blocks: [
      { kind: 'steps', items: [
        b('Отдавайте `subscription-userinfo` — это самое заметное для пользователя.',
          'Send `subscription-userinfo` — it is the most visible thing to the user.'),
        b('Добавьте `reclash-servicename` и логотип: панель перестаёт быть безымянной.',
          'Add `reclash-servicename` and a logo: the dashboard stops being nameless.'),
        b('Поставьте `reclash-supporturl` — меньше писем «куда писать».',
          'Set `reclash-supporturl` — fewer “where do I write?” messages.'),
        b('Выберите цвет через `reclash-hex` и проверьте его в живом превью [конструктора](page:builder).',
          'Pick a colour via `reclash-hex` and check it in the live preview in the [builder](page:builder).'),
        b('Проверьте ответ курлом: `curl -sI \'https://…/sub\' | grep -i reclash`.',
          'Verify with curl: `curl -sI \'https://…/sub\' | grep -i reclash`.'),
        b('Убедитесь, что заголовки доживают до клиента через ваш прокси и CDN.',
          'Make sure the headers survive your reverse proxy and CDN.'),
        b('Не отправляйте `reclash-settings` без причины.',
          'Do not send `reclash-settings` without a reason.'),
      ] },
      { kind: 'p', text: b(
        `Первоисточник этой страницы — [PROVIDER_HEADERS.md](${providerHeadersSource}) в репозитории. Если он разойдётся с этой страницей — прав репозиторий.`,
        `The source of truth for this page is [PROVIDER_HEADERS.md](${providerHeadersSource}) in the repository. If the two ever disagree, the repository is right.`) },
    ],
  },
]

function aliasRows(language: Language) {
  const unit = (value: string) => value
    .replace('{m}', language === 'ru' ? 'мин.' : 'min')
    .replace('{h}', language === 'ru' ? 'ч.' : 'h')
  return aliasChains.map(({ label, chain }) => ({
    label: label[language],
    chain: chain.map((wire) => {
      const name = wire.split(' ')[0]!
      const header = referenceAnchor(name) ? name : undefined
      return header ? { kind: 'code' as const, text: unit(wire), header } : { kind: 'code' as const, text: unit(wire) }
    }),
  }))
}

function resolveBlock(block: SourceBlock, language: Language): DocBlock {
  const r = (text: Bi) => rich(text[language])
  switch (block.kind) {
    case 'p': return { kind: 'p', text: r(block.text) }
    case 'h3': return { kind: 'h3', text: block.text[language] }
    case 'code': return { kind: 'code', code: block.code(language), label: block.label[language] }
    case 'layers': return { kind: 'layers', items: block.items.map(item => ({ term: item.term[language], tag: item.tag[language], body: r(item.body) })) }
    case 'rules':
    case 'problems': return { kind: block.kind, items: block.items.map(item => ({ term: item.term[language], body: r(item.body) })) }
    case 'note': return { kind: 'note', tone: block.tone, text: r(block.text) }
    case 'aliases': return { kind: 'aliases', head: [block.head[0][language], block.head[1][language]], rows: aliasRows(language) }
    case 'table': return {
      kind: 'table', direction: block.direction[language], head: [block.head[0][language], block.head[1][language]],
      rows: block.rows.map(([name, text]) => [rich(name), r(text)]),
    }
    case 'steps': return { kind: 'steps', items: block.items.map(r) }
  }
}

const cache = new Map<Language, DocSection[]>()

export function docsSections(language: Language): DocSection[] {
  let resolved = cache.get(language)
  if (!resolved) {
    resolved = sections.map(section => ({
      id: section.id,
      title: section.title[language],
      keys: `${section.title.ru} ${section.title.en} ${section.keys}`.toLowerCase(),
      blocks: section.blocks.map(block => resolveBlock(block, language)),
    }))
    cache.set(language, resolved)
  }
  return resolved
}
