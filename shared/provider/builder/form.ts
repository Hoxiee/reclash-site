import type { BilingualText } from '../../site/routes.ts'

// Labels, help, grouping and order of the builder form. Types, enums and limits come from the schema;
// `tests/builder.test.mjs` keeps this list and the schema's property paths in step.
export type Widget = 'color' | 'time' | 'multiline' | 'hidden'
export type FormEntry = {
  path: string, label: BilingualText, help?: BilingualText, widget?: Widget,
  placeholder?: string, ordered?: boolean, exclusive?: string[],
}
export type FormSection = { key: string, title: BilingualText, summary: BilingualText, entries: FormEntry[] }

const e = (path: string, ru: string, en: string, help?: [string, string], extra: Partial<FormEntry> = {}): FormEntry =>
  ({ path, label: { ru, en }, ...(help ? { help: { ru: help[0], en: help[1] } } : {}), ...extra })

const powerStates: Array<[string, string, string]> = [['off', 'Выключено', 'Off'], ['connecting', 'Подключение', 'Connecting'], ['on', 'Включено', 'On'], ['paused', 'Пауза', 'Paused'], ['expired', 'План закончился', 'Plan expired'], ['exhausted', 'Трафик исчерпан', 'Traffic exhausted'], ['ending', 'План скоро закончится', 'Plan ending'], ['grace', 'Льготный период', 'Grace period']]

const actionEntries = (prefix: string) => [
  e(`${prefix}.url`, 'Открыть ссылку', 'Open a link', ['http, https или Telegram, до 2048 символов.', 'An http, https or Telegram link, up to 2048 characters.'], { placeholder: 'https://' }),
  e(`${prefix}.copy`, 'Скопировать текст', 'Copy text', ['До 256 байт в UTF-8.', 'At most 256 bytes in UTF-8.']),
  e(`${prefix}.share`, 'Поделиться текстом', 'Share text', ['Системное меню на Android, копирование на остальных. До 1024 байт.', 'The share sheet on Android, a copy elsewhere. At most 1024 bytes.'], { widget: 'multiline' }),
  e(`${prefix}.app`, 'Действие приложения', 'App action', ['Скрывается, если у действия нет данных: support без support-url, renew без provider.renew.', 'Hidden when it has nothing to open: support without support-url, renew without provider.renew.']),
]

