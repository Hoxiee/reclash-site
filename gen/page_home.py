"""Landing page."""

from . import ui
from .ui import esc, icon, brand_icon, mark, ticks, rubric, chip, btn


def hero(ctx):
    t = ctx.t
    lines = t(
        ["ВАШ ТРАФИК", "— ВАШИ", "ПРАВИЛА"],
        ["YOUR TRAFFIC", "IS YOURS", "TO ROUTE"],
    )
    head = "".join(
        '<span class="hl enter%s" style="--i:%d;--d:%.2fs">%s</span>'
        % (" grad" if i == 2 else "", i, 0.14 + i * 0.1, esc(line))
        for i, line in enumerate(lines)
    )

    return "".join([
        '<section class="hero">',
        '<canvas class="hero__canvas" aria-hidden="true"></canvas>',
        '<div class="hero__glow" aria-hidden="true"></div>',
        '<div class="hero__glow hero__glow--2" aria-hidden="true"></div>',
        '<div class="shell hero__inner">',
        '<div class="hero__copy">',
        '<p class="hero__meta enter" style="--d:.05s">',
        ticks(),
        "<span>",
        esc(t("Форк FlClash", "A fork of FlClash")),
        "</span><span>",
        esc(t("ядро mihomo", "mihomo core")),
        "</span><span>GPL-3.0</span></p>",
        '<h1 class="hero__title">', head, "</h1>",
        '<p class="hero__lede enter" style="--d:.5s">',
        t(
            "ReClash — открытый клиент для <strong>mihomo</strong> с понятной панелью, "
            "живой темой от провайдера и настройками, которые не приходится искать. "
            "Свои серверы, свои правила, свой трафик.",
            "ReClash is an open-source <strong>mihomo</strong> client with a clear dashboard, "
            "a live provider theme and settings you do not have to hunt for. "
            "Your own servers, your own rules, your own traffic.",
        ),
        "</p>",
        '<div class="hero__actions enter" style="--d:.62s">',
        btn(ctx.page("download"), t("Скачать клиент", "Download the client"), "", "download"),
        btn("#get-started", t("Быстрый старт", "Quick start"), "btn--ghost", "bolt"),
        "</div>",
        '<div class="hero__chips enter" style="--d:.72s">',
        chip("Windows"), chip("macOS"), chip("Linux"), chip("Android"),
        chip(t("открытый код", "open source"), True),
        "</div>",
        "</div>",
        '<div class="hero__stage">',
        '<span class="hero__orbit hero__orbit--1" aria-hidden="true"></span>',
        '<span class="hero__orbit hero__orbit--2" aria-hidden="true"></span>',
        '<div class="hero__mark" tabindex="0" role="img" aria-label="%s">'
        % esc(t("Знак ReClash", "The ReClash mark")),
        '<span class="halo" aria-hidden="true"></span>',
        mark("mkHero", 62.1, "", ""),
        '<span class="hero__mark__hint">%s</span>'
        % esc(t("наведите · кликните", "hover · click")),
        "</div>",
        # Floating telemetry: the numbers tick on their own (home.js), so the
        # mark sits inside a small live readout rather than a still picture.
        '<div class="hero__chip hero__chip--a" aria-hidden="true">'
        '<span class="hero__chip__k">%s</span>'
        '<b><span data-tele="delay">32</span><i>ms</i></b></div>'
        % esc(t("задержка", "delay")),
        '<div class="hero__chip hero__chip--b" aria-hidden="true">'
        '<span class="hero__chip__k">%s</span>'
        '<b><span data-tele="down">6.4</span><i>MB/s</i></b></div>'
        % esc(t("скорость", "down")),
        "</div>",
        "</div></section>",
    ])


def marquee(ctx):
    t = ctx.t
    words = t(
        [
            "mihomo под капотом", "профиль одной ссылкой", "темы от провайдера",
            "виджеты панели", "TUN и системный прокси", "правила и группы",
            "GeoIP и GeoSite", "без телеметрии", "GPL-3.0",
        ],
        [
            "mihomo under the hood", "one-link profile", "provider themes",
            "dashboard widgets", "TUN and system proxy", "rules and groups",
            "GeoIP and GeoSite", "no telemetry", "GPL-3.0",
        ],
    )
    run = "".join("<span>%s</span>" % esc(w) for w in words)
    return (
        '<div class="marquee" aria-hidden="true"><div class="marquee__track">%s%s</div></div>'
        % (run, run)
    )


