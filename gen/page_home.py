"""Landing page."""

from . import ui
from .ui import esc, icon, brand_icon, mark, ticks, rubric, chip, btn, json_block


def hero(ctx):
    t = ctx.t
    lines = t(
        ["ВАШ ТРАФИК", "— ВАШИ", "ПРАВИЛА"],
        ["YOUR TRAFFIC", "IS YOURS", "TO ROUTE"],
    )
    head = "".join(
        '<span class="hl%s" style="--i:%d">%s</span>'
        % (" grad" if i == 2 else "", i, esc(line))
        for i, line in enumerate(lines)
    )

    return "".join([
        '<section class="hero">',
        '<canvas class="hero__canvas" aria-hidden="true"></canvas>',
        '<div class="hero__glow" aria-hidden="true"></div>',
        '<div class="hero__glow hero__glow--2" aria-hidden="true"></div>',
        '<div class="shell hero__inner">',
        "<div>",
        '<p class="hero__meta">',
        ticks(),
        "<span>",
        esc(t("Форк FlClash", "A fork of FlClash")),
        "</span><span>",
        esc(t("ядро mihomo", "mihomo core")),
        "</span><span>GPL-3.0</span></p>",
        '<h1 class="hero__title">', head, "</h1>",
        '<p class="hero__lede">',
        t(
            "ReClash — клиент для <strong>mihomo</strong> с встроенным обходом DPI, "
            "живой темой от провайдера и настройками, которые не приходится искать. "
            "Свои серверы, свои правила, свой трафик.",
            "ReClash is a <strong>mihomo</strong> client with built-in DPI bypass, "
            "a live provider theme and settings you do not have to hunt for. "
            "Your own servers, your own rules, your own traffic.",
        ),
        "</p>",
        '<div class="hero__actions">',
        btn(ctx.page("download"), t("Скачать клиент", "Download the client"), "", "download"),
        btn(ctx.page("headers"), t("Документация по заголовкам", "Header reference"), "btn--ghost", "book"),
        "</div>",
        '<div class="hero__chips">',
        chip("Windows"), chip("macOS"), chip("Linux"), chip("Android"),
        chip(t("открытый код", "open source"), True),
        "</div>",
        "</div>",
        '<div class="hero__mark" tabindex="0" role="img" aria-label="%s">'
        % esc(t("Знак ReClash", "The ReClash mark")),
        '<span class="halo" aria-hidden="true"></span>',
        mark("mkHero", 62.1, "", ""),
        '<span class="hero__mark__hint">%s</span>'
        % esc(t("наведите · кликните", "hover · click")),
        "</div>",
        "</div></section>",
    ])


def marquee(ctx):
    t = ctx.t
    words = t(
        [
            "обход DPI из коробки", "ByeDPI встроен", "mihomo под капотом",
            "темы от провайдера", "виджеты панели", "TUN и системный прокси",
            "правила и группы", "без телеметрии", "GPL-3.0",
        ],
        [
            "DPI bypass out of the box", "ByeDPI built in", "mihomo under the hood",
            "provider themes", "dashboard widgets", "TUN and system proxy",
            "rules and groups", "no telemetry", "GPL-3.0",
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
         t("Провайдер режет соединение — включите обход DPI на том же экране, "
           "рядом с кнопкой подключения. Дальше клиент разбирается сам.",
           "Your ISP is cutting the connection — switch DPI bypass on from the same "
           "screen, next to the connect button. The client takes it from there.")),
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
        ("shield",
         t("Обход DPI без плясок", "DPI bypass without the dance"),
         t("ByeDPI встроен в клиент. Не нужен отдельный процесс, отдельный порт и "
           "отдельная инструкция — включается одним переключателем.",
           "ByeDPI is built into the client. No separate process, no separate port, "
           "no separate tutorial — one switch and it is on.")),
        ("palette",
         t("Тема, которую задаёт провайдер", "A theme your provider sets"),
         t("Один заголовок в ответе подписки — и приложение перекрашивается под бренд: "
           "цвет, фон, кольцо подключения, логотип, набор виджетов.",
           "A single response header repaints the app in your brand: colour, background, "
           "connection ring, logo and the widget set.")),
        ("layers",
         t("Панель, которую можно собрать", "A dashboard you can assemble"),
         t("Четырнадцать виджетов: скорость, расход трафика, режим, определение сети, "
           "TUN, системный прокси, объявление, карточка сервиса.",
           "Fourteen widgets: speed, traffic usage, mode, network detection, TUN, "
           "system proxy, announcement, service card.")),
        ("route",
         t("Ядро mihomo целиком", "The full mihomo core"),
         t("Правила, группы, провайдеры прокси, GeoIP и GeoSite, fake-ip, "
           "внешние контроллеры — всё, к чему вы привыкли в Clash.Meta.",
           "Rules, groups, proxy providers, GeoIP and GeoSite, fake-ip, external "
           "controllers — everything you expect from Clash.Meta.")),
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
        '<article class="card reveal" data-delay="%s">'
        '<span class="card__icon">%s</span>'
        '<span class="card__num">%02d</span>'
        "<h3>%s</h3><p>%s</p></article>"
        % (round(i * 0.06, 2), icon(ic), i + 1, esc(title), esc(text))
        for i, (ic, title, text) in enumerate(items)
    )
    return "".join([
        '<section class="section section--tight" id="features">',
        '<div class="shell">',
        rubric("02", t("что внутри", "what is inside")),
        '<div class="feature-grid">%s</div>' % cards,
        "</div></section>",
    ])


# --------------------------------------------------------------- DPI stage


