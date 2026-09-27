#!/usr/bin/env python3
"""Render the ReClash site into dist/.

No dependencies, no network, no build step beyond `python3 build.py`.
Everything under dist/ is disposable and regenerated from gen/ + assets/.
"""

import argparse
import datetime
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gen import layout, ui  # noqa: E402
from gen.layout import Ctx  # noqa: E402
from gen import (  # noqa: E402
    page_home, page_docs, page_headers, page_downloads, page_start,
    page_gallery, page_mocksubs, page_report, mocks, mockhdr,
)

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
LANGS = ("ru", "en")

DEFAULT_BASE_URL = "https://reclash.pages.dev"

RENDERERS = {
    "index": page_home.render,
    "gallery": page_gallery.render,
    "docs": page_docs.render,
    "headers": page_headers.render,
    "reference": page_headers.render_reference,
    "download": page_downloads.render,
    "start": page_start.render,
    "mock": page_mocksubs.render,
    "report": page_report.render,
}


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)
    return len(text.encode("utf-8"))


def minify_css(text):
    """Strip comments and collapse whitespace without changing meaning.

    A character walk, not a regex: strings ('...' / "...") and url() payloads
    are copied verbatim so the data-URI noise texture and its embedded spaces
    survive intact, and a collapsed whitespace run is only dropped when it sits
    against a separator that never carries selector or media-query meaning
    ({ } ; ,). Spaces around :, >, +, ~, ( and calc() operators are kept, so
    combinators and `and (min-width: …)` stay valid. /*! banners are preserved.
    """
    out = []
    pending = False  # a collapsed whitespace run is waiting to be emitted
    i, n = 0, len(text)
    sep = "{};,"

    def flush_before(nextc):
        nonlocal pending
        if pending:
            if out and out[-1] not in sep and nextc not in sep:
                out.append(" ")
            pending = False

    while i < n:
        c = text[i]
        if c == "/" and i + 1 < n and text[i + 1] == "*":
            if i + 2 < n and text[i + 2] == "!":  # keep licence banners
                end = text.find("*/", i + 3)
                end = n if end == -1 else end + 2
                flush_before(c)
                out.append(text[i:end])
                i = end
                continue
            end = text.find("*/", i + 2)
            i = n if end == -1 else end + 2
            pending = True  # a comment is a token boundary
            continue
        if c == '"' or c == "'":
            flush_before(c)
            q = c
            out.append(c)
            i += 1
            while i < n:
                ch = text[i]
                out.append(ch)
                if ch == "\\" and i + 1 < n:
                    out.append(text[i + 1])
                    i += 2
                    continue
                i += 1
                if ch == q:
                    break
            continue
        if c in " \t\r\n\f":
            j = i
            while j < n and text[j] in " \t\r\n\f":
                j += 1
            pending = True
            i = j
            continue
        flush_before(c)
        if c == "}" and out and out[-1] == ";":
            out.pop()
        out.append(c)
        i += 1
    return "".join(out).strip()


def copy_assets():
    src = os.path.join(ROOT, "assets")
    dst = os.path.join(DIST, "assets")
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    for r, _, files in os.walk(dst):
        for f in files:
            if not f.endswith(".css"):
                continue
            p = os.path.join(r, f)
            with open(p, "r", encoding="utf-8") as fh:
                css = fh.read()
            with open(p, "w", encoding="utf-8") as fh:
                fh.write(minify_css(css))
    total = sum(
        os.path.getsize(os.path.join(r, f))
        for r, _, files in os.walk(dst)
        for f in files
    )
    return total