export const formSections: FormSection[] = [
  { key: 'version', title: { ru: 'Версия', en: 'Version' }, summary: { ru: 'Всегда 1', en: 'Always 1' }, entries: [
    e('version', 'Версия формата', 'Format version', ['Любое другое значение отклоняет файл.', 'Any other value rejects the file.'], { widget: 'hidden' }),
  ] },
  { key: 'provider', title: { ru: 'Провайдер', en: 'Provider' }, summary: { ru: 'Имя, логотипы, ссылки и сообщения', en: 'Name, logos, links and messages' }, entries: [
    e('provider.name', 'Название сервиса', 'Service name', ['На карточке панели и в окне импорта.', 'On the dashboard card and in the import dialog.']),
    e('provider.logo', 'Логотип', 'Logo', ['На простой панели, в кошельке профилей и при импорте.', 'On the simple dashboard, in the profile wallet and during import.'], { placeholder: 'https://' }),
    e('provider.logo-dark', 'Логотип для тёмной темы', 'Dark theme logo', ['Без него берётся logo.', 'Falls back to logo.'], { placeholder: 'https://' }),
    e('provider.support-url', 'Поддержка', 'Support', ['Также https://t.me/…, https://telegram.me/… и tg://.', 'Also https://t.me/…, https://telegram.me/… and tg:// links.'], { placeholder: 'https://t.me/example_support' }),
    e('provider.web-url', 'Сайт', 'Website', undefined, { placeholder: 'https://' }),
    e('provider.type', 'Тип подписки', 'Subscription type', ['test, promo или dev показывают бейдж при импорте; другие значения — ничего.', 'test, promo or dev show a badge in the import dialog; other values show none.'], { placeholder: 'test' }),
    e('provider.hide-url', 'Скрыть ссылку', 'Hide the URL', ['Маскирует ссылку в редакторе профиля и окне импорта, но не делает её секретной.', 'Masks the URL in the profile editor and import dialog. It does not make it secret.']),
    e('provider.server-group', 'Группа серверов', 'Server group', ['Группа, чей выбранный узел показывает простая панель. Без учёта регистра.', 'The proxy group whose selected node the simple dashboard shows. Case-insensitive.'], { placeholder: 'Proxy' }),
    e('provider.announce', 'Описание', 'Announcement', ['В окне импорта и на карточке над виджетами, которую нельзя убрать.', 'In the import dialog and in a card above the widgets that cannot be moved or removed.']),
    e('provider.announce.text', 'Текст', 'Text', undefined, { widget: 'multiline' }),
    e('provider.announce.url', 'Ссылка', 'Link', undefined, { placeholder: 'https://' }),
    e('provider.notice', 'Уведомление', 'Notice', ['Закрываемое. Закрытие запоминается для этого текста и ссылки.', 'Dismissible. A dismissal is remembered for that exact text and link.']),
    e('provider.notice.text', 'Текст', 'Text', undefined, { widget: 'multiline' }),
    e('provider.notice.url', 'Ссылка', 'Link', undefined, { placeholder: 'https://' }),
    e('provider.renew', 'Продление', 'Renewal', ['Кнопка «Продлить» с days дней до конца.', 'The renew action, offered from days left.']),
    e('provider.renew.url', 'Ссылка', 'Link', undefined, { placeholder: 'https://' }),
    e('provider.renew.days', 'За сколько дней', 'Days before expiry'),
    e('provider.top-up', 'Докупка трафика', 'Traffic top-up', ['Кнопка докупки с percent процентов использованного трафика.', 'The top-up action, offered from percent of quota used.']),
    e('provider.top-up.url', 'Ссылка', 'Link', undefined, { placeholder: 'https://' }),
    e('provider.top-up.percent', 'С какого процента', 'From percent used'),
  ] },
  { key: 'reminders', title: { ru: 'Напоминания', en: 'Reminders' }, summary: { ru: 'Когда уведомлять о сроке и трафике', en: 'When to notify about expiry and traffic' }, entries: [
    e('reminders.expire-days', 'За сколько дней до конца', 'Days before expiry', ['Через запятую. По умолчанию 3, 2, 1.', 'Comma-separated. Default 3, 2, 1.'], { placeholder: '3, 2, 1' }),
    e('reminders.traffic-percent', 'Процент трафика', 'Percent of traffic used', ['Через запятую. По умолчанию 90.', 'Comma-separated. Default 90.'], { placeholder: '90' }),
  ] },
  { key: 'settings', title: { ru: 'Настройки', en: 'Settings' }, summary: { ru: 'Меняются только перечисленные', en: 'Only listed settings change' }, entries: [
    e('settings.minimize-on-exit', 'Сворачивать при выходе', 'Minimize on exit'),
    e('settings.launch-at-login', 'Автозапуск', 'Launch at login'),
    e('settings.start-hidden', 'Тихий запуск', 'Start hidden'),
    e('settings.connect-on-launch', 'Подключаться при запуске', 'Connect on launch'),
    e('settings.check-app-updates', 'Проверять обновления', 'Check for app updates'),
    e('settings.capture-logs', 'Собирать логи', 'Capture logs', ['Выключение скрывает раздел логов.', 'Off hides the logs entry.']),
    e('settings.close-connections', 'Закрывать соединения', 'Close connections', ['При смене прокси.', 'When the proxy changes.']),
  ] },
  { key: 'policy', title: { ru: 'Политика', en: 'Policy' }, summary: { ru: 'Ограничения, которые пользователь не снимет', en: 'Limits the user cannot lift' }, entries: [
    e('policy.global', 'Глобальный режим', 'Global mode', ['listed пускает GLOBAL только через узлы группы GLOBAL из тела подписки; off убирает режим. По умолчанию any.', 'listed limits Global to the nodes of the body\'s GLOBAL group; off removes the mode. Default any.']),
    e('policy.apps', 'Исключения приложений', 'App exclusions', ['required делает tun.exclude-package обязательным на Android. По умолчанию recommended.', 'required makes tun.exclude-package mandatory on Android. Default recommended.']),
    e('policy.local-ports', 'Локальные порты', 'Local ports', ['Только Android: closed закрывает все локальные прокси-порты. По умолчанию open.', 'Android only: closed closes every local proxy port. Default open.']),
    e('policy.dashboard', 'Панель', 'Dashboard', ['locked убирает редактирование обеих панелей. По умолчанию editable.', 'locked removes editing on both dashboards. Default editable.']),
  ] },
  { key: 'apps', title: { ru: 'Приложения', en: 'Apps' }, summary: { ru: 'Рекомендуемые списки Android', en: 'Recommended Android lists' }, entries: [
    e('apps.exclude', 'Исключить из туннеля', 'Exclude from the tunnel', ['По одному пакету в строке. Пользователь может вернуть.', 'One package per line. The user can take them back.'], { placeholder: 'com.example.bank' }),
    e('apps.include', 'Включить в туннель', 'Include in the tunnel', ['По одному пакету в строке. Работает в режиме белого списка.', 'One package per line. Applies in whitelist mode.'], { placeholder: 'com.example.app' }),
    e('apps.routing', 'Местные приложения', 'Domestic apps', ['domestic добавляет установленные местные приложения региона, domestic:<cc> — указанной страны.', 'domestic adds installed domestic apps of the region; domestic:<cc> of that country.'], { placeholder: 'domestic' }),
  ] },
  { key: 'transport', title: { ru: 'Транспорт', en: 'Transport' }, summary: { ru: 'Запасные хосты подписки', en: 'Other hosts for the subscription' }, entries: [
    e('transport.fallback-hosts', 'Запасные хосты', 'Fallback hosts', ['host[:port], по одному в строке. Только для https-подписок.', 'host[:port], one per line. Only for https subscriptions.'], { placeholder: 'backup.example.net:8443' }),
    e('transport.new-domain', 'Новый домен', 'New domain', ['Одна строка host[:port], не список.', 'One host[:port] string, not a list.'], { placeholder: 'new.example.net' }),
  ] },
  { key: 'support', title: { ru: 'Поддержка', en: 'Support' }, summary: { ru: 'Подписанные ссылки и отчёты', en: 'Signed fix links and reports' }, entries: [
    e('support.keys', 'Публичные ключи', 'Public keys', ['До двух ключей ed25519:…, по одному в строке.', 'At most two ed25519:… keys, one per line.'], { placeholder: 'ed25519:…' }),
    e('support.upload-url', 'Адрес для отчётов', 'Report upload URL', ['Приложение назовёт домен перед первой отправкой.', 'The app names the domain before the first upload.'], { placeholder: 'https://' }),
  ] },
  { key: 'view', title: { ru: 'Вид', en: 'View' }, summary: { ru: 'Цвет, стиль и список прокси', en: 'Color, style and proxy list' }, entries: [
    e('view.app', 'Приложение', 'App'),
    e('view.app.color', 'Цвет', 'Color', ['Записывается в кавычках: без них # — комментарий YAML.', 'Written quoted: unquoted, # starts a YAML comment.'], { widget: 'color', placeholder: '#336699' }),
    e('view.app.color-dark', 'Цвет в тёмной теме', 'Dark theme color', ['Без color игнорируется.', 'Ignored without color.'], { widget: 'color', placeholder: '#99BBEE' }),
    e('view.app.style', 'Стиль', 'Style'),
    e('view.app.black', 'Чёрный фон', 'Pure black'),
    e('view.app.navbar', 'Панель навигации', 'Navigation bar'),
    e('view.app.glass', 'Стекло', 'Glass', ['Запрошенное качество; при перегрузке может снижаться на сессию.', 'The requested quality; sustained overload can lower it for the session.']),
    e('view.proxies', 'Список прокси', 'Proxy list'),
    e('view.proxies.type', 'Вид', 'Type'),
    e('view.proxies.sort', 'Сортировка', 'Sort'),
    e('view.proxies.layout', 'Плотность', 'Layout'),
    e('view.proxies.icon', 'Иконки', 'Icons'),
    e('view.proxies.card', 'Карточка', 'Card'),
  ] },
  { key: 'power-button', title: { ru: 'Кнопка питания', en: 'Power button' }, summary: { ru: 'Форма и заливка', en: 'Shape and fill' }, entries: [
    e('power-button.shape', 'Форма', 'Shape', ['Несколько форм — пул: одна выбирается на сессию. random — все формы, только целиком.', 'Several shapes form a pool: one is picked per session. random means every shape, only as the whole value.'], { exclusive: ['random'] }),
    e('power-button.type', 'Заливка', 'Fill'),
  ] },
  { key: 'wallpaper', title: { ru: 'Обои', en: 'Wallpaper' }, summary: { ru: 'Фоновое изображение', en: 'Background image' }, entries: [
    e('wallpaper.url', 'Изображение', 'Image', ['https, PNG, JPEG или WebP.', 'https, PNG, JPEG or WebP.'], { placeholder: 'https://' }),
    e('wallpaper.opacity', 'Непрозрачность, %', 'Opacity, %'),
  ] },
  { key: 'widgets', title: { ru: 'Виджеты', en: 'Widgets' }, summary: { ru: 'Карточки панели по порядку', en: 'Dashboard cards in order' }, entries: [
    e('widgets', 'Виджеты', 'Widgets', ['currentOutbound добавляется первым, если его нет. vpnButton — Android, networkTakeover — десктоп.', 'currentOutbound is added first when missing. vpnButton is Android, networkTakeover desktop.'], { ordered: true }),
  ] },
  { key: 'cards', title: { ru: 'Карточки', en: 'Cards' }, summary: { ru: 'Баннеры, заметки и действия', en: 'Banners, notes and actions' }, entries: [
    e('cards.type', 'Тип', 'Type'),
    e('cards.id', 'ID', 'ID', ['Уникальный. Закрытие запоминается по содержимому карточки.', 'Unique. A dismissal is remembered for the exact content of the card.']),
    e('cards.layout', 'Макет', 'Layout', ['image — только изображение, ему нужна image.', 'image is the image alone and needs one.']),
    e('cards.tone', 'Тон', 'Tone'),
    e('cards.level', 'Уровень', 'Level'),
    e('cards.title', 'Заголовок', 'Title'),
    e('cards.text', 'Текст', 'Text', undefined, { widget: 'multiline' }),
    e('cards.image', 'Изображение', 'Image', ['https, PNG, JPEG или WebP до 2 МиБ. SVG не поддерживается.', 'https, PNG, JPEG or WebP, at most 2 MiB. No SVG.'], { placeholder: 'https://' }),
    e('cards.image-dark', 'Изображение для тёмной темы', 'Dark theme image', undefined, { placeholder: 'https://' }),
    e('cards.side', 'Сторона изображения', 'Image side', ['Для макета split.', 'For the split layout.']),
    e('cards.countdown', 'Обратный отсчёт до', 'Countdown to', ['Показывает оставшееся время.', 'Shows the time left.'], { widget: 'time' }),
    e('cards.button', 'Кнопка', 'Button', ['Карточка с кнопкой сама не нажимается.', 'A card with a button is not tappable itself.']),
    e('cards.button.label', 'Подпись', 'Label'),
    ...actionEntries('cards.button'),
    ...actionEntries('cards'),
    e('cards.items', 'Кнопки', 'Items', ['От 2 до 6.', 'From 2 to 6.']),
    e('cards.items.icon', 'Иконка', 'Icon', ['Неизвестное имя даёт нейтральную иконку.', 'An unknown name shows a neutral icon.']),
    e('cards.items.label', 'Подпись', 'Label'),
    ...actionEntries('cards.items'),
    e('cards.dismissible', 'Можно закрыть', 'Dismissible'),
    e('cards.when', 'Условия показа', 'Show when', ['Карточка видна, пока выполняются все условия.', 'The card shows while every listed condition holds.']),
    e('cards.when.from', 'С момента', 'From', undefined, { widget: 'time' }),
    e('cards.when.until', 'До момента', 'Until', undefined, { widget: 'time' }),
    e('cards.when.days-left-below', 'Осталось дней меньше', 'Days left below'),
    e('cards.when.traffic-above', 'Трафика использовано от, %', 'Traffic used from, %'),
    e('cards.when.platforms', 'Платформы', 'Platforms'),
    e('cards.when.client-below', 'Версия приложения ниже', 'App version below', ['Старые клиенты файл не читают.', 'Older clients do not read the file.'], { placeholder: '1.5.0' }),
  ] },
  { key: 'power-labels', title: { ru: 'Подписи кнопки', en: 'Power labels' }, summary: { ru: 'Текст под кнопкой питания', en: 'Text under the power button' }, entries: powerStates.flatMap(([state, ru, en]) => [
    e(`power-labels.${state}`, ru, en),
    e(`power-labels.${state}.title`, 'Заголовок', 'Title'),
    e(`power-labels.${state}.hint`, 'Подсказка', 'Hint', state === 'on' ? ['Во включённом состоянии подсказка не видна: там строка соединения.', 'A hint on on is not shown: the live connection line stays there.'] : undefined),
  ]) },
]

export const formEntries = formSections.flatMap(section => section.entries)
const byPath = new Map(formEntries.map(entry => [entry.path, entry]))

/** The entry for an instance path: `cards.2.items.0.label` reads `cards.items.label`. */
export function entryFor(path: string): FormEntry | undefined {
  return byPath.get(schemaPathOf(path))
}

export const schemaPathOf = (path: string) => path.split('.').filter(segment => !/^\d+$/.test(segment)).join('.')