# ------------------------------------------------------------- app mockup


def section_launch(ctx):
    """Slot 01. The old block here was a fake app window; this one is a tool.

    Steps on the left say what the whole setup costs you. The panel on the
    right is a working converter: a visitor who already has a subscription
    link leaves this section holding an import link, not a promise."""
    t = ctx.t
    steps = [
        (t("Поставьте клиент", "Install the client"),
         t("Windows, macOS, Linux или Android. Установщик или портативная сборка — "
           "ни аккаунта, ни регистрации, ни почты.",
           "Windows, macOS, Linux or Android. Installer or portable build — "
           "no account, no sign-up, no email.")),
        (t("Добавьте подписку одной ссылкой", "Add the subscription with one link"),
         t("Ссылка от провайдера приносит профиль, серверы и правила разом. "
           "Заполнять руками нечего.",
           "The link from your provider brings the profile, the servers and the rules "
           "in one go. Nothing to fill in by hand."),),
        (t("Подключитесь", "Connect"),
         t("Выберите TUN для всего устройства или системный прокси для приложений, "
           "которые его поддерживают. Режим всегда можно сменить на главном экране.",
           "Choose TUN for the whole device or system proxy for apps that support it. "
           "You can switch the mode from the main screen at any time.")),
    ]
    ol = "".join(
        '<li class="launch__step reveal" data-delay="%s">'
        '<span class="launch__step__n" aria-hidden="true"><span>%02d</span></span>'
        "<h3>%s</h3><p>%s</p></li>"
        % (round(i * 0.07, 2), i + 1, esc(pair[0]), esc(pair[1]))
        for i, pair in enumerate(steps)
    )

    tool = "".join([
        '<div class="launch__tool reveal" data-delay="0.1">',
        '<p class="eyebrow">%s</p>' % esc(t("ссылка-импорт", "the import link")),
        "<h3>%s</h3>" % esc(t(
            "Уже есть ссылка на подписку?",
            "Already have a subscription link?",
        )),
        "<p>%s</p>" % esc(t(
            "Вставьте её — и получите ссылку, которая открывает ReClash и "
            "импортирует профиль одним касанием. Такую же кнопку провайдер "
            "может положить в личный кабинет.",
            "Paste it here and get a link that opens ReClash and imports the profile "
            "in one tap. A provider can put the very same button in their dashboard.",
        )),
        ui.deeplink(ctx, "dl-home"),
        '<p class="dl-note">%s</p>' % esc(t(
            "Ссылка собирается прямо в браузере и никуда не отправляется.",
            "The link is assembled in your browser and never leaves it.",
        )),
        '<div class="row gap-2 launch__tool__go">%s%s</div>' % (
            btn(ctx.page("download"), t("Скачать ReClash", "Download ReClash"), "", "download"),
            btn(ctx.page("start"), t("Быстрый старт", "Quick start"), "btn--ghost", "bolt"),
        ),
        "</div>",
    ])

    return "".join([
        '<section class="section" id="get-started">',
        '<div class="shell">',
        rubric("01", t("первый запуск", "first run")),
        '<div class="split" style="margin-bottom:var(--step-4)">',
        '<h2 class="statement">%s</h2>' % t(
            "Установка — это <em>одна ссылка</em>, а не вечер с документацией.",
            "Setting it up is <em>one link</em>, not an evening with the docs.",
        ),
        "<div><p class=\"lede\">%s</p>%s</div>" % (
            esc(t(
                "ReClash не продаёт доступ и ничего о вас не знает: подписку вы "
                "приносите свою. Всё, что нужно сделать, — ниже.",
                "ReClash sells no access and knows nothing about you — the subscription "
                "is yours to bring. Everything you have to do is below.",
            )),
            '<p class="row gap-2" style="margin-top:var(--step-3)">%s%s</p>' % (
                chip(t("без аккаунта", "no account"), True),
                chip(t("импорт по ссылке", "import by link")),
            ),
        ),
        "</div>",
        '<div class="launch"><ol class="launch__steps">%s</ol>%s</div>' % (ol, tool),
        "</div></section>",
    ])


# ---------------------------------------------------------------- features


