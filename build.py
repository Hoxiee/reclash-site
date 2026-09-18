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
from gen import page_home, page_headers, page_downloads, page_start  # noqa: E402

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
LANGS = ("ru", "en")

DEFAULT_BASE_URL = "https://hoxiee.github.io/ReClash-site"

RENDERERS = {
    "index": page_home.render,
    "headers": page_headers.render,
    "download": page_downloads.render,
    "start": page_start.render,
}


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)
    return len(text.encode("utf-8"))


def copy_assets():
    src = os.path.join(ROOT, "assets")
    dst = os.path.join(DIST, "assets")
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
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
    return "User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % base_url


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
                head_extra=data.get("head_extra", ""),
            )
            size = write(os.path.join(DIST, lang, layout.FILE[key]), html)
            print("  %s/%-14s %6.1f KB" % (lang, layout.FILE[key], size / 1024))
            pages += 1
            total += size

    write(os.path.join(DIST, "index.html"), redirect_page(base_url))
    write(os.path.join(DIST, "404.html"), not_found(base_url))
    write(os.path.join(DIST, "robots.txt"), robots(base_url))
    write(os.path.join(DIST, "sitemap.xml"), sitemap(base_url))
    open(os.path.join(DIST, ".nojekyll"), "w").close()

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
        import socketserver

        os.chdir(DIST)

        class Handler(http.server.SimpleHTTPRequestHandler):
            # A browser that navigates away mid-response drops the connection,
            # and SimpleHTTPRequestHandler lets the resulting BrokenPipeError
            # bubble up as a scary traceback. It is expected and harmless, so
            # swallow it quietly instead of dumping a stack over the log.
            def handle_one_request(self):
                try:
                    super().handle_one_request()
                except (BrokenPipeError, ConnectionResetError):
                    self.close_connection = True

        with socketserver.TCPServer(("127.0.0.1", 8000), Handler) as httpd:
            print("\n  http://127.0.0.1:8000/  (Ctrl-C to stop)")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n  stopped")


if __name__ == "__main__":
    main()
