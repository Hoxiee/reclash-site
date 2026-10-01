"""Landing page."""

from . import ui
from .ui import esc, icon, brand_icon, mark, ticks, rubric, chip, btn


def hero(ctx):
    t = ctx.t
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
        esc(t("форк FlClash", "a fork of FlClash")),
        "</span><span>",
        esc(t("ядро mihomo", "mihomo core")),
        "</span><span>GPL-3.0</span></p>",
        '<h1 class="hero__title enter" style="--d:.16s">',
        esc(t("Свобода,", "Freedom")),
        '<span class="hero__title__sub">%s</span>'
        % esc(t("которую нельзя отобрать.", "no one can take away.")),
        "</h1>",
        '<p class="hero__lede enter" style="--d:.3s">',
        t(
            "Полное ядро mihomo и режим «Авто»: клиент сам держит рабочий узел под "
            "вашу сеть и переключается, когда она меняется. Открытый код на Windows, "
            "macOS, Linux и Android.",
            "The full mihomo core, plus Auto: it keeps a working node for your network "
            "and switches when the network changes. Open source on Windows, macOS, "
            "Linux and Android.",
        ),
        "</p>",
        '<div class="hero__actions enter" style="--d:.42s">',
        btn(ctx.page("download"), t("Скачать", "Download"), "", "download"),
        btn("#get-started", t("Как это работает", "How it works"), "btn--ghost", "bolt"),
        "</div>",
        '<div class="hero__chips enter" style="--d:.52s">',
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
        "</div>",
        "</div></section>",
    ])


def section_why(ctx):
    """Positioning, placed before the audience fork.

    The old page split by audience straight after the hero, so a first-time
    reader had to pick a track before learning what ReClash even is. This block
    answers that first: the same mihomo core as Clash.Meta, what ReClash adds on
    top, and what it refuses to take in return. The lineage on the right names
    the three projects so the "fork of a fork" question is settled here rather
    than left for the FAQ."""
    t = ctx.t
    chain = [
        ("mihomo", t("ядро маршрутизации: правила, группы, GeoIP, fake-ip",
                     "the routing core: rules, groups, GeoIP, fake-ip"), False),
        ("FlClash", t("кроссплатформенная база на Flutter",
                      "the cross-platform Flutter base"), False),
        ("ReClash", t("темы провайдера, умная маршрутизация, обход DPI, панель заново",
                      "provider themes, smart routing, DPI bypass, a dashboard rebuilt"), True),
    ]
    rows = "".join(
        '<li class="lineage__row%s"><span class="lineage__name">%s</span>'
        '<span class="lineage__what">%s</span></li>'
        % (" lineage__row--this" if this else "", esc(name), esc(what))
        for name, what, this in chain
    )
    return "".join([
        '<section class="section section--tight" id="why"><div class="shell">',
        rubric("01", t("что это", "what it is")),
        '<div class="split">',
        "<div>",
        '<h2 class="statement">%s</h2>' % t(
            "Форк <em>FlClash</em> на ядре mihomo.",
            "A fork of <em>FlClash</em> on the mihomo core.",
        ),
        '<p class="lede" style="margin-top:var(--step-3)">%s</p>' % t(
            "Маршрутизацию делает то же ядро <strong>mihomo</strong>, что и в Clash.Meta. "
            "ReClash добавляет сверху то, чего не хватало: оформление от провайдера, "
            "умную маршрутизацию, встроенный обход DPI и панель, собранную заново.",
            "Routing runs on the same <strong>mihomo</strong> core as Clash.Meta. ReClash adds "
            "what was missing on top: provider theming, smart routing, a built-in "
            "DPI bypass, and a dashboard rebuilt from scratch.",
        ),
        '<p class="row gap-2" style="margin-top:var(--step-4)">%s%s</p>' % (
            chip(t("открытый код", "open source"), True),
            chip(t("ядро mihomo", "mihomo core")),
        ),
        '<p class="muted" style="margin-top:var(--step-3);font-size:.92rem">%s</p>' % t(
            "Проект не аффилирован с FlClash, mihomo или FlClashX. "
            "<a class=\"link link--cyan\" href=\"%s\">Чем отличается от FlClash</a>."
            % (ctx.page("start") + "#faq-flclash"),
            "The project is not affiliated with FlClash, mihomo or FlClashX. "
            "<a class=\"link link--cyan\" href=\"%s\">How it differs from FlClash</a>."
            % (ctx.page("start") + "#faq-flclash"),
        ),
        "</div>",
        '<div><p class="eyebrow" style="margin-bottom:var(--step-2)">%s</p>'
        '<ul class="lineage">%s</ul></div>' % (
            esc(t("родословная", "lineage")), rows),
        "</div>",
        "</div></section>",
    ])


