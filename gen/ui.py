"""Shared markup: the logo, icon set, page chrome and editorial primitives.

Every page is rendered twice — once per language — from the same functions, so
the two versions cannot drift apart.
"""

from html import escape as _esc

# --------------------------------------------------------------------- links

GITHUB = "https://github.com/Hoxiee/ReClash"
GITHUB_RELEASES = GITHUB + "/releases"
GITHUB_ISSUES = GITHUB + "/issues"
REPO = "Hoxiee/ReClash"
TELEGRAM = "https://t.me/ReClashApp"
UPSTREAM_FLCLASH = "https://github.com/chen08209/FlClash"
UPSTREAM_MIHOMO = "https://github.com/MetaCubeX/mihomo"
UPSTREAM_BYEDPI = "https://github.com/hufrea/byedpi"
LICENSE_URL = GITHUB + "/blob/main/LICENSE"
HEADERS_SRC = GITHUB + "/blob/main/PROVIDER_HEADERS.md"

PAGES = ("index", "gallery", "docs", "builder", "reference", "download", "start", "mock", "report")

# Rendered and reachable, but kept out of the sitemap and marked noindex:
# the mock-subscriptions page is test scaffolding, not something to surface
# in search.
NOINDEX = ("mock", "report")


def esc(text):
    return _esc(str(text), quote=True)


# ---------------------------------------------------------------- logo mark

# Geometry copied verbatim from assets_source/images/icon/status_3.svg.
# Never redraw these paths by eye.
MARK_PATHS = (
    ("M137.3,225.8 L184.5,355.5"),
    ("M208.8,126.3 L303.2,385.7"),
    ("M335.3,178.1 L366.7,264.6"),
)


def mark(uid="mk", stroke=62.1, classes="", extra=""):
    """The three-stroke ReClash mark with its brand gradient."""
    paths = "".join(
        '<path class="stroke" d="%s"/>' % d for d in MARK_PATHS
    )
    return (
        '<svg viewBox="0 0 512 512" class="%s" %s aria-hidden="true" focusable="false">'
        '<defs><linearGradient id="%s" x1="106" y1="95" x2="398" y2="417" '
        'gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#7C5CFF"/>'
        '<stop offset=".52" stop-color="#3686ED"/>'
        '<stop offset="1" stop-color="#2FD3B6"/>'
        "</linearGradient></defs>"
        '<g fill="none" stroke="url(#%s)" stroke-width="%s" stroke-linecap="round">%s</g>'
        "</svg>"
    ) % (classes, extra, uid, uid, stroke, paths)


def ticks():
    return '<span class="ticks" aria-hidden="true"><i></i><i></i><i></i></span>'


# -------------------------------------------------------------------- icons

_ICONS = {
    "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    "shield": '<path d="M12 3 5 6v6c0 4.4 3 8.2 7 9.4 4-1.2 7-5 7-9.4V6z"/><path d="m9 12 2 2 4-4"/>',
    "route": '<circle cx="6" cy="4" r="2"/><circle cx="18" cy="20" r="2"/><path d="M6 6v5a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v1"/>',
    "layers": '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    "gauge": '<path d="M4 18a9 9 0 1 1 16 0"/><path d="m12 14 4-4"/><circle cx="12" cy="14" r="1.6"/>',
    "palette": '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.8-.4-1.2.4-2.2 1.6-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/>',
    "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
    "lock": '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    "code": '<path d="m8 8-5 4 5 4"/><path d="m16 8 5 4-5 4"/><path d="m13 5-2 14"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
    "wrench": '<path d="M14.5 3.5a5 5 0 0 0 6 6l-9.6 9.6a2.8 2.8 0 0 1-4-4z"/>',
    "split": '<path d="M4 12h5l3-5h8"/><path d="M12 17h8"/><path d="m17 4 3 3-3 3"/><path d="m17 14 3 3-3 3"/>',
    "chip": '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/>',
    "sparkle": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6.3 6.3 2.6 2.6M15.1 15.1l2.6 2.6M17.7 6.3l-2.6 2.6M8.9 15.1l-2.6 2.6"/>',
    "download": '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
    "link": '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 1 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 1 0 7 7l1-1"/>',
    "book": '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7"/>',
    "eye": '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/>',
    "list": '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
}

