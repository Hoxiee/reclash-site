"""The provider documentation — the narrative guide.

This is the page a provider reads front to back: how the header mechanism
works, the parsing rules every value obeys, how the whole thing survives the
trip through a reverse proxy and a CDN, and a rollout checklist. The full
per-header catalogue (every value, alias and example) lives on its own page —
`reference.html`, `page_headers.render_reference` — and the interactive
builder on `headers.html`. Only `docs.css` and the shared `core.js` (TOC
filter + scroll-spy); no builder.js, no phone-preview styles.
"""

from . import spec, ui
from .ui import esc, rubric, chip, codeblock, notice, table


# The doc's own sections, in order. `tool` and `ref` are cross-page links
# (the builder and the catalogue); everything else is an in-page anchor. The
# fourth field is the TOC filter's search index — both languages on purpose,
# so a reader finds a section whichever language they type in.
TOC = [
    ("tool", "Конструктор", "The builder", "builder generator форма конструктор"),
    ("ref", "Заголовки", "Headers", "reference catalog справочник каталог все заголовки список"),
    ("overview", "Как это работает", "How it works", "overview обзор three tiers слои начало"),
    ("rules", "Правила разбора", "Parsing rules", "case base64 приоритет priority регистр"),
    ("compat", "Совместимость", "Compatibility", "flclashx алиасы aliases приоритет псевдонимы"),
    ("delivery", "Доставка и отладка", "Delivery and debugging",
     "curl proxy cdn cache troubleshooting отладка прокси кэш не доходят nginx caddy"),
    ("hwid", "Устройства и HWID", "Devices and HWID", "x-hwid x-device-os лимит limit устройства"),
    ("checklist", "Чеклист внедрения", "Rollout checklist", "checklist проверка testing шаги"),
]


def toc(ctx):
    t = ctx.t

    def href(key):
        if key == "tool":
            return ctx.page("headers")
        if key == "ref":
            return ctx.page("reference")
        return "#" + key

    items = "".join(
        '<li data-keys="%s"><a href="%s">%s</a></li>'
        % (esc(keys), href(key), esc(t(ru, en)))
        for key, ru, en, keys in TOC
    )
    return (
        '<nav class="toc" aria-label="' + esc(t("Содержание", "Contents")) + '">'
        "<h2>" + esc(t("Содержание", "Contents")) + "</h2>"
        '<input class="toc__search" type="search" placeholder="'
        + esc(t("фильтр…", "filter…")) + '" aria-label="'
        + esc(t("Фильтр по разделам", "Filter sections")) + '">'
        "<ol>" + items + "</ol></nav>"
    )


def sec(key, title, body):
    return '<section id="%s"><h2>%s</h2>%s</section>' % (key, esc(title), body)