def section_features(ctx):
    t = ctx.t
    items = [
        ("route",
         t("Ядро mihomo целиком", "The full mihomo core"),
         t("Правила, группы, провайдеры прокси, GeoIP и GeoSite, fake-ip, "
           "внешние контроллеры — всё, к чему вы привыкли в Clash.Meta.",
           "Rules, groups, proxy providers, GeoIP and GeoSite, fake-ip, external "
           "controllers — everything you expect from Clash.Meta.")),
        ("palette",
         t("Тема, которую задаёт провайдер", "A theme your provider sets"),
         t("Один заголовок в ответе подписки — и приложение перекрашивается под бренд: "
           "цвет, фон, кольцо подключения, логотип, набор виджетов.",
           "A single response header repaints the app in your brand: colour, background, "
           "connection ring, logo and the widget set.")),
        ("layers",
         t("Панель, которую можно собрать", "A dashboard you can assemble"),
         t("Пятнадцать виджетов: скорость, расход трафика, режим, определение сети, "
           "TUN, системный прокси, объявление, карточка сервиса.",
           "Fifteen widgets: speed, traffic usage, mode, network detection, TUN, "
           "system proxy, announcement, service card.")),
        ("shield",
         t("Обход DPI — когда он нужен", "DPI bypass — when you need it"),
         t("Если сеть фильтрует соединение по сигнатуре, ByeDPI включается одним "
           "переключателем. В обычной сети его можно не трогать.",
           "If the network filters the connection by signature, ByeDPI is one switch "
           "away. On a regular network you can leave it off.")),
        ("globe",
         t("Четыре платформы", "Four platforms"),
         t("Windows, macOS, Linux и Android из одной кодовой базы на Flutter. "
           "Одинаковые настройки, одинаковые профили.",
           "Windows, macOS, Linux and Android from one Flutter codebase. "
           "Same settings, same profiles.")),
        ("lock",
         t("Открытый код и никакой телеметрии", "Open source, zero telemetry"),
         t("GPL-3.0, исходники на GitHub. Клиент не отправляет статистику "
           "и не знает ничего, кроме вашей подписки.",
           "GPL-3.0, sources on GitHub. The client sends no analytics and knows "
           "nothing beyond your subscription.")),
    ]
    cards = "".join(
        '<article class="card reveal" data-glow data-delay="%s">'
        '<span class="card__icon">%s</span>'
        '<span class="card__num">%02d</span>'
        "<h3>%s</h3><p>%s</p>%s</article>"
        % (round(i * 0.06, 2), icon(ic), i + 1, esc(title), esc(text),
           ('<a class="link link--cyan" href="%s">%s</a>' %
            (ctx.page("start") + "#faq-dpi", esc(t("Когда включать DPI", "When to enable DPI"))))
           if ic == "shield" else "")
        for i, (ic, title, text) in enumerate(items)
    )
    return "".join([
        '<section class="section section--tight" id="features">',
        '<div class="shell">',
        rubric("02", t("что внутри", "what is inside")),
        '<div class="feature-grid">%s</div>' % cards,
        "</div></section>",
    ])


# ---------------------------------------------------------- live dashboard


def _demo_widget(title, value, detail="", kind="", wide=False):
    return (
        '<div class="live-panel__widget%s" data-widget="%s">'
        '<span class="live-panel__widget-title">%s</span>'
        '<strong>%s</strong>%s</div>'
    ) % (
        " live-panel__widget--wide" if wide else "",
        esc(kind), esc(title), value,
        '<span class="live-panel__widget-detail">%s</span>' % detail if detail else "",
    )


def _demo_panel(ctx, key, name, initial, theme, widgets, label, hidden=False):
    style = ";".join("%s:%s" % pair for pair in theme.items())
    return "".join([
        '<div class="live-panel__screen" data-demo-panel="%s" data-demo-label="%s" '
        'style="%s"%s aria-hidden="true">' %
        (esc(key), esc(label), esc(style), " hidden" if hidden else ""),
        '<div class="live-panel__top"><span class="live-panel__logo">%s</span>' % esc(initial),
        '<span class="live-panel__service" data-demo-service>%s</span>' % esc(name),
        '<span class="live-panel__state">%s</span></div>' % esc(ctx.t("подключено", "connected")),
        '<div class="live-panel__body"><div class="live-panel__ring">'
        '<span><b>%s</b><small>%s</small></span></div>' %
        (esc(ctx.t("Защищено", "Protected")), esc(ctx.t("соединение активно", "connection active"))),
        '<div class="live-panel__widgets">%s</div></div></div>' % "".join(widgets),
    ])