def section_paths(ctx):
    """The closing fork: two doors, one per audience.

    It is the last thing on the page on purpose. By the time the reader reaches
    it they have seen what ReClash is, the two chapters (01 for users, 02 for
    providers), the platforms and the honest box — so this is not a mid-page
    reader-ejector but the natural exit, and each card links straight to where
    that audience actually goes next.
    """
    t = ctx.t
    cards = [
        (ctx.page("download"), "download", "user",
         t("у вас есть ссылка", "you have a link"),
         t("Вставьте ссылку и подключитесь", "Paste the link and connect"),
         t("ReClash откроет ссылку провайдера, покажет остаток трафика и подключит — "
           "без аккаунта, регистрации и почты.",
           "ReClash opens your provider's link, shows the traffic you have left and "
           "connects — no account, no sign-up, no email."),
         t("Скачать ReClash", "Download ReClash")),
        (ctx.page("builder") + "#builder", "palette", "provider",
         t("вы продаёте доступ", "you sell access"),
         t("Сделайте клиент своим", "Make the client yours"),
         t("Несколько заголовков в ответе подписки — и приложение носит ваш логотип, "
           "цвет и кнопку продления. Своего приложения не нужно.",
           "A few headers in the subscription response and the app wears your logo, "
           "your colour and your renew button. No app of your own needed."),
         t("Собрать заголовки", "Build the headers")),
    ]
    figs = "".join(
        '<a class="path path--%s reveal" href="%s" data-delay="%s">'
        '<span class="path__icon">%s</span>'
        '<p class="eyebrow">%s</p><h2>%s</h2><p>%s</p>'
        '<span class="path__go">%s<i aria-hidden="true">&#8594;</i></span></a>'
        % (kind, href, round(i * 0.08, 2), icon(ic), esc(eyebrow),
           esc(title), esc(body), esc(go))
        for i, (href, ic, kind, eyebrow, title, body, go) in enumerate(cards)
    )
    return (
        '<section class="section section--tight" id="paths"><div class="shell">'
        '<p class="eyebrow center">%s</p>'
        '<h2 class="statement center" style="margin-bottom:var(--step-5)">%s</h2>'
        '<div class="paths">%s</div></div></section>'
        % (esc(t("что дальше", "what's next")),
           t("Дальше зависит от того, <em>кто вы</em>.",
             "What comes next depends on <em>who you are</em>."), figs)
    )


