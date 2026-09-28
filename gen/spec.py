"""Machine-readable slice of PROVIDER_HEADERS.md.

The docs tables, the builder form and the live preview all read from here, so
the reference and the tool can never describe different rules.
"""

import json as _json
import os as _os

# The structural half of this file — the widget set and its platforms, the
# reclash-view token values, the theme variants — is generated in the ReClash
# fork by `tool/gen_provider_standard.dart` and vendored beside this module as
# JSON. The RU/EN prose stays here, keyed by the same ids, so the fork owns the
# structure and the site owns the wording; tools/check_fork_headers.py guards
# the seam and --sync refreshes the vendored copy.
_STANDARD_PATH = _os.path.join(
    _os.path.dirname(_os.path.abspath(__file__)), "provider_standard.g.json")
with open(_STANDARD_PATH, encoding="utf-8") as _fh:
    STANDARD = _json.load(_fh)


def _cover(kind, prose_keys, standard_keys):
    """Fail the build when the prose and the fork standard name different keys."""
    prose, canon = set(prose_keys), set(standard_keys)
    if prose != canon:
        raise SystemExit(
            "spec.py: %s prose out of sync with the fork standard "
            "(missing prose for: %s; stale prose for: %s) — run "
            "`python tools/check_fork_headers.py --sync`, then edit the prose"
            % (kind, ", ".join(sorted(canon - prose)) or "\u2014",
               ", ".join(sorted(prose - canon)) or "\u2014"))


def _widget_platform(platforms):
    """Collapse the fork's platform list into the builder's availability tag."""
    s = set(platforms)
    if s == {"Windows", "MacOS", "Linux", "Android"}:
        return "all"
    if s == {"Windows", "MacOS", "Linux"}:
        return "desktop"
    if s == {"Android"}:
        return "android"
    raise SystemExit("spec.py: unmapped widget platform set %s — extend "
                     "_widget_platform and PLATFORM_LABEL" % sorted(s))


# ru label, en label, on-by-default in the builder, keyed by widget id.
# byedpi-only widgets (the classic desync tools) are documented elsewhere and
# are intentionally absent; the modes filter below drops them before _cover.
_WIDGET_PROSE = {
    'networkSpeed': ('Скорость сети', 'Network speed', True),
    'trafficUsage': ('Расход трафика', 'Traffic usage', True),
    'networkDetection': ('Определение сети', 'Network detection', False),
    'tunButton': ('Кнопка TUN', 'TUN button', False),
    'vpnButton': ('Кнопка VPN', 'VPN button', False),
    'systemProxyButton': ('Системный прокси', 'System proxy', False),
    'intranetIp': ('Внутренний IP', 'Intranet IP', False),
    'memoryInfo': ('Память', 'Memory info', False),
    'goroutineInfo': ('Горутины', 'Goroutines', False),
    'metaInfo': ('Подписка: срок и квота', 'Subscription: term and quota', False),
    'announce': ('Объявление', 'Announcement', False),
    'serviceInfo': ('Карточка сервиса', 'Service card', True),
    'changeServerButton': ('Смена сервера', 'Change server', True),
    'smartRouting': ('Умная маршрутизация', 'Smart routing', False),
    'serviceStatus': ('Статус сервисов', 'Service status', False),
    'connections': ('Соединения', 'Connections', False),
    'dnsQueries': ('DNS-запросы', 'DNS queries', False),
    'requests': ('Запросы', 'Requests', False),
    'runTime': ('Старт', 'Start', False),
    'proxyGroups': ('Группа прокси', 'Proxy group', False),
    'profiles': ('Профили', 'Profiles', False),
    'overrideDnsButton': ('Переопределить DNS', 'Override DNS', False),
}

WIDGETS = []
for _w in STANDARD["widgets"]:
    if _w["modes"] == ["byedpi"]:
        continue
    _ru, _en, _on = _WIDGET_PROSE[_w["id"]]
    WIDGETS.append((_w["id"], _widget_platform(_w["platforms"]), _ru, _en, _on))
