"""Quick start, the deep-link builder and the FAQ."""

from . import ui
from .ui import esc, icon, brand_icon, rubric, chip, btn, codeblock, notice, table, json_block


def faq_item(uid, question, answer, open_=False):
    return (
        '<div class="faq__item">'
        '<button class="faq__q" type="button" aria-controls="%(id)s" '
        'aria-expanded="%(exp)s">'
        '<span class="faq__q__mark" aria-hidden="true"></span>'
        "<span>%(q)s</span></button>"
        '<div class="faq__a" id="%(id)s" data-open="%(exp)s">'
        '<div class="faq__a__inner"><div class="faq__a__body">%(a)s</div></div></div></div>'
        % {"id": uid, "exp": "true" if open_ else "false",
           "q": esc(question), "a": answer}
    )


def step(title, *blocks):
    # No spacer div for the number: .step draws it with ::before, and a
    # pseudo-element is itself a grid item — an extra child would push the
    # text into the 3.5rem number column on a second row.
    return "<div class=\"step\"><div><h3>%s</h3>%s</div></div>" % (
        esc(title), "".join(blocks)
    )


def p(text):
    return "<p>%s</p>" % text


# ------------------------------------------------------------------ sections


def section_hero(ctx):
    t = ctx.t
    return (
        '<section class="pagehead"><div class="shell">'
        '<p class="eyebrow">' + esc(t("Быстрый старт", "Quick start")) + "</p>"
        "<h1>"
        + t('От нуля до <span class="grad">трафика</span>',
            'Zero to <span class="grad">traffic</span>')
        + "</h1>"
        '<p class="lede">' + esc(t(
            "Четыре шага, конструктор ссылки-импорта и ответы на вопросы, которые "
            "чаще всего заканчиваются словами «а, вот оно что».",
            "Four steps, an import-link builder, and answers to the questions that "
            "most often end in “oh, that's what it was”.",
        )) + "</p>"
        '<p class="pagehead__meta">'
        + chip(t("~2 минуты", "~2 minutes")) + chip(t("Без регистрации", "No sign-up"))
        + chip("reclash://") + "</p></div></section>"
    )


def section_steps(ctx):
    t = ctx.t
    steps = [
        step(
            t("Установите клиент", "Install the client"),
            p(t(
                'Возьмите пакет для своей системы на странице '
                '<a class="link link--cyan" href="%s">загрузок</a>. Android — APK, '
                'Windows — установщик или портативный ZIP, macOS — DMG, Linux — '
                'AppImage, DEB или RPM.' % ctx.page("download"),
                'Grab the package for your system on the '
                '<a class="link link--cyan" href="%s">downloads</a> page. Android — APK, '
                'Windows — installer or portable ZIP, macOS — DMG, Linux — '
                'AppImage, DEB or RPM.' % ctx.page("download"),
            )),
            p('<span class="faint">' + t(
                "Проверьте SHA256 из релиза. Это тридцать секунд.",
                "Check the SHA256 from the release. It takes thirty seconds.",
            ) + "</span>"),
        ),
        step(
            t("Добавьте подписку", "Add a subscription"),
            p(t(
                "«Профили» → «Добавить» → вставьте URL подписки от вашего провайдера. "
                "ReClash сам подберёт формат, если сервер отдаёт разное в зависимости "
                "от <code>User-Agent</code>.",
                "“Profiles” → “Add” → paste the subscription URL from your provider. "
                "ReClash figures out the format itself when the server varies its answer "
                "by <code>User-Agent</code>.",
            )),
            notice("<span>" + t(
                "ReClash не продаёт доступ и не выдаёт подписки. Ссылку вы приносите свою.",
                "ReClash does not sell access and does not issue subscriptions. "
                "You bring your own link.",
            ) + "</span>", "notice--info"),
        ),
        step(
            t("Выберите узел и режим", "Pick a node and a mode"),
            p(t(
                "На странице «Прокси» выберите группу и узел. Прогоните тест задержки — "
                "он честнее, чем флаг страны.",
                "On the “Proxies” page pick a group and a node. Run the latency test — "
                "it is more honest than a country flag.",
            )),
            p(t(
                "Режим маршрутизации переключается на панели. <b>Авто</b> — режим по "
                "умолчанию: правила плюс умная маршрутизация, которая сама держит "
                "рабочий узел под текущую сеть. <b>По правилам</b> — то же без "
                "автоподбора. <b>Глобально</b> — всё в туннель. <b>Напрямую</b> — "
                "туннель выключен, но клиент остаётся в строю.",
                "The routing mode is switched on the dashboard. <b>Auto</b> is the "
                "default: rules plus smart routing, which keeps a working node for the "
                "current network on its own. <b>Rule</b> is the same without the "
                "auto-pick. <b>Global</b> sends everything down the tunnel. "
                "<b>Direct</b> switches the tunnel off while the client stays up.",
            )),
        ),
        step(
            t("Подключитесь", "Connect"),
            p(t(
                "<b>TUN/VPN</b> перехватывает трафик на сетевом уровне — работает для "
                "всего, включая приложения, которые игнорируют системный прокси. "
                "<b>Системный прокси</b> проще и не требует прав, но его слушают не все "
                "программы.",
                "<b>TUN/VPN</b> intercepts traffic at the network layer — it covers "
                "everything, including apps that ignore the system proxy. "
                "<b>System proxy</b> is simpler and needs no privileges, but not every "
                "program obeys it.",
            )),
            p('<span class="faint">' + t(
                "Если провайдер режет соединение по DPI — включите обход в настройках; "
                "он встроен и не требует отдельной программы.",
                "If your ISP throttles the handshake with DPI, switch the bypass on in "
                "settings; it is built in and needs no separate program.",
            ) + "</span>"),
        ),
    ]
    return (
        '<section class="section section--tight"><div class="shell">'
        + rubric("01", t("четыре шага", "four steps"))
        + '<h2 class="statement">'
        + t("Никаких аккаунтов. Только <em>ваша</em> ссылка.",
            "No accounts. Just <em>your</em> link.")
        + "</h2>"
        + '<div class="steps" style="margin-top:var(--step-4)">' + "".join(steps) + "</div>"
        + "</div></section>"
    )


