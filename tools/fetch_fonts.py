#!/usr/bin/env python3
"""Refill assets/fonts/ from Google Fonts.

The site self-hosts every face, because its readers sit behind filtering and a
request to fonts.gstatic.com is one more thing that can be dropped. This script
is how those woff2 files got there, kept in the repository so the set can be
rebuilt or a weight range widened without guesswork.

It fetches the CSS for each family, picks out the four subsets the site loads,
and writes them under the names assets/css/fonts.css already expects. That CSS
is written by hand and is not touched here: the unicode-range lines in it are
what actually keep Cyrillic and Latin on separate downloads.

    python3 tools/fetch_fonts.py            # report what is missing
    python3 tools/fetch_fonts.py --force    # download everything again
"""

import argparse
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "assets", "fonts")
CSS = os.path.join(ROOT, "assets", "css", "fonts.css")

API = "https://fonts.googleapis.com/css2"
# Google serves woff2 only to a browser-shaped client; anything else gets ttf.
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0 Safari/537.36")

# local prefix -> (family query, the axis range the site declares)
FAMILIES = {
    "unbounded": ("Unbounded:wght@400..900", "400 900"),
    "onest": ("Onest:wght@300..900", "300 900"),
    "jbmono": ("JetBrains+Mono:wght@400..700", "400 700"),
}

# Google labels each @font-face block with a comment; these are the four we keep.
SUBSETS = ("cyrillic-ext", "cyrillic", "latin-ext", "latin")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def faces(css):
    """Map subset name -> woff2 URL, reading the /* subset */ labels."""
    out = {}
    # the comment sits immediately before the block it names
    for label, block in re.findall(r"/\*\s*([a-z-]+)\s*\*/\s*(@font-face\s*\{[^}]*\})", css):
        m = re.search(r"url\((https://[^)]+\.woff2)\)", block)
        if m:
            out[label] = m.group(1)
    return out


def main():
    ap = argparse.ArgumentParser(description="Download the site's woff2 subsets.")
    ap.add_argument("--force", action="store_true",
                    help="re-download files that are already present")
    args = ap.parse_args()

    os.makedirs(FONTS, exist_ok=True)
    wanted = [(p, s) for p in FAMILIES for s in SUBSETS]
    missing = [(p, s) for p, s in wanted
               if not os.path.exists(os.path.join(FONTS, "%s-%s.woff2" % (p, s)))]

    if not missing and not args.force:
        print("all %d subsets present in assets/fonts/ — nothing to do "
              "(pass --force to re-download)" % len(wanted))
        return 0

    todo = wanted if args.force else missing
    families = sorted({p for p, _ in todo})
    fetched = 0

    for prefix in families:
        query, axis = FAMILIES[prefix]
        try:
            css = fetch("%s?family=%s&display=swap" % (API, query)).decode("utf-8")
        except urllib.error.URLError as e:
            print("%s: could not reach Google Fonts (%s)" % (prefix, e), file=sys.stderr)
            return 1

        urls = faces(css)
        for subset in SUBSETS:
            if (prefix, subset) not in todo:
                continue
            if subset not in urls:
                print("%s: no %s subset in the served CSS" % (prefix, subset), file=sys.stderr)
                return 1
            path = os.path.join(FONTS, "%s-%s.woff2" % (prefix, subset))
            data = fetch(urls[subset])
            with open(path, "wb") as fh:
                fh.write(data)
            fetched += 1
            print("%-34s %7d bytes  (%s)" % (os.path.basename(path), len(data), axis))

    print("\nwrote %d file(s) to assets/fonts/" % fetched)
    print("assets/css/fonts.css is hand-written and was not touched; check that "
          "its font-weight ranges still match the axes above.")

    # a face nobody declares would sit in the folder and ship for nothing
    declared = set(re.findall(r"\.\./fonts/([a-z0-9-]+\.woff2)", open(CSS, encoding="utf-8").read()))
    on_disk = {f for f in os.listdir(FONTS) if f.endswith(".woff2")}
    for extra in sorted(on_disk - declared):
        print("note: assets/fonts/%s is not referenced by fonts.css" % extra)
    return 0


if __name__ == "__main__":
    sys.exit(main())