def redirect_page(base_url):
    """Root index: pick a language from the browser, degrade to a real choice."""
    return (
        "<!doctype html>\n"
        '<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>ReClash</title>\n"
        '<meta name="color-scheme" content="dark">\n'
        '<meta name="robots" content="noindex">\n'
        '<link rel="canonical" href="%s/en/index.html">\n'
        '<link rel="alternate" hreflang="ru" href="%s/ru/index.html">\n'
        '<link rel="alternate" hreflang="en" href="%s/en/index.html">\n'
        '<link rel="alternate" hreflang="x-default" href="%s/en/index.html">\n'
        '<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">\n'
        "<style>\n"
        "html{color-scheme:dark}\n"
        "body{margin:0;min-height:100svh;display:grid;place-items:center;gap:1rem;\n"
        "background:#07060b;color:#ece9f5;font:16px/1.5 system-ui,sans-serif;text-align:center}\n"
        "a{color:#22d3ee}\n"
        "p{margin:0}\n"
        "</style>\n"
        '<script>\n'
        'var l=(navigator.language||"en").toLowerCase().slice(0,2);\n'
        'location.replace((l==="ru"||l==="uk"||l==="be"||l==="kk"?"ru":"en")+"/index.html");\n'
        "</script>\n"
        "</head>\n<body>\n"
        "<p>ReClash</p>\n"
        '<p><a href="ru/index.html">Русский</a> &nbsp;·&nbsp; <a href="en/index.html">English</a></p>\n'
        "</body>\n</html>\n" % (base_url, base_url, base_url, base_url)
    )


def not_found(base_url):
    return (
        "<!doctype html>\n"
        '<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>404 — ReClash</title>\n"
        '<meta name="color-scheme" content="dark">\n'
        '<meta name="robots" content="noindex">\n'
        '<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">\n'
        "<style>\n"
        "html{color-scheme:dark}\n"
        "body{margin:0;min-height:100svh;display:grid;place-items:center;\n"
        "background:#07060b;color:#ece9f5;font:16px/1.6 system-ui,sans-serif;text-align:center}\n"
        "div{display:grid;gap:.9rem;padding:1.5rem}\n"
        "b{font-size:clamp(3rem,14vw,7rem);line-height:1;letter-spacing:-.04em;\n"
        "background:linear-gradient(100deg,#7c5cff,#3686ed 52%,#2fd3b6);\n"
        "-webkit-background-clip:text;background-clip:text;color:transparent}\n"
        "a{color:#22d3ee}\n"
        "</style>\n</head>\n<body>\n"
        "<div><b>404</b>\n"
        "<p>Страница не найдена · Page not found</p>\n"
        '<p><a href="/ru/index.html">Русский</a> &nbsp;·&nbsp; <a href="/en/index.html">English</a></p>\n'
        "</div>\n</body>\n</html>\n"
    )


def sitemap(base_url):
    today = datetime.date.today().isoformat()
    urls = []
    for lang in LANGS:
        other = "en" if lang == "ru" else "ru"
        for key in ui.PAGES:
            if key in ui.NOINDEX:
                continue
            f = layout.FILE[key]
            urls.append(
                "  <url>\n"
                "    <loc>%s/%s/%s</loc>\n"
                '    <xhtml:link rel="alternate" hreflang="%s" href="%s/%s/%s"/>\n'
                '    <xhtml:link rel="alternate" hreflang="%s" href="%s/%s/%s"/>\n'
                '    <xhtml:link rel="alternate" hreflang="x-default" href="%s/en/%s"/>\n'
                "    <lastmod>%s</lastmod>\n"
                "  </url>"
                % (base_url, lang, f,
                   lang, base_url, lang, f,
                   other, base_url, other, f,
                   base_url, f,
                   today)
            )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )


def robots(base_url):
    # Everything is public and meant to be found. We name the search-generative
    # and AI-assistant crawlers explicitly so it is unambiguous they may read
    # and cite the site (Google-Extended / Applebot-Extended gate AI use even
    # when the normal bot is allowed). All resolve to the same allow-all.
    ai_agents = (
        "Googlebot", "Google-Extended", "Bingbot", "Applebot", "Applebot-Extended",
        "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web",
        "anthropic-ai", "PerplexityBot", "Perplexity-User", "CCBot",
    )
    blocks = ["User-agent: *\nAllow: /\n"]
    for a in ai_agents:
        blocks.append("User-agent: %s\nAllow: /\n" % a)
    return "\n".join(blocks) + "\nSitemap: %s/sitemap.xml\n" % base_url