def section_deeplink(ctx):
    t = ctx.t
    schemes = [
        ("reclash://connect",
         t("запустить туннель и подключиться", "start the tunnel and connect")),
        ("reclash://disconnect", t("остановить туннель", "stop the tunnel")),
        ("reclash://toggle",
         t("подключить, если остановлено, иначе отключить",
           "connect if stopped, disconnect if running")),
        ("reclash://open",
         t("вывести окно на передний план", "bring the window to the front")),
        ("reclash://close",
         t("свернуть в трей или выйти, если так настроено",
           "hide to tray, or exit when configured")),
        ("reclash://add/&lt;url&gt;",
         t("URL подписки — добавляется после подтверждения",
           "a subscription URL, added after confirmation")),
        ("reclash://import/&lt;base64&gt;",
         t("конфиг в base64 — импортируется как профиль",
           "a base64-encoded config, imported as a profile")),
        ("reclash://install-config?url=&lt;url&gt;",
         t("совместимая ссылка кнопок Clash и FlClash; "
           "необязательный &name= задаёт имя профиля",
           "the compat link Clash and FlClash buttons already use; "
           "an optional &name= sets the profile name")),
    ]
    rows = [["<code>%s</code>" % s, esc(d)] for s, d in schemes]
    return (
        '<section class="section"><div class="shell">'
        + rubric("02", t("ссылка-импорт", "the import link"))
        + '<div class="split">'
        + '<div><h2 class="statement">'
        + t("Одна ссылка — <em>и профиль внутри</em>.",
            "One link — <em>and the profile is in</em>.")
        + "</h2></div>"
        + '<div><p class="lede">' + esc(t(
            "Провайдеру не нужно объяснять пользователю, куда вставлять URL. "
            "Соберите ссылку здесь и положите её кнопкой в личном кабинете.",
            "A provider does not need to explain where to paste a URL. Build the link "
            "here and put it behind a button in your dashboard.",
        )) + "</p></div></div>"
        + ui.deeplink(ctx, "dl-start", style="margin-top:var(--step-4)")
        + '<p class="dl-note">' + esc(t(
            "Ссылка никуда не отправляется — она собирается прямо в вашем браузере.",
            "The link is not sent anywhere — it is assembled right in your browser.",
        )) + "</p>"
        + '<div style="margin-top:var(--step-4)">'
        + table([t("Схема", "Scheme"), t("Что делает", "What it does")], rows)
        + "</div>"
        + notice("<span>" + t(
            "Ссылки <code>add</code>, <code>import</code> и <code>install-config</code> "
            "несут доступ к вашему трафику. Открывайте только те, которым доверяете.",
            "<code>add</code>, <code>import</code> and <code>install-config</code> links "
            "carry access to your traffic. Only open the ones you trust.",
        ) + "</span>", "notice--warn")
        + "</div></section>"
    )


