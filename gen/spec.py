"""Machine-readable slice of PROVIDER_HEADERS.md.

The docs tables, the builder form and the live preview all read from here, so
the reference and the tool can never describe different rules.
"""

# id, availability, ru label, en label, on-by-default in the builder
WIDGETS = [
    ("networkSpeed", "all", "Скорость сети", "Network speed", True),
    ("outboundModeV2", "all", "Режим маршрутизации", "Routing mode", True),
    ("outboundMode", "all", "Режим маршрутизации (старый)", "Routing mode (legacy)", False),
    ("trafficUsage", "all", "Расход трафика", "Traffic usage", True),
    ("networkDetection", "all", "Определение сети", "Network detection", False),
    ("tunButton", "desktop", "Кнопка TUN", "TUN button", False),
    ("vpnButton", "android", "Кнопка VPN", "VPN button", False),
    ("systemProxyButton", "desktop", "Системный прокси", "System proxy", False),
    ("intranetIp", "all", "Внутренний IP", "Intranet IP", False),
    ("memoryInfo", "all", "Память", "Memory info", False),
    ("metaInfo", "all", "Подписка: срок и квота", "Subscription: term and quota", False),
    ("announce", "all", "Объявление", "Announcement", False),
    ("serviceInfo", "all", "Карточка сервиса", "Service card", True),
    ("changeServerButton", "all", "Смена сервера", "Change server", True),
    ("smartRouting", "all", "Умная маршрутизация", "Smart routing", False),
]

PLATFORM_LABEL = {
    "all": ("все платформы", "all platforms"),
    "desktop": ("Windows, macOS, Linux", "Windows, macOS, Linux"),
    "android": ("Android", "Android"),
}

# reclash-view tokens
VIEW_TOKENS = [
    ("type", ["tab", "list"], "Форма страницы прокси", "Proxy page shape"),
    ("sort", ["default", "none", "delay", "name"], "Сортировка узлов", "Node sorting"),
    ("layout", ["loose", "standard", "tight"], "Плотность сетки", "Grid density"),
    ("icon", ["none", "standard", "icon"], "Иконки узлов", "Node icons"),
    ("card", ["expand", "shrink", "min", "oneline"], "Размер карточки", "Card size"),
]

THEME_VARIANTS = [
    ("tonalspot", "Сбалансированный, по умолчанию", "Balanced, the default"),
    ("fidelity", "Ближе к исходному цвету", "Closer to the source colour"),
    ("monochrome", "Оттенки серого", "Greyscale"),
    ("neutral", "Почти без насыщенности", "Nearly desaturated"),
    ("vibrant", "Максимальная насыщенность", "Maximum saturation"),
    ("expressive", "Смещённый оттенок", "Shifted hue"),
    ("content", "От контента, живее fidelity", "Content-driven, livelier than fidelity"),
]

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
     "Крупная надпись на экране подключения вместо «Вы защищены».",
     "The headline on the connection screen, in place of \u201cYou are protected\u201d."),
    ("reclash-servicelogo", "Абсолютный HTTPS-URL картинки", "Absolute HTTPS image URL",
     "Логотип на панели и в контроле подключения.",
     "Provider logo shown in the dashboard and connection control."),
    ("reclash-serverinfo", "Имя прокси-группы", "Proxy-group name",
     "Группа, из которой берётся активный сервер для панели.",
     "Group used to resolve the active server shown in the dashboard."),
    ("reclash-buyplan", "URL", "URL",
     "Действие «Продлить / купить тариф».", "Subscription renewal or plan purchase action."),
    ("reclash-buytraffic", "URL", "URL",
     "Действие «Докупить трафик».", "Extra-traffic purchase action."),
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
    ("reclash-widgets", "Имена виджетов через запятую", "Comma-separated widget names",
     "Предлагает набор и порядок виджетов панели.",
     "Suggests dashboard widgets and their order."),
    ("reclash-custom", "<code>add</code> или <code>update</code>", "<code>add</code> or <code>update</code>",
     "Как сливать список виджетов с пользовательским.",
     "Controls how <code>reclash-widgets</code> is merged."),
    ("reclash-settings", "Токены настроек через запятую", "Comma-separated setting tokens",
     "Значения по умолчанию при первом добавлении профиля.",
     "Supplies application defaults when the profile is first added."),
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
