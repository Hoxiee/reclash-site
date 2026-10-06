"""Provider header reference + the interactive header builder."""

from . import spec, ui, remnawave
from .ui import esc, icon, mark, rubric, chip, btn, codeblock, notice, table, json_block


# --------------------------------------------------------------- primitives


def sig(name, *tags):
    body = "<code>" + esc(name) + "</code>"
    for text, alias in tags:
        body += '<span class="tag%s">%s</span>' % (
            " tag--alias" if alias else "",
            esc(text),
        )
    return '<div class="sig">' + body + "</div>"


def fld(fid, label, control, hint="", cls=""):
    return (
        '<div class="field ' + cls + '">'
        '<label for="' + fid + '">' + label + "</label>"
        + control
        + ('<small>' + hint + "</small>" if hint else "")
        + "</div>"
    )


def txt(fid, placeholder="", kind="text", extra=""):
    return (
        '<input type="' + kind + '" id="' + fid + '" name="' + fid + '" '
        'placeholder="' + esc(placeholder) + '" ' + extra + " autocomplete=\"off\" spellcheck=\"false\">"
    )


def area(fid, placeholder="", rows=2):
    return (
        '<textarea id="' + fid + '" name="' + fid + '" rows="' + str(rows) + '" '
        'placeholder="' + esc(placeholder) + '" spellcheck="false"></textarea>'
    )


def sel(fid, options, value=""):
    opts = "".join(
        '<option value="%s"%s>%s</option>'
        % (esc(v), " selected" if v == value else "", esc(label))
        for v, label in options
    )
    return '<select id="' + fid + '" name="' + fid + '">' + opts + "</select>"


def chk(fid, label, checked=False, attr=""):
    return (
        '<label class="check"><input type="checkbox" '
        + ('id="' + fid + '" name="' + fid + '" ' if fid else "")
        + attr
        + (" checked" if checked else "")
        + "><span>"
        + label
        + "</span></label>"
    )


def group(num, title, headers, body, open_=False):
    """One collapsible block of the builder form.

    A button toggles the block; the answer lives in a grid wrapper that
    animates 0fr -> 1fr, the same trick the FAQ uses, so opening and closing
    glide instead of snapping. builder.js keeps one block open at a time and
    drives the animation on both sides; without it the .no-js rule leaves every
    block open, so a plain button still reveals everything.

    The button carries the header names the block emits, so a shut block still
    says what is inside it, and data-group carries the block number to
    builder.js, which sets data-active whenever the block is emitting headers —
    a shut, filled block wears an accent rail and a live dot."""
    uid = "bgroup-" + esc(num)
    return (
        '<div class="bgroup" data-group="' + esc(num) + '"'
        + (' data-open="true"' if open_ else ' data-open="false"') + ">"
        '<button class="bgroup__sum" type="button" aria-controls="' + uid + '"'
        ' aria-expanded="' + ("true" if open_ else "false") + '">'
        '<span class="bgroup__num mono">' + esc(num) + "</span>"
        '<span class="bgroup__dot" aria-hidden="true"></span>'
        '<span class="bgroup__ttl">' + esc(title) + "</span>"
        '<span class="bgroup__hdrs mono">' + esc(headers) + "</span>"
        '<span class="bgroup__chev" aria-hidden="true">'
        '<svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></span>'
        "</button>"
        '<div class="bgroup__reveal" id="' + uid + '">'
        '<div class="bgroup__clip">'
        '<fieldset class="bgroup__body">'
        '<legend class="visually-hidden">' + esc(num + " " + title) + "</legend>"
        + body
        + "</fieldset></div></div></div>"
    )


def grid(*fields):
    """Two or three short fields on one line instead of one per row."""
    return '<div class="fgrid">' + "".join(fields) + "</div>"


def rule():
    return '<hr class="fsep">'


# ------------------------------------------------------------------ builder

# What ReClash itself falls back to, so an untouched form emits nothing surprising.
VIEW_DEFAULT = {
    "type": "tab",
    "sort": "default",
    "layout": "standard",
    "icon": "standard",
    "card": "expand",
}