def doc_body(ctx):
    t = ctx.t
    ref = ctx.page("reference")
    tool = ctx.page("headers")
    out = []

    # -- overview ---------------------------------------------------------
    example = (
        "HTTP/1.1 200 OK\n"
        "Content-Type: application/yaml; charset=utf-8\n"
        "Subscription-Userinfo: upload=13421772800; download=83994443776; "
        "total=214748364800; expire=1798761600\n"
        "Profile-Title: Nebula VPN\n"
        "ReClash-ServiceName: Nebula VPN\n"
        "ReClash-Hex: 2FD3B6:vibrant\n"
        "ReClash-SupportURL: https://nebula.example/help\n"
    )
    out.append(sec("overview", t("Как это работает", "How it works"),
        "<p>" + t(
            "Клиент забирает подписку обычным HTTP-запросом. Тело ответа — конфиг "
            "mihomo, а заголовки ответа — всё остальное: имя сервиса, остаток трафика, "
            "тема, набор виджетов, ссылки на биллинг. Ни SDK, ни плагина, ни "
            "договорённости с нами не требуется.",
            "The client fetches the subscription with a plain HTTP request. The body is "
            "a mihomo config; the response headers carry everything else: service name, "
            "remaining traffic, theme, widget set, billing links. No SDK, no plugin and "
            "no agreement with us is required.",
        ) + "</p>"
        + "<p>" + t(
            "Заголовки перечитываются при каждом обновлении профиля — по кнопке или по "
            "интервалу. Значения привязаны к профилю, а не к приложению: тему задаёт тот "
            "профиль, который сейчас активен.",
            "Headers are re-read on every profile update — manual or scheduled. Values "
            "belong to the profile, not to the application: the theme comes from whichever "
            "profile is currently active.",
        ) + "</p>"
        + codeblock(example, t("копировать", "copy"), t("готово", "copied"))
        + "<h3>" + esc(t("Три слоя заголовков", "Three layers of headers")) + "</h3>"
        + "<p>" + t(
            "Заголовки, которые читает ReClash, делятся на три группы — стоит "
            "понимать, какая за что отвечает. Полный список каждого слоя — в "
            "<a class=\"link\" href=\"" + ref + "\">справочнике</a>.",
            "The headers ReClash reads fall into three groups — it helps to know "
            "which does what. The full list of each layer is in the "
            "<a class=\"link\" href=\"" + ref + "\">reference</a>.",
        ) + "</p>"
        + '<dl class="deflist">'
        + "".join("<div><dt>" + esc(a) + "</dt><dd>" + b + "</dd></div>" for a, b in [
            (t("Общие", "Common"),
             t("Стандартные заголовки Clash — <code>subscription-userinfo</code>, "
               "<code>profile-title</code> и другие. Если вы их уже отдаёте, "
               "менять ничего не нужно.",
               "Standard Clash headers — <code>subscription-userinfo</code>, "
               "<code>profile-title</code> and the rest. If you already send them, "
               "nothing changes.")),
            (t("ReClash", "ReClash"),
             t("Двадцать заголовков <code>reclash-*</code> — всё, что делает "
               "панель фирменной: тема, кольцо, виджеты, объявления. Понимает "
               "только ReClash.",
               "Twenty <code>reclash-*</code> headers — everything that makes the "
               "dashboard yours: theme, ring, widgets, announcements. Only ReClash "
               "reads them.")),
            (t("Псевдонимы", "Aliases"),
             t("Заголовки <code>flclashx-*</code>, которые ReClash читает ради "
               "совместимости — чтобы вам не пришлось ничего переделывать. См. "
               "<a class=\"link\" href=\"#compat\">«Совместимость»</a>.",
               "The <code>flclashx-*</code> headers ReClash reads for compatibility "
               "— so you need not redo anything. See "
               "<a class=\"link\" href=\"#compat\">“Compatibility”</a>.")),
        ])
        + "</dl>"
        + notice(
            "<span>" + t(
                "Заголовки — это подсказки оформления, а не механизм доверия. "
                "Пользователь может переопределить почти всё, что вы прислали.",
                "Headers are presentation hints, not a trust mechanism. The user can "
                "override nearly everything you send.",
            ) + "</span>", "notice--info")
    ))

    # -- rules ------------------------------------------------------------
    rules = [
        (t("Регистр не важен", "Case does not matter"),
         t("Имена заголовков сравниваются без учёта регистра: <code>ReClash-Hex</code>, "
           "<code>reclash-hex</code> и <code>RECLASH-HEX</code> — одно и то же.",
           "Header names are compared case-insensitively: <code>ReClash-Hex</code>, "
           "<code>reclash-hex</code> and <code>RECLASH-HEX</code> are the same header.")),
        (t("Приоритет у reclash-*", "reclash-* wins"),
         t("Если пришли и <code>reclash-*</code>, и псевдоним, и общий заголовок — "
           "побеждает <code>reclash-*</code>.",
           "When <code>reclash-*</code>, an alias and a common header all arrive, "
           "<code>reclash-*</code> wins.")),
        (t("Повторы склеиваются", "Repeats are joined"),
         t("Несколько одинаковых заголовков соединяются через запятую — так же, как это "
           "делает HTTP.",
           "Several identical headers are joined with commas, exactly as HTTP does.")),
        (t("Пустое игнорируется", "Empty is ignored"),
         t("Пустые значения и неизвестные токены просто отбрасываются: сломать "
           "приложение опечаткой нельзя.",
           "Empty values and unknown tokens are dropped: a typo cannot break the app.")),
        (t("Base64 для не-ASCII", "Base64 for non-ASCII"),
         t("Текстовые заголовки принимают префикс <code>base64:</code> или "
           "<code>base64,</code>. Для кириллицы и эмодзи это обязательно — "
           "в HTTP-заголовке им не место.",
           "Text headers accept a <code>base64:</code> or <code>base64,</code> prefix. "
           "For Cyrillic and emoji it is mandatory — an HTTP header is no place for them.")),
        (t("Только HTTPS в ссылках", "HTTPS only in links"),
         t("Все URL — абсолютные и по HTTPS. Исключение — фон, который допускает "
           "и <code>http</code>. Логин и пароль в URL запрещены.",
           "All URLs are absolute and HTTPS. The one exception is the background, which "
           "also accepts <code>http</code>. Credentials in URLs are rejected.")),
    ]
    out.append(sec("rules", t("Правила разбора", "Parsing rules"),
        "<p>" + t(
            "Эти правила действуют для всех заголовков сразу — держите их в голове, "
            "читая <a class=\"link\" href=\"" + ref + "\">справочник</a>.",
            "These rules hold for every header at once — keep them in mind as you read "
            "the <a class=\"link\" href=\"" + ref + "\">reference</a>.",
        ) + "</p>"
        + '<dl class="deflist">'
        + "".join("<div><dt>" + esc(a) + "</dt><dd>" + b + "</dd></div>" for a, b in rules)
        + "</dl>"))

    # -- compat (was: aliases) -------------------------------------------
    L = 0 if ctx.lang == "ru" else 1
    a_rows = []
    for ru, en, chain in spec.ALIASES:
        unit = lambda x: (x.replace("{m}", t("мин.", "min"))
                           .replace("{h}", t("ч.", "h")))
        cells = " <span class=\"faint\">&rarr;</span> ".join(
            "<code>" + esc(unit(x)) + "</code>" for x in chain
        )
        a_rows.append([esc(ru if L == 0 else en), cells])
    out.append(sec("compat", t("Совместимость", "Compatibility"),
        "<p>" + t(
            "ReClash читает часть заголовков FlClashX, чтобы провайдерам не пришлось "
            "ничего переделывать. Порядок в таблице — порядок приоритета: побеждает "
            "первый непустой. В <a class=\"link\" href=\"" + ref + "\">справочнике</a> "
            "псевдоним показан прямо на карточке своего заголовка.",
            "ReClash reads some FlClashX headers so providers do not have to redo anything. "
            "The order in the table is the priority order: the first non-empty value wins. "
            "In the <a class=\"link\" href=\"" + ref + "\">reference</a> the alias is shown "
            "right on its header's card.",
        ) + "</p>"
        + table([t("Что задаётся", "What it sets"), t("Приоритет", "Priority")], a_rows)
        + notice("<span>" + t(
            "У надписи подключения, кольца, виджетов, <code>reclash-custom</code>, "
            "<code>reclash-settings</code> и запасных хостов псевдонимов нет — это возможности ReClash.",
            "The active-protection text, hero ring, widgets, <code>reclash-custom</code>, "
            "<code>reclash-settings</code> and fallback hosts have no aliases — they are ReClash features.",
        ) + "</span>", "notice--info")))

    # -- delivery ---------------------------------------------------------
    curl_test = (
        "# " + t("что реально уходит клиенту", "what actually reaches the client") + "\n"
        "curl -sSI 'https://sub.nebula.example/sub/TOKEN' | grep -i "
        "'reclash\\|subscription\\|profile\\|content-disposition'\n\n"
        "# " + t("тело подписки, без заголовков", "the subscription body, without headers") + "\n"
        "curl -s 'https://sub.nebula.example/sub/TOKEN' | head -20"
    )
    problems = [
        (t("Заголовки не доходят до клиента", "Headers never reach the client"),
         t("Почти всегда их срезает обратный прокси или CDN. nginx по умолчанию "
           "не пробрасывает произвольные заголовки апстрима — проверьте, что перед "
           "<code>location</code> подписки нет <code>proxy_hide_header</code> на "
           "<code>reclash-*</code>, а панель отдаёт их до прокси. Соберите готовый "
           "фрагмент для nginx или Caddy в <a class=\"link\" href=\"" + tool + "\">"
           "конструкторе</a>.",
           "A reverse proxy or CDN is almost always stripping them. nginx does not "
           "forward arbitrary upstream headers by default — check that nothing "
           "<code>proxy_hide_header</code>s <code>reclash-*</code> before the "
           "subscription <code>location</code>, and that the panel emits them "
           "upstream of the proxy. Grab a ready nginx or Caddy snippet in the "
           "<a class=\"link\" href=\"" + tool + "\">builder</a>.")),
        (t("Кириллица приходит мусором", "Cyrillic arrives as garbage"),
         t("HTTP-заголовок несёт только ASCII. Любой не-латинский текст — имя "
           "сервиса, объявление, надпись подключения — кодируйте префиксом "
           "<code>base64:</code>. Конструктор делает это автоматически.",
           "An HTTP header carries ASCII only. Encode any non-Latin text — service "
           "name, announcement, connection headline — with a <code>base64:</code> "
           "prefix. The builder does this for you.")),
        (t("Значения задвоились", "Values show up twice"),
         t("Панель уже отдаёт заголовок, а ваш прокси добавляет его ещё раз: "
           "<code>add_header</code> в nginx дописывает, а не заменяет. Спрячьте "
           "исходный через <code>proxy_hide_header</code> либо задавайте значение "
           "в одном месте.",
           "The panel already sends a header and your proxy adds it again: nginx's "
           "<code>add_header</code> appends rather than replaces. Hide the original "
           "with <code>proxy_hide_header</code>, or set the value in one place only.")),
        (t("CDN кэширует старый ответ", "The CDN caches a stale response"),
         t("Если подписка идёт через CDN, он может отдавать закэшированный ответ с "
           "прежними заголовками. Исключите путь подписки из кэша или отдавайте "
           "<code>Cache-Control: no-store</code> на нём.",
           "If the subscription goes through a CDN, it may serve a cached response "
           "with the old headers. Exclude the subscription path from the cache, or "
           "send <code>Cache-Control: no-store</code> on it.")),
        (t("Заголовок игнорируется, хотя дошёл", "The header arrives but is ignored"),
         t("Проверьте написание и значение по <a class=\"link\" href=\"" + ref + "\">"
           "справочнику</a>: неизвестные токены и пустые значения молча отбрасываются. "
           "Регистр имени роли не играет, а вот <code>reclash-view</code> и "
           "<code>reclash-hex</code> разбираются по строгим правилам — см. "
           "<a class=\"link\" href=\"#rules\">«Правила разбора»</a>.",
           "Check the spelling and value against the <a class=\"link\" href=\"" + ref + "\">"
           "reference</a>: unknown tokens and empty values are dropped silently. The name's "
           "case does not matter, but <code>reclash-view</code> and <code>reclash-hex</code> "
           "parse by strict rules — see <a class=\"link\" href=\"#rules\">“Parsing rules”</a>.")),
    ]
    out.append(sec("delivery", t("Доставка и отладка", "Delivery and debugging"),
        "<p>" + t(
            "Самая частая проблема — заголовки правильные на источнике, но клиент "
            "их не видит. Начните с того, чтобы посмотреть, что реально уходит по "
            "сети:",
            "The most common problem is that the headers are right at the origin but "
            "the client never sees them. Start by looking at what actually goes over "
            "the wire:",
        ) + "</p>"
        + codeblock(curl_test, t("копировать", "copy"), t("готово", "copied"))
        + "<p>" + t(
            "В выводе должны быть ваши <code>reclash-*</code> и "
            "<code>subscription-userinfo</code>. Если их нет — дело в том, что между "
            "панелью и клиентом, а не в самих значениях.",
            "The output should carry your <code>reclash-*</code> and "
            "<code>subscription-userinfo</code>. If they are missing, the problem is "
            "between the panel and the client, not in the values themselves.",
        ) + "</p>"
        + '<dl class="deflist">'
        + "".join("<div><dt>" + esc(a) + "</dt><dd>" + b + "</dd></div>" for a, b in problems)
        + "</dl>"))

    # -- hwid -------------------------------------------------------------
    req_rows = [["<code>" + esc(n) + "</code>", esc(ru if L == 0 else en)]
                for n, ru, en in spec.HWID_REQUEST]
    res_rows = [["<code>" + esc(n) + "</code>", ru if L == 0 else en]
                for n, ru, en in spec.HWID_RESPONSE]
    out.append(sec("hwid", t("Устройства и HWID", "Devices and HWID"),
        "<p>" + t(
            "Если пользователь включил передачу идентификатора устройства, запрос "
            "подписки несёт несколько дополнительных заголовков. Они нужны, чтобы вы "
            "могли показать понятный список устройств и лимит по тарифу.",
            "When the user enables device-identifier sharing, the subscription request "
            "carries a few extra headers. They exist so you can show a sensible device "
            "list and a plan device limit.",
        ) + "</p>"
        + table([t("Заголовок запроса", "Request header"), t("Значение", "Value")], req_rows)
        + "<h3>" + esc(t("Ответ клиенту", "Responding to the client")) + "</h3>"
        + table([t("Заголовок ответа", "Response header"), t("Что покажет клиент", "What the client shows")], res_rows)))

    # -- checklist --------------------------------------------------------
    steps = t(
        [
            "Отдавайте <code>subscription-userinfo</code> — это самое заметное для пользователя.",
            "Добавьте <code>reclash-servicename</code> и логотип: панель перестаёт быть безымянной.",
            "Поставьте <code>reclash-supporturl</code> — меньше писем «куда писать».",
            "Выберите цвет через <code>reclash-hex</code> и проверьте его в живом превью "
            "<a class=\"link\" href=\"" + tool + "\">конструктора</a>.",
            "Проверьте ответ курлом: <code>curl -sI 'https://…/sub' | grep -i reclash</code>.",
            "Убедитесь, что заголовки доживают до клиента через ваш прокси и CDN.",
            "Не отправляйте <code>reclash-settings</code> без причины.",
        ],
        [
            "Send <code>subscription-userinfo</code> — it is the most visible thing to the user.",
            "Add <code>reclash-servicename</code> and a logo: the dashboard stops being nameless.",
            "Set <code>reclash-supporturl</code> — fewer “where do I write?” messages.",
            "Pick a colour via <code>reclash-hex</code> and check it in the live preview "
            "in the <a class=\"link\" href=\"" + tool + "\">builder</a>.",
            "Verify with curl: <code>curl -sI 'https://…/sub' | grep -i reclash</code>.",
            "Make sure the headers survive your reverse proxy and CDN.",
            "Do not send <code>reclash-settings</code> without a reason.",
        ],
    )
    out.append(sec("checklist", t("Чеклист внедрения", "Rollout checklist"),
        "<ol>" + "".join("<li>" + x + "</li>" for x in steps) + "</ol>"
        + '<p style="margin-top:var(--step-4)">' + t(
            'Первоисточник этой страницы — <a class="link link--cyan" href="%s" '
            'target="_blank" rel="noopener">PROVIDER_HEADERS.md</a> в репозитории. '
            "Если он разойдётся с этой страницей — прав репозиторий." % ui.HEADERS_SRC,
            'The source of truth for this page is <a class="link link--cyan" href="%s" '
            'target="_blank" rel="noopener">PROVIDER_HEADERS.md</a> in the repository. '
            "If the two ever disagree, the repository is right." % ui.HEADERS_SRC,
        ) + "</p>"))

    return '<div class="doc__body">' + "".join(out) + "</div>"