def webmanifest(base_url):
    """A minimal web app manifest so mobile search and PWA-aware crawlers can
    read the app's name, colours and icons. Icon/URL fields are absolute so the
    manifest stays correct regardless of the host or any hosting sub-path."""
    data = {
        "name": "ReClash",
        "short_name": "ReClash",
        "description": ("An open-source mihomo client with rule-based routing, "
                        "an Auto mode, a DPI bypass and provider theming."),
        "id": base_url + "/",
        "start_url": base_url + "/",
        "scope": base_url + "/",
        "display": "standalone",
        "background_color": "#07060b",
        "theme_color": "#07060b",
        "categories": ["utilities", "productivity", "security"],
        "icons": [
            {"src": base_url + "/assets/img/icon-192.png",
             "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": base_url + "/assets/img/icon-512.png",
             "sizes": "512x512", "type": "image/png", "purpose": "any"},
        ],
    }
    return _json.dumps(data, ensure_ascii=False, indent=2) + "\n"


# --------------------------------------------------------------- mock subs
#
# A mock subscription is an HTTP response the ReClash app fetches: the body is
# a mihomo profile, the ReClash-* response headers carry the metadata (title,
# quota, theme, logo, background, announce). GitHub Pages cannot set custom
# headers, so the generated `dist/_headers` is meant for Cloudflare Pages /
# Netlify, and `dist/mock/_headers.json` feeds the local --serve so the same
# response can be tested without a deploy. `{BASE}` in a value is the site
# origin; both consumers substitute it (the origin for _headers, the live
# request origin for --serve). Media (logo/background) are absolute URLs, as a
# real provider would send.

import json as _json  # noqa: E402

# The body/headers builders live in gen/mockhdr.py so the mock-subs page can
# render the exact same response in its manual. Re-exported here under the
# names build_mocks already uses.
mock_body = mockhdr.mock_body
mock_headers = mockhdr.mock_headers


def build_mocks(base_url):
    """Write each profile body to dist/mock/<key>, the Cloudflare/Netlify
    `dist/_headers`, and the `dist/mock/_headers.json` manifest for --serve."""
    manifest = {}
    lines = [
        "# Generated by build.py — do not edit. Response headers for the mock",
        "# subscriptions, in Cloudflare Pages / Netlify _headers format.",
        "",
    ]
    for m in mocks.MOCKS:
        path = "/mock/%s" % m["key"]
        write(os.path.join(DIST, "mock", m["key"]), mock_body(m))
        pairs = mock_headers(m)
        manifest[path] = {k: v for k, v in pairs}
        lines.append(path)
        for k, v in pairs:
            lines.append("  %s: %s" % (k, v.replace("{BASE}", base_url)))
        lines.append("")
    # The report decoder gets a strict, network-free policy header on both
    # localized copies. frame-ancestors is header-only (ignored in the page's
    # own <meta> CSP), so it lives here; the rest mirrors page_report.CSP.
    lines.append("/*/report.html")
    lines.append("  Content-Security-Policy: %s; frame-ancestors 'none'"
                 % page_report.CSP)
    lines.append("  X-Content-Type-Options: nosniff")
    lines.append("  Referrer-Policy: no-referrer")
    lines.append("")
    write(os.path.join(DIST, "_headers"), "\n".join(lines))
    write(os.path.join(DIST, "mock", "_headers.json"),
          _json.dumps(manifest, ensure_ascii=False, indent=0))
    return len(mocks.MOCKS)


