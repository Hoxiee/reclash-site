"""Provider header reference + the interactive header builder."""

from . import spec, ui
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

    The <summary> is the only thing a shut group shows, so it carries the
    header names the block emits: the provider can find the one control they
    came for without opening all nine. The <legend> stays in the markup for
    screen readers, which announce a fieldset by it, but it is hidden — the
    summary above is already saying the same words on screen.

    data-group carries the block number to builder.js, which sets data-active
    on it whenever the block is emitting headers — so a shut, filled block wears
    an accent rail and a live dot, and the provider can see what is on without
    opening anything."""
    return (
        # name= makes the group an exclusive accordion natively: the browser
        # shuts the others when one opens, no JS and no dependence on a script
        # that a stale cache might not have. builder.js repeats it for browsers
        # too old for name (pre-2024), so both paths keep one block open.
        '<details class="bgroup" name="bgroup" data-group="' + esc(num) + '"'
        + (" open" if open_ else "") + ">"
        '<summary class="bgroup__sum">'
        '<span class="bgroup__num mono">' + esc(num) + "</span>"
        '<span class="bgroup__dot" aria-hidden="true"></span>'
        '<span class="bgroup__ttl">' + esc(title) + "</span>"
        '<span class="bgroup__hdrs mono">' + esc(headers) + "</span>"
        '<span class="bgroup__chev" aria-hidden="true">'
        '<svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></span>'
        "</summary>"
        '<fieldset class="bgroup__body">'
        '<legend class="visually-hidden">' + esc(num + " " + title) + "</legend>"
        + body
        + "</fieldset></details>"
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
        "f_support": "", "f_buyplan": "", "f_buytraffic": "",
        "f_announce": "", "f_interval": "",
        "f_hex": "7C5CFF", "f_variant": "tonalspot",
        "f_bgurl": "", "f_bgop": "10",
        "f_ring1": "7C5CFF", "f_ring2": "3686ED", "f_ring3": "2FD3B6",
        "f_view_type": "tab", "f_view_sort": "default", "f_view_layout": "standard",
        "f_view_icon": "standard", "f_view_card": "expand",
        "f_custom": "", "f_newdomain": "", "f_fallback": "",
        "f_userinfo": 0, "f_svcname_b64": 0, "f_announce_b64": 0,
        "f_theme": 0, "f_pureblack": 0, "f_bg": 0, "f_ring": 0, "f_view": 0,
        "f_widgets": 0, "f_settings": 0, "f_aliases": 0,
    }

    def preset(**over):
        d = dict(base)
        d.update(over)
        return d

    minimal = preset(
        f_userinfo=1,
        f_title=t("Тариф «Орбита»", "Orbit plan"),
        f_svcname="Nebula VPN",
        f_support="https://nebula.example/help",
    )
    brand = preset(
        f_userinfo=1,
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
                 "outboundModeV2", "changeServerButton"],
    )
    full = preset(
        f_userinfo=1,
        f_title=t("Тариф «Орбита»", "Orbit plan"),
        f_svcname="Nebula VPN",
        f_activetext=t("Nebula на связи", "Nebula has you covered"),
        f_logo="https://nebula.example/logo-512.png",
        f_serverinfo="Auto",
        f_support="https://nebula.example/help",
        f_buyplan="https://nebula.example/billing",
        f_buytraffic="https://nebula.example/billing/traffic",
        f_announce=t(
            "Профилактика на узлах DE 14 апреля, 02:00–04:00 МСК.",
            "Maintenance on the DE nodes on 14 April, 02:00–04:00 UTC.",
        ),
        f_interval="60",
        f_theme=1, f_hex="7C5CFF", f_variant="expressive", f_pureblack=1,
        f_bg=1, f_bgurl="https://nebula.example/bg.webp", f_bgop="14",
        f_ring=1,
        f_view=1, f_view_sort="delay", f_view_layout="tight", f_view_card="shrink",
        f_widgets=1, f_custom="update",
        f_settings=1,
        f_fallback="sub2.nebula.example, sub3.nebula.example",
        f_aliases=1,
        widgets=["announce", "metaInfo", "serviceInfo", "networkSpeed",
                 "trafficUsage", "outboundModeV2", "networkDetection",
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
        # The connection screen, word for word as the application sets it:
        # lib/l10n/intl/messages_{ru,en}.dart. A preview that paraphrased the
        # client would be a mock-up of a different app.
        "heroDur": t("12 минут", "12 minutes"),
        "heroFree": t("свободно из {n}", "free of {n}"),
        "heroMore": t("Показать сведения о подписке", "Show subscription details"),
        "heroPause": t("Пауза", "Pause"),
        "heroProtected": t("Вы защищены", "You are protected"),
        "heroRemaining": t("Осталось", "Remaining"),
        "heroRenew": t("Продлить подписку", "Renew subscription"),
        "heroSince": t("Подключено {n}", "Connected {n}"),
        "heroSmart": t("Умная маршрутизация включена", "Smart routing is on"),
        "heroSub": t("Подписка", "Subscription"),
        "heroTopUp": t("Докупить трафик", "Top up traffic"),
        "heroUnlimited": t("без ограничений", "unlimited"),
        "heroUpdate": t("Обновить", "Update"),
        # meta_info.dart: the subscription tile's status line. {n} is the
        # number of days and {D} its noun — daysLeft() in the client is an
        # ICU plural, and plural() here is the same rule spelled out.
        "metaDays": t("{n} {D}", "{n} {D} left"),
        "metaPerpetual": t("Бессрочная подписка", "Perpetual subscription"),
        "metaRemaining": t("Осталось", "Remaining"),
        "metaUsed": t("Использовано", "Used traffic"),
        "lblBg": t("Фон", "Background"),
        "lblBuyPlan": t("Тариф", "Plan"),
        "lblBuyTraffic": t("Трафик", "Traffic"),
        "lblLogo": t("Логотип", "Logo"),
        "lblSupport": t("Поддержка", "Support"),
        "linkCopied": t("Ссылка скопирована", "Link copied"),
        # The four routing modes exactly as the client labels them —
        # arb/intl_{ru,en}.arb, keys auto / rule / global / direct.
        "modeAuto": t("Авто", "Auto"),
        "modeDirect": t("Прямой", "Direct"),
        "modeGlobal": t("Глобальный", "Global"),
        "modeRule": t("Правило", "Rule"),
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
        "undo": t("Вернуть как было", "Undo"),
        "undoHint": t("Отменить пресет «{n}» и вернуть прежние значения полей",
                      "Undo the \u201c{n}\u201d preset and bring the old values back"),
        "presets": {"minimal": minimal, "brand": brand, "full": full},
    }


def builder_form(ctx):
    t = ctx.t
    L = 0 if ctx.lang == "ru" else 1

    # --- 01 subscription --------------------------------------------------
    g_sub = (
        chk("f_userinfo", t("Отдавать <code>subscription-userinfo</code>",
                            "Send <code>subscription-userinfo</code>"), True)
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

    # The nine blocks used to stand open all at once, which made the form a
    # single 4000-pixel column: the five that most providers never touch were
    # in the way of the four they always do. Each block now names the headers
    # it emits, so a shut one still says what is inside it.
    groups = [
        ("01", t("Подписка и трафик", "Subscription and traffic"),
         "Subscription-Userinfo · ReClash-AutoUpdateInterval", g_sub, True),
        ("02", t("Сервис", "Service"),
         "ReClash-ServiceName · ActiveText · ServiceLogo · ServerInfo", g_service, False),
        ("03", t("Ссылки и объявление", "Links and announcement"),
         "ReClash-SupportURL · BuyPlan · BuyTraffic · Announce", g_links, False),
        ("04", t("Тема и кольцо", "Theme and ring"),
         "ReClash-Hex · ReClash-HeroRing", g_theme, False),
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
    ]
    return (
        '<form class="builder__form" id="builder" novalidate>'
        + "".join(group(*g) for g in groups)
        + "</form>"
    )


def builder_output(ctx):
    t = ctx.t
    panes = [("http", "HTTP"), ("nginx", "nginx"), ("caddy", "Caddy"),
             ("php", "PHP"), ("go", "Go"), ("py", "Python")]
    tabs = "".join(
        '<button type="button" role="tab" id="tab-%s" aria-controls="tp-%s" '
        'aria-selected="%s" tabindex="%s">%s</button>'
        % (key, key, "true" if i == 0 else "false", "0" if i == 0 else "-1", esc(label))
        for i, (key, label) in enumerate(panes)
    )
    panels = "".join(
        '<div class="tabpanel" id="tp-%s" role="tabpanel" aria-labelledby="tab-%s"%s>'
        '<div class="codeblock builder__code">'
        '<button class="copy" type="button" data-done-label="%s">%s</button>'
        '<pre><code id="out-%s"></code></pre></div></div>'
        % (key, key, "" if i == 0 else " hidden",
           esc(t("готово", "copied")), esc(t("копировать", "copy")), key)
        for i, (key, label) in enumerate(panes)
    )

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
        '<div class="tabs" data-tabs role="tablist" aria-label="'
        + esc(t("Формат вывода", "Output format")) + '">'
        + tabs + "</div>"
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


# The four bottom-bar destinations, in the application's own order.
NAV = [
    ("Панель", "Dashboard",
     '<path d="M4 18a9 9 0 1 1 16 0"/><path d="m12 14 4-4"/>'),
    ("Прокси", "Proxies",
     '<circle cx="6" cy="4.5" r="2"/><circle cx="18" cy="19.5" r="2"/>'
     '<path d="M6 6.5v5a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v.5"/>'),
    ("Правила", "Rules",
     '<path d="M4 12h5l3-5h8"/><path d="M12 17h8"/><circle cx="9" cy="12" r="1.4"/>'),
    ("Ещё", "More",
     '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/>'
     '<circle cx="19" cy="12" r="1.6"/>'),
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
        '<div class="tabs" role="tablist" aria-label="'
        + esc(t("Экран превью", "Preview screen")) + '">' + tabs + "</div>"
        # data-screen carries the active screen to CSS: the connect screen owns
        # its own ring, so the widget screen's floating button has to go away
        # rather than float over the orb.
        '<div class="phone" id="pv-phone" data-screen="hero">'
        '<div class="phone__screen">'
        '<div class="phone__bgimg" id="pv-bg"></div>'
        '<div class="phone__status"><span>9:41</span>'
        '<span class="phone__title" id="pv-title">'
        + esc(t("Панель", "Dashboard")) + "</span>"
        '<span class="phone__sig" aria-hidden="true"><i></i><i></i><i></i></span></div>'
        '<div class="phone__content" id="pv-screen"></div>'
        '<div class="phone__fab" id="pv-fab">'
        '<span class="fab__ring" aria-hidden="true"></span>'
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>'
        "</div>"
        '<div class="phone__nav">' + nav + "</div>"
        "</div></div>"
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
    return (
        '<section class="section section--tight" id="tool">'
        '<div class="shell">'
        + rubric("01", t("конструктор", "the builder"))
        + '<div class="split" style="margin-bottom:var(--step-4)">'
        + '<h2 class="statement">'
        + t("Соберите заголовки <em>здесь</em> — и сразу посмотрите, что увидит пользователь.",
            "Assemble the headers <em>here</em> — and watch what the user will see.")
        + "</h2>"
        + '<div><p class="lede">' + esc(t(
            "Форма проверяет значения по тем же правилам, что и клиент: HTTPS, "
            "диапазоны, длину объявления, порты в запасных хостах. Справа — готовый "
            "фрагмент для nginx, Caddy, PHP, Go или Python.",
            "The form validates values by the same rules as the client: HTTPS, ranges, "
            "announcement length, ports in fallback hosts. On the right — a ready snippet "
            "for nginx, Caddy, PHP, Go or Python.",
        )) + "</p></div></div>"
        + presets
        + '<div class="builder">'
        + builder_form(ctx)
        + builder_output(ctx)
        + "</div>"
        + builder_foot(ctx)
        + "</div>"
        + json_block("builder-strings", builder_strings(ctx))
        + json_block("widget-spec", spec.widget_spec(ctx.lang))
        + "</section>"
    )


# --------------------------------------------------------------- reference


TOC = [
    ("tool", "Конструктор", "The builder", "builder generator форма"),
    ("overview", "Как это работает", "How it works", "overview обзор"),
    ("rules", "Правила разбора", "Parsing rules", "case base64 приоритет priority"),
    ("common", "Общие заголовки", "Common headers",
     "subscription-userinfo profile-title content-disposition support-url announce"),
    ("reclash", "Заголовки ReClash", "ReClash headers", "reclash-* список list"),
    ("theme", "Тема и оформление", "Theme and looks",
     "reclash-hex background heroring pureblack цвет colour"),
    ("view", "Страница прокси", "Proxy page", "reclash-view type sort layout icon card"),
    ("widgets", "Виджеты панели", "Dashboard widgets", "reclash-widgets custom"),
    ("settings", "Настройки по умолчанию", "Default settings", "reclash-settings autorun"),
    ("migration", "Смена домена", "Domain migration", "reclash-newdomain fallbackhosts"),
    ("aliases", "Совместимость", "Compatibility", "flclashx алиасы aliases приоритет"),
    ("hwid", "Устройства и HWID", "Devices and HWID", "x-hwid x-device-os лимит limit"),
    ("checklist", "Чеклист внедрения", "Rollout checklist", "checklist проверка testing"),
]


def toc(ctx):
    t = ctx.t
    items = "".join(
        '<li data-keys="%s"><a href="#%s">%s</a></li>'
        % (esc(keys), key, esc(t(ru, en)))
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
    L = 0 if ctx.lang == "ru" else 1
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
        '<dl class="deflist">'
        + "".join("<div><dt>" + esc(a) + "</dt><dd>" + b + "</dd></div>" for a, b in rules)
        + "</dl>"))

    # -- common -----------------------------------------------------------
    rows = [
        ["<code>" + esc(name) + "</code>",
         '<span class="mono faint">' + (ru_v if L == 0 else en_v) + "</span>",
         ru_b if L == 0 else en_b]
        for name, ru_v, en_v, ru_b, en_b in spec.COMMON_HEADERS
    ]
    out.append(sec("common", t("Общие заголовки", "Common headers"),
        "<p>" + t(
            "Эти заголовки понимают многие клиенты Clash. Если вы их уже отдаёте — "
            "ReClash подхватит их без изменений на вашей стороне.",
            "Many Clash clients understand these. If you already send them, ReClash picks "
            "them up with no change on your side.",
        ) + "</p>"
        + table([t("Заголовок", "Header"), t("Значение", "Value"), t("Что делает", "What it does")], rows)))

    # -- reclash ----------------------------------------------------------
    rows = [
        ["<code>" + esc(name) + "</code>",
         '<span class="mono faint">' + (ru_v if L == 0 else en_v) + "</span>",
         ru_p if L == 0 else en_p]
        for name, ru_v, en_v, ru_p, en_p in spec.RECLASH_HEADERS
    ]
    out.append(sec("reclash", t("Заголовки ReClash", "ReClash headers"),
        "<p>" + t(
            "Семнадцать заголовков, которые понимает только ReClash. Все они "
            "необязательны — берите ровно те, которые вам нужны.",
            "Seventeen headers only ReClash understands. Every one is optional — take "
            "exactly the ones you need.",
        ) + "</p>"
        + table([t("Заголовок", "Header"), t("Значение", "Value"), t("Назначение", "Purpose")], rows)))

    # -- theme ------------------------------------------------------------
    var_rows = [
        ["<code>" + v + "</code>", ru if L == 0 else en]
        for v, ru, en in spec.THEME_VARIANTS
    ]
    out.append(sec("theme", t("Тема и оформление", "Theme and looks"),
        sig("reclash-hex", (t("псевдоним flclashx-hex", "alias flclashx-hex"), True))
        + "<p>" + t(
            "Значение — цвет <code>RRGGBB</code> или <code>AARRGGBB</code>, за ним "
            "необязательный вариант палитры и необязательный <code>pureblack</code>. "
            "Разделители — <code>:</code>, <code>;</code> или <code>,</code>.",
            "The value is an <code>RRGGBB</code> or <code>AARRGGBB</code> colour, followed "
            "by an optional palette variant and an optional <code>pureblack</code>. "
            "Separators are <code>:</code>, <code>;</code> or <code>,</code>.",
        ) + "</p>"
        + codeblock("ReClash-Hex: 2FD3B6\nReClash-Hex: 2FD3B6:vibrant\n"
                    "ReClash-Hex: FF7C5CFF;expressive;pureblack",
                    t("копировать", "copy"), t("готово", "copied"))
        + table([t("Вариант", "Variant"), t("Что даёт", "What it does")], var_rows)
        + "<h3>" + esc(t("Фон панели", "Dashboard background")) + "</h3>"
        + sig("reclash-background", (t("псевдоним flclashx-background", "alias flclashx-background"), True))
        + "<p>" + t(
            "Абсолютный <code>http</code>- или <code>https</code>-адрес картинки и "
            "необязательная непрозрачность 1–100. По умолчанию 10 — фон должен "
            "оставаться фоном.",
            "An absolute <code>http</code> or <code>https</code> image URL and an optional "
            "opacity from 1 to 100. The default is 10 — a background should stay a background.",
        ) + "</p>"
        + codeblock("ReClash-Background: https://nebula.example/bg.webp,14",
                    t("копировать", "copy"), t("готово", "copied"))
        + "<h3>" + esc(t("Кольцо подключения", "Connection ring")) + "</h3>"
        + sig("reclash-heroring")
        + "<p>" + t(
            "Ровно три цвета — градиент кольца вокруг кнопки подключения. Меньше или "
            "больше трёх значений игнорируется целиком. Псевдонима у этого заголовка нет.",
            "Exactly three colours — the gradient of the ring around the connect button. "
            "Fewer or more than three values are ignored entirely. This header has no alias.",
        ) + "</p>"
        + codeblock("ReClash-HeroRing: 7C5CFF;3686ED;2FD3B6",
                    t("копировать", "copy"), t("готово", "copied"))
        + "<h3>" + esc(t("Логотип", "Logo")) + "</h3>"
        + sig("reclash-servicelogo", (t("псевдоним flclashx-servicelogo", "alias flclashx-servicelogo"), True))
        + "<ul>"
        + "".join("<li>" + x + "</li>" for x in t(
            ["Абсолютный HTTPS-адрес, PNG или SVG.",
             "Квадрат, 256–512 px по стороне.",
             "Прозрачный фон — логотип ложится на тему пользователя.",
             "Значимая часть — в центральных 80 %: края обрезаются под скругление."],
            ["An absolute HTTPS URL, PNG or SVG.",
             "Square, 256–512 px per side.",
             "Transparent background — the logo sits on the user's theme.",
             "Keep the meaningful part inside the central 80 %: edges get rounded off."],
        )) + "</ul>"))

    # -- view -------------------------------------------------------------
    view_rows = []
    for name, values, ru, en in spec.VIEW_TOKENS:
        view_rows.append([
            "<code>" + name + "</code>",
            " ".join("<code>" + v + "</code>" for v in values),
            esc(ru if L == 0 else en),
        ])
    out.append(sec("view", t("Страница прокси", "Proxy page"),
        sig("reclash-view", (t("псевдоним flclashx-view", "alias flclashx-view"), True))
        + "<p>" + t(
            "Токены вида <code>ключ:значение</code> через запятую или точку с запятой. "
            "Неизвестные ключи и значения отбрасываются, остальные применяются. "
            "Это предложение, а не приказ: пользователь может переключить вид сам.",
            "Tokens of the form <code>key:value</code>, comma- or semicolon-separated. "
            "Unknown keys and values are dropped, the rest apply. It is a suggestion, not "
            "an order: the user can switch the view back.",
        ) + "</p>"
        + table([t("Ключ", "Key"), t("Значения", "Values"), t("Что задаёт", "What it sets")], view_rows)
        + codeblock("ReClash-View: type:tab; sort:delay; layout:tight; icon:standard; card:shrink",
                    t("копировать", "copy"), t("готово", "copied"))))

    # -- widgets ----------------------------------------------------------
    w_rows = [
        ["<code>" + wid + "</code>",
         esc(ru if L == 0 else en),
         '<span class="faint">' + esc(spec.PLATFORM_LABEL[plat][L]) + "</span>"]
        for wid, plat, ru, en, _ in spec.WIDGETS
    ]
    out.append(sec("widgets", t("Виджеты панели", "Dashboard widgets"),
        sig("reclash-widgets")
        + "<p>" + t(
            "Имена виджетов через запятую — порядок в списке становится порядком на "
            "панели. Виджеты, недоступные на платформе, просто не появятся.",
            "Comma-separated widget names — their order becomes the order on the dashboard. "
            "Widgets unavailable on a platform simply do not appear.",
        ) + "</p>"
        + table([t("Имя", "Name"), t("Виджет", "Widget"), t("Доступен", "Available on")], w_rows)
        + '<p class="faint">' + t(
            "Имена <code>desyncStrategy</code>, <code>desyncTest</code> и "
            "<code>desyncEngine</code> клиент распознаёт, но они относятся только к "
            "режиму ByeDPI. Профиль панели работает в VPN-режиме, поэтому такими "
            "заголовками эти карточки показать нельзя.",
            "The client recognises <code>desyncStrategy</code>, <code>desyncTest</code> "
            "and <code>desyncEngine</code>, but they belong to ByeDPI mode only. A panel "
            "profile runs in VPN mode, so its headers cannot make those cards appear.",
        ) + "</p>"
        + "<h3><code>reclash-custom</code></h3>"
        + "<p>" + t(
            "Управляет тем, как ваш список сливается с уже собранным пользователем: "
            "<code>add</code> добавляет недостающие виджеты в конец, <code>update</code> "
            "заменяет набор целиком. Без этого заголовка набор предлагается только при "
            "первом добавлении профиля.",
            "Controls how your list merges with the one the user already assembled: "
            "<code>add</code> appends the missing widgets, <code>update</code> replaces the "
            "whole set. Without this header the set is suggested only when the profile is "
            "first added.",
        ) + "</p>"
        + codeblock("ReClash-Widgets: serviceInfo,networkSpeed,trafficUsage,outboundModeV2\n"
                    "ReClash-Custom: update",
                    t("копировать", "copy"), t("готово", "copied"))))

    # -- settings ---------------------------------------------------------
    s_rows = [["<code>" + tok + "</code>", esc(ru if L == 0 else en)]
              for tok, ru, en in spec.SETTINGS_TOKENS]
    out.append(sec("settings", t("Настройки по умолчанию", "Default settings"),
        sig("reclash-settings")
        + "<p>" + t(
            "Токены через запятую. Применяются <strong>один раз</strong> — при первом "
            "добавлении профиля. Дальше настройками владеет пользователь, и повторная "
            "отправка ничего не изменит.",
            "Comma-separated tokens. They apply <strong>once</strong> — when the profile is "
            "first added. After that the settings belong to the user, and re-sending the "
            "header changes nothing.",
        ) + "</p>"
        + table([t("Токен", "Token"), t("Что включает", "What it turns on")], s_rows)
        + notice("<span>" + t(
            "Не включайте всё подряд. Автозапуск и автоподключение — это решение "
            "пользователя, а не ваше.",
            "Do not switch everything on. Autostart and auto-connect are the user's "
            "decision, not yours.",
        ) + "</span>", "notice--warn")))

    # -- migration --------------------------------------------------------
    out.append(sec("migration", t("Смена домена", "Domain migration"),
        sig("reclash-newdomain", (t("псевдоним flclashx-newdomain", "alias flclashx-newdomain"), True))
        + "<p>" + t(
            "Только имя хоста и необязательный порт — без схемы, пути и параметров. "
            "Клиент не переключается вслепую: он проверяет, что новый адрес действительно "
            "отдаёт вашу подписку, и только потом переносит профиль.",
            "A hostname and an optional port only — no scheme, path or query. The client "
            "does not switch blindly: it verifies that the new address really serves your "
            "subscription, and only then migrates the profile.",
        ) + "</p>"
        + codeblock("ReClash-NewDomain: sub.nebula.example\n"
                    "ReClash-NewDomain: sub.nebula.example:8443",
                    t("копировать", "copy"), t("готово", "copied"))
        + "<h3>" + esc(t("Запасные хосты", "Fallback hosts")) + "</h3>"
        + sig("reclash-fallbackhosts")
        + "<p>" + t(
            "До четырёх имён хостов через запятую — без портов и без схемы. Имена "
            "приводятся к нижнему регистру, дубликаты убираются, лишнее отбрасывается. "
            "Клиент идёт к ним, когда основной адрес временно недоступен. "
            "Псевдонима у этого заголовка нет.",
            "Up to four comma-separated hostnames — no ports, no scheme. Names are "
            "lowercased, duplicates removed, the excess dropped. The client falls back to "
            "them when the main address is temporarily unreachable. This header has no alias.",
        ) + "</p>"
        + codeblock("ReClash-FallbackHosts: sub2.nebula.example,sub3.nebula.example",
                    t("копировать", "copy"), t("готово", "copied"))))

    # -- aliases ----------------------------------------------------------
    a_rows = []
    for ru, en, chain in spec.ALIASES:
        unit = lambda x: (x.replace("{m}", t("мин.", "min"))
                           .replace("{h}", t("ч.", "h")))
        cells = " <span class=\"faint\">&rarr;</span> ".join(
            "<code>" + esc(unit(x)) + "</code>" for x in chain
        )
        a_rows.append([esc(ru if L == 0 else en), cells])
    out.append(sec("aliases", t("Совместимость", "Compatibility"),
        "<p>" + t(
            "ReClash читает часть заголовков FlClashX, чтобы провайдерам не пришлось "
            "ничего переделывать. Порядок в таблице — порядок приоритета: побеждает "
            "первый непустой.",
            "ReClash reads some FlClashX headers so providers do not have to redo anything. "
            "The order in the table is the priority order: the first non-empty value wins.",
        ) + "</p>"
        + table([t("Что задаётся", "What it sets"), t("Приоритет", "Priority")], a_rows)
        + notice("<span>" + t(
            "У кольца, виджетов, <code>reclash-custom</code>, <code>reclash-settings</code> "
            "и запасных хостов псевдонимов нет — это возможности ReClash.",
            "The hero ring, widgets, <code>reclash-custom</code>, <code>reclash-settings</code> "
            "and fallback hosts have no aliases — they are ReClash features.",
        ) + "</span>", "notice--info")))

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
        + table([t("Заголовок ответа", "Response header"), t("Что покажет клиент", "What the client shows")], res_rows)
        + notice("<strong>" + esc(t("Важно.", "Important.")) + "</strong> <span>" + t(
            "Не используйте эти заголовки как границу аутентификации. Они приходят от "
            "клиента, их можно подделать, и они предназначены для удобства, а не для "
            "контроля доступа.",
            "Do not use these headers as an authentication boundary. They come from the "
            "client, they can be forged, and they exist for convenience rather than access "
            "control.",
        ) + "</span>", "notice--warn")))

    # -- checklist --------------------------------------------------------
    steps = t(
        [
            "Отдавайте <code>subscription-userinfo</code> — это самое заметное для пользователя.",
            "Добавьте <code>reclash-servicename</code> и логотип: панель перестаёт быть безымянной.",
            "Поставьте <code>reclash-supporturl</code> — меньше писем «куда писать».",
            "Выберите цвет через <code>reclash-hex</code> и проверьте его в превью выше.",
            "Проверьте ответ курлом: <code>curl -sI 'https://…/sub' | grep -i reclash</code>.",
            "Убедитесь, что заголовки доживают до клиента через ваш прокси и CDN.",
            "Не отправляйте <code>reclash-settings</code> без причины.",
            "Не полагайтесь на HWID для контроля доступа.",
        ],
        [
            "Send <code>subscription-userinfo</code> — it is the most visible thing to the user.",
            "Add <code>reclash-servicename</code> and a logo: the dashboard stops being nameless.",
            "Set <code>reclash-supporturl</code> — fewer “where do I write?” messages.",
            "Pick a colour via <code>reclash-hex</code> and check it in the preview above.",
            "Verify with curl: <code>curl -sI 'https://…/sub' | grep -i reclash</code>.",
            "Make sure the headers survive your reverse proxy and CDN.",
            "Do not send <code>reclash-settings</code> without a reason.",
            "Do not rely on HWID for access control.",
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
    t = ctx.t
    body = "".join([
        '<section class="pagehead"><div class="shell">',
        '<p class="eyebrow">' + esc(t("Для провайдеров", "For providers")) + "</p>",
        "<h1>" + t("Заголовки <span class=\"grad\">подписки</span>",
                   "Subscription <span class=\"grad\">headers</span>") + "</h1>",
        '<p class="lede">' + esc(t(
            "Полный справочник по заголовкам ответа, которые читает ReClash, "
            "и конструктор, который соберёт их за вас — с живым превью приложения.",
            "The complete reference for the response headers ReClash reads, plus a builder "
            "that assembles them for you — with a live preview of the app.",
        )) + "</p>",
        '<p class="pagehead__meta">',
        chip("17 reclash-*"), chip(t("6 общих", "6 common")),
        chip(t("12 псевдонимов", "12 aliases")), chip("HWID"),
        "</p></div></section>",
        section_builder(ctx),
        '<section class="section"><div class="shell">',
        rubric("02", t("справочник", "the reference")),
        '<div class="doc">' + toc(ctx) + doc_body(ctx) + "</div>",
        "</div></section>",
    ])
    return {
        "active": "headers",
        "title": t("Заголовки подписки для провайдеров",
                   "Subscription headers for providers"),
        "description": t(
            "Справочник по заголовкам ответа подписки для ReClash: тема, виджеты, "
            "объявления, лимиты трафика, HWID — и конструктор с живым превью.",
            "Reference for ReClash subscription response headers: theme, widgets, "
            "announcements, traffic limits, HWID — plus a builder with a live preview.",
        ),
        "body": body,
        "css": ("preview.css", "docs.css"),
        "js": ("builder.js",),
    }