def section_dpi(ctx):
    t = ctx.t
    # key, button label, what happens, per-lane verdict for ReClash, did it pass
    modes = [
        # The baseline, not a verdict on the client: it is what any client does
        # with the bypass switched off, and the lane says so in those words —
        # "signature matched" on the ReClash lane read as "ReClash fails".
        ("off", t("Без обхода", "No bypass"),
         t("Обход выключен: ClientHello уходит как есть, и провайдер рвёт "
           "соединение на первом пакете. Так ведёт себя любой клиент.",
           "Bypass off: the ClientHello goes out as-is and the ISP drops the "
           "connection on the first packet. Any client behaves this way."),
         t("обход выключен → RST", "bypass off → RST"), False),
        ("split", t("Разрез", "Split"),
         t("ClientHello режется на части — сигнатура не собирается, соединение живёт.",
           "The ClientHello is cut into pieces — the signature never forms and the connection survives."),
         t("сигнатура не собралась", "signature never formed"), True),
        ("fake", t("Фейк + десинк", "Fake + desync"),
         t("Впереди летит поддельный пакет с коротким TTL: DPI видит одно, сервер — другое.",
           "A fake low-TTL packet goes first: the DPI sees one thing, the server another."),
         t("DPI поверил фейку", "DPI believed the decoy"), True),
    ]
    direct_verdict = t("сигнатура найдена → RST", "signature matched → RST")

    buttons = "".join(
        '<button type="button" data-mode="%s" aria-pressed="%s" title="%s">%s</button>'
        % (key, "true" if key == "split" else "false", esc(note), esc(label))
        for key, label, note, _, _ in modes
    )

    lanes = "".join(
        '<div class="dpi__lane" data-lane="%s">'
        '<div class="dpi__lane__head">'
        '<span class="dpi__lane__label">%s</span>'
        '<span class="dpi__lane__verdict" data-verdict="%s" data-ok="%s">%s</span>'
        "</div>"
        '<span class="dpi__track"></span></div>'
        % (key, esc(label), key,
           "true" if key == "reclash" else "false",
           esc(modes[1][3] if key == "reclash" else direct_verdict))
        for key, label in (
            ("direct", t("Обычный клиент", "Plain client")),
            ("reclash", "ReClash"),
        )
    )

    legend = "".join(
        '<span><i class="%s"></i>%s</span>' % (cls, esc(text))
        for cls, text in (
            ("", t("пакет", "packet")),
            ("is-blocked", t("отброшен", "dropped")),
            ("is-wall", t("точка инспекции", "inspection point")),
        )
    )

    stage = "".join([
        '<div class="dpi__stage">',
        '<div class="dpi__stage__head">',
        '<span>tcp/443 · tls clienthello</span>',
        '<span class="dpi__stage__mode" data-mode-label>%s</span>' % esc(modes[1][1]),
        "</div>",
        '<div class="dpi__lanes"><span class="dpi__wall"><span>DPI</span></span>%s</div>' % lanes,
        # the control belongs next to the thing it controls, not in the text column
        '<div class="dpi__controls">',
        '<div class="dpi__toggle" role="group" aria-label="%s">%s</div>'
        % (esc(t("Режим обхода", "Bypass mode")), buttons),
        '<p class="dpi__readout" role="status"></p>',
        "</div>",
        '<div class="dpi__legend">%s</div>' % legend,
        "</div>",
    ])

    return "".join([
        '<section class="section" id="dpi">',
        '<div class="shell">',
        rubric("03", t("обход блокировок", "getting through")),
        '<div class="dpi">',
        '<div class="dpi__say">',
        '<h2 class="statement">%s</h2>' % t(
            "DPI смотрит на <em>первые байты</em>. ByeDPI делает так, чтобы смотреть было не на что.",
            "DPI reads the <em>first bytes</em>. ByeDPI makes sure there is nothing to read.",
        ),
        '<p class="lede" style="margin-top:var(--step-3)">%s</p>' % esc(t(
            "Переключите режим и посмотрите, что происходит с пакетами. "
            "Схема упрощена, но порядок событий настоящий.",
            "Switch the mode and watch what happens to the packets. "
            "The diagram is simplified, but the order of events is real.",
        )),
        "</div>",
        stage,
        "</div>",
        '<p class="notice notice--info" style="margin-top:var(--step-4)">'
        "<span>%s</span></p>" % esc(t(
            "Обход DPI помогает против фильтрации по сигнатурам. Это не анонимайзер "
            "и не защита от целевого наблюдения — и ReClash этого не обещает.",
            "DPI bypass helps against signature filtering. It is not an anonymiser and "
            "not protection from targeted surveillance — and ReClash does not claim otherwise.",
        )),
        "</div>",
        json_block("dpi-strings", {
            "direct": direct_verdict,
            "modes": {
                key: {"label": label, "note": note, "verdict": verdict, "ok": ok}
                for key, label, note, verdict, ok in modes
            },
        }),
        "</section>",
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
        '<div class="platform" data-platform="%s">'
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
        section_dpi(ctx),
        section_providers(ctx),
        section_platforms(ctx),
        section_honest(ctx),
        section_cta(ctx),
    ])
    return {
        "active": "index",
        "title": t(
            "ReClash — клиент mihomo с обходом DPI",
            "ReClash — a mihomo client with DPI bypass",
        ),
        "description": t(
            "ReClash — открытый клиент для mihomo с встроенным обходом DPI, темами от "
            "провайдера и виджетами панели. Windows, macOS, Linux, Android.",
            "ReClash is an open-source mihomo client with built-in DPI bypass, provider "
            "themes and dashboard widgets. Windows, macOS, Linux, Android.",
        ),
        "body": body,
        "css": ("home.css",),
        "js": ("home.js",),
    }