def build(base_url, version_note=""):
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)

    pages = 0
    total = 0
    for lang in LANGS:
        ctx = Ctx(lang, base_url, version_note)
        for key in ui.PAGES:
            data = RENDERERS[key](ctx)
            html = layout.document(
                ctx,
                active=data["active"],
                title=data["title"],
                description=data["description"],
                body=data["body"],
                css=data.get("css", ()),
                js=data.get("js", ()),
                css_defer=data.get("css_defer", ()),
                head_extra=data.get("head_extra", ""),
                faq=data.get("faq"),
            )
            size = write(os.path.join(DIST, lang, layout.FILE[key]), html)
            print("  %s/%-14s %6.1f KB" % (lang, layout.FILE[key], size / 1024))
            pages += 1
            total += size

    write(os.path.join(DIST, "index.html"), redirect_page(base_url))
    write(os.path.join(DIST, "404.html"), not_found(base_url))
    write(os.path.join(DIST, "robots.txt"), robots(base_url))
    write(os.path.join(DIST, "sitemap.xml"), sitemap(base_url))
    write(os.path.join(DIST, "site.webmanifest"), webmanifest(base_url))
    open(os.path.join(DIST, ".nojekyll"), "w").close()

    n_mocks = build_mocks(base_url)
    print("  %d mock subscriptions -> /mock/ + dist/_headers" % n_mocks)

    assets = copy_assets()
    print("\n  %d pages, %.1f KB html, %.1f KB assets" % (pages, total / 1024, assets / 1024))
    print("  → %s" % DIST)


def main():
    ap = argparse.ArgumentParser(description="Build the ReClash site into dist/.")
    ap.add_argument("--base-url", default=os.environ.get("BASE_URL", DEFAULT_BASE_URL),
                    help="absolute site root, used for canonical/OG/sitemap URLs")
    ap.add_argument("--version-note", default="", help="text shown next to the download CTA")
    ap.add_argument("--serve", action="store_true", help="build, then serve dist/ on :8000")
    args = ap.parse_args()

    build(args.base_url.rstrip("/"), args.version_note)

    if args.serve:
        import http.server

        os.chdir(DIST)

        # The mock subscriptions carry ReClash-* response headers that a static
        # host would set from dist/_headers. SimpleHTTPRequestHandler cannot, so
        # for local testing we serve those paths by hand from the manifest and
        # substitute the live origin into {BASE} — the app can then import
        # http://<this-host>:8000/mock/<key> and see real headers.
        import json as _json
        try:
            with open(os.path.join(DIST, "mock", "_headers.json"), encoding="utf-8") as _fh:
                MOCK_HEADERS = _json.load(_fh)
        except OSError:
            MOCK_HEADERS = {}

        class Handler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                p = self.path.split("?", 1)[0].rstrip("/")
                hdrs = MOCK_HEADERS.get(p)
                if hdrs is None:
                    return super().do_GET()
                try:
                    with open(os.path.join(DIST, p.lstrip("/")), "rb") as fh:
                        body = fh.read()
                except OSError:
                    self.send_error(404)
                    return
                origin = "http://" + (self.headers.get("Host") or "127.0.0.1:8000")
                self.send_response(200)
                for k, v in hdrs.items():
                    self.send_header(k, v.replace("{BASE}", origin))
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            # A browser that navigates away mid-response drops the connection,
            # and SimpleHTTPRequestHandler lets the resulting BrokenPipeError
            # bubble up as a scary traceback. It is expected and harmless, so
            # swallow it quietly instead of dumping a stack over the log.
            def handle_one_request(self):
                try:
                    super().handle_one_request()
                except (BrokenPipeError, ConnectionResetError):
                    self.close_connection = True

        # A thread per connection, not one connection at a time. A browser opens
        # several sockets up front and leaves a few idle for reuse; a
        # single-threaded server blocks inside handle_one_request() reading a
        # socket that has not sent a request yet, and every real asset request
        # queues behind it. That is the page taking ~ten seconds to fill in:
        # the HTML arrives, then the CSS and fonts stall until an idle browser
        # socket times out and frees the one server thread. daemon_threads lets
        # Ctrl-C exit even while sockets are still held open.
        class Server(http.server.ThreadingHTTPServer):
            daemon_threads = True
            allow_reuse_address = True

        with Server(("127.0.0.1", 8000), Handler) as httpd:
            print("\n  http://127.0.0.1:8000/  (Ctrl-C to stop)")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n  stopped")


if __name__ == "__main__":
    main()