_BRAND = {
    "github": '<path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.1 4.7 18.1 5 18.1 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9A11.5 11.5 0 0 0 12 .5z"/>',
    "telegram": '<path d="M21.9 4.3 18.9 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L7.2 12.1 2.7 10.7c-1-.3-1-1 .2-1.4l18-6.9c.8-.3 1.5.2 1 1.9z"/>',
    "windows": '<path d="M3 5.5 10.3 4.5v7.1H3zM11.5 4.3 21 3v8.6h-9.5zM3 12.8h7.3v7.1L3 18.9zM11.5 12.8H21V21l-9.5-1.3z"/>',
    "apple": '<path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-1.9-.9-3.2-.8c-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.7c1.3 0 2.2-1.2 3-2.4.9-1.3 1.3-2.6 1.3-2.7 0 0-2.6-1-2.6-3.6zM14.2 4.9c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/>',
    "linux": '<path d="M12 2c2.4 0 3.6 1.9 3.6 4.3 0 1.4-.2 2.2.3 3.3.6 1.2 2.3 3 2.8 5 .3 1.1.1 2-.4 2.6.4.9.3 1.9-.3 2.4-.6.6-1.7.6-2.6.2-.8.6-2 .9-3.4.9s-2.6-.3-3.4-.9c-.9.4-2 .4-2.6-.2-.6-.5-.7-1.5-.3-2.4-.5-.6-.7-1.5-.4-2.6.5-2 2.2-3.8 2.8-5 .5-1.1.3-1.9.3-3.3C8.4 3.9 9.6 2 12 2z"/><circle cx="10.3" cy="7" r=".9" fill="#07060b"/><circle cx="13.7" cy="7" r=".9" fill="#07060b"/>',
    "android": '<path d="M6 10h12v7.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 17.5z"/><rect x="2.5" y="10" width="2.6" height="7" rx="1.3"/><rect x="18.9" y="10" width="2.6" height="7" rx="1.3"/><rect x="8.6" y="19.4" width="2.6" height="4.1" rx="1.3"/><rect x="12.8" y="19.4" width="2.6" height="4.1" rx="1.3"/><path d="M6.2 8.6a5.8 5.8 0 0 1 11.6 0z"/><path d="m7.4 3.2 1.3 2M16.6 3.2l-1.3 2" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
}


def icon(name, cls="", stroke=True):
    body = _ICONS.get(name)
    if body is None:
        return ""
    attrs = (
        'fill="none" stroke="currentColor" stroke-width="1.6" '
        'stroke-linecap="round" stroke-linejoin="round"'
        if stroke
        else 'fill="currentColor"'
    )
    return (
        '<svg viewBox="0 0 24 24" class="%s" %s aria-hidden="true" focusable="false">%s</svg>'
        % (cls, attrs, body)
    )


def brand_icon(name, cls=""):
    body = _BRAND.get(name, "")
    return (
        '<svg viewBox="0 0 24 24" class="%s" fill="currentColor" aria-hidden="true" '
        'focusable="false">%s</svg>' % (cls, body)
    )


# --------------------------------------------------------------- primitives


def rubric(num, slug):
    return (
        '<div class="rubric"><span class="rubric__num"><span>%s</span></span>'
        '<span class="rubric__slug">%s</span><span class="rubric__line"></span></div>'
        % (esc(num), esc(slug))
    )


def chip(text, live=False):
    dot = '<span class="chip__dot"></span>' if live else ""
    return '<span class="chip%s">%s%s</span>' % (
        " chip--live" if live else "",
        dot,
        esc(text),
    )


def btn(href, label, kind="", icon_name=None, external=False, attrs=""):
    ico = icon(icon_name, "btn__icon") if icon_name else ""
    rel = ' target="_blank" rel="noopener"' if external else ""
    return '<a class="btn %s" href="%s"%s %s>%s<span>%s</span></a>' % (
        kind,
        esc(href),
        rel,
        attrs,
        ico,
        esc(label),
    )