def builder_strings(ctx):
    t = ctx.t
    base = {
        "f_up": "12.5", "f_down": "78.2", "f_total": "200", "f_expire": "2026-12-31",
        "f_title": "", "f_svcname": "", "f_activetext": "", "f_logo": "",
        "f_serverinfo": "",
        "f_support": "", "f_report": "", "f_webpage": "",
        "f_buyplan": "", "f_buytraffic": "",
        "f_announce": "", "f_announceurl": "", "f_interval": "",
        "f_expiredays": "", "f_trafficpercent": "",
        "f_hex": "7C5CFF", "f_variant": "tonalspot",
        "f_bgurl": "", "f_bgop": "10",
        "f_ring1": "7C5CFF", "f_ring2": "3686ED", "f_ring3": "2FD3B6",
        "f_view_type": "tab", "f_view_sort": "default", "f_view_layout": "standard",
        "f_view_icon": "standard", "f_view_card": "expand",
        "f_custom": "", "f_newdomain": "", "f_fallback": "",
        "f_svcname_b64": 0, "f_announce_b64": 0,
        "f_theme": 0, "f_pureblack": 0, "f_bg": 0, "f_ring": 0, "f_heroeffect": 0,
        "f_view": 0,
        "f_widgets": 0, "f_settings": 0, "f_aliases": 0,
    }

    def preset(**over):
        d = dict(base)
        d.update(over)
        return d

    minimal = preset(
        f_title=t("Тариф «Орбита»", "Orbit plan"),
        f_svcname="Nebula VPN",
        f_support="https://nebula.example/help",
    )
    brand = preset(
        f_title=t("Тариф «Орбита»", "Orbit plan"),
        f_svcname="Nebula VPN",
        f_activetext=t("Nebula на связи", "Nebula has you covered"),
        f_logo="https://nebula.example/logo-512.png",
        f_serverinfo="Auto",
        f_support="https://nebula.example/help",
        f_buyplan="https://nebula.example/billing",
        f_theme=1, f_hex="2FD3B6", f_variant="vibrant",
        f_ring=1,
        f_widgets=1,
        f_interval="60",
        widgets=["serviceInfo", "networkSpeed", "trafficUsage",
                 "changeServerButton"],
    )
    full = preset(
        f_title=t("Тариф «Орбита»", "Orbit plan"),
        f_svcname="Nebula VPN",
        f_activetext=t("Nebula на связи", "Nebula has you covered"),
        f_logo="https://nebula.example/logo-512.png",
        f_serverinfo="Auto",
        f_support="https://nebula.example/help",
        f_report="https://nebula.example/report",
        f_webpage="https://nebula.example/account",
        f_buyplan="https://nebula.example/billing",
        f_buytraffic="https://nebula.example/billing/traffic",
        f_announce=t(
            "Профилактика на узлах DE 14 апреля, 02:00–04:00 МСК.",
            "Maintenance on the DE nodes on 14 April, 02:00–04:00 UTC.",
        ),
        f_announceurl="https://nebula.example/status",
        f_interval="60",
        f_expiredays="7,3,1",
        f_trafficpercent="80,95",
        f_theme=1, f_hex="7C5CFF", f_variant="expressive", f_pureblack=1,
        f_bg=1, f_bgurl="https://nebula.example/bg.webp", f_bgop="14",
        f_ring=1, f_heroeffect=1,
        f_view=1, f_view_sort="delay", f_view_layout="tight", f_view_card="shrink",
        f_widgets=1, f_custom="update",
        f_settings=1,
        f_fallback="sub2.nebula.example, sub3.nebula.example",
        f_aliases=1,
        widgets=["announce", "metaInfo", "serviceInfo", "networkSpeed",
                 "trafficUsage", "networkDetection",
                 "smartRouting", "changeServerButton"],
    )

    return {
        "countLabel": t("{n} {H} · {b} {B}", "{n} {H} · {b} {B}"),
        # one|few|many for Russian, one|other for English — see plural() in builder.js
        "plBytes": t("байт|байта|байт", "byte|bytes"),
        "plDays": t("день|дня|дней", "day|days"),
        "plHeaders": t("заголовок|заголовка|заголовков", "header|headers"),
        "defService": t("Ваш сервис", "Your service"),
        # network_detection.dart, the connection doctor's verdict when it
        # has seen real traffic go through and come back — doctorHealthyTitle,
        # trimmed to the one word a half-width tile has room for.
        "detectOk": t("Исправно", "Healthy"),
        "errCreds": t("логин и пароль в URL недопустимы",
                      "credentials in the URL are not allowed"),
        "errDomain": t("только хост и необязательный порт — без схемы и пути",
                       "hostname and optional port only — no scheme, no path"),
        "errExpireDays": t("дни — целые больше нуля через запятую",
                           "days must be positive integers, comma-separated"),
        "errFallbackPort": t("запасные хосты указываются без портов",
                             "fallback hosts must not carry ports"),
        "errHex": t("нужен RRGGBB или AARRGGBB", "expected RRGGBB or AARRGGBB"),
        "errHttps": t("нужен абсолютный HTTPS-адрес", "an absolute HTTPS URL is required"),
        "errInterval": t("интервал — целое число больше нуля",
                         "the interval must be a positive integer"),
        "errOpacity": t("прозрачность — целое от 1 до 100",
                        "opacity must be an integer from 1 to 100"),
        "errRing": t("кольцу нужны ровно три цвета RRGGBB",
                     "the ring needs exactly three RRGGBB colours"),
        "errTrafficPercent": t("проценты — целые 1–100 через запятую",
                               "percents must be integers 1–100, comma-separated"),
        "errUrl": t(
            "не похоже на URL — клиент не сможет разобрать адрес и заголовок уйдёт пустым",
            "this does not parse as a URL — the client cannot read the address and "
            "the header will go out empty",
        ),
        # _QuickSwitchCard opens a sheet of them; the tile itself just says
        # what the switch beside it is for.
        "options": t("Опции", "Options"),
        "grpAuto": t("Авто", "Auto"),
        "grpStreaming": t("Стриминг", "Streaming"),
        "grpDirect": t("Прямой доступ", "Direct"),
        # The connection screen, word for word as the application sets it:
        # lib/l10n/intl/messages_{ru,en}.dart. A preview that paraphrased the
        # client would be a mock-up of a different app.
        "heroDur": t("12 минут", "12 minutes"),
        "heroFree": t("свободно из {n}", "free of {n}"),
        "heroMore": t("Показать сведения о подписке", "Show subscription details"),
        # The disconnected orb, word for word from hero_connect_orb_slot.dart:
        # the caption when nothing is running yet and the app is waiting for a
        # tap. Tapping the orb in the preview flips it to the connected state.
        "heroNotProtected": t("Вы не защищены", "Not protected"),
        "heroTapToConnect": t("Нажмите, чтобы включить защиту",
                              "Tap to turn protection on"),
        "heroPause": t("Пауза", "Pause"),
        "heroProtected": t("Вы защищены", "You are protected"),
        "heroRemaining": t("Осталось", "Remaining"),
        "heroRenew": t("Продлить подписку", "Renew subscription"),
        "heroSince": t("Подключено {n}", "Connected {n}"),
        "heroSmart": t("Умная маршрутизация включена", "Smart routing is on"),
        # hero_routing.dart, the not-flowing branch of heroServiceLineViewOf:
        # the engine is on but no tunnel is carrying traffic yet, so the line
        # is muted with an hourglass rather than accented with a bolt.
        "smartRoutingWaitingTunnel": t(
            "Умная маршрутизация включена · ждёт туннель",
            "Smart routing is on · waiting for the tunnel"),
        "heroTopUp": t("Докупить трафик", "Top up traffic"),
        "heroUnlimited": t("без ограничений", "unlimited"),
        "heroUpdate": t("Обновить", "Update"),
        # The download/upload pair the orb shows once connected
        # (hero_connect_orb_slot.dart). A preview has no live throughput, so it
        # stands in with one plausible sample; the unit stays as the client
        # prints it — "${unit}/s" — rather than being localised.
        "heroDownVal": "8.4",
        "heroUpVal": "1.2",
        "heroSpeedUnit": t("МБ/с", "MB/s"),
        # meta_info.dart: the subscription tile's status line. {n} is the
        # number of days and {D} its noun — daysLeft() in the client is an
        # ICU plural, and plural() here is the same rule spelled out.
        "metaDays": t("{n} {D}", "{n} {D} left"),
        "metaPerpetual": t("Бессрочная подписка", "Perpetual subscription"),
        "metaRemaining": t("Осталось", "Remaining"),
        "metaUsed": t("Использовано", "Used traffic"),
        "lblAnnounceUrl": t("Ссылка объявления", "Announcement link"),
        "lblBg": t("Фон", "Background"),
        "lblBuyPlan": t("Тариф", "Plan"),
        "lblBuyTraffic": t("Трафик", "Traffic"),
        "lblLogo": t("Логотип", "Logo"),
        "lblReport": t("Сообщить о проблеме", "Report a problem"),
        "lblSupport": t("Поддержка", "Support"),
        "lblWebpage": t("Личный кабинет", "Account page"),
        "linkCopied": t("Ссылка скопирована", "Link copied"),
        "moveDown": t("Переместить ниже", "Move down"),
        "moveUp": t("Переместить выше", "Move up"),
        "noWidgets": t("Виджеты не выбраны", "No widgets selected"),
        "proxies": t("Прокси", "Proxies"),
        "support": t("Поддержка", "Support"),
        # "Системный прокси" is the client's own label and it does not fit
        # four of eight columns; the tile is labelled by the shorter half.
        "sysProxy": t("Прокси ОС", "System proxy"),
        "sniPath": t(
            "Префикс пути подписки. У Marzban и 3x-ui это /sub/<токен>, "
            "у Marzneshin — /sub/<логин>/<ключ>, у Remnawave — /api/sub/<id>. "
            "Точное совпадение (location = /sub) не поймает ни один из них.",
            "The subscription path prefix. Marzban and 3x-ui serve /sub/<token>, "
            "Marzneshin /sub/<user>/<key>, Remnawave /api/sub/<id>. "
            "An exact match (location = /sub) catches none of them.",
        ),
        "sniHide": t(
            "Панель уже отдаёт эти заголовки сама, а add_header не заменяет, "
            "а добавляет: без proxy_hide_header клиент получит два значения.",
            "The panel already sends these itself, and add_header appends rather "
            "than replaces: without proxy_hide_header the client gets two values.",
        ),
        "sniAdd": t(
            "add_header внутри location отменяет все add_header уровня server — "
            "если там были свои, перенесите их сюда.",
            "add_header inside a location cancels every add_header at the server "
            "level — if you had any there, repeat them here.",
        ),
        "sniPort": t(
            "Порт вашей панели: Marzban и Marzneshin — 8000, Remnawave — 3000, "
            "3x-ui — 2053.",
            "Your panel's port: Marzban and Marzneshin use 8000, Remnawave 3000, "
            "3x-ui 2053.",
        ),
        "sniCaddyPath": t(
            "Префикс пути подписки — /sub* ловит и /sub/<токен>. "
            "header в Caddy заменяет значение, дублей не будет.",
            "The subscription path prefix — /sub* also catches /sub/<token>. "
            "Caddy's header directive replaces, so nothing is duplicated.",
        ),
        "sniUserinfo": t(
            "subscription-userinfo эмитит панель или ваш бэкенд — свой для "
            "каждого пользователя. Ниже только пример формата: не прописывайте "
            "его статикой, иначе всем выдадите одну квоту.",
            "subscription-userinfo is emitted by the panel or your backend, one "
            "per user. The line below is only the format example — do not "
            "hardcode it, or every user gets the same quota.",
        ),
        "warnAnnounceLong": t(
            "Объявление длиннее 180 символов — на телефоне его обрежет.",
            "The announcement is longer than 180 characters — phones will clip it.",
        ),
        "warnAnnounceNl": t(
            "Переносы строк схлопнуты в пробелы: объявление показывается одной строкой.",
            "Line breaks were collapsed into spaces — the announcement renders as one line.",
        ),
        "warnEmpty": t(
            "Пока ни одного заголовка — панель отдаст подписку без вашего оформления. "
            "Включите хотя бы один блок слева.",
            "No headers yet — the panel will serve the subscription with none of your "
            "branding. Switch on at least one block on the left.",
        ),
        "warnFallbackMax": t(
            "Клиент возьмёт только первые четыре запасных хоста.",
            "The client keeps only the first four fallback hosts.",
        ),
        "warnIntervalSmall": t(
            "Интервал меньше 10 минут — лишняя нагрузка на ваш сервер.",
            "An interval under 10 minutes puts needless load on your server.",
        ),
        "warnLogoExt": t(
            "У логотипа нет расширения картинки — проверьте, что отдаётся PNG или SVG.",
            "The logo URL has no image extension — check that it serves PNG or SVG.",
        ),
        "warnMarkup": t(
            "В объявлении есть < или > — разметка не отрисовывается, покажется как текст.",
            "The announcement contains < or > — markup is not rendered, it shows as text.",
        ),
        "warnOneline": t(
            "card:oneline экономит место, но прячет задержку на узких экранах.",
            "card:oneline saves room but hides latency on narrow screens.",
        ),
        "warnQuotaRange": t(
            "Значение трафика не помещается в счётчик: обрезано до 8 ПиБ. "
            "Выше этого числа байты перестают считаться целыми и заголовок "
            "уходит клиенту как 1e+21 — такой он не прочитает.",
            "A traffic value that large does not fit the counter: clamped to 8 PiB. "
            "Above that, bytes stop being whole numbers and the header reaches the "
            "client as 1e+21, which it cannot read.",
        ),
        "warnOverQuota": t(
            "upload + download больше total — клиент покажет отрицательный остаток.",
            "upload + download exceeds total — the client will show a negative balance.",
        ),
        "warnPlatform": t(
            "Эти виджеты есть не на всех платформах: {n}. На остальных они просто не появятся.",
            "These widgets are not on every platform: {n}. Elsewhere they simply do not appear.",
        ),
        "warnSettings": t(
            "ReClash-Settings применяется только при первом добавлении профиля.",
            "ReClash-Settings applies only when the profile is first added.",
        ),
        "wAnnounce": t("Объявление", "Announcement"),
        # The client says "Сменить сервер" here, but four of the handset's
        # eight columns hold about nine characters next to the icon and the
        # chevron, so the tile is labelled by its subject instead of by its
        # verb. The checkbox in the form above still spells it out in full.
        "wChangeServer": t("Сервер", "Server"),
        # The client says "Проверка сети"; a half-width tile holds about
        # nine characters next to a flag and a chevron, so the tile is
        # labelled by its subject. Same trade as wChangeServer.
        "wDetect": t("Сеть", "Network"),
        "wIntranet": t("Внутренний IP", "Intranet IP"),
        "wMemory": t("Память", "Memory info"),
        # metaInfo is the subscription card — event_available, the plan's
        # remaining days, its quota bar — and not, as the name suggests,
        # anything about the core.
        "wMeta": t("Подписка", "Subscription"),
        "wSmart": t("Маршрут", "Routing"),
        "wNetworkSpeed": t("Скорость", "Speed"),
        "wOutbound": t("Режим", "Mode"),
        "wService": t("Сервис", "Service"),
        "wTraffic": t("Трафик", "Traffic"),
        # The live-feed and resource tiles are labelled exactly as the client
        # labels them — DashboardInfoCard/FeedCard ellipsize a long head on one
        # line, so the subject-only shortening the tiles above needed does not
        # apply here.
        "wGoroutine": t("Горутины", "Goroutines"),
        "wConnections": t("Соединения", "Connections"),
        "wDns": t("DNS-запросы", "DNS queries"),
        "wRequests": t("Запросы", "Requests"),
        # run_time.dart labels the uptime tile with the "Start" string.
        "wRunTime": t("Старт", "Start"),
        "wProxyGroups": t("Группа прокси", "Proxy group"),
        "wProfiles": t("Профили", "Profiles"),
        "wOverrideDns": t("Переопределить DNS", "Override DNS"),
        "wServiceStatus": t("Статус сервисов", "Service status"),
        # The only verdict the preview paints; service_status.dart colours
        # "available" with the success role.
        "svcAvailable": t("Доступен", "Available"),
        "undo": t("Вернуть как было", "Undo"),
        "undoHint": t("Отменить пресет «{n}» и вернуть прежние значения полей",
                      "Undo the \u201c{n}\u201d preset and bring the old values back"),
        "presets": {"minimal": minimal, "brand": brand, "full": full},
    }