_cover("widget", _WIDGET_PROSE,
       [_w["id"] for _w in STANDARD["widgets"] if _w["modes"] != ["byedpi"]])

PLATFORM_LABEL = {
    "all": ("все платформы", "all platforms"),
    "desktop": ("Windows, macOS, Linux", "Windows, macOS, Linux"),
    "android": ("Android", "Android"),
}

# reclash-view tokens: value lists come from the fork standard, prose stays here
_VIEW_PROSE = {
    'type': ('Форма страницы прокси', 'Proxy page shape'),
    'sort': ('Сортировка узлов', 'Node sorting'),
    'layout': ('Плотность сетки', 'Grid density'),
    'icon': ('Иконки узлов', 'Node icons'),
    'card': ('Размер карточки', 'Card size'),
}
VIEW_TOKENS = [(_k, STANDARD["tokens"]["view"][_k], _ru, _en)
               for _k, (_ru, _en) in _VIEW_PROSE.items()]
_cover("view-token", _VIEW_PROSE, STANDARD["tokens"]["view"])

# theme variants: the key set comes from the fork standard, prose stays here
_THEME_PROSE = {
    'tonalspot': ('Сбалансированный, по умолчанию', 'Balanced, the default'),
    'fidelity': ('Ближе к исходному цвету', 'Closer to the source colour'),
    'monochrome': ('Оттенки серого', 'Greyscale'),
    'neutral': ('Почти без насыщенности', 'Nearly desaturated'),
    'vibrant': ('Максимальная насыщенность', 'Maximum saturation'),
    'expressive': ('Смещённый оттенок', 'Shifted hue'),
    'content': ('От контента, живее fidelity', 'Content-driven, livelier than fidelity'),
}
THEME_VARIANTS = [(_v, _ru, _en) for _v, (_ru, _en) in _THEME_PROSE.items()]
_cover("theme-variant", _THEME_PROSE, STANDARD["tokens"]["themeVariants"])

SETTINGS_TOKENS = [
    ("minimize", "Сворачивать вместо выхода", "Minimize instead of exiting"),
    ("autorun", "Подключаться при запуске ReClash", "Start the connection when ReClash opens"),
    ("shadowstart", "Запускаться в фоне", "Launch in the background"),
    ("autostart", "Запускаться вместе с системой", "Launch at OS startup"),
    ("autoupdate", "Проверять обновления ReClash", "Check for ReClash updates"),
    ("openlogs", "Открывать логи вместе с подключением", "Open logs with the connection"),
    ("closeconnections", "Закрывать соединения при паузе", "Close connections when the VPN pauses"),
]

# name, kind, ru value spec, en value spec, ru behaviour, en behaviour
COMMON_HEADERS = [
    (
        "subscription-userinfo",
        "upload=&lt;байты&gt;; download=&lt;байты&gt;; total=&lt;байты&gt;; expire=&lt;unix-секунды&gt;",
        "upload=&lt;bytes&gt;; download=&lt;bytes&gt;; total=&lt;bytes&gt;; expire=&lt;unix-seconds&gt;",
        "Показывает расход трафика и дату окончания.",
        "Shows traffic usage and the expiry date.",
    ),
    (
        "profile-title",
        "Имя профиля, UTF-8 или Base64",
        "Profile name, plain UTF-8 or Base64",
        "Именует импортированный профиль, пока пользователь не переименовал его вручную. "
        "Для не-ASCII используйте <code>base64:</code>.",
        "Names the imported profile unless the user has renamed it. "
        "Use <code>base64:</code> for non-ASCII text.",
    ),
    (
        "content-disposition",
        "Имя файла в ответе",
        "A response filename",
        "Запасной источник имени профиля.",
        "Used as a profile-name fallback.",
    ),
    (
        "profile-update-interval",
        "Целое &gt; 0, в часах",
        "Positive integer, in hours",
        "Интервал обновления профиля.",
        "Sets the profile update interval.",
    ),
    (
        "support-url",
        "URL поддержки",
        "Provider support URL",
        "Добавляет действие «Поддержка». Абсолютный HTTPS-адрес.",
        "Adds a support action. Use an absolute HTTPS URL.",
    ),
    (
        "announce",
        "Текст или Base64",
        "Plain text or Base64",
        "Показывает объявление провайдера.",
        "Shows a provider announcement.",
    ),
    (
        "report-url",
        "URL для сообщения о проблеме",
        "Issue-report URL",
        "Совместимое имя для <code>reclash-reporturl</code>. "
        "Добавляет действие «Сообщить о проблеме» с подпиской.",
        "Compatibility name for <code>reclash-reporturl</code>. "
        "Adds a “report an issue” action for the subscription.",
    ),
]

