"""Remnawave-native integration data for the headers builder.

The builder already collects the ReClash `reclash-*` header set; this module
adds the pieces a provider pastes straight into a Remnawave panel instead of
running their own nginx/Caddy in front of the subscription:

- the fallback response formats offered for the catch-all SRR rule;
- the Subscription-Page (Subpage Builder) template — a full, opinionated
  ReClash layout the constructor ships so the provider only edits branding.

builder.js finalises the subpage config in the browser (branding, locales),
so everything here is static template data handed over via a `json_block`.
The schema follows @remnawave/subscription-page-types v0.6.2: every
`svgIconKey` used under `platforms` is present in `svgLibrary`, every
`LocalizedText` carries both bundled locales, and each platform is a wrapper
with an `apps` list rather than a bare app.
"""

# Fallback response types for the catch-all SRR rule (non-ReClash clients).
# Broad Clash compatibility is the sane default; the rest are the panel's own
# supported formats a provider might prefer.
FALLBACK_TYPES = [
    ("CLASH", "CLASH"),
    ("MIHOMO", "MIHOMO"),
    ("SINGBOX", "SINGBOX"),
    ("STASH", "STASH"),
    ("XRAY_JSON", "XRAY_JSON"),
    ("XRAY_BASE64", "XRAY_BASE64"),
]

# Bundled subpage locales. Every LocalizedText below carries exactly these,
# and builder.js narrows both the texts and config.locales to the provider's
# choice — so the saved config never declares a locale it cannot fill.
LOCALES = ["en", "ru"]

# Where each platform's "download the client" button points. Absolute and
# stable, hosted by the project itself — the subpage lives on the provider's
# panel, not on this site, so a same-host link would not resolve there.
DOWNLOAD_URL = "https://github.com/Hoxiee/ReClash/releases/latest"

# The one-click import deeplink. {{SUBSCRIPTION_LINK}} is a Remnawave subpage
# template variable, substituted by the panel per user.
IMPORT_DEEPLINK = "reclash://install-config?url={{SUBSCRIPTION_LINK}}"


def _svg_fill(body, viewbox="0 0 24 24"):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" '
        'fill="currentColor">%s</svg>' % (viewbox, body)
    )


def _svg_stroke(body):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
        'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
        'stroke-linejoin="round">%s</svg>' % body
    )


# The ReClash mark, verbatim from assets/img/logo-mark.svg (its own gradient,
# so it renders in brand colour regardless of the panel's icon tint).
_RECLASH_MARK = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" '
    'aria-label="ReClash"><defs><linearGradient id="rcMark" x1="106" y1="95" '
    'x2="398" y2="417" gradientUnits="userSpaceOnUse">'
    '<stop offset="0" stop-color="#7C5CFF"/>'
    '<stop offset=".52" stop-color="#3686ED"/>'
    '<stop offset="1" stop-color="#2FD3B6"/></linearGradient></defs>'
    '<g fill="none" stroke="url(#rcMark)" stroke-width="62.1" stroke-linecap="round">'
    '<path d="M137.3,225.8 L184.5,355.5"/>'
    '<path d="M208.8,126.3 L303.2,385.7"/>'
    '<path d="M335.3,178.1 L366.7,264.6"/></g></svg>'
)