def builder_form(ctx):
    t = ctx.t
    L = 0 if ctx.lang == "ru" else 1

    # --- 01 subscription --------------------------------------------------
    # Subscription-Userinfo is not a header the provider sets here: the panel
    # (Remnawave) or the provider's own backend emits it per user from the real
    # plan. So the block opens with a note saying so, and the quota fields below
    # only feed the live preview's subscription card and the commented example
    # in the self-host snippets.
    g_sub = (
        '<p class="bnote">'
        + t("<code>subscription-userinfo</code> панель отдаёт сама — "
            "Remnawave и другие бэкенды считают трафик и срок для каждого "
            "пользователя. Здесь эти цифры только рисуют карточку подписки в "
            "превью; в реальный заголовок их подставит панель.",
            "<code>subscription-userinfo</code> is emitted by the panel itself "
            "— Remnawave and other backends compute traffic and expiry per "
            "user. Here these numbers only draw the subscription card in the "
            "preview; the panel fills the real header.")
        + "</p>"
        + grid(
            fld("f_up", esc(t("Отдано, ГБ", "Uploaded, GB")),
                txt("f_up", "12.5", "number",
                    'min="0" max="8388608" step="0.01" value="12.5"')),
            fld("f_down", esc(t("Принято, ГБ", "Downloaded, GB")),
                txt("f_down", "78.2", "number",
                    'min="0" max="8388608" step="0.01" value="78.2"')),
            fld("f_total", esc(t("Лимит, ГБ", "Quota, GB")),
                txt("f_total", "200", "number",
                    'min="0" max="8388608" step="0.01" value="200"'),
                esc(t("0 — без ограничений", "0 means unlimited"))),
            fld("f_expire", esc(t("Истекает", "Expires")),
                txt("f_expire", "", "date", 'value="2026-12-31"'),
                esc(t("даёт плашку «Осталось N дней»", "drives the “N days left” pill"))),
        )
        + fld("f_interval", esc(t("Интервал обновления, мин", "Update interval, min")),
              txt("f_interval", "60", "number", 'min="1" step="1"'),
              esc(t("ReClash считает минуты, псевдонимы — часы.",
                    "ReClash counts minutes; the aliases count hours.")))
        + grid(
            fld("f_expiredays", esc(t("Напоминания об окончании, дней",
                                      "Expiry reminders, days")),
                txt("f_expiredays", "7,3,1"),
                esc(t("Через запятую; по умолчанию 3,2,1.",
                      "Comma-separated; default 3,2,1."))),
            fld("f_trafficpercent", esc(t("Напоминания о трафике, %",
                                          "Traffic reminders, %")),
                txt("f_trafficpercent", "80,95"),
                esc(t("Через запятую; по умолчанию 90.",
                      "Comma-separated; default 90."))),
        )
    )

    # --- 02 service -------------------------------------------------------
    g_service = (
        grid(
            fld("f_svcname", esc(t("Имя сервиса", "Service name")),
                txt("f_svcname", "Nebula VPN")),
            fld("f_title", esc(t("Имя профиля", "Profile name")),
                txt("f_title", t("Тариф «Орбита»", "Orbit plan"))),
        )
        + chk("f_svcname_b64", esc(t("Всегда кодировать имя в Base64",
                                     "Always Base64-encode the name")))
        + fld("f_activetext", esc(t("Надпись на экране подключения",
                                    "Connection-screen headline")),
              txt("f_activetext", t("Nebula на связи", "Nebula has you covered")),
              esc(t("Пусто — приложение напишет «Вы защищены».",
                    "Left empty, the app writes “You are protected”.")))
        + fld("f_logo", esc(t("Логотип, URL", "Logo URL")),
              txt("f_logo", "https://nebula.example/logo-512.png", "url"),
              esc(t("Квадратный PNG или SVG, 256–512 px. Встаёт в центр кольца.",
                    "Square PNG or SVG, 256–512 px. It goes in the middle of the ring.")))
        + fld("f_serverinfo", esc(t("Группа активного сервера", "Active-server group")),
              txt("f_serverinfo", "Auto"),
              esc(t("Имя прокси-группы из вашего конфига.",
                    "A proxy-group name from your own config.")))
    )

    # --- 03 links and announcement ---------------------------------------
    g_links = (
        fld("f_support", esc(t("Поддержка", "Support")),
            txt("f_support", "https://nebula.example/help", "url"),
            esc(t("Даёт кнопку «Поддержка» в ряду действий.",
                  "Adds the Support chip to the action row.")))
        + fld("f_report", esc(t("Сообщить о проблеме", "Report a problem")),
              txt("f_report", "https://nebula.example/report", "url"),
              esc(t("Кнопка «Сообщить о проблеме» на карточке подписки.",
                    "Adds the “Report a problem” action to the subscription.")))
        + fld("f_webpage", esc(t("Личный кабинет", "Account page")),
              txt("f_webpage", "https://nebula.example/account", "url"),
              esc(t("Читается и из profile-web-page-url, который шлют marzban и 3x-ui.",
                    "Also read from profile-web-page-url, which marzban and 3x-ui send.")))
        + grid(
            fld("f_buyplan", esc(t("Продление тарифа", "Renew plan")),
                txt("f_buyplan", "https://nebula.example/billing", "url")),
            fld("f_buytraffic", esc(t("Покупка трафика", "Buy traffic")),
                txt("f_buytraffic", "https://nebula.example/billing/traffic", "url")),
        )
        + fld("f_announce", esc(t("Объявление", "Announcement")),
              area("f_announce", t("Профилактика 14 апреля, 02:00–04:00 МСК.",
                                   "Maintenance on 14 April, 02:00–04:00 UTC.")),
              esc(t("Одна строка, до 180 символов, без разметки.",
                    "One line, up to 180 characters, no markup.")))
        + chk("f_announce_b64", esc(t("Всегда кодировать объявление в Base64",
                                      "Always Base64-encode the announcement")))
        + fld("f_announceurl", esc(t("Ссылка объявления", "Announcement link")),
              txt("f_announceurl", "https://nebula.example/status", "url"),
              esc(t("Делает объявление ссылкой вместо кнопки «Закрыть».",
                    "Turns the announcement into a link instead of the dismiss button.")))
    )

    # --- 04 theme + ring --------------------------------------------------
    variants = [(v, v + " — " + (ru if L == 0 else en))
                for v, ru, en in spec.THEME_VARIANTS]
    g_theme = (
        chk("f_theme", esc(t("Задавать тему приложения", "Set the application theme")), True)
        + grid(
            fld("f_hex", esc(t("Цвет", "Colour")),
                txt("f_hex", "7C5CFF", "text", 'value="7C5CFF" maxlength="9"'),
                esc("RRGGBB / AARRGGBB")),
            fld("f_variant", esc(t("Вариант палитры", "Palette variant")),
                sel("f_variant", variants, "tonalspot")),
        )
        + chk("f_pureblack", esc(t("Чёрный фон (pureblack)", "Pure-black surfaces (pureblack)")))
        + rule()
        + chk("f_ring", esc(t("Кольцо подключения — три цвета градиента",
                              "Connection ring — three gradient stops")), True)
        + grid(
            fld("f_ring1", esc(t("Стоп 1", "Stop 1")),
                txt("f_ring1", "7C5CFF", "text", 'value="7C5CFF" maxlength="9"')),
            fld("f_ring2", esc(t("Стоп 2", "Stop 2")),
                txt("f_ring2", "3686ED", "text", 'value="3686ED" maxlength="9"')),
            fld("f_ring3", esc(t("Стоп 3", "Stop 3")),
                txt("f_ring3", "2FD3B6", "text", 'value="2FD3B6" maxlength="9"')),
        )
        + chk("f_heroeffect", esc(t("Живой эффект за кольцом — aurora",
                                    "Living effect behind the ring — aurora")))
        + '<p class="preview-note preview-note--left">' + esc(t(
            "Превью — приближение схемы Material: точные оттенки считает само приложение.",
            "The preview approximates the Material scheme — exact tones are computed by the app.",
        )) + "</p>"
    )

    # --- 05 background ----------------------------------------------------
    g_bg = (
        chk("f_bg", esc(t("Фон панели", "Dashboard background")))
        + grid(
            fld("f_bgurl", esc(t("Картинка, URL", "Image URL")),
                txt("f_bgurl", "https://nebula.example/bg.webp", "url")),
            fld("f_bgop", esc(t("Непрозрачность, 1–100", "Opacity, 1–100")),
                txt("f_bgop", "10", "number", 'min="1" max="100" step="1" value="10"'),
                esc(t("выше 25 текст тонет", "above 25 the text drowns"))),
        )
    )

    # --- 06 widgets -------------------------------------------------------
    g_widgets = (
        chk("f_widgets", esc(t("Предлагать набор виджетов", "Suggest a widget set")), True)
        + '<div class="orderlist-box">'
        '<div class="orderlist" id="widget-order" data-fade="end"></div></div>'
        + fld("f_custom", esc(t("Слияние с пользовательским набором",
                                "Merge with the user's own set")),
              sel("f_custom", [
                  ("", t("не отправлять ReClash-Custom", "do not send ReClash-Custom")),
                  ("add", "add — " + t("добавить недостающие", "append what is missing")),
                  ("update", "update — " + t("заменить набор целиком", "replace the whole set")),
              ]))
    )

    # --- 07 proxy view ----------------------------------------------------
    view_rows = ""
    for name, values, ru, en in spec.VIEW_TOKENS:
        view_rows += fld(
            "f_view_" + name,
            esc(ru if L == 0 else en) + ' <span class="mono faint">' + name + "</span>",
            sel("f_view_" + name, [(v, v) for v in values], VIEW_DEFAULT[name]),
        )
    g_view = (
        chk("f_view", esc(t("Предлагать вид страницы прокси",
                            "Suggest the proxy-page presentation")))
        + '<div class="fgrid fgrid--tight">' + view_rows + "</div>"
    )

    # --- 08 defaults ------------------------------------------------------
    settings_boxes = "".join(
        chk("", esc(ru if L == 0 else en), False, 'data-setting="' + token + '" ')
        for token, ru, en in spec.SETTINGS_TOKENS
    )
    g_settings = (
        chk("f_settings", esc(t("Задавать настройки при первом добавлении",
                                "Set defaults when the profile is first added")))
        + '<div class="checkgrid">' + settings_boxes + "</div>"
    )

    # --- 09 migration + compat -------------------------------------------
    g_migration = (
        fld("f_newdomain", esc(t("Новый домен подписки", "New subscription domain")),
            txt("f_newdomain", "sub.nebula.example"),
            esc(t("Только хост и необязательный порт. Клиент переносит подписку "
                  "лишь после собственных проверок.",
                  "Hostname and optional port only. The client migrates the subscription "
                  "only after its own checks.")))
        + fld("f_fallback", esc(t("Запасные хосты", "Fallback hosts")),
              txt("f_fallback", "sub2.nebula.example, sub3.nebula.example"),
              esc(t("До четырёх имён через запятую, без портов и схемы.",
                    "Up to four comma-separated names, no ports and no scheme.")))
        + rule()
        + chk("f_aliases", esc(t("Дублировать заголовками FlClashX",
                                 "Also emit the FlClashX aliases")))
        + '<small class="faint">' + esc(t(
            "Удваивает часть заголовков, зато профиль выглядит так же в FlClashX.",
            "Doubles some headers, but the profile looks the same in FlClashX.",
        )) + "</small>"
    )

    # --- 10 Remnawave -----------------------------------------------------
    # These fields shape the three Remnawave artefacts (SRR rules, global
    # headers, subscription page) and the check command — not any reclash-*
    # header, so they live in their own block at the end of the form.
    g_remnawave = (
        '<p class="faint">' + esc(t(
            "Настройки трёх артефактов для панели Remnawave: правил ответа (SRR), "
            "глобальных заголовков и страницы подписки. Готовое — на вкладках "
            "справа.",
            "Settings for the three Remnawave artefacts — response rules (SRR), "
            "global headers and the subscription page. The output is on the tabs "
            "to the right.",
        )) + "</p>"
        + fld("f_rw_fallback", esc(t("Формат для остальных клиентов",
                                     "Format for other clients")),
              sel("f_rw_fallback", remnawave.FALLBACK_TYPES, "CLASH"),
              esc(t("Завершающее правило SRR: что получат клиенты, кроме ReClash "
                    "(иначе панель отдаст им 403).",
                    "The catch-all SRR rule: what clients other than ReClash get "
                    "(otherwise the panel answers them with 403).")))
        + chk("f_rw_hwid", esc(t("Отключить HWID-лимит для правила ReClash",
                                 "Disable the HWID limit for the ReClash rule")))
        + rule()
        + '<p class="faint">' + esc(t("Локали страницы подписки",
                                      "Subscription-page locales")) + "</p>"
        + '<div class="checkgrid">'
        + chk("f_rw_en", esc(t("Английский", "English")), True)
        + chk("f_rw_ru", esc(t("Русский", "Russian")), True)
        + "</div>"
        + fld("f_rw_suburl", esc(t("Ссылка подписки для проверки",
                                   "Subscription URL to check")),
              txt("f_rw_suburl", "https://panel.example.com/api/sub/<id>", "url"),
              esc(t("Подставляется в команду curl на вкладке «Проверка».",
                    "Filled into the curl command on the Check tab.")))
    )

    # The ten blocks used to stand open all at once, which made the form a
    # single 4000-pixel column: the five that most providers never touch were
    # in the way of the four they always do. Each block now names the headers
    # it emits, so a shut one still says what is inside it.
    groups = [
        ("01", t("Подписка и трафик", "Subscription and traffic"),
         "ReClash-AutoUpdateInterval · ExpireDays · TrafficPercent", g_sub, False),
        ("02", t("Сервис", "Service"),
         "ReClash-ServiceName · ActiveText · ServiceLogo · ServerInfo", g_service, True),
        ("03", t("Ссылки и объявление", "Links and announcement"),
         "ReClash-SupportURL · ReportURL · WebPageURL · BuyPlan · "
         "BuyTraffic · Announce · AnnounceURL", g_links, False),
        ("04", t("Тема и кольцо", "Theme and ring"),
         "ReClash-Hex · HeroRing · HeroEffect", g_theme, False),
        ("05", t("Фон панели", "Dashboard background"),
         "ReClash-Background", g_bg, False),
        ("06", t("Виджеты панели", "Dashboard widgets"),
         "ReClash-Widgets · ReClash-Custom", g_widgets, False),
        ("07", t("Страница прокси", "Proxy page"),
         "ReClash-View", g_view, False),
        ("08", t("Настройки по умолчанию", "Default settings"),
         "ReClash-Settings", g_settings, False),
        ("09", t("Миграция и совместимость", "Migration and compatibility"),
         "ReClash-NewDomain · FallbackHosts · FlClashX-*", g_migration, False),
        ("10", t("Remnawave", "Remnawave"),
         "SRR · " + t("глобальные заголовки", "global headers") + " · "
         + t("страница", "subscription page"), g_remnawave, False),
    ]
    return (
        '<form class="builder__form" id="builder" novalidate>'
        + "".join(group(*g) for g in groups)
        + "</form>"
    )


