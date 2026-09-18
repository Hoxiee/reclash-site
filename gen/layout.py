"""Page skeleton: <head>, masthead, footer. Shared by all four pages."""

from . import ui
from .ui import esc, icon, brand_icon, mark, ticks

NAV = (
    ("index", "Клиент", "Client"),
    ("headers", "Заголовки", "Headers"),
    ("download", "Загрузки", "Download"),
    ("start", "Старт и FAQ", "Start & FAQ"),
)

FILE = {
    "index": "index.html",
    "headers": "headers.html",
    "download": "download.html",
    "start": "start.html",
}


class Ctx:
    """Per-language rendering context."""

    def __init__(self, lang, base_url, version_note=""):
        self.lang = lang
        self.base_url = base_url.rstrip("/")
        self.version_note = version_note

    def t(self, ru, en):
        return ru if self.lang == "ru" else en

    def page(self, key):
        return FILE[key]

    def asset(self, path):
        return "../" + path.lstrip("/")

    def other(self, key):
        other_lang = "en" if self.lang == "ru" else "ru"
        return "../%s/%s" % (other_lang, FILE[key])

    def abs_url(self, key):
        return "%s/%s/%s" % (self.base_url, self.lang, FILE[key])


# ------------------------------------------------------------------ chrome


def masthead(ctx, active):
    links = "".join(
        '<a href="%s"%s>%s</a>'
        % (
            ctx.page(key),
            ' aria-current="page"' if key == active else "",
            esc(ctx.t(ru, en)),
        )
        for key, ru, en in NAV
    )
    lang_links = "".join(
        '<a href="%s" data-lang="%s" hreflang="%s"%s>%s</a>'
        % (
            FILE[active] if code == ctx.lang else "../%s/%s" % (code, FILE[active]),
            code,
            code,
            ' aria-current="true"' if code == ctx.lang else "",
            code.upper(),
        )
        for code in ("ru", "en")
    )
    return (
        '<header class="masthead" data-open="false">'
        '<div class="shell masthead__inner">'
        '<a class="brand" href="%(home)s" aria-label="ReClash">'
        '<span class="brand__mark">%(mark)s</span>'
        '<span class="brand__word">Re<em>Clash</em></span></a>'
        '<button class="burger" type="button" aria-expanded="false" '
        'aria-label="%(menu)s"><svg viewBox="0 0 24 24" aria-hidden="true">'
        '<path d="M3 6h18M3 12h18M3 18h18"/></svg></button>'
        '<nav class="nav" aria-label="%(navlabel)s">%(links)s</nav>'
        '<div class="lang" role="group" aria-label="%(langlabel)s">%(langs)s</div>'
        '<a class="btn btn--sm masthead__cta" href="%(dl)s">%(dllabel)s</a>'
        "</div>"
        '<div class="masthead__progress" aria-hidden="true"><span></span></div>'
        "</header>"
        % {
            "home": ctx.page("index"),
            "mark": mark("mkNav"),
            "menu": esc(ctx.t("Меню", "Menu")),
            "navlabel": esc(ctx.t("Основная навигация", "Main navigation")),
            "langlabel": esc(ctx.t("Язык сайта", "Site language")),
            "links": links,
            "langs": lang_links,
            "dl": ctx.page("download"),
            "dllabel": esc(ctx.t("Скачать", "Download")),
        }
    )