def section_live_dashboard(ctx):
    t = ctx.t
    speed = lambda rate: _demo_widget(
        t("Скорость сети", "Network speed"),
        '<span class="live-panel__metric">%s</span>' % esc(rate),
        '<span class="live-panel__spark" aria-hidden="true"></span>', "networkSpeed", True)
    presets = [
        ("default", "ReClash", "R", {
            "--demo-accent": "#7c5cff", "--demo-bg": "#11101a", "--demo-surface": "#1a1826",
            "--demo-text": "#f1eaf2", "--demo-ring-a": "#7c5cff", "--demo-ring-b": "#3686ed",
            "--demo-ring-c": "#2fd3b6",
        }, [
            speed("18.4 MB/s"),
            _demo_widget(t("Режим", "Mode"), t("Правила", "Rule"), "mihomo", "outboundModeV2"),
            _demo_widget(t("Трафик", "Traffic"), "42.8 GB", "↑ 4.7 · ↓ 38.1", "trafficUsage"),
        ]),
        ("nebula", "Nebula VPN", "N", {
            "--demo-accent": "#2fd3b6", "--demo-bg": "#071b1d", "--demo-surface": "#102b2d",
            "--demo-text": "#e9fffb", "--demo-ring-a": "#2fd3b6", "--demo-ring-b": "#58a6ff",
            "--demo-ring-c": "#b6f36b",
        }, [
            _demo_widget(t("Сервис", "Service"), "Nebula VPN", "user-4821", "serviceInfo", True),
            speed("24.1 MB/s"),
            _demo_widget(t("Подписка", "Subscription"), "68%", t("24 дня", "24 days"), "metaInfo"),
            _demo_widget(t("Состояние сети", "Network status"), t("Доступна", "Available"), "185.22.17.4", "networkDetection"),
        ]),
        ("mono", "Northline", "N", {
            "--demo-accent": "#f2f0ea", "--demo-bg": "#111111", "--demo-surface": "#202020",
            "--demo-text": "#f2f0ea", "--demo-ring-a": "#f2f0ea", "--demo-ring-b": "#969696",
            "--demo-ring-c": "#4a4a4a",
        }, [
            _demo_widget(t("Сервис", "Service"), "Northline", "member-08", "serviceInfo", True),
            _demo_widget(t("Маршрутизация", "Routing"), t("Глобально", "Global"), "mihomo", "outboundModeV2"),
            _demo_widget(t("Состояние сети", "Network status"), t("В норме", "Healthy"), "91.204.12.8", "networkDetection"),
        ]),
    ]
    names = {"default": "ReClash", "nebula": "Nebula VPN", "mono": t("Моно", "Mono")}
    labels = {
        key: t("Панель %s: тема, кольцо подключения и виджеты" % name,
               "%s dashboard: theme, connection ring and widgets" % name)
        for key, name, _, _, _ in presets
    }
    buttons = "".join(
        '<button type="button" data-demo-preset="%s" aria-pressed="%s">%s</button>' %
        (key, "true" if i == 0 else "false", esc(names[key]))
        for i, (key, _, _, _, _) in enumerate(presets)
    )
    panels = "".join(
        _demo_panel(ctx, key, name, initial, theme, widgets, labels[key], i > 0)
        for i, (key, name, initial, theme, widgets) in enumerate(presets)
    )
    return "".join([
        '<section class="section" id="dashboard">',
        '<div class="shell">', rubric("03", t("живая панель", "live dashboard")),
        '<div class="live-panel" data-dashboard-demo>',
        '<div class="live-panel__copy"><h2 class="statement">%s</h2>' % t(
            "Провайдер задаёт <em>характер</em>. Вы решаете, что оставить на панели.",
            "Your provider sets the <em>character</em>. You choose what stays on the dashboard."),
        '<p class="lede">%s</p>' % esc(t(
            "Попробуйте три готовых варианта. Заголовки подписки могут менять бренд, палитру, "
            "кольцо подключения и порядок виджетов — без отдельной сборки приложения.",
            "Try three ready-made variants. Subscription headers can change the brand, palette, "
            "connection ring and widget order — without a custom app build.")),
        '<div class="live-panel__presets" role="group" aria-label="%s">%s</div>' %
        (esc(t("Вариант панели", "Dashboard preset")), buttons),
        '<div class="live-panel__action">%s</div></div>' % btn(
            ctx.page("headers") + "#builder", t("Собрать свою панель", "Build your dashboard"), "btn--ghost", "wrench"),
        '<div class="live-panel__viewport" role="img" aria-label="%s">%s</div>' %
        (esc(labels["default"]), panels),
        '<p class="visually-hidden" data-demo-status role="status" aria-live="polite"></p>',
        '</div></div></section>',
    ])