def builder_output(ctx):
    t = ctx.t
    # Ten output formats do not fit one strip without a horizontal scroll, so
    # they nest: two top-level categories, each opening its own sub-tabs.
    # Remnawave first — the panel path needs no server of your own; the server
    # snippets stay under "self-host" for providers who front the endpoint.
    categories = [
        ("rw", t("Remnawave", "Remnawave"),
         t("Артефакты Remnawave", "Remnawave artefacts"),
         [("srr", t("Правила", "Rules")),
          ("rwh", t("Заголовки", "Headers")),
          ("subpage", t("Страница", "Page")),
          ("curl", t("Проверка", "Check"))]),
        ("self", t("Свой сервер", "Self-host"),
         t("Серверные сниппеты", "Server snippets"),
         [("http", "HTTP"), ("nginx", "nginx"), ("caddy", "Caddy"),
          ("php", "PHP"), ("go", "Go"), ("py", "Python")]),
    ]

    def panel(key, active):
        return (
            '<div class="tabpanel" id="tp-%s" role="tabpanel" aria-labelledby="tab-%s"%s>'
            '<div class="codeblock builder__code">'
            '<button class="copy" type="button" data-done-label="%s">%s</button>'
            '<pre><code id="out-%s"></code></pre></div></div>'
            % (key, key, "" if active else " hidden",
               esc(t("готово", "copied")), esc(t("копировать", "copy")), key)
        )

    def subtabs(panes, label):
        buttons = "".join(
            '<button type="button" role="tab" id="tab-%s" aria-controls="tp-%s" '
            'aria-selected="%s" tabindex="%s">%s</button>'
            % (key, key, "true" if i == 0 else "false", "0" if i == 0 else "-1", esc(lbl))
            for i, (key, lbl) in enumerate(panes)
        )
        rows = "".join(panel(key, i == 0) for i, (key, lbl) in enumerate(panes))
        return (
            '<div class="tabs" data-tabs role="tablist" aria-label="' + esc(label) + '">'
            + buttons + "</div>" + rows
        )

    # Top-level category tabs (each controls a group that holds its own sub-tabs).
    cat_tabs = "".join(
        '<button type="button" role="tab" id="tab-cat-%s" aria-controls="cat-%s" '
        'aria-selected="%s" tabindex="%s">%s</button>'
        % (cat, cat, "true" if i == 0 else "false", "0" if i == 0 else "-1", esc(name))
        for i, (cat, name, sublabel, panes) in enumerate(categories)
    )
    cat_groups = "".join(
        '<div class="tabpanel tabgroup" id="cat-%s" role="tabpanel" '
        'aria-labelledby="tab-cat-%s"%s>%s</div>'
        % (cat, cat, "" if i == 0 else " hidden", subtabs(panes, sublabel))
        for i, (cat, name, sublabel, panes) in enumerate(categories)
    )
    tabs = (
        '<div class="tabs" data-tabs role="tablist" aria-label="'
        + esc(t("Куда встроить", "Where to integrate")) + '">' + cat_tabs + "</div>"
    )
    panels = cat_groups

    # The phone rides in the sticky column opposite the fields it previews. The
    # switch and the live count sit in a fixed-height header bar, the preview and
    # the code share one fixed-height stage — so flipping Preview↔Code changes
    # nothing about the column's size and the page never jumps under the cursor.
    # Count, warnings and the share link used to live here too and pushed the
    # phone off a laptop screen; they moved to a full-width strip below (see
    # builder_foot) where they get room to breathe and stay in view.
    return (
        '<div class="builder__out">'
        '<div class="builder__switch">'
        '<div class="tabs tabs--seg" data-tabs role="tablist" aria-label="'
        + esc(t("Что показывать", "What to show")) + '">'
        '<button type="button" role="tab" id="tab-pv" aria-controls="tp-pv" '
        'aria-selected="true" tabindex="0">'
        + esc(t("Превью", "Preview")) + "</button>"
        '<button type="button" role="tab" id="tab-code" aria-controls="tp-code" '
        'aria-selected="false" tabindex="-1">'
        + esc(t("Код", "Code")) + "</button>"
        "</div>"
        '<p class="builder__count mono" id="builder-count"></p>'
        "</div>"
        '<div class="builder__stage">'
        '<div class="tabpanel" id="tp-pv" role="tabpanel" aria-labelledby="tab-pv">'
        + builder_preview(ctx) + "</div>"
        '<div class="tabpanel" id="tp-code" role="tabpanel" aria-labelledby="tab-code" hidden>'
        + tabs
        + panels
        + "</div>"
        + "</div>"
        + "</div>"
    )