# name, ru value, en value, ru purpose, en purpose
RECLASH_HEADERS = [
    ("reclash-announce", "Текст или Base64", "Plain text or Base64",
     "Объявление провайдера. Приоритетнее <code>announce</code>.",
     "Provider announcement. Takes priority over <code>announce</code>."),
    ("reclash-supporturl", "URL поддержки", "Provider support URL",
     "Страница поддержки. Абсолютный HTTPS.",
     "Support page. Use an absolute HTTPS URL."),
    ("reclash-autoupdateinterval", "Целое &gt; 0, в минутах", "Positive integer, in minutes",
     "Интервал обновления профиля.", "Profile update interval."),
    ("reclash-servicename", "Текст или Base64", "Plain text or Base64",
     "Имя сервиса на панели.", "Provider name shown in the dashboard."),
    ("reclash-activetext", "Текст или Base64", "Plain text or Base64",
     "Надпись под кольцом подключения и в уведомлении Android вместо «Вы защищены».",
     "The caption under the hero orb and in the Android notification, in place of \u201cYou are protected\u201d."),
    ("reclash-servicelogo", "Абсолютный HTTPS-URL картинки", "Absolute HTTPS image URL",
     "Логотип на панели и в контроле подключения.",
     "Provider logo shown in the dashboard and connection control."),
    ("reclash-serverinfo", "Имя прокси-группы, текст или Base64", "Proxy-group name, plain text or Base64",
     "Группа, из которой берётся активный сервер для панели.",
     "Group used to resolve the active server shown in the dashboard."),
    ("reclash-buyplan", "URL", "URL",
     "Действие «Продлить / купить тариф».", "Subscription renewal or plan purchase action."),
    ("reclash-buytraffic", "URL", "URL",
     "Действие «Докупить трафик».", "Extra-traffic purchase action."),
    ("reclash-reporturl", "URL", "URL",
     "Действие «Сообщить о проблеме с подпиской».",
     "Subscription issue-report action."),
    ("reclash-view", "Токены страницы прокси", "Proxy-page tokens",
     "Предлагает вид страницы прокси для этого профиля.",
     "Suggests the proxy-page presentation for this profile."),
    ("reclash-hex", "Токены темы", "Theme tokens",
     "Применяет тему, пока профиль активен.",
     "Applies a theme while this profile is active."),
    ("reclash-background", "URL картинки и прозрачность", "Image URL and optional opacity",
     "Фон панели, пока профиль активен.",
     "Applies a dashboard background while this profile is active."),
    ("reclash-heroring", "Ровно три цвета", "Exactly three colours",
     "Градиент кольца в подключённом состоянии.",
     "Sets the connected-state hero-ring gradient."),
    ("reclash-heroeffect", "<code>aurora</code> или пусто", "<code>aurora</code> or empty",
     "Живой эффект за кольцом подключения. Пока поддерживается только <code>aurora</code>; "
     "любое другое значение выключает эффект.",
     "A living effect behind the connection ring. Only <code>aurora</code> is supported for now; "
     "any other value turns the effect off."),
    ("reclash-widgets", "Имена виджетов через запятую", "Comma-separated widget names",
     "Предлагает набор и порядок виджетов панели.",
     "Suggests dashboard widgets and their order."),
    ("reclash-custom", "<code>add</code> или <code>update</code>", "<code>add</code> or <code>update</code>",
     "Как сливать список виджетов с пользовательским.",
     "Controls how <code>reclash-widgets</code> is merged."),
    ("reclash-settings", "Токены настроек через запятую", "Comma-separated setting tokens",
     "Настройки по умолчанию при первом добавлении профиля — после подтверждения пользователем.",
     "Application defaults offered when the profile is first added — applied only after the user confirms."),
    ("reclash-newdomain", "Хост и необязательный порт", "Hostname with optional port",
     "Предлагает миграцию домена подписки — после проверок.",
     "Proposes a subscription-domain migration subject to checks."),
    ("reclash-fallbackhosts", "До четырёх хостов через запятую", "Up to four comma-separated hostnames",
     "Запасные хосты при временных сбоях загрузки.",
     "Supplies fallback hosts for transient fetch failures."),
]

