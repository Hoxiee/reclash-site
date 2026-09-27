"""Page skeleton: <head>, masthead, footer. Shared by all four pages."""

from . import ui, seo
from .ui import esc, icon, brand_icon, mark, ticks

# "download" is intentionally absent: the masthead already carries a prominent
# "Скачать" CTA on the right, so a second nav link to the same page is noise.
# The page still exists (footer links to it, and the CTA points at it).
NAV = (
    ("index", "Клиент", "Client"),
    ("gallery", "Галерея", "Gallery"),
    ("start", "Старт и FAQ", "Start & FAQ"),
    ("dev", "Разработчикам", "Developers"),
)

FILE = {
    "index": "index.html",
    "gallery": "gallery.html",
    "docs": "docs.html",
    "builder": "builder.html",
    "reference": "reference.html",
    "download": "download.html",
    "start": "start.html",
    "mock": "mock-subs.html",
    "report": "report.html",
}

# A nav item may open a hover/focus sub-menu instead of being a plain link.
# Each entry is (page-key, ru, en). The "Разработчикам" item is the provider
# toolchain: the docs, the header catalogue, the builder and the mock
# subscriptions all live under it. It sits last in NAV, next to the language
# switch, so the client-facing links come first. Keyed by NAV key so any page's
# masthead grows the same drop-down.
SUBNAV = {
    "dev": (
        ("docs", "Документация", "Documentation"),
        ("reference", "Заголовки", "Headers"),
        ("builder", "Конструктор", "Builder"),
        ("mock", "Мок-подписки", "Mock subs"),
        ("report", "Отчёт подписки", "Subscription report"),
    ),
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


def _nav_item(ctx, key, ru, en, active):
    """One masthead entry. A key in SUBNAV becomes a hover/focus drop-down whose
    items are separate pages (the builder and the reference); every other key is
    a plain link.

    The parent points at its first sub-page and lights up as current whenever
    any of its sub-pages is active. A keyboard user who never triggers hover
    still reaches that first page by clicking, and the sub-menu is progressive:
    with no CSS it is just two more links, and core.js closes the mobile menu on
    any of them because they are `.nav a` too."""
    sub = SUBNAV.get(key)
    if not sub:
        current = ' aria-current="page"' if key == active else ""
        return '<a href="%s"%s>%s</a>' % (ctx.page(key), current, esc(ctx.t(ru, en)))
    sub_keys = [sk for sk, _, _ in sub]
    parent_current = ' aria-current="page"' if active in sub_keys else ""
    chevron = ('<svg class="nav__chev" viewBox="0 0 24 24" aria-hidden="true">'
               '<path d="m7 10 5 5 5-5"/></svg>')
    items = "".join(
        '<a href="%s" role="menuitem"%s>%s</a>'
        % (ctx.page(sk), ' aria-current="page"' if sk == active else "",
           esc(ctx.t(sru, sen)))
        for sk, sru, sen in sub
    )
    return (
        '<div class="nav__item nav__item--has-sub">'
        '<a href="%s"%s aria-haspopup="true">%s%s</a>'
        '<div class="nav__sub" role="menu" aria-label="%s">%s</div>'
        "</div>"
        % (ctx.page(sub_keys[0]), parent_current, esc(ctx.t(ru, en)), chevron,
           esc(ctx.t(ru, en)), items)
    )


def masthead(ctx, active):
    links = "".join(
        _nav_item(ctx, key, ru, en, active) for key, ru, en in NAV
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
            (t("Документация по заголовкам", "Header documentation"), ctx.page("docs"), False),
            (t("Справочник по заголовкам", "Header reference"), ctx.page("reference"), False),
            (t("Конструктор заголовков", "Header builder"), ctx.page("builder"), False),
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


def document(ctx, *, active, title, description, body, css=(), js=(), css_defer=(), head_extra="", faq=None):
    other_lang = "en" if ctx.lang == "ru" else "ru"
    # Fonts are discovered only after fonts.css parses, so the display and body
    # faces the first screen always needs start late. Preload the one subset the
    # page's language actually renders — Cyrillic for ru, Latin for en — so the
    # fetch runs in parallel with the stylesheets instead of after them. Only the
    # two above-the-fold faces (Unbounded display, Onest body); the mono subset
    # is code-only and can swap in later without a preload.
    sub = "cyrillic" if ctx.lang == "ru" else "latin"
    font_preload = "".join(
        '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>'
        % esc(ctx.asset("assets/fonts/%s-%s.woff2" % (family, sub)))
        for family in ("onest", "unbounded")
    )
    styles = "".join(
        '<link rel="stylesheet" href="%s">' % esc(ctx.asset("assets/css/" + name))
        for name in ("fonts.css", "base.css", "site.css") + tuple(css)
    )
    # Below-the-fold or JS-driven styles that must not block the first paint.
    # `media="print"` lets the browser fetch the sheet at a low, non-blocking
    # priority; the onload flips it to `all` once it lands. A <noscript> copy
    # restores it as a normal blocking stylesheet when JS is off, so the markup
    # still renders styled without the loop that would otherwise apply it.
    deferred = tuple(css_defer)
    deferred_styles = "".join(
        '<link rel="stylesheet" href="%(h)s" media="print" '
        'onload="this.media=\'all\'">'
        '<noscript><link rel="stylesheet" href="%(h)s"></noscript>'
        % {"h": esc(ctx.asset("assets/css/" + name))}
        for name in deferred
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
        '<meta name="robots" content="%(robots)s">\n'
        '<meta name="color-scheme" content="dark">\n'
        '<meta name="theme-color" content="#07060b">\n'
        '<link rel="icon" href="%(favsvg)s" type="image/svg+xml">\n'
        '<link rel="alternate icon" href="%(favico)s" sizes="16x16 32x32 48x48">\n'
        '<link rel="apple-touch-icon" href="%(apple)s">\n'
        '<link rel="manifest" href="%(manifest)s">\n'
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
        '<meta property="og:image:secure_url" content="%(og)s">\n'
        '<meta property="og:image:type" content="image/png">\n'
        '<meta property="og:image:width" content="1200">\n'
        '<meta property="og:image:height" content="630">\n'
        '<meta property="og:image:alt" content="%(ogalt)s">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        '<meta name="twitter:title" content="%(title)s">\n'
        '<meta name="twitter:description" content="%(desc)s">\n'
        '<meta name="twitter:image" content="%(og)s">\n'
        '<meta name="twitter:image:alt" content="%(ogalt)s">\n'
        "%(fontpreload)s\n"
        "%(styles)s\n"
        "%(deferred_styles)s"
        "%(ldjson)s"
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
            "robots": ("noindex, follow" if active in ui.NOINDEX else
                       "index, follow, max-image-preview:large, "
                       "max-snippet:-1, max-video-preview:-1"),
            "ogalt": esc(ctx.t("ReClash — открытый клиент для mihomo",
                               "ReClash — an open-source mihomo client")),
            "manifest": esc(ctx.asset("site.webmanifest")),
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
            "fontpreload": font_preload,
            "styles": styles,
            "deferred_styles": deferred_styles,
            "ldjson": seo.jsonld(ctx, active, title, description, faq=faq),
            "scripts": scripts,
            "head_extra": head_extra,
            "skip": esc(ctx.t("К содержимому", "Skip to content")),
            "masthead": masthead(ctx, active),
            "body": body,
            "footer": footer(ctx),
        }
    )