# ------------------------------------------------------- providers (paper)


def section_providers(ctx):
    t = ctx.t
    rows = [
        ("reclash-servicename", t("имя сервиса на панели", "service name in the dashboard")),
        ("reclash-hex", t("цвет темы и вариант палитры", "theme colour and palette variant")),
        ("reclash-widgets", t("набор и порядок виджетов", "widget set and order")),
        ("reclash-announce", t("объявление для пользователей", "announcement for users")),
        ("reclash-buyplan", t("кнопка продления подписки", "renew-subscription action")),
        ("reclash-fallbackhosts", t("запасные хосты подписки", "subscription fallback hosts")),
    ]
    li = "".join(
        '<div><dt>%s</dt><dd>%s</dd></div>' % (esc(name), esc(desc))
        for name, desc in rows
    )
    return "".join([
        '<section class="section paper cut-top" id="providers">',
        '<div class="shell">',
        rubric("04", t("для провайдеров", "for providers")),
        '<div class="split">',
        "<div>",
        '<h2 class="statement">%s</h2>' % t(
            "Ваша подписка отдаёт <em>заголовки</em>. ReClash их читает и перекрашивается.",
            "Your subscription returns <em>headers</em>. ReClash reads them and repaints itself.",
        ),
        '<p class="lede" style="margin-top:var(--step-3)">%s</p>' % esc(t(
            "Никаких SDK, плагинов и договорённостей. Достаточно добавить несколько "
            "HTTP-заголовков в ответ на запрос подписки — и клиент у пользователя "
            "покажет ваш логотип, ваш цвет, ваш остаток трафика и вашу кнопку продления.",
            "No SDK, no plugin, no agreement. Add a few HTTP headers to the subscription "
            "response and the user's client shows your logo, your colour, your remaining "
            "traffic and your renewal button.",
        )),
        '<div class="row gap-2" style="margin-top:var(--step-4)">%s%s</div>' % (
            btn(ctx.page("headers"), t("Открыть документацию", "Open the reference"), "btn--paper", "book"),
            btn(ctx.page("headers") + "#builder",
                t("Собрать заголовки", "Build the headers"), "btn--amber", "wrench"),
        ),
        "</div>",
        '<div><dl class="deflist">%s</dl>'
        '<p class="mono-note" style="margin-top:var(--step-3)">%s</p></div>'
        % (li, esc(t(
            "Полный список — 17 заголовков ReClash, 6 общих и 11 псевдонимов FlClashX.",
            "The full list: 17 ReClash headers, 6 common ones and 11 FlClashX aliases.",
        ))),
        "</div>",
        "</div></section>",
    ])


# ------------------------------------------------------------- platforms


def section_platforms(ctx):
    t = ctx.t
    plats = [
        ("windows", "Windows",
         [t("Windows 10 и новее", "Windows 10 and newer"),
          t("установщик и портативная сборка", "installer and portable build"),
          t("TUN и системный прокси", "TUN and system proxy")]),
        ("apple", "macOS",
         [t("Intel и Apple Silicon", "Intel and Apple Silicon"),
          t("DMG-образ", "DMG image"),
          t("TUN через системного помощника", "TUN via the system helper")]),
        ("linux", "Linux",
         [t("AppImage, deb, rpm", "AppImage, deb, rpm"),
          "x86_64 · arm64",
          t("TUN и системный прокси", "TUN and system proxy")]),
        ("android", "Android",
         [t("Android 6 и новее", "Android 6 and newer"),
          t("APK по архитектурам", "per-ABI APKs"),
          t("режим VPN-сервиса", "VPN service mode")]),
    ]
    cards = "".join(
        '<div class="platform" data-glow data-platform="%s">'
        '<span class="platform__icon">%s</span>'
        '<span class="platform__os">%s</span>'
        "<ul>%s</ul></div>"
        % (key if key != "apple" else "macos", brand_icon(key), esc(name),
           "".join("<li>%s</li>" % esc(x) for x in bullets))
        for key, name, bullets in plats
    )
    return "".join([
        '<section class="section" id="platforms">',
        '<div class="shell">',
        rubric("05", t("платформы", "platforms")),
        '<div class="platforms">%s</div>' % cards,
        '<p class="muted" style="margin-top:var(--step-3);font-size:.92rem">%s</p>'
        % t(
            "Актуальные файлы всегда на <a class=\"link link--cyan\" href=\"%s\">странице загрузок</a>."
            % ctx.page("download"),
            "Current files are always on the <a class=\"link link--cyan\" href=\"%s\">downloads page</a>."
            % ctx.page("download"),
        ),
        "</div></section>",
    ])