def builder_foot(ctx):
    """The warnings, the share link and its note — a full-width strip under the
    two-column builder. Warnings you must scroll a sticky pane to find are not
    warnings, so they run the whole width here, directly under the fields that
    raise them."""
    t = ctx.t
    return (
        '<div class="builder__foot">'
        '<div class="builder__warnings" id="builder-warnings" role="status" '
        'aria-live="polite" data-ok="' + esc(t(
            "Значения проходят проверку — заголовки готовы к отправке.",
            "Every value checks out — the headers are ready to serve.",
        )) + '"></div>'
        '<div class="builder__actions">'
        '<button class="btn btn--sm" type="button" id="builder-share">'
        + esc(t("Скопировать ссылку на конфигурацию", "Copy a link to this configuration"))
        + "</button>"
        + '<p class="builder__sharenote faint">' + esc(t(
            "Ссылка хранит всю форму в адресе страницы — её можно отправить коллеге "
            "или сохранить в задаче.",
            "The link stores the whole form in the page address — send it to a colleague "
            "or paste it into a ticket.",
        )) + "</p>"
        + "</div>"
        + "</div>"
    )


# The Material icons the client actually names, drawn rather than fetched.
# Keyed so the mobile bottom bar reads from one place.
NAV_ICONS = {
    # Icons.space_dashboard — four rounded panels, one of them wider.
    "dashboard": '<path d="M4 4h6v7H4z"/><path d="M14 4h6v4h-6z"/>'
                 '<path d="M14 12h6v8h-6z"/><path d="M4 15h6v5H4z"/>',
    # Icons.article — a sheet with three text rules.
    "proxies": '<rect x="4" y="4" width="16" height="16" rx="2"/>'
               '<path d="M8 9h8M8 13h8M8 17h4"/>',
    # Icons.folder.
    "profiles": '<path d="M3.5 7a2 2 0 0 1 2-2h3.6l2 2.4H18.5a2 2 0 0 1 2 2V17'
                'a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    # Icons.view_timeline — stacked pill bars offset along a rail.
    "requests": '<path d="M4 6.5h9M7 12h11M4 17.5h7"/>',
    # Icons.ballot — a card with two checkbox rows.
    "connections": '<rect x="4" y="4" width="16" height="16" rx="2"/>'
                   '<rect x="7" y="8" width="3" height="3" rx="0.6"/>'
                   '<rect x="7" y="14" width="3" height="3" rx="0.6"/>'
                   '<path d="M12.5 9.5h5M12.5 15.5h5"/>',
    # Icons.construction — a wrench crossed with a flat blade.
    "tools": '<path d="M14 6.5a3.4 3.4 0 0 0 4.4 4.4l-8.9 8.9-4.4-4.4z"/>'
             '<path d="m8.5 10-4-4a2 2 0 0 1 2.8-2.8l4 4"/>',
    # Icons.info_outline.
    "about": '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/>'
             '<circle cx="12" cy="8" r="0.6"/>',
}

# The mobile bottom bar, in the application's own order: the four destinations
# whose NavigationItem carries NavigationItemMode.mobile (settings/navigation.dart).
NAV = [
    ("Панель", "Dashboard", NAV_ICONS["dashboard"]),
    ("Прокси", "Proxies", NAV_ICONS["proxies"]),
    ("Профили", "Profiles", NAV_ICONS["profiles"]),
    ("Инструменты", "Tools", NAV_ICONS["tools"]),
]


def builder_preview(ctx):
    t = ctx.t
    nav = "".join(
        '<div%s><span class="phone__navico"><svg viewBox="0 0 24 24" aria-hidden="true">'
        "%s</svg></span><span>%s</span></div>"
        % (' data-on="true"' if i == 0 else "", path, esc(t(ru, en)))
        for i, (ru, en, path) in enumerate(NAV)
    )

    screens = [
        ("hero", t("Подключение", "Connect")),
        ("dash", t("Виджеты", "Widgets")),
        ("proxy", t("Прокси", "Proxies")),
    ]
    tabs = "".join(
        '<button type="button" data-pv="%s" aria-selected="%s">%s</button>'
        % (key, "true" if i == 0 else "false", esc(label))
        for i, (key, label) in enumerate(screens)
    )
    return (
        '<div class="builder__preview">'
        '<div class="pv-controls">'
        '<div class="tabs" role="tablist" aria-label="'
        + esc(t("Экран превью", "Preview screen")) + '">' + tabs + "</div>"
        "</div>"
        # data-screen carries the active screen to CSS: the connect screen owns
        # its own ring, so the widget screen's floating button has to go away
        # rather than float over the orb.
        '<div class="pv-scaler">'
        '<div class="phone" id="pv-phone" data-screen="hero">'
        '<div class="phone__screen">'
        '<div class="phone__bgimg" id="pv-bg"></div>'
        '<div class="phone__status"><span>9:41</span>'
        '<span class="phone__title" id="pv-title">'
        + esc(t("Панель", "Dashboard")) + "</span>"
        '<span class="phone__sig" aria-hidden="true"><i></i><i></i><i></i></span></div>'
        '<div class="phone__content" id="pv-screen"></div>'
        # AppNavBar is one floating dock over the content, not a bar bolted to
        # the frame: a rounded surfaceContainer pill of destinations and, on
        # the classic dashboard, the start control held at its trailing edge as
        # a circle the bar's height (widgets/nav/app_nav_bar.dart).
        '<div class="phone__dock">'
        '<div class="phone__nav">' + nav + "</div>"
        '<div class="phone__fab" id="pv-fab">'
        '<span class="fab__ring" aria-hidden="true"></span>'
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>'
        "</div>"
        "</div>"
        "</div></div></div>"
        '<p class="preview-note">' + esc(t(
            "Живое превью экрана подключения: оно обновляется на каждое нажатие клавиши.",
            "A live preview of the connection screen — it updates on every keystroke.",
        )) + "</p>"
        "</div>"
    )