def footer(ctx):
    t = ctx.t

    def col(title, items):
        li = "".join(
            '<li><a href="%s"%s>%s</a></li>'
            % (esc(href), ' target="_blank" rel="noopener"' if ext else "", esc(label))
            for label, href, ext in items
        )
        return "<div><h3>%s</h3><ul>%s</ul></div>" % (esc(title), li)

    product = col(
        t("Сайт", "Site"),
        [
            (t("Клиент", "Client"), ctx.page("index"), False),
            (t("Заголовки для провайдеров", "Provider headers"), ctx.page("headers"), False),
            (t("Загрузки", "Downloads"), ctx.page("download"), False),
            (t("Быстрый старт и FAQ", "Quick start & FAQ"), ctx.page("start"), False),
        ],
    )
    source = col(
        t("Исходники", "Source"),
        [
            ("GitHub", ui.GITHUB, True),
            (t("Релизы", "Releases"), ui.GITHUB_RELEASES, True),
            (t("Баг-трекер", "Issue tracker"), ui.GITHUB_ISSUES, True),
            ("GPL-3.0", ui.LICENSE_URL, True),
        ],
    )
    upstream = col(
        t("Стоит на плечах", "Standing on"),
        [
            ("FlClash", ui.UPSTREAM_FLCLASH, True),
            ("mihomo", ui.UPSTREAM_MIHOMO, True),
            ("ByeDPI", ui.UPSTREAM_BYEDPI, True),
        ],
    )

    return (
        '<footer class="footer"><div class="shell">'
        '<div class="footer__grid">'
        "<div><p class=\"footer__word\">Re<span class=\"grad\">Clash</span></p>"
        '<p class="footer__note">%(note)s</p>'
        '<p class="row gap-2" style="margin-top:1.15rem">'
        '<a class="chip" href="%(gh)s" target="_blank" rel="noopener">%(ghi)s GitHub</a>'
        '<a class="chip" href="%(tg)s" target="_blank" rel="noopener">%(tgi)s Telegram</a>'
        "</p></div>"
        "%(product)s%(source)s%(upstream)s"
        "</div>"
        '<div class="footer__base">'
        "<span>&copy; %(year)s ReClash</span>"
        "<span>%(license)s</span>"
        "<span>%(disclaimer)s</span>"
        '<span class="footer__live"><i aria-hidden="true"></i>%(live)s</span>'
        "</div>"
        "</div></footer>"
        % {
            "note": esc(
                t(
                    "Клиент для mihomo с обходом DPI. Не продаёт доступ, "
                    "не выдаёт подписки и не заменяет вашу осторожность.",
                    "A mihomo client with DPI bypass. It does not sell access, "
                    "does not issue subscriptions, and does not replace your own caution.",
                )
            ),
            "gh": ui.GITHUB,
            "ghi": brand_icon("github", "ico-sm"),
            "tg": ui.TELEGRAM,
            "tgi": brand_icon("telegram", "ico-sm"),
            "product": product,
            "source": source,
            "upstream": upstream,
            "year": "2026",
            "license": esc(t("Лицензия GPL-3.0", "Licensed under GPL-3.0")),
            "disclaimer": esc(
                t(
                    "Форк FlClash. Не аффилирован с FlClash, mihomo или FlClashX.",
                    "A fork of FlClash. Not affiliated with FlClash, mihomo or FlClashX.",
                )
            ),
            "live": esc(t("проект живой", "project alive")),
        }
    )


# -------------------------------------------------------------------- shell