def section_faq(ctx):
    t = ctx.t
    items = faq_items(ctx)
    return (
        '<section class="section section--tight"><div class="shell">'
        + rubric("03", t("вопросы", "questions"))
        + '<h2 class="statement">'
        + t("Отвечаем <em>до</em> того, как вы спросите.",
            "Answered <em>before</em> you ask.")
        + "</h2>"
        + '<div class="faq" style="margin-top:var(--step-4)">'
        + "".join(faq_item(*i) for i in items)
        + "</div></div></section>"
    )


def faq_items(ctx):
    t = ctx.t
    items = [
        ("faq-what",
         t("Что такое ReClash и чем он не является?",
           "What is ReClash, and what is it not?"),
         t("<p>Это клиент для ядра mihomo: он берёт вашу подписку, маршрутизирует "
           "трафик по правилам и умеет обходить DPI. Это <b>не</b> VPN-сервис: "
           "ReClash не продаёт доступ, не выдаёт подписки и не рекомендует "
           "провайдеров. Сервер и ссылку вы приносите свои.</p>",
           "<p>It is a client for the mihomo core: it takes your subscription, routes "
           "traffic by rules and can bypass DPI. It is <b>not</b> a VPN service: "
           "ReClash does not sell access, does not issue subscriptions and does not "
           "recommend providers. You bring your own server and link.</p>"),
         True),
        ("faq-flclash",
         t("Чем это отличается от FlClash?", "How is this different from FlClash?"),
         t('<p>ReClash — форк <a class="link link--cyan" href="%s" target="_blank" '
           'rel="noopener">FlClash</a>. Основные добавления: умная маршрутизация, '
           "которая сама держит рабочий узел под текущую сеть, расширенный набор "
           "заголовков для провайдеров (тема, объявления, миграция домена), "
           "переработанная панель, импорт из большего числа форматов "
           "(в том числе Amnezia) и встроенный обход DPI. Ядро маршрутизации то "
           "же — mihomo.</p>"
           "<p>Проект не аффилирован с FlClash, mihomo или FlClashX.</p>"
           % ui.UPSTREAM_FLCLASH,
           '<p>ReClash is a fork of <a class="link link--cyan" href="%s" target="_blank" '
           'rel="noopener">FlClash</a>. The main additions: smart routing that keeps a '
           "working node for the current network on its own, a much larger provider "
           "header set (theme, announcements, domain migration), a reworked "
           "dashboard, import from more formats (Amnezia among them), and "
           "a built-in DPI bypass. The routing core is the same — mihomo.</p>"
           "<p>The project is not affiliated with FlClash, mihomo or FlClashX.</p>"
           % ui.UPSTREAM_FLCLASH),
         False),
        ("faq-smart",
         t("Что такое умная маршрутизация?", "What is smart routing?"),
         t("<p>Это режим «Авто»: клиент сам подбирает узел, который работает в вашей "
           "текущей сети, и переключается, когда сеть меняется, — не открывая окно. "
           "Начать проще с регионального пресета (Россия, Иран, Китай), а стратегию, "
           "проверки и маркеры можно донастроить.</p>"
           "<p>Обычные режимы никуда не делись: «Авто» — это те же правила плюс "
           "автоподбор, который можно выключить.</p>",
           "<p>It is the “Auto” mode: the client picks a node that works on your current "
           "network and switches on its own when the network changes — without opening "
           "the window. Start from a region preset (Russia, Iran, China); strategy, "
           "checks and markers can be fine-tuned.</p>"
           "<p>The plain modes are still there: “Auto” is the same rules plus an "
           "auto-pick you can switch off.</p>"),
         False),
        ("faq-dpi",
         t("Обход DPI — это то же самое, что VPN?",
           "Is the DPI bypass the same thing as a VPN?"),
         t("<p>Нет. Обход DPI работает <i>до</i> прокси: он разбивает и маскирует "
           "начало соединения так, чтобы оборудование провайдера не опознало его "
           "по сигнатуре и не оборвало. Трафик при этом всё равно идёт туда, куда "
           "вы его направили.</p>"
           "<p>Иногда обхода хватает и без прокси — например, когда сайт блокируют "
           "по SNI, а не по IP. Иногда нужен и прокси, и обход, чтобы соединение "
           "с прокси вообще установилось.</p>",
           "<p>No. The DPI bypass works <i>before</i> the proxy: it fragments and "
           "disguises the start of the connection so the ISP's equipment cannot match "
           "it against a signature and cut it. The traffic still goes wherever you "
           "pointed it.</p>"
           "<p>Sometimes the bypass alone is enough — when a site is blocked by SNI "
           "rather than by IP. Sometimes you need both, so that the connection to the "
           "proxy can be established at all.</p>"),
         False),
        ("faq-tun",
         t("TUN или системный прокси — что выбрать?",
           "TUN or system proxy — which one?"),
         t("<p><b>TUN/VPN</b> перехватывает трафик на сетевом уровне: покрывает всё, "
           "включая программы, которые про системный прокси не знают. Требует прав "
           "(на десктопе — администратора, на Android — разрешения VPN).</p>"
           "<p><b>Системный прокси</b> проще и не требует прав, но его слушают только "
           "те приложения, которые уважают настройки ОС. Игры, часть мессенджеров и "
           "многие CLI-утилиты — не слушают.</p>",
           "<p><b>TUN/VPN</b> intercepts traffic at the network layer: it covers "
           "everything, including programs that know nothing about a system proxy. "
           "It needs privileges (administrator on desktop, the VPN permission on "
           "Android).</p>"
           "<p><b>System proxy</b> is simpler and needs no privileges, but only apps "
           "that respect OS settings will use it. Games, some messengers and many CLI "
           "tools will not.</p>"),
         False),
        ("faq-logs",
         t("Что ReClash собирает обо мне?", "What does ReClash collect about me?"),
         t("<p>На десктопе — ничего: наружу клиент ходит только за вашей подпиской и, "
           "если вы не выключили проверку, за списком релизов на GitHub. Логи и "
           "статистика соединений остаются на устройстве и нужны для диагностики — их "
           "можно очистить в любой момент.</p>"
           "<p>На Android в сборку входит аналитика сбоев (Firebase Crashlytics). По "
           "умолчанию она выключена; включить можно вручную в настройках, о чём "
           "приложение предупреждает при первом запуске. Когда включена — отправляет "
           "данные об устройстве и детали сбоя, без личных данных, и отключается "
           "там же.</p>",
           "<p>On desktop, nothing: the client only reaches your subscription and, "
           "unless you turned the check off, the GitHub release list. Logs and "
           "connection statistics stay on the device for diagnostics — you can clear "
           "them at any time.</p>"
           "<p>On Android the build includes crash analytics (Firebase Crashlytics). "
           "It is off by default; you can turn it on in settings, and the app tells "
           "you about it on first launch. When on, it sends device information and "
           "crash details — no personal data — and can be turned off in the same "
           "place.</p>"),
         False),
        ("faq-hwid",
         t("Что за HWID и зачем он провайдеру?",
           "What is HWID and why would a provider want it?"),
         t("<p>Это стабильный 16-символьный хеш устройства, который клиент может "
           "приложить к запросу подписки, — чтобы провайдер показал вам понятный "
           "список ваших устройств и лимит по тарифу. Передача выключается в "
           "настройках.</p>"
           '<p>Провайдерам: подробности — на странице '
           '<a class="link link--cyan" href="%s#hwid">документации</a>.</p>'
           % ctx.page("docs"),
           "<p>It is a stable 16-character device hash the client can attach to the "
           "subscription request, so the provider can show you a readable list of your "
           "devices and your plan limit. Sharing it can be switched off in settings.</p>"
           '<p>For providers: the details are on the '
           '<a class="link link--cyan" href="%s#hwid">documentation</a>.</p>'
           % ctx.page("docs")),
         False),
        ("faq-theme",
         t("Почему приложение вдруг сменило цвет?",
           "Why did the app suddenly change colour?"),
         t("<p>Скорее всего, ваш провайдер прислал тему заголовком "
           "<code>ReClash-Hex</code> вместе с профилем. Тема привязана к активному "
           "профилю: переключите профиль — вернётся прежняя. Полностью отключить "
           "провайдерское оформление можно в настройках темы.</p>",
           "<p>Most likely your provider sent a theme in the <code>ReClash-Hex</code> "
           "header alongside the profile. The theme belongs to the active profile: "
           "switch profiles and the old one returns. Provider styling can be turned "
           "off entirely in the theme settings.</p>"),
         False),
        ("faq-provider",
         t("Я провайдер. Что мне нужно сделать?",
           "I am a provider. What do I need to do?"),
         t('<p>Ничего в клиенте — только добавить заголовки к ответу вашей подписки. '
           'Ни SDK, ни плагина, ни договорённости с нами. Соберите их '
           '<a class="link link--cyan" href="%s#tool">конструктором</a> и вставьте '
           "фрагмент в nginx, Caddy или ваш бэкенд.</p>"
           "<p>Минимум, который заметит пользователь: остаток трафика, имя сервиса и "
           "ссылка на поддержку.</p>" % ctx.page("builder"),
           '<p>Nothing in the client — just add headers to your subscription response. '
           "No SDK, no plugin, no agreement with us. Assemble them with the "
           '<a class="link link--cyan" href="%s#tool">builder</a> and paste the snippet '
           "into nginx, Caddy or your backend.</p>"
           "<p>The minimum a user will notice: remaining traffic, the service name and "
           "a support link.</p>" % ctx.page("builder")),
         False),
        ("faq-ios",
         t("Будет ли версия для iOS?", "Will there be an iOS version?"),
         t("<p>Сейчас нет. App Store не пускает клиенты такого рода без отдельной "
           "программы разработчика, а сторонняя установка на iOS — отдельная история.</p>",
           "<p>Not currently. The App Store does not admit clients of this kind without "
           "a separate developer programme, and sideloading on iOS is its own story.</p>"),
         False),
        ("faq-broken",
         t("Не подключается. С чего начать?", "It will not connect. Where do I start?"),
         t("<p>По порядку:</p><ol>"
           "<li>Обновите профиль — подписка могла протухнуть.</li>"
           "<li>Прогоните тест задержки: если все узлы «не отвечают», проблема между "
           "вами и провайдером, а не в правилах.</li>"
           "<li>Переключитесь в режим «Глобально»: если заработало — дело в правилах "
           "маршрутизации.</li>"
           "<li>Включите обход DPI: провайдер может резать сам handshake.</li>"
           "<li>Загляните в «Логи». Там обычно написано прямым текстом.</li>"
           "</ol>"
           '<p>Не помогло — <a class="link link--cyan" href="%s" target="_blank" '
           'rel="noopener">откройте issue</a>. И вычистите ссылку подписки из логов '
           "перед отправкой: в ней ваши учётные данные.</p>" % ui.GITHUB_ISSUES,
           "<p>In order:</p><ol>"
           "<li>Refresh the profile — the subscription may have gone stale.</li>"
           "<li>Run the latency test: if every node is unreachable, the problem is "
           "between you and the provider, not in the rules.</li>"
           "<li>Switch to Global mode: if it starts working, the routing rules are "
           "the cause.</li>"
           "<li>Turn the DPI bypass on: your ISP may be cutting the handshake itself.</li>"
           "<li>Open “Logs”. It usually says so in plain words.</li>"
           "</ol>"
           '<p>Still stuck — <a class="link link--cyan" href="%s" target="_blank" '
           'rel="noopener">open an issue</a>. And scrub the subscription URL out of the '
           "logs before you post them: it carries your credentials.</p>" % ui.GITHUB_ISSUES),
         False),
    ]
    return items