def section_builder(ctx):
    t = ctx.t
    # A preset is a starting point, not a plain button: each card names what it
    # turns on so a provider picks by outcome rather than by guessing what
    # "Branding" fills in. The undo sits apart, in amber, because it appears only
    # after a preset has already overwritten a filled-in form.
    preset_defs = [
        ("minimal", t("Минимум", "Minimal"),
         t("Трафик, имя, поддержка", "Traffic, name, support")),
        ("brand", t("Брендирование", "Branding"),
         t("Тема, кольцо, виджеты", "Theme, ring, widgets")),
        ("full", t("Всё сразу", "Everything"),
         t("Каждый блок разом", "Every block at once")),
    ]
    preset_cards = "".join(
        '<button class="preset-card" type="button" data-preset="%s">'
        '<span class="preset-card__name">%s</span>'
        '<span class="preset-card__desc">%s</span></button>'
        % (key, esc(name), esc(desc))
        for key, name, desc in preset_defs
    )
    presets = (
        '<div class="preset-bar">'
        '<span class="preset-bar__label eyebrow">' + esc(t("Начните с пресета", "Start from a preset")) + "</span>"
        '<div class="preset-bar__cards">' + preset_cards + "</div>"
        '<button class="btn btn--sm btn--amber preset-bar__undo" type="button" id="builder-undo" hidden>'
        + esc(t("Вернуть как было", "Undo")) + "</button>"
        "</div>"
    )
    # The builder is a page of its own now, so its section carries the page
    # header directly — eyebrow, an <h1> statement, the lede and the scope chips
    # that used to live in a separate pagehead above. No "01" rubric: a single
    # tool page has nothing to number against.
    return (
        '<section class="section section--tight" id="tool">'
        '<div class="shell">'
        + '<p class="eyebrow">' + esc(t("Для провайдеров", "For providers")) + "</p>"
        + '<div class="split builder-head">'
        + '<h1 class="statement">'
        + t("Соберите заголовки <em>здесь</em> — и сразу посмотрите, что увидит пользователь.",
            "Assemble the headers <em>here</em> — and watch what the user will see.")
        + "</h1>"
        + '<div><p class="lede">' + esc(t(
            "Форма проверяет значения по тем же правилам, что и клиент: HTTPS, "
            "диапазоны, длину объявления, порты в запасных хостах. Справа — готовые "
            "артефакты для панели Remnawave и фрагменты для nginx, Caddy, PHP, Go "
            "или Python.",
            "The form validates values by the same rules as the client: HTTPS, ranges, "
            "announcement length, ports in fallback hosts. On the right — ready-made "
            "artefacts for the Remnawave panel and snippets for nginx, Caddy, PHP, Go "
            "or Python.",
        )) + "</p>"
        + '<p class="row gap-2 builder-head__meta">'
        + chip("%d reclash-*" % len(spec.RECLASH_HEADERS)) + chip(t("%d общих" % len(spec.COMMON_HEADERS), "%d common" % len(spec.COMMON_HEADERS)))
        + chip(t("11 псевдонимов", "11 aliases")) + chip("HWID")
        + '<a class="chip chip--link" href="' + ctx.page("reference") + '">'
        + esc(t("Заголовки →", "Headers →")) + "</a>"
        + "</p></div></div>"
        + presets
        + '<div class="builder">'
        + builder_form(ctx)
        + builder_output(ctx)
        + "</div>"
        + builder_foot(ctx)
        + "</div>"
        + json_block("builder-strings", builder_strings(ctx))
        + json_block("widget-spec", spec.widget_spec(ctx.lang))
        + json_block("remnawave-template", remnawave.template())
        + "</section>"
    )

def render(ctx):
    """The builder page (builder.html) — the heavy, interactive one. Carries
    builder.js and the phone-preview styles. The full spec lives on its own
    lighter page (reference.html), one click away in the header and here."""
    t = ctx.t
    # The builder is self-sufficient: its own section carries the page header,
    # so there is no separate pagehead above it (that only duplicated the
    # section's statement and lede).
    body = section_builder(ctx)
    return {
        "active": "builder",
        "title": t("Конструктор заголовков подписки",
                   "Subscription header builder"),
        "description": t(
            "Конструктор заголовков ответа подписки для ReClash с живым превью "
            "приложения и артефактами для Remnawave, nginx, Caddy, PHP, Go и Python.",
            "A builder for ReClash subscription response headers with a live app "
            "preview and artefacts for Remnawave, nginx, Caddy, PHP, Go and Python.",
        ),
        "body": body,
        "css": ("docs.css",),
        "css_defer": ("preview.css",),
        "js": ("builder.js",),
    }


# --------------------------------------------------------------- reference
#
# The catalogue: one card per header, collapsed to a name + category + alias +
# one-line summary, expanded to the full format, description, an example and,
# where the value is structured, a token table. A search box and category chips
# on top (core.js drives them; with no JS every card is just open markup). The
# narrative guide — how it all works, parsing rules, delivery — is a separate,
# lighter page (docs.html, page_docs.render).

# reclash-* header -> its flclashx-* alias badges, derived from spec.ALIASES so
# the catalogue can never claim an alias the reference table does not list.
def _alias_map():
    m = {}
    for _ru, _en, chain in spec.ALIASES:
        names = [x.split(" ")[0] for x in chain]
        prim = next((n for n in names if n.startswith("reclash-")), None)
        if not prim:
            continue
        m[prim] = [n for n in names if n.startswith("flclashx-")]
    return m


CAT_LABEL = {
    "common": ("Общий", "Common"),
    "reclash": ("ReClash", "ReClash"),
    "hwid": ("Устройство", "Device"),
}


def hcard(ctx, name, cat, summary, fmt, body, example="", extra="", keys=""):
    """One catalogue entry. `summary` shows collapsed; everything else unfolds.
    The id is language-neutral (h-<name>) so the two language builds stay in
    id-parity; `keys` carries both-language search terms (core.js reads them,
    verify.py strips them before its Cyrillic check)."""
    t = ctx.t
    slug = "h-" + name
    cat_ru, cat_en = CAT_LABEL[cat]
    aliases = _alias_map().get(name, []) if cat == "reclash" else []
    badges = ['<span class="hcard__cat hcard__cat--%s">%s</span>'
              % (cat, esc(t(cat_ru, cat_en)))]
    for a in aliases:
        badges.append('<span class="hcard__alias" title="%s"><code>%s</code></span>'
                      % (esc(t("псевдоним", "alias")), esc(a)))
    meta = (
        '<div class="hcard__meta"><div class="hcard__row">'
        '<span class="hcard__k">' + esc(t("Формат", "Format")) + "</span>"
        '<span class="hcard__v mono">' + fmt + "</span></div>"
        + ("".join(
            '<div class="hcard__row"><span class="hcard__k">%s</span>'
            '<span class="hcard__v"><code>%s</code></span></div>'
            % (esc(t("Псевдоним", "Alias")), esc(a)) for a in aliases)
           if aliases else "")
        + "</div>"
    )
    ex = (codeblock(example, t("копировать", "copy"), t("готово", "copied"))
          if example else "")
    dk = " ".join([name] + aliases + [keys]).strip()
    return (
        # `open` in the markup so the catalogue reads with no JS; core.js closes
        # every card on load and drives expand/collapse from there.
        '<details class="hcard" open id="' + slug + '" data-cat="' + cat + '"'
        ' data-name="' + esc(name) + '" data-keys="' + esc(dk) + '">'
        '<summary class="hcard__sum">'
        '<code class="hcard__name">' + esc(name) + "</code>"
        '<span class="hcard__badges">' + "".join(badges) + "</span>"
        '<span class="hcard__lead">' + summary + "</span>"
        '<span class="hcard__chev" aria-hidden="true">'
        '<svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></span>'
        "</summary>"
        '<div class="hcard__panel">' + meta
        + '<div class="hcard__prose">' + body + "</div>"
        + extra + ex + "</div></details>"
    )