# ------------------------------------------------------------ honesty box


def section_honest(ctx):
    t = ctx.t
    yes = t(
        [
            "Подключает вас к серверам, которые вы сами добавили",
            "Обходит фильтрацию по сигнатурам протокола",
            "Показывает остаток трафика и срок подписки",
            "Работает без аккаунта и без регистрации",
            "Открыт целиком: код, сборка, лицензия",
        ],
        [
            "Connects you to servers you added yourself",
            "Gets past protocol-signature filtering",
            "Shows remaining traffic and subscription expiry",
            "Works with no account and no sign-up",
            "Is fully open: code, build, licence",
        ],
    )
    no = t(
        [
            "Не продаёт доступ и не выдаёт подписки",
            "Не делает вас анонимным",
            "Не защищает от целевого наблюдения",
            "Не гарантирует обход в любой сети",
            "Не собирает статистику и не «улучшает продукт»",
        ],
        [
            "Does not sell access or issue subscriptions",
            "Does not make you anonymous",
            "Does not protect you from targeted surveillance",
            "Does not guarantee a bypass on every network",
            "Does not collect analytics or “improve the product”",
        ],
    )

    def col(cls, title, glyph, items):
        li = "".join('<li data-glyph="%s">%s</li>' % (glyph, esc(x)) for x in items)
        return '<div class="honest__col %s"><h3>%s</h3><ul>%s</ul></div>' % (cls, esc(title), li)

    return "".join([
        '<section class="section section--tight" id="honest">',
        '<div class="shell">',
        rubric("06", t("без маркетинга", "no marketing")),
        '<div class="honest">',
        col("", t("Что ReClash делает", "What ReClash does"), "+", yes),
        col("honest__col--no", t("Чего ReClash не делает", "What ReClash does not do"), "−", no),
        "</div>",
        "</div></section>",
    ])


def section_cta(ctx):
    t = ctx.t
    return "".join([
        '<section class="section section--tight">',
        '<div class="shell"><div class="cta">',
        '<p class="eyebrow">%s</p>' % esc(t("Дальше — просто", "It is simple from here")),
        "<h2>%s</h2>" % esc(t("Поставьте и подключитесь", "Install it and connect")),
        '<p class="lede" style="margin:var(--step-3) auto 0">%s</p>' % esc(t(
            "Скачайте сборку для своей системы, добавьте подписку по ссылке — "
            "и всё. Если что-то пойдёт не так, есть быстрый старт и FAQ.",
            "Grab the build for your system, add your subscription by link — that is it. "
            "If something goes sideways, there is a quick start and a FAQ.",
        )),
        '<div class="hero__actions">%s%s</div>' % (
            btn(ctx.page("download"), t("Скачать", "Download"), "", "download"),
            btn(ctx.page("start"), t("Быстрый старт", "Quick start"), "btn--ghost", "bolt"),
        ),
        "</div></div></section>",
    ])


def render(ctx):
    t = ctx.t
    body = "".join([
        hero(ctx),
        marquee(ctx),
        section_launch(ctx),
        section_features(ctx),
        section_live_dashboard(ctx),
        section_providers(ctx),
        section_platforms(ctx),
        section_honest(ctx),
        section_cta(ctx),
    ])
    return {
        "active": "index",
        "title": t(
            "ReClash — открытый клиент для mihomo",
            "ReClash — an open-source mihomo client",
        ),
        "description": t(
            "ReClash — открытый клиент для mihomo с темами провайдера, настраиваемой "
            "панелью и опциональным обходом DPI. Windows, macOS, Linux, Android.",
            "ReClash is an open-source mihomo client with provider themes, a configurable "
            "dashboard and optional DPI bypass. Windows, macOS, Linux, Android.",
        ),
        "body": body,
        "css": ("home.css",),
        "js": ("home.js",),
    }
