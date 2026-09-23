"""Structured data (Schema.org JSON-LD) for every page.

Search engines and AI answer engines (Google's AI Overviews, Bing/Copilot,
Perplexity, ChatGPT search) read JSON-LD to understand what a page *is* and to
lift facts and Q&A straight into a generated answer. We emit one <script
type="application/ld+json"> per page carrying a @graph:

  - an Organization + a WebSite node, shared by @id across pages;
  - a WebPage node for the current page, tied to a BreadcrumbList;
  - on the landing page, a SoftwareApplication describing the app itself;
  - on the docs page, a TechArticle;
  - on the quick-start page, a FAQPage built from the very same Q&A the page
    renders, so the two can never drift.

Everything is derived from the page's own title/description and the shared
links in `ui`, so there is nothing to keep in sync by hand and no fabricated
data (no invented ratings, no fake version).
"""

import html as _html
import json as _json
import re as _re

from . import ui

# One-line project summary reused by the WebSite and Organization nodes.
_SITE_DESC = (
    "Открытый клиент для mihomo с маршрутизацией по правилам, режимом «Авто», "
    "обходом DPI и оформлением через заголовки провайдера. Windows, macOS, "
    "Linux, Android.",
    "An open-source mihomo client with rule-based routing, an Auto mode, a DPI "
    "bypass and provider theming through response headers. Windows, macOS, "
    "Linux, Android.",
)


def _plain(text):
    """Flatten answer/question HTML to a single line of plain text — the form
    Schema.org Question/Answer text is happiest with and the form that keeps
    stray markup out of the JSON payload."""
    text = _re.sub(r"<[^>]+>", " ", text)
    text = _html.unescape(text)
    return _re.sub(r"\s+", " ", text).strip()


def _emit(graph):
    payload = {"@context": "https://schema.org", "@graph": graph}
    text = _json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    # Same guard json_block() uses: never let a value close the <script> early.
    text = text.replace("</", "<\\/")
    return '<script type="application/ld+json">%s</script>\n' % text


def _full_title(title):
    return title if title.startswith("ReClash") else "%s — ReClash" % title


def _software(ctx, base, org_id, og):
    t = ctx.t
    return {
        "@type": "SoftwareApplication",
        "@id": base + "/#app",
        "name": "ReClash",
        "applicationCategory": "SecurityApplication",
        "operatingSystem": "Windows, macOS, Linux, Android",
        "description": t(*_SITE_DESC),
        "url": base + "/",
        "downloadUrl": ui.GITHUB_RELEASES,
        "softwareHelp": "%s/%s/%s" % (base, ctx.lang, ctx.page("start")),
        "license": ui.LICENSE_URL,
        "isAccessibleForFree": True,
        "inLanguage": ["ru", "en"],
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "author": {"@id": org_id},
        "publisher": {"@id": org_id},
        "image": og,
        "screenshot": base + "/assets/img/og.png",
        "featureList": [
            t("Полное ядро mihomo (Clash.Meta)", "Full mihomo (Clash.Meta) core"),
            t("Маршрутизация по правилам", "Rule-based routing"),
            t("Режим «Авто»: умный выбор узла под сеть",
              "Auto mode: smart per-network node selection"),
            t("Встроенный обход DPI", "Built-in DPI bypass"),
            t("Оформление через заголовки провайдера",
              "Provider theming through response headers"),
            t("Windows, macOS, Linux, Android", "Windows, macOS, Linux, Android"),
        ],
        "sameAs": [ui.GITHUB, ui.TELEGRAM],
    }


def _tech_article(ctx, canonical, title, description, org_id, site_id):
    return {
        "@type": "TechArticle",
        "@id": canonical + "#article",
        "headline": _full_title(title),
        "description": description,
        "inLanguage": ctx.lang,
        "url": canonical,
        "author": {"@id": org_id},
        "publisher": {"@id": org_id},
        "isPartOf": {"@id": site_id},
        "about": ctx.t("Заголовки ответа подписки ReClash",
                       "ReClash subscription response headers"),
    }


def _faq_page(ctx, canonical, faq):
    return {
        "@type": "FAQPage",
        "@id": canonical + "#faq",
        "inLanguage": ctx.lang,
        "mainEntity": [
            {
                "@type": "Question",
                "name": _plain(q),
                "acceptedAnswer": {"@type": "Answer", "text": _plain(a)},
            }
            for q, a in faq
        ],
    }


def jsonld(ctx, active, title, description, faq=None):
    """The full JSON-LD <script> for one rendered page."""
    t = ctx.t
    base = ctx.base_url
    lang = ctx.lang
    canonical = ctx.abs_url(active)
    home = "%s/%s/%s" % (base, lang, ctx.page("index"))
    og = "%s/assets/img/og%s.png" % (base, "" if lang == "ru" else "-" + lang)

    org_id = base + "/#org"
    site_id = base + "/#website"

    org = {
        "@type": "Organization",
        "@id": org_id,
        "name": "ReClash",
        "url": base + "/",
        "logo": {
            "@type": "ImageObject",
            "url": base + "/assets/img/icon-512.png",
            "width": 512,
            "height": 512,
        },
        "sameAs": [ui.GITHUB, ui.TELEGRAM],
    }
    website = {
        "@type": "WebSite",
        "@id": site_id,
        "name": "ReClash",
        "url": base + "/",
        "inLanguage": ["ru", "en"],
        "description": t(*_SITE_DESC),
        "publisher": {"@id": org_id},
    }
    webpage = {
        "@type": "WebPage",
        "@id": canonical + "#webpage",
        "url": canonical,
        "name": _full_title(title),
        "description": description,
        "inLanguage": lang,
        "isPartOf": {"@id": site_id},
        "primaryImageOfPage": {"@type": "ImageObject", "url": og},
        "breadcrumb": {"@id": canonical + "#breadcrumb"},
    }
    crumbs = [{"@type": "ListItem", "position": 1,
               "name": t("Главная", "Home"), "item": home}]
    if active != "index":
        crumbs.append({"@type": "ListItem", "position": 2,
                       "name": title, "item": canonical})
    breadcrumb = {
        "@type": "BreadcrumbList",
        "@id": canonical + "#breadcrumb",
        "itemListElement": crumbs,
    }

    graph = [org, website, webpage, breadcrumb]
    if active == "index":
        graph.append(_software(ctx, base, org_id, og))
    if active == "docs":
        graph.append(_tech_article(ctx, canonical, title, description, org_id, site_id))
    if faq:
        graph.append(_faq_page(ctx, canonical, faq))
    return _emit(graph)