def catalog(ctx):
    t = ctx.t
    L = 0 if ctx.lang == "ru" else 1
    cards = {"common": [], "reclash": [], "hwid": []}

    # -- extended detail, examples and token tables, keyed by header name -----
    # Only the headers that need more than their one-line purpose carry an entry
    # here; the rest fall back to the spec purpose alone.
    def var_table():
        rows = [["<code>" + v + "</code>", ru if L == 0 else en]
                for v, ru, en in spec.THEME_VARIANTS]
        return table([t("Вариант", "Variant"), t("Что даёт", "What it does")], rows)

    def view_table():
        rows = [["<code>" + n + "</code>",
                 " ".join("<code>" + v + "</code>" for v in vals),
                 esc(ru if L == 0 else en)]
                for n, vals, ru, en in spec.VIEW_TOKENS]
        return table([t("Ключ", "Key"), t("Значения", "Values"), t("Что задаёт", "What it sets")], rows)

    def widget_table():
        rows = [["<code>" + wid + "</code>", esc(ru if L == 0 else en),
                 '<span class="faint">' + esc(spec.PLATFORM_LABEL[plat][L]) + "</span>"]
                for wid, plat, ru, en, _ in spec.WIDGETS]
        return table([t("Имя", "Name"), t("Виджет", "Widget"), t("Доступен", "Available on")], rows)

    def settings_table():
        rows = [["<code>" + tok + "</code>", esc(ru if L == 0 else en)]
                for tok, ru, en in spec.SETTINGS_TOKENS]
        return table([t("Токен", "Token"), t("Что включает", "What it turns on")], rows)

    # name -> dict(fmt=(ru,en) or str, body=(ru,en), example=str, extra=callable|str, keys=(ru,en))
    D = {
        # ---- common --------------------------------------------------------
        "subscription-userinfo": dict(
            fmt="upload=&lt;%s&gt;; download=&lt;%s&gt;; total=&lt;%s&gt;; expire=&lt;%s&gt;"
                % (t("байты", "bytes"), t("байты", "bytes"), t("байты", "bytes"),
                   t("unix-секунды", "unix-seconds")),
            body=t(
                "Расход и лимит трафика в байтах и дата окончания в unix-секундах. "
                "<code>total=0</code> — безлимит, <code>expire=0</code> — бессрочно. "
                "Клиент показывает остаток, полосу расхода и число дней до конца.",
                "Traffic usage and quota in bytes, plus the expiry as unix-seconds. "
                "<code>total=0</code> means unlimited, <code>expire=0</code> perpetual. "
                "The client shows the remaining amount, a usage bar and days left."),
            example="Subscription-Userinfo: upload=13421772800; download=83994443776; "
                    "total=214748364800; expire=1798761600",
            keys=("трафик остаток квота срок лимит байты",
                  "traffic quota remaining expiry limit bytes")),
        "profile-title": dict(
            example="Profile-Title: Nebula VPN\nProfile-Title: base64:0J3QtdCx0YPQu9CwIFZQTg==",
            keys=("имя профиля название", "profile name title")),
        "content-disposition": dict(
            example='Content-Disposition: attachment; filename="nebula.yaml"',
            keys=("имя файла", "filename")),
        "profile-update-interval": dict(
            example="Profile-Update-Interval: 24",
            keys=("интервал обновления часы", "update interval hours")),
        "support-url": dict(
            example="Support-Url: https://nebula.example/help",
            keys=("поддержка ссылка", "support link")),
        "announce": dict(
            example="Announce: base64:0J/RgNC+0YTQuNC70LDQutGC0LjQutCw",
            keys=("объявление новость", "announcement news")),
        # ---- reclash -------------------------------------------------------
        "reclash-announce": dict(
            example="ReClash-Announce: base64:0J/RgNC+0YTQuNC70LDQutGC0LjQutCw 14.04",
            keys=("объявление баннер", "announcement banner")),
        "reclash-announceurl": dict(
            example="ReClash-AnnounceURL: https://nebula.example/news",
            keys=("объявление ссылка новости", "announcement link news")),
        "reclash-supporturl": dict(
            example="ReClash-SupportURL: https://nebula.example/help",
            keys=("поддержка помощь", "support help")),
        "reclash-autoupdateinterval": dict(
            example="ReClash-AutoUpdateInterval: 60",
            keys=("интервал обновления минуты", "update interval minutes")),
        "reclash-webpageurl": dict(
            example="ReClash-WebPageURL: https://nebula.example/account",
            keys=("личный кабинет аккаунт профиль", "account personal cabinet profile")),
        "reclash-expiredays": dict(
            example="ReClash-ExpireDays: 7,3,1",
            keys=("дни окончания напоминание срок", "expiry days reminder")),
        "reclash-trafficpercent": dict(
            example="ReClash-TrafficPercent: 80,95",
            keys=("трафик проценты напоминание лимит", "traffic percent reminder quota")),
        "reclash-servicename": dict(
            example="ReClash-ServiceName: Nebula VPN",
            keys=("имя сервиса бренд", "service name brand")),
        "reclash-activetext": dict(
            body=t(
                "Надпись под кольцом подключения и в уведомлении Android — вместо "
                "стандартного «Вы защищены». Для не-ASCII используйте <code>base64:</code>.",
                "The caption under the connection ring and in the Android notification — "
                "in place of the default “You are protected”. Use <code>base64:</code> "
                "for non-ASCII."),
            example="ReClash-ActiveText: Nebula has you covered",
            keys=("надпись подключение защита", "caption connected protected")),
        "reclash-servicelogo": dict(
            body=t(
                "Логотип на панели и в контроле подключения. Абсолютный HTTPS-адрес, "
                "PNG или SVG, квадрат 256–512 px, прозрачный фон; значимую часть держите "
                "в центральных 80 % — края обрезаются под скругление.",
                "The logo on the dashboard and connection control. An absolute HTTPS URL, "
                "PNG or SVG, square 256–512 px, transparent background; keep the meaningful "
                "part inside the central 80 % — edges get rounded off."),
            example="ReClash-ServiceLogo: https://nebula.example/logo-512.png",
            keys=("логотип картинка бренд", "logo image brand")),
        "reclash-serverinfo": dict(
            example="ReClash-ServerInfo: Auto",
            keys=("группа сервер активный", "group server active")),
        "reclash-buyplan": dict(
            example="ReClash-BuyPlan: https://nebula.example/billing",
            keys=("тариф продление оплата биллинг", "plan renew billing purchase")),
        "reclash-buytraffic": dict(
            example="ReClash-BuyTraffic: https://nebula.example/billing/traffic",
            keys=("трафик докупить оплата", "traffic top up purchase")),
        "reclash-view": dict(
            fmt="type:… sort:… layout:… icon:… card:…",
            body=t(
                "Токены вида <code>ключ:значение</code> через запятую или точку с запятой. "
                "Неизвестные ключи и значения отбрасываются, остальные применяются. Это "
                "предложение, а не приказ: пользователь может переключить вид сам.",
                "Tokens of the form <code>key:value</code>, comma- or semicolon-separated. "
                "Unknown keys and values are dropped, the rest apply. It is a suggestion, "
                "not an order: the user can switch the view back."),
            extra=view_table,
            example="ReClash-View: type:tab; sort:delay; layout:tight; icon:standard; card:shrink",
            keys=("вид страница прокси сортировка сетка", "view proxy page sort grid layout")),
        "reclash-hex": dict(
            fmt="RRGGBB[:variant][:pureblack]",
            body=t(
                "Цвет <code>RRGGBB</code> или <code>AARRGGBB</code>, за ним необязательный "
                "вариант палитры и необязательный <code>pureblack</code> (чёрный AMOLED-фон). "
                "Разделители — <code>:</code>, <code>;</code> или <code>,</code>. Тема "
                "действует, пока профиль активен.",
                "An <code>RRGGBB</code> or <code>AARRGGBB</code> colour, then an optional "
                "palette variant and an optional <code>pureblack</code> (an AMOLED black "
                "background). Separators are <code>:</code>, <code>;</code> or <code>,</code>. "
                "The theme applies while the profile is active."),
            extra=var_table,
            example="ReClash-Hex: 2FD3B6\nReClash-Hex: 2FD3B6:vibrant\n"
                    "ReClash-Hex: FF7C5CFF;expressive;pureblack",
            keys=("тема цвет палитра pureblack amoled", "theme colour palette pureblack amoled")),
        "reclash-background": dict(
            fmt="url[,opacity]",
            body=t(
                "Абсолютный <code>http</code>- или <code>https</code>-адрес картинки и "
                "необязательная непрозрачность 1–100. По умолчанию 10 — фон должен "
                "оставаться фоном. Действует, пока профиль активен.",
                "An absolute <code>http</code> or <code>https</code> image URL and an "
                "optional opacity from 1 to 100. The default is 10 — a background should "
                "stay a background. Applies while the profile is active."),
            example="ReClash-Background: https://nebula.example/bg.webp,14",
            keys=("фон картинка обои прозрачность", "background image wallpaper opacity")),
        "reclash-heroring": dict(
            fmt="c1;c2;c3",
            body=t(
                "Ровно три цвета — градиент кольца вокруг кнопки подключения. Меньше или "
                "больше трёх значений игнорируется целиком. Псевдонима у этого заголовка нет.",
                "Exactly three colours — the gradient of the ring around the connect button. "
                "Fewer or more than three values are ignored entirely. This header has no alias."),
            example="ReClash-HeroRing: 7C5CFF;3686ED;2FD3B6",
            keys=("кольцо градиент подключение", "ring gradient hero connection")),
        "reclash-heroeffect": dict(
            fmt="aurora",
            body=t(
                "Живой эффект за кольцом подключения. Пока поддерживается только "
                "<code>aurora</code> — мягкое северное сияние; любое другое значение "
                "выключает эффект. Псевдонима у этого заголовка нет.",
                "A living effect behind the connection ring. Only <code>aurora</code> — a "
                "soft aurora glow — is supported for now; any other value turns the effect "
                "off. This header has no alias."),
            example="ReClash-HeroEffect: aurora",
            keys=("эффект сияние aurora кольцо анимация", "effect aurora glow ring animation")),
        "reclash-widgets": dict(
            fmt=t("имена через запятую", "comma-separated names"),
            body=t(
                "Имена виджетов через запятую — порядок в списке становится порядком на "
                "панели. Виджеты, недоступные на платформе, просто не появятся. "
                "<code>reclash-custom</code> управляет тем, как список сливается с "
                "пользовательским.",
                "Comma-separated widget names — their order becomes the order on the "
                "dashboard. Widgets unavailable on a platform simply do not appear. "
                "<code>reclash-custom</code> controls how the list merges with the "
                "user's own."),
            extra=widget_table,
            example="ReClash-Widgets: serviceInfo,networkSpeed,trafficUsage,changeServerButton",
            keys=("виджеты панель карточки порядок", "widgets dashboard cards order")),
        "reclash-custom": dict(
            fmt="add | update",
            body=t(
                "Как <code>reclash-widgets</code> сливается с уже собранным пользователем "
                "набором: <code>add</code> добавляет недостающие виджеты в конец, "
                "<code>update</code> заменяет набор целиком. Без этого заголовка набор "
                "предлагается только при первом добавлении профиля.",
                "How <code>reclash-widgets</code> merges with the set the user already "
                "assembled: <code>add</code> appends the missing widgets, <code>update</code> "
                "replaces the whole set. Without this header the set is suggested only when "
                "the profile is first added."),
            example="ReClash-Widgets: serviceInfo,networkSpeed,trafficUsage,changeServerButton\n"
                    "ReClash-Custom: update",
            keys=("слияние виджеты добавить заменить", "merge widgets add update replace")),
        "reclash-settings": dict(
            fmt=t("токены через запятую", "comma-separated tokens"),
            body=t(
                "Настройки по умолчанию. Предлагаются <strong>один раз</strong> — при первом "
                "добавлении профиля: ReClash покажет запрошенные изменения и применит их "
                "только после подтверждения. Не перечисленные настройки остаются как есть, "
                "дальше настройками владеет пользователь.",
                "Application defaults. Offered <strong>once</strong> — when the profile is "
                "first added: ReClash shows the requested changes and applies them only after "
                "the user confirms. Unlisted settings keep their values; after that the "
                "settings belong to the user."),
            extra=settings_table,
            example="ReClash-Settings: minimize,autoupdate",
            keys=("настройки умолчания автозапуск", "settings defaults autostart autorun")),
        "reclash-newdomain": dict(
            fmt=t("хост[:порт]", "host[:port]"),
            body=t(
                "Только имя хоста и необязательный порт — без схемы, пути и параметров. "
                "Клиент не переключается вслепую: он проверяет, что новый адрес действительно "
                "отдаёт вашу подписку, и только потом переносит профиль.",
                "A hostname and an optional port only — no scheme, path or query. The client "
                "does not switch blindly: it verifies that the new address really serves your "
                "subscription, and only then migrates the profile."),
            example="ReClash-NewDomain: sub.nebula.example\n"
                    "ReClash-NewDomain: sub.nebula.example:8443",
            keys=("смена домен миграция переезд", "domain migration move switch")),
        "reclash-fallbackhosts": dict(
            fmt=t("до 4 хостов через запятую", "up to 4 comma-separated hosts"),
            body=t(
                "До четырёх имён хостов через запятую — без портов и схемы. Имена приводятся "
                "к нижнему регистру, дубликаты убираются, лишнее отбрасывается. Клиент идёт к "
                "ним, когда основной адрес временно недоступен. Псевдонима нет.",
                "Up to four comma-separated hostnames — no ports, no scheme. Names are "
                "lowercased, duplicates removed, the excess dropped. The client falls back to "
                "them when the main address is temporarily unreachable. No alias."),
            example="ReClash-FallbackHosts: sub2.nebula.example,sub3.nebula.example",
            keys=("запасные хосты резерв отказоустойчивость", "fallback hosts backup failover")),
        # ---- hwid ----------------------------------------------------------
        "x-hwid": dict(example="X-HWID: 3f7a9c2e5b1d8046",
                       keys=("устройство хеш идентификатор", "device hash identifier")),
        "x-device-os": dict(example="X-Device-OS: Android",
                            keys=("ос платформа", "os platform")),
        "x-ver-os": dict(example="X-Ver-OS: 14",
                         keys=("версия ос", "os version")),
        "x-device-model": dict(example="X-Device-Model: Pixel 8",
                               keys=("модель устройство хост", "model device host")),
        "x-hwid-max-devices-reached": dict(
            fmt="true", example="X-HWID-Max-Devices-Reached: true",
            keys=("лимит устройств превышен", "device limit reached")),
        "x-hwid-not-supported": dict(
            fmt="true", example="X-HWID-Not-Supported: true",
            keys=("режим не поддерживается", "mode unsupported")),
    }

    def emit(name, cat, summary, default_fmt):
        d = D.get(name, {})
        fmt = d.get("fmt", default_fmt)
        body = d.get("body", summary)
        ex = d.get("example", "")
        extra = d.get("extra", "")
        if callable(extra):
            extra = extra()
        kw = d.get("keys", ("", ""))
        # Both languages in the search index on purpose — the reader finds a
        # header whichever language they type; verify.py strips data-keys before
        # its Cyrillic check, so the RU terms never count as a leak on the EN page.
        cards[cat].append(hcard(ctx, name, cat, summary, fmt, body, ex, extra,
                                keys=(kw[0] + " " + kw[1]).strip()))

    # common headers
    for name, ru_v, en_v, ru_b, en_b in spec.COMMON_HEADERS:
        emit(name, "common", ru_b if L == 0 else en_b,
             '<span class="mono faint">' + (ru_v if L == 0 else en_v) + "</span>")
    # reclash headers
    for name, ru_v, en_v, ru_p, en_p in spec.RECLASH_HEADERS:
        emit(name, "reclash", ru_p if L == 0 else en_p,
             '<span class="mono faint">' + (ru_v if L == 0 else en_v) + "</span>")
    # hwid — request then response
    for name, ru, en in spec.HWID_REQUEST:
        emit(name, "hwid", esc(ru if L == 0 else en), "&mdash;")
    for name, ru, en in spec.HWID_RESPONSE:
        emit(name, "hwid", ru if L == 0 else en, "true")

    groups = [
        ("common", t("Общие заголовки", "Common headers"),
         t("Стандартные заголовки Clash. Отдаёте их уже — ReClash подхватит без изменений.",
           "Standard Clash headers. If you already send them, ReClash picks them up unchanged.")),
        ("reclash", t("Заголовки ReClash", "ReClash headers"),
         t("Заголовки, которые понимает только ReClash. Все необязательны.",
           "Headers only ReClash understands. Every one is optional.")),
        ("hwid", t("Устройства и HWID", "Devices and HWID"),
         t("Заголовки запроса от клиента и ответы на них.",
           "Request headers from the client and the responses to them.")),
    ]

    chips = [("all", t("Все", "All"), sum(len(cards[c]) for c in cards))]
    for key, _, _ in groups:
        chips.append((key, t(*CAT_LABEL[key]), len(cards[key])))
    filt = "".join(
        '<button class="hfilter" type="button" data-cat="%s"%s>%s'
        '<span class="hfilter__n">%d</span></button>'
        % (key, ' aria-pressed="true"' if key == "all" else ' aria-pressed="false"',
           esc(label), n)
        for key, label, n in chips
    )

    sections = []
    for key, title, lede in groups:
        sections.append(
            '<section class="hgroup" id="cat-%s" data-cat="%s">'
            '<h2 class="hgroup__ttl">%s <span class="hgroup__n mono">%d</span></h2>'
            '<p class="hgroup__lede">%s</p>'
            '<div class="hcards">%s</div></section>'
            % (key, key, esc(title), len(cards[key]), esc(lede), "".join(cards[key]))
        )

    return (
        '<div class="catalog" data-catalog>'
        '<div class="catalog__bar">'
        '<div class="catalog__search"><svg class="catalog__ico" viewBox="0 0 24 24" '
        'aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>'
        '<input type="search" class="catalog__input" '
        'placeholder="' + esc(t("Поиск по имени или описанию…", "Search by name or description…")) + '" '
        'aria-label="' + esc(t("Поиск заголовков", "Search headers")) + '">'
        "</div>"
        '<div class="catalog__filters" role="group" aria-label="'
        + esc(t("Фильтр по категориям", "Filter by category")) + '">' + filt + "</div>"
        "</div>"
        '<p class="catalog__empty" hidden>' + esc(t(
            "Ничего не нашлось. Сбросьте фильтр или измените запрос.",
            "Nothing matches. Clear the filter or change the query.")) + "</p>"
        + "".join(sections)
        + "</div>"
    )