# ----------------------------------------------------------- users (01)


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
        rubric("03", t("пользователям", "for users")),
        '<div class="split" style="margin-bottom:var(--step-4)">',
        '<h2 class="statement">%s</h2>' % t(
            "Настройка — это <em>одна ссылка</em> и три шага.",
            "Setup is <em>one link</em> and three steps.",
        ),
        "<div><p class=\"lede\">%s</p>%s</div>" % (
            esc(t(
                "Подписку вы приносите свою. Всё, что нужно сделать, — ниже.",
                "The subscription is yours to bring — everything you have to do is below.",
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
        ("bolt",
         t("Умная маршрутизация", "Smart routing"),
         t("Режим «Авто» сам держит рабочий узел под текущую сеть и переключается, "
           "когда она меняется, — начиная с регионального пресета.",
           "The “Auto” mode keeps a working node for the current network and switches "
           "when the network changes — starting from a region preset.")),
        ("palette",
         t("Вид задаёт провайдер", "The look comes from the provider"),
         t("Один заголовок в ответе подписки — и приложение перекрашивается под бренд: "
           "цвет, фон, кольцо подключения и логотип.",
           "A single response header repaints the app in your brand: colour, background, "
           "connection ring and logo.")),
        ("shield",
         t("Встроенный обход DPI", "Built-in DPI bypass"),
         t("Разбивает и маскирует handshake ещё до прокси. Включается в настройках, "
           "когда провайдер режет само соединение по DPI.",
           "Fragments and masks the handshake before the proxy even starts. Turn it on "
           "when your ISP throttles the connection itself by DPI.")),
        ("split",
         t("Весь трафик или только приложения", "Whole device or just apps"),
         t("Режим TUN заворачивает всю систему, системный прокси — только "
           "приложения, которые его поддерживают. Переключается на главном экране.",
           "TUN mode captures the whole system; the system proxy covers only the apps "
           "that support it. Switch it from the main screen.")),
        ("gauge",
         t("Трафик и срок — на виду", "Traffic and expiry, at a glance"),
         t("Клиент читает остаток трафика и дату окончания прямо из подписки и держит "
           "их на главном экране — без захода в личный кабинет.",
           "The client reads your remaining traffic and expiry straight from the "
           "subscription and keeps them on the main screen — no dashboard visit needed.")),
    ]
    def card_link(ic):
        if ic == "palette":
            return ('<a class="link link--cyan" href="#providers">%s</a>'
                    % esc(t("Как это работает", "See how it works")))
        if ic == "bolt":
            return ('<a class="link link--cyan" href="%s">%s</a>'
                    % (ctx.page("start") + "#faq-smart",
                       esc(t("Как работает «Авто»", "How “Auto” works"))))
        if ic == "shield":
            return ('<a class="link link--cyan" href="%s">%s</a>'
                    % (ctx.page("start") + "#faq-dpi",
                       esc(t("Как работает обход", "How the bypass works"))))
        return ""

    cards = "".join(
        '<article class="card reveal" data-glow data-delay="%s">'
        '<span class="card__icon">%s</span>'
        '<span class="card__num">%02d</span>'
        "<h3>%s</h3><p>%s</p>%s</article>"
        % (round(i * 0.06, 2), icon(ic), i + 1, esc(title), esc(text), card_link(ic))
        for i, (ic, title, text) in enumerate(items)
    )
    return "".join([
        '<section class="section section--tight" id="features">',
        '<div class="shell">',
        rubric("02", t("что умеет", "what it does")),
        '<h2 class="statement" style="margin-bottom:var(--step-4)">%s</h2>' % t(
            "Что <em>умеет</em> ReClash.",
            "What ReClash <em>does</em>.",
        ),
        '<div class="feature-grid">%s</div>' % cards,
        "</div></section>",
    ])


# ------------------------------------------------------- providers (paper)


def section_providers(ctx):
    """Slot 04. The branding story, shown as cause and effect.

    The reader sees the mechanism itself: on the left, the raw HTTP response a
    subscription returns; on the right, the flat app surface those headers
    paint — logo tile, name, renew button, announcement, traffic meter. Flip
    between provider presets and the changed header lines flash while the whole
    right panel re-tints, because everything there reads var(--accent) and the
    property is registered and transitioned. It cycles on its own and stops the
    moment the reader takes over; with no JS it is one finished, honest frame.
    The paper insert the reader liked stays, with the header reference below."""
    t = ctx.t

    # Each preset is the same payload a set of response headers carries: a name,
    # two accent colours, a node, an announcement and an optional renew action
    # (empty for the default, unbranded ReClash).
    brands = [
        {"id": "reclash", "name": "ReClash",
         "accent": "#7c5cff", "accent2": "#2fd3b6",
         "node": t("Амстердам · 24 мс", "Amsterdam · 24 ms"),
         "announce": t("Профиль импортирован по ссылке.", "Profile imported from a link."),
         "renew": "", "tag": t("по умолчанию", "default")},
        {"id": "aurora", "name": "Aurora VPN",
         "accent": "#2fd3b6", "accent2": "#22d3ee",
         "node": t("Хельсинки · 18 мс", "Helsinki · 18 ms"),
         "announce": t("Новый узел в Осло уже в списке.", "A new Oslo node is in your list."),
         "renew": t("Продлить", "Renew"), "tag": t("тема провайдера", "provider theme")},
        {"id": "brand", "name": t("Ваш бренд", "Your brand"),
         "accent": "#ffd45f", "accent2": "#ff9f68",
         "node": t("Стокгольм · 21 мс", "Stockholm · 21 ms"),
         "announce": t("Оплачено до 14 октября.", "Paid through 14 October."),
         "renew": t("Личный кабинет", "My account"),
         "tag": t("бренд провайдера", "provider brand")},
    ]
    first = brands[0]

    def hexv(c):
        return c.lstrip("#").upper()

    # The provider tabs. Each button carries the whole preset as data-* so the
    # JS can repaint both panels; with no JS the first is simply the one shown.
    tabs = "".join(
        '<button class="hdemo__tab%s" type="button" style="--pdot:%s" '
        'data-brand="%s" data-accent="%s" data-accent2="%s" data-name="%s" '
        'data-hex="%s" data-node="%s" data-announce="%s" data-renew="%s" '
        'aria-pressed="%s">'
        '<span class="hdemo__dot" aria-hidden="true"></span>%s</button>'
        % (" is-on" if i == 0 else "", b["accent"], b["id"], b["accent"],
           b["accent2"], esc(b["name"]), hexv(b["accent"]), esc(b["node"]),
           esc(b["announce"]), esc(b["renew"]), "true" if i == 0 else "false",
           esc(b["tag"]))
        for i, b in enumerate(brands)
    )

    # Left: the raw response. The dim first line is fixed; the four reclash-*
    # lines below carry data-f keys so the JS updates their values and flashes
    # whichever ones changed.
    def ln(field, key, val, dim=False):
        return ('<span class="hdemo__ln%s"%s>'
                '<span class="hdemo__k">%s</span> '
                '<span class="hdemo__v">%s</span></span>'
                % (" hdemo__ln--dim" if dim else "",
                   ' data-f="%s"' % field if field else "",
                   esc(key), esc(val)))

    code = "".join([
        '<div class="hdemo__panel">',
        '<span class="hdemo__cap">%s</span>' % esc(t("ответ подписки", "subscription response")),
        '<pre class="hdemo__code"><code>',
        ln("", "HTTP/2 200", "", dim=True).replace('<span class="hdemo__v"></span>', ""),
        ln("", "content-type:", "application/json", dim=True),
        ln("servicename", "reclash-servicename:", first["name"]),
        ln("hex", "reclash-hex:", hexv(first["accent"])),
        ln("announce", "reclash-announce:", first["announce"]),
        ln("buyplan", "reclash-buyplan:", first["renew"] or "—"),
        "</code></pre></div>",
    ])

    # Right: the surface those headers paint. Everything reads var(--accent),
    # but as tints and fills, never as text on the cream — contrast stays safe
    # whatever colour the provider ships.
    out = "".join([
        '<div class="hdemo__panel">',
        '<span class="hdemo__cap">%s</span>' % esc(t("что видит пользователь", "what the user sees")),
        '<div class="hdemo__out">',
        '<div class="hdemo__head">',
        '<span class="hdemo__logo" aria-hidden="true">%s</span>' % icon("sparkle"),
        '<span class="hdemo__name">%s</span>' % esc(first["name"]),
        '<span class="hdemo__renew"%s>%s</span>'
        % ("" if first["renew"] else " hidden", esc(first["renew"] or "")),
        "</div>",
        '<div class="hdemo__announce">%s</div>' % esc(first["announce"]),
        '<div class="hdemo__meter"><span class="hdemo__meter__k">%s</span>'
        '<span class="hdemo__track"><i></i></span>'
        '<span class="hdemo__meter__v">62 / 200 %s</span></div>'
        % (esc(t("Трафик", "Traffic")), esc(t("ГБ", "GB"))),
        '<div class="hdemo__note">%s</div>' % esc(first["node"]),
        "</div></div>",
    ])

    hdemo = "".join([
        '<div class="hdemo" data-brand="%s">' % first["id"],
        '<div class="hdemo__switch" role="group" aria-label="%s">'
        '<span class="hdemo__switch__lab">%s</span>%s</div>'
        % (esc(t("Тема провайдера", "Provider theme")),
           esc(t("Смените бренд", "Switch the brand")), tabs),
        '<div class="hdemo__grid">%s%s</div>' % (code, out),
        "</div>",
    ])

    intro = "".join([
        '<div class="providers__intro">',
        '<h2 class="statement">%s</h2>' % t(
            "Ваше приложение. Только <em>писать</em> его не нужно.",
            "Your app. You just <em>don't build</em> it.",
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
            btn(ctx.page("docs"), t("Открыть документацию", "Open the docs"), "btn--paper", "book"),
            btn(ctx.page("builder") + "#builder",
                t("Собрать заголовки", "Build the headers"), "btn--amber", "wrench"),
        ),
        '<p class="muted" style="margin-top:var(--step-3);font-size:.92rem">%s</p>' % t(
            "Конструктор сразу отдаёт готовые артефакты для панели <strong>Remnawave</strong>, "
            "рядом — <a class=\"link link--cyan\" href=\"%s\">мок-подписки</a> для проверки."
            % ctx.page("mock"),
            "The builder emits ready-made artefacts for the <strong>Remnawave</strong> panel; "
            "next to it are <a class=\"link link--cyan\" href=\"%s\">mock subscriptions</a> to test against."
            % ctx.page("mock"),
        ),
        "</div>",
    ])

    return "".join([
        '<section class="section paper cut-top" id="providers">',
        '<div class="shell">',
        rubric("04", t("провайдерам", "for providers")),
        intro,
        hdemo,
        '<p class="providers__more">%s</p>' % t(
            "Заголовки настраивают всё оформление клиента — имя сервиса, цвет и палитру, "
            "hero-кольцо и эффект, объявление, кнопки продления, "
            "запасные хосты и другое — все они <b>reclash-*</b>; клиент также "
            "читает стандартные заголовки подписки, а часть имён FlClashX понимает как "
            "псевдонимы — <a class=\"link link--cyan\" href=\"%s\">полный справочник</a>."
            % ctx.page("reference"),
            "The headers configure the whole look of the client — service name, colour and "
            "palette, hero ring and effect, announcement, renew buttons, "
            "fallback hosts and more — all of them <b>reclash-*</b> headers; the client also "
            "reads standard subscription headers and understands a subset of FlClashX names "
            "as aliases — <a class=\"link link--cyan\" href=\"%s\">the full reference</a>."
            % ctx.page("reference"),
        ),
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
        '<section class="section section--tight" id="platforms">',
        '<div class="shell">',
        rubric("05", t("платформы", "platforms")),
        '<h2 class="statement" style="margin-bottom:var(--step-4)">%s</h2>' % t(
            "Работает на <em>четырёх</em> платформах.",
            "Runs on <em>four</em> platforms.",
        ),
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
    """Closing honesty beat before the download CTA.

    The old two-column does/doesn't list read as generic and half-repeated the
    trust facts from the stat band and section 01. This replaces it with a
    single positioning line: nothing locks the user in — ReClash is a client,
    the subscription is a plain Clash config that travels, and the code is open.
    Deliberately minimal: a breather between the dense sections and the CTA."""
    t = ctx.t
    return "".join([
        '<section class="section section--tight" id="honest"><div class="shell">',
        rubric("06", t("честно", "the honest bit")),
        '<h2 class="statement" style="max-width:14ch">%s</h2>' % t(
            "Уйти можно <em>когда угодно</em>.",
            "Leave <em>whenever</em> you want.",
        ),
        '<p class="lede" style="margin-top:var(--step-3);max-width:62ch">%s</p>' % t(
            "Ни аккаунта, ни привязки. Серверы и профили — ваши, а подписка в обычном "
            "формате Clash уносится в любой совместимый клиент. ReClash открыт целиком — "
            "ничто не держит вас здесь.",
            "No account, no lock-in. Your servers and profiles are yours, and a subscription "
            "in the plain Clash format moves to any compatible client. ReClash is fully open — "
            "nothing keeps you here.",
        ),
        "</div></section>",
    ])


# ------------------------------------------------------ proof / stat band


def section_stats(ctx):
    """A thin band of facts under the hero, so the project reads as real before
    the first feature. Every figure is checkable elsewhere on the site."""
    t = ctx.t
    stats = [
        ("4", t("платформы", "platforms")),
        ("∞", t("цветов темы", "theme colours")),
        ("20", t("заголовков бренда", "brand headers")),
        ("GPL-3.0", t("открытый код", "open source")),
    ]
    cells = "".join(
        '<div class="stat"><span class="stat__num">%s</span>'
        '<span class="stat__label">%s</span></div>' % (esc(num), esc(label))
        for num, label in stats
    )
    return (
        '<section class="statband"><div class="shell">'
        '<div class="statband__grid">%s</div></div></section>' % cells
    )


def render(ctx):
    t = ctx.t
    body = "".join([
        hero(ctx),
        section_stats(ctx),
        section_why(ctx),
        section_features(ctx),
        section_launch(ctx),
        section_providers(ctx),
        section_platforms(ctx),
        section_honest(ctx),
        section_paths(ctx),
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