def render(ctx):
    """The documentation page (docs.html) — the narrative guide. Light: only
    docs.css and the shared core.js. The per-header catalogue is on
    reference.html; the builder on headers.html."""
    t = ctx.t
    body = "".join([
        '<section class="pagehead"><div class="shell">',
        '<p class="eyebrow">' + esc(t("Для провайдеров", "For providers")) + "</p>",
        "<h1>" + t("Документация по <span class=\"grad\">заголовкам</span>",
                   "Header <span class=\"grad\">documentation</span>") + "</h1>",
        '<p class="lede">' + esc(t(
            "Как ваша панель управляет оформлением клиента через обычные HTTP-заголовки "
            "ответа: механизм, правила разбора, совместимость, доставка через прокси и "
            "CDN, чеклист внедрения. Полный список заголовков — в справочнике.",
            "How your panel drives the client's presentation through plain HTTP response "
            "headers: the mechanism, the parsing rules, compatibility, delivery through a "
            "proxy and a CDN, a rollout checklist. The full header list is in the reference.",
        )) + "</p>",
        '<p class="pagehead__meta">',
        chip(t("гайд", "the guide")), chip(t("3 слоя", "3 layers")),
        chip(t("доставка", "delivery")), chip("HWID"),
        '<a class="chip chip--link" href="' + ctx.page("reference") + '">'
        + esc(t("Заголовки →", "Headers →")) + "</a>",
        '<a class="chip chip--link" href="' + ctx.page("headers") + '">'
        + esc(t("Конструктор →", "Builder →")) + "</a>",
        "</p></div></section>",
        '<section class="section"><div class="shell">',
        rubric("01", t("документация", "the guide")),
        '<div class="doc">' + toc(ctx) + doc_body(ctx) + "</div>",
        "</div></section>",
    ])
    return {
        "active": "docs",
        "title": t("Документация по заголовкам подписки",
                   "Subscription header documentation"),
        "description": t(
            "Документация по заголовкам ответа подписки для ReClash: как работает "
            "механизм, правила разбора, совместимость с FlClashX, доставка через "
            "прокси и CDN, HWID и чеклист внедрения.",
            "Documentation for ReClash subscription response headers: how the mechanism "
            "works, parsing rules, FlClashX compatibility, delivery through a proxy and "
            "CDN, HWID and a rollout checklist.",
        ),
        "body": body,
        "css": ("docs.css",),
    }
