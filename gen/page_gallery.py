"""Gallery: screenshots and short clips of ReClash in use.

Placeholder scaffold. The tiles below are empty frames sized to the shapes the
real media will take; drop the images and clips in when they exist. Media is
served from this host (no CDN — the audience is under blocks), so every tile is
lazy and carries explicit dimensions to keep the grid from reflowing as it
fills.
"""

from . import ui
from .ui import esc, icon, chip


# The shape each slot will hold once real media lands. `span` widens a tile to
# two columns on the desktop grid; `kind` flips the corner badge and, later,
# picks <img> vs <video>. Captions are bilingual from the start so the page
# never has to be retro-fitted for the second language.
SHOTS = (
    ("wide", "shot", "Главный экран — подключение и трафик", "Home — connection and traffic"),
    ("tall", "clip", "Переключение узла на лету", "Switching nodes on the fly"),
    ("cell", "shot", "Список прокси и тест задержки", "Proxy list and latency test"),
    ("cell", "shot", "Правила маршрутизации", "Routing rules"),
    ("wide", "clip", "Обход DPI в действии", "DPI bypass in action"),
    ("cell", "shot", "Тема и акцент под провайдера", "Provider theme and accent"),
    ("cell", "shot", "Заголовки от провайдера", "Provider headers"),
    ("tall", "shot", "Экран подписки и остатка", "Subscription and quota screen"),
)

FILTERS = (
    ("all", "Всё", "All"),
    ("client", "Клиент", "Client"),
    ("bypass", "Обход", "Bypass"),
    ("themes", "Темы", "Themes"),
)


def section_hero(ctx):
    t = ctx.t
    return (
        '<section class="pagehead"><div class="shell">'
        '<p class="eyebrow">' + esc(t("Галерея", "Gallery")) + "</p>"
        "<h1>" + t('ReClash <span class="grad">в деле</span>',
                   'ReClash <span class="grad">in action</span>') + "</h1>"
        '<p class="lede">' + esc(t(
            "Скриншоты и короткие клипы: как выглядит клиент, что делает обход DPI "
            "и как провайдер настраивает вид под себя. Живые кадры появятся здесь.",
            "Screenshots and short clips: how the client looks, what the DPI bypass "
            "does, and how a provider tailors the look. Live captures land here.",
        )) + "</p>"
        '<p class="pagehead__meta">'
        + chip(t("Скоро с медиа", "Media coming soon"))
        + chip(t("Скрины и клипы", "Shots and clips"))
        + chip(t("С этого хоста", "Served from here")) + "</p></div></section>"
    )


def section_filters(ctx):
    t = ctx.t
    # Visual only for now — the real filter is wired in JS once there is media
    # to filter. Rendered as buttons so turning them live later is a no-op in
    # the markup.
    btns = "".join(
        '<button class="gfilter__btn" type="button"%s>%s</button>'
        % (' aria-pressed="true"' if key == "all" else ' aria-pressed="false"',
           esc(t(ru, en)))
        for key, ru, en in FILTERS
    )
    return (
        '<section class="section section--tight"><div class="shell">'
        '<div class="gfilter" role="group" aria-label="%s">%s</div>'
        "</div></section>" % (esc(t("Фильтр галереи", "Gallery filter")), btns)
    )


def tile(ctx, shape, kind, ru, en):
    t = ctx.t
    badge = t("Видео", "Clip") if kind == "clip" else t("Скрин", "Shot")
    glyph = icon("eye" if kind == "clip" else "layers", "shot__glyph")
    return (
        '<figure class="shot shot--%s" data-kind="%s">'
        '<div class="shot__frame">'
        '<span class="shot__badge">%s</span>'
        "%s"
        '<span class="shot__soon">%s</span>'
        "</div>"
        '<figcaption class="shot__cap">%s</figcaption>'
        "</figure>"
    ) % (shape, kind, esc(badge), glyph,
         esc(t("скоро", "soon")), esc(t(ru, en)))


def section_grid(ctx):
    tiles = "".join(tile(ctx, *s) for s in SHOTS)
    return (
        '<section class="section"><div class="shell">'
        '<div class="gallery">%s</div>'
        "</div></section>" % tiles
    )


def section_note(ctx):
    t = ctx.t
    return (
        '<section class="section section--tight"><div class="shell">'
        + ui.notice("<span>" + t(
            "Это заглушка галереи. Кадры и клипы добавим позже — сетка и подписи "
            "уже на своих местах.",
            "This is a gallery placeholder. Captures and clips come later — the "
            "grid and captions are already in place.",
        ) + "</span>", "notice--info")
        + "</div></section>"
    )


def render(ctx):
    t = ctx.t
    body = "".join([
        section_hero(ctx),
        section_filters(ctx),
        section_grid(ctx),
        section_note(ctx),
    ])
    return {
        "active": "gallery",
        "title": t("Галерея", "Gallery"),
        "description": t(
            "Скриншоты и короткие клипы ReClash: клиент, обход DPI и оформление "
            "под провайдера.",
            "Screenshots and short clips of ReClash: the client, the DPI bypass and "
            "provider theming.",
        ),
        "body": body,
        "css": ("gallery.css",),
        "js": (),
    }