def document(ctx, *, active, title, description, body, css=(), js=(), head_extra=""):
    other_lang = "en" if ctx.lang == "ru" else "ru"
    styles = "".join(
        '<link rel="stylesheet" href="%s">' % esc(ctx.asset("assets/css/" + name))
        for name in ("fonts.css", "base.css", "site.css") + tuple(css)
    )
    scripts = "".join(
        '<script src="%s" defer></script>' % esc(ctx.asset("assets/js/" + name))
        for name in ("core.js",) + tuple(js)
    )
    full_title = title if title.startswith("ReClash") else "%s — ReClash" % title

    return (
        "<!doctype html>\n"
        '<html lang="%(lang)s" class="no-js">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>%(title)s</title>\n"
        '<meta name="description" content="%(desc)s">\n'
        '<meta name="color-scheme" content="dark">\n'
        '<meta name="theme-color" content="#07060b">\n'
        '<link rel="icon" href="%(favsvg)s" type="image/svg+xml">\n'
        '<link rel="alternate icon" href="%(favico)s" sizes="16x16 32x32 48x48">\n'
        '<link rel="apple-touch-icon" href="%(apple)s">\n'
        '<link rel="canonical" href="%(canonical)s">\n'
        '<link rel="alternate" hreflang="%(lang)s" href="%(canonical)s">\n'
        '<link rel="alternate" hreflang="%(other)s" href="%(other_url)s">\n'
        '<link rel="alternate" hreflang="x-default" href="%(xdefault)s">\n'
        '<meta property="og:type" content="website">\n'
        '<meta property="og:site_name" content="ReClash">\n'
        '<meta property="og:locale" content="%(oglocale)s">\n'
        '<meta property="og:title" content="%(title)s">\n'
        '<meta property="og:description" content="%(desc)s">\n'
        '<meta property="og:url" content="%(canonical)s">\n'
        '<meta property="og:image" content="%(og)s">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        '<meta name="twitter:title" content="%(title)s">\n'
        '<meta name="twitter:description" content="%(desc)s">\n'
        '<meta name="twitter:image" content="%(og)s">\n'
        "%(styles)s\n"
        "%(head_extra)s"
        '<script>document.documentElement.classList.remove("no-js");</script>\n'
        "%(scripts)s\n"
        "</head>\n<body>\n"
        '<a class="skip-link" href="#main">%(skip)s</a>\n'
        # Site-wide atmosphere: drifting brand light, a masked grid and diagonal
        # beams cut on the mark's angle, a vignette. Painted once, fixed behind
        # everything, never intercepts pointer events. Degrades to a flat ink
        # panel with no JS and under reduced-motion.
        '<div class="backdrop" aria-hidden="true">'
        '<span class="backdrop__blob backdrop__blob--v"></span>'
        '<span class="backdrop__blob backdrop__blob--c"></span>'
        '<span class="backdrop__blob backdrop__blob--b"></span>'
        '<span class="backdrop__grid"></span>'
        '<span class="backdrop__beams"></span>'
        '<span class="backdrop__vignette"></span>'
        "</div>\n"
        # Soft brand-coloured light that trails the cursor. Desktop-only, added
        # by core.js so it never exists without the loop that drives it.
        "%(masthead)s\n"
        '<main id="main">\n%(body)s\n</main>\n'
        "%(footer)s\n"
        # If a deferred script never arrived (blocked, cached wrong, 404), put
        # the no-js class back so reveal blocks and FAQ answers stay readable.
        # This must wait for DOMContentLoaded: core.js is deferred, so it has not
        # run yet while the body is still parsing, and checking window.RC now
        # would re-add no-js on every load — which pins every FAQ answer open.
        # DOMContentLoaded fires after deferred scripts, so by then window.RC is
        # set in the normal case and missing only on a genuine load failure.
        "<script>addEventListener('DOMContentLoaded',function(){"
        "if(!window.RC){document.documentElement.classList.add('no-js');}"
        "});</script>\n"
        "</body>\n</html>\n"
        % {
            "lang": ctx.lang,
            "other": other_lang,
            "title": esc(full_title),
            "desc": esc(description),
            "favsvg": esc(ctx.asset("assets/img/favicon.svg")),
            "favico": esc(ctx.asset("assets/img/favicon.ico")),
            "apple": esc(ctx.asset("assets/img/apple-touch-icon.png")),
            # one card per language: a Russian link shared into a chat should not
            # preview an English headline
            "og": esc("%s/assets/img/og%s.png"
                      % (ctx.base_url, "" if ctx.lang == "ru" else "-" + ctx.lang)),
            "canonical": esc(ctx.abs_url(active)),
            "other_url": esc("%s/%s/%s" % (ctx.base_url, other_lang, FILE[active])),
            "xdefault": esc("%s/en/%s" % (ctx.base_url, FILE[active])),
            "oglocale": "ru_RU" if ctx.lang == "ru" else "en_US",
            "styles": styles,
            "scripts": scripts,
            "head_extra": head_extra,
            "skip": esc(ctx.t("К содержимому", "Skip to content")),
            "masthead": masthead(ctx, active),
            "body": body,
            "footer": footer(ctx),
        }
    )