# Platform glyphs (geometry shared with gen/ui.py brand icons) and the small
# action icons the install blocks use. IconKeys are latin-only, as the schema
# requires.
SVG_LIBRARY = {
    "reclashMark": _RECLASH_MARK,
    "pfWindows": _svg_fill(
        '<path d="M3 5.5 10.3 4.5v7.1H3zM11.5 4.3 21 3v8.6h-9.5zM3 12.8h7.3v7.1'
        'L3 18.9zM11.5 12.8H21V21l-9.5-1.3z"/>'
    ),
    "pfApple": _svg_fill(
        '<path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2'
        '-2.9.9-3.7.9s-1.9-.9-3.2-.8c-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6'
        '.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.7c1.3 0 2.2-1.2 3-2.4'
        '.9-1.3 1.3-2.6 1.3-2.7 0 0-2.6-1-2.6-3.6zM14.2 4.9c.7-.8 1.1-2 1-3.1-1 0'
        '-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/>'
    ),
    "pfLinux": _svg_fill(
        '<path d="M12 2c2.4 0 3.6 1.9 3.6 4.3 0 1.4-.2 2.2.3 3.3.6 1.2 2.3 3 2.8 5'
        '.3 1.1.1 2-.4 2.6.4.9.3 1.9-.3 2.4-.6.6-1.7.6-2.6.2-.8.6-2 .9-3.4.9s-2.6'
        '-.3-3.4-.9c-.9.4-2 .4-2.6-.2-.6-.5-.7-1.5-.3-2.4-.5-.6-.7-1.5-.4-2.6.5-2 '
        '2.2-3.8 2.8-5 .5-1.1.3-1.9.3-3.3C8.4 3.9 9.6 2 12 2z"/>'
    ),
    "pfAndroid": _svg_fill(
        '<path d="M6 10h12v7.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 17.5z"/>'
        '<rect x="2.5" y="10" width="2.6" height="7" rx="1.3"/>'
        '<rect x="18.9" y="10" width="2.6" height="7" rx="1.3"/>'
        '<rect x="8.6" y="19.4" width="2.6" height="4.1" rx="1.3"/>'
        '<rect x="12.8" y="19.4" width="2.6" height="4.1" rx="1.3"/>'
        '<path d="M6.2 8.6a5.8 5.8 0 0 1 11.6 0z"/>'
    ),
    "pfAndroidTv": _svg_fill(
        '<rect x="2.5" y="5" width="19" height="12" rx="2"/>'
        '<path d="M8 20.5h8" stroke="currentColor" stroke-width="1.6" '
        'stroke-linecap="round"/>'
    ),
    "icoDownload": _svg_stroke('<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/>'
                               '<path d="M4 20h16"/>'),
    "icoLink": _svg_stroke(
        '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 1 0-7-7l-1 1"/>'
        '<path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 1 0 7 7l1-1"/>'
    ),
    "icoCopy": _svg_stroke('<rect x="9" y="9" width="11" height="11" rx="2"/>'
                           '<path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
}


def _t(en, ru):
    """A LocalizedText carrying both bundled locales."""
    return {"en": en, "ru": ru}


def _reclash_app():
    return {
        "name": "ReClash",
        "svgIconKey": "reclashMark",
        "featured": False,
        "blocks": [
            {
                "svgIconKey": "icoDownload",
                "svgIconColor": "violet",
                "title": _t("Install ReClash", "Установите ReClash"),
                "description": _t(
                    "Download the ReClash client for your device and install it.",
                    "Скачайте клиент ReClash для вашего устройства и установите его.",
                ),
                "buttons": [
                    {
                        "link": DOWNLOAD_URL,
                        "type": "external",
                        "svgIconKey": "icoDownload",
                        "text": _t("Download ReClash", "Скачать ReClash"),
                    }
                ],
            },
            {
                "svgIconKey": "icoLink",
                "svgIconColor": "teal",
                "title": _t("Add your subscription", "Добавьте подписку"),
                "description": _t(
                    "Open the link in ReClash to import this subscription in one "
                    "tap, or copy it and add the profile by hand.",
                    "Откройте ссылку в ReClash, чтобы импортировать подписку в одно "
                    "касание, или скопируйте её и добавьте профиль вручную.",
                ),
                "buttons": [
                    {
                        "link": IMPORT_DEEPLINK,
                        "type": "subscriptionLink",
                        "svgIconKey": "icoLink",
                        "text": _t("Open in ReClash", "Открыть в ReClash"),
                    },
                    {
                        "link": "{{SUBSCRIPTION_LINK}}",
                        "type": "copyButton",
                        "svgIconKey": "icoCopy",
                        "text": _t("Copy link", "Скопировать ссылку"),
                    },
                ],
            },
        ],
    }


def _platform(display_en, display_ru, icon_key):
    return {
        "displayName": _t(display_en, display_ru),
        "svgIconKey": icon_key,
        "apps": [_reclash_app()],
    }


def template():
    """The full subpage RawConfig, before branding and locale narrowing.

    builder.js clones this, injects the provider's title/logo/support URL,
    narrows every LocalizedText plus config.locales to the chosen locales, and
    serialises it.
    """
    return {
        "version": "1",
        "locales": list(LOCALES),
        "brandingSettings": {
            "title": "ReClash",
            "logoUrl": "",
            "supportUrl": "",
        },
        "uiConfig": {
            "subscriptionInfoBlockType": "cards",
            "installationGuidesBlockType": "accordion",
        },
        "baseSettings": {
            "metaTitle": "ReClash",
            "metaDescription": "ReClash subscription",
            "showConnectionKeys": False,
            "hideGetLinkButton": False,
        },
        # baseTranslations is an optional partial record; omitted here so the
        # panel keeps its own localized defaults rather than being handed blanks.
        "svgLibrary": SVG_LIBRARY,
        "platforms": {
            "android": _platform("Android", "Android", "pfAndroid"),
            "windows": _platform("Windows", "Windows", "pfWindows"),
            "macos": _platform("macOS", "macOS", "pfApple"),
            "linux": _platform("Linux", "Linux", "pfLinux"),
            "androidTV": _platform("Android TV", "Android TV", "pfAndroidTv"),
        },
    }