def render_reference(ctx):
    """The reference page (reference.html) — the header catalogue. Light: just
    docs.css and the shared core.js (search + category filter). No builder.js,
    no phone-preview styles. The narrative guide is docs.html; the builder that
    assembles these headers is builder.html."""
    t = ctx.t
    body = "".join([
        '<section class="pagehead"><div class="shell">',
        '<p class="eyebrow">' + esc(t("Для провайдеров", "For providers")) + "</p>",
        "<h1>" + t("Справочник по <span class=\"grad\">заголовкам</span>",
                   "The header <span class=\"grad\">reference</span>") + "</h1>",
        '<p class="lede">' + esc(t(
            "Каждый заголовок ответа, который читает ReClash: имя, формат, псевдонимы, "
            "что делает и пример. Ищите по имени или описанию, фильтруйте по категории. "
            "Как всё это работает целиком — в документации.",
            "Every response header ReClash reads: name, format, aliases, what it does and "
            "an example. Search by name or description, filter by category. How it all fits "
            "together is in the documentation.",
        )) + "</p>",
        '<p class="pagehead__meta">',
        chip("%d reclash-*" % len(spec.RECLASH_HEADERS)), chip(t("%d общих" % len(spec.COMMON_HEADERS), "%d common" % len(spec.COMMON_HEADERS))),
        chip("HWID"),
        '<a class="chip chip--link" href="' + ctx.page("docs") + '">'
        + esc(t("Документация →", "Documentation →")) + "</a>",
        '<a class="chip chip--link" href="' + ctx.page("builder") + '">'
        + esc(t("Конструктор →", "Builder →")) + "</a>",
        "</p></div></section>",
        '<section class="section"><div class="shell">',
        rubric("01", t("справочник", "the reference")),
        catalog(ctx),
        "</div></section>",
    ])
    return {
        "active": "reference",
        "title": t("Справочник по заголовкам подписки",
                   "Subscription header reference"),
        "description": t(
            "Справочник по заголовкам ответа подписки для ReClash: имя, формат, "
            "псевдонимы, назначение и пример каждого. Поиск и фильтр по категориям.",
            "Reference for ReClash subscription response headers: name, format, aliases, "
            "purpose and an example for each. Searchable and filterable by category.",
        ),
        "body": body,
        "css": ("docs.css",),
    }