def codeblock(code, copy_label="copy", done_label="ok", lang_cls=""):
    return (
        '<div class="codeblock"><button class="copy" type="button" '
        'data-done-label="%s">%s</button><pre class="%s"><code>%s</code></pre></div>'
        % (esc(done_label), esc(copy_label), lang_cls, esc(code))
    )


def notice(text, kind=""):
    return '<p class="notice %s">%s</p>' % (kind, text)


def table(headings, rows, cls=""):
    head = "".join("<th>%s</th>" % h for h in headings)
    body = "".join(
        "<tr>%s</tr>" % "".join("<td>%s</td>" % c for c in row) for row in rows
    )
    return (
        '<div class="table-wrap"><table class="data %s"><thead><tr>%s</tr></thead>'
        "<tbody>%s</tbody></table></div>" % (cls, head, body)
    )


def _uri(text):
    """encodeURIComponent, byte for byte, so the sample rendered here matches
    the one core.js rebuilds on the first keystroke."""
    from urllib.parse import quote

    return quote(text, safe="-_.!~*'()")


def deeplink(ctx, uid, style=""):
    """The import-link builder.

    Both the landing's first-run panel and the quick-start page mount one, and
    core.js wires every instance it finds — so the markup lives here once
    instead of being copied into two page modules and drifting.

    It renders in its sample state: the output plate is never a blank strip,
    and the tool still explains itself with JavaScript switched off.
    """
    t = ctx.t
    sample = "https://sub.example/link/abc123"
    msgs = (
        ("sample", t(
            "Это пример. Вставьте свою ссылку — соберём вашу.",
            "That is a sample. Paste your own link and we will build yours.",
        )),
        ("bad", t(
            "Это не похоже на адрес подписки: он начинается с https://",
            "That does not look like a subscription address: it starts with https://",
        )),
        ("ready", t(
            "Ссылка готова — можно копировать.",
            "The link is ready — copy it.",
        )),
        ("done", t(
            "Скопировано в буфер обмена.",
            "Copied to the clipboard.",
        )),
        ("fail", t(
            "Браузер не дал доступ к буферу. Выделите ссылку и скопируйте вручную.",
            "The browser refused clipboard access. Select the link and copy it by hand.",
        )),
    )
    data = "".join(
        ' data-msg-%s="%s"' % (key, esc(text)) for key, text in msgs
    )
    return (
        '<div class="deeplink" data-state="sample" data-scheme="reclash" '
        'data-sample-url="%s"%s%s>'
        '<div class="deeplink__in">'
        '<label class="deeplink__cap" for="%s">%s</label>'
        '<input id="%s" type="url" inputmode="url" spellcheck="false" '
        'autocomplete="off" placeholder="%s">'
        "</div>"
        '<button class="btn btn--sm deeplink__act" type="button" data-make '
        'data-done-label="%s">%s</button>'
        '<div class="deeplink__res">'
        '<span class="deeplink__cap deeplink__cap--out">%s</span>'
        '<code class="deeplink__out">reclash://install-config?url=%s</code>'
        "</div>"
        '<p class="deeplink__msg" data-tone="info" role="status">%s</p>'
        "</div>"
    ) % (
        esc(sample),
        data,
        (' style="%s"' % style) if style else "",
        esc(uid),
        esc(t("Ваша ссылка на подписку", "Your subscription URL")),
        esc(uid),
        esc(sample),
        esc(t("Скопировано", "Copied")),
        esc(t("Собрать и скопировать", "Build and copy")),
        esc(t("Готовая ссылка-импорт", "The finished import link")),
        esc(_uri(sample)),
        esc(dict(msgs)["sample"]),
    )


def json_block(el_id, payload):
    import json

    text = json.dumps(payload, ensure_ascii=False)
    text = text.replace("</", "<\\/")
    return '<script type="application/json" id="%s">%s</script>' % (el_id, text)