def section_help(ctx):
    t = ctx.t
    return (
        '<section class="section"><div class="shell">'
        + rubric("04", t("если что", "if all else fails"))
        + '<div class="row gap-2" style="flex-wrap:wrap;margin-top:var(--step-3)">'
        + btn(ui.GITHUB_ISSUES, t("Баг-трекер", "Issue tracker"),
              "btn--lg", "wrench", True)
        + btn(ui.TELEGRAM, "Telegram", "btn--lg btn--ghost", "link", True)
        + btn(ctx.page("builder"), t("Заголовки", "Headers"),
              "btn--lg btn--ghost", "book")
        + "</div>"
        + '<p class="dl-note" style="margin-top:var(--step-3)">' + esc(t(
            "Перед отправкой логов удалите из них ссылку подписки — в ней ваши "
            "учётные данные.",
            "Before posting logs, remove the subscription URL from them — it carries "
            "your credentials.",
        )) + "</p>"
        + "</div></section>"
    )


def render(ctx):
    t = ctx.t
    body = "".join([
        section_hero(ctx),
        section_steps(ctx),
        section_deeplink(ctx),
        section_faq(ctx),
        section_help(ctx),
    ])
    return {
        "active": "start",
        "title": t("Быстрый старт и FAQ", "Quick start & FAQ"),
        "description": t(
            "Как запустить ReClash за четыре шага, чем TUN отличается от системного "
            "прокси и что делает обход DPI.",
            "How to get ReClash running in four steps, how TUN differs from a system "
            "proxy, and what the DPI bypass does.",
        ),
        "body": body,
        "css": ("docs.css",),
        "js": (),
        # Feed the FAQ into a Schema.org FAQPage so search and AI answer engines
        # can lift the questions and answers directly — same source as the page.
        "faq": [(q, a) for _uid, q, a, _open in faq_items(ctx)],
    }