# {m} / {h} are unit placeholders — the docs page substitutes them per language,
# so no Russian abbreviation can leak into the English page.
ALIASES = [
    ("Объявление", "Announcement", ["reclash-announce", "announce"]),
    ("URL поддержки", "Support URL", ["reclash-supporturl", "support-url", "flclashx-supporturl"]),
    ("Интервал обновления", "Update interval",
     ["reclash-autoupdateinterval ({m})", "profile-update-interval ({h})",
      "flclashx-autoupdateinterval ({h})"]),
    ("Имя сервиса", "Service name", ["reclash-servicename", "flclashx-servicename"]),
    ("Логотип сервиса", "Service logo", ["reclash-servicelogo", "flclashx-servicelogo"]),
    ("Группа сервера", "Server-info group", ["reclash-serverinfo", "flclashx-serverinfo"]),
    ("URL тарифа", "Plan URL", ["reclash-buyplan", "flclashx-buyplan"]),
    ("URL трафика", "Traffic URL", ["reclash-buytraffic", "flclashx-buytraffic"]),
    ("URL отчёта", "Report URL", ["reclash-reporturl", "report-url"]),
    ("Вид прокси", "Proxy view", ["reclash-view", "flclashx-view"]),
    ("Тема", "Theme", ["reclash-hex", "flclashx-hex"]),
    ("Фон", "Background", ["reclash-background", "flclashx-background"]),
    ("Новый домен", "New domain", ["reclash-newdomain", "flclashx-newdomain"]),
]

HWID_REQUEST = [
    ("x-hwid", "Стабильный 16-символьный хеш устройства", "Stable 16-character device hash"),
    ("x-device-os", "Название ОС", "Operating-system name"),
    ("x-ver-os", "Версия ОС", "Operating-system version"),
    ("x-device-model", "Модель устройства или имя хоста", "Device model or host name"),
]

HWID_RESPONSE = [
    ("x-hwid-max-devices-reached",
     "Показывает сообщение о лимите устройств и предлагает <code>reclash-supporturl</code>, если он есть.",
     "Shows the device-limit message and offers <code>reclash-supporturl</code> when available."),
    ("x-hwid-not-supported",
     "Показывает, что выбранный режим клиента или устройства не поддерживается.",
     "Shows that the selected client/device mode is unsupported."),
]


def widget_spec(lang):
    """Payload consumed by builder.js."""
    out = []
    for wid, plat, ru, en, default_on in WIDGETS:
        out.append(
            {
                "id": wid,
                "label": ru if lang == "ru" else en,
                "plat": PLATFORM_LABEL[plat][0 if lang == "ru" else 1],
                "on": default_on,
            }
        )
    return out
