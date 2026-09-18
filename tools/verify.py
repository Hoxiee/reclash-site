#!/usr/bin/env python3
"""End-to-end checks over dist/: structure, JS contracts, parity, dead links."""
import html.parser, json, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "source", "track", "wbr"}

fails = []
warns = []


class Checker(html.parser.HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.stack = []
        self.ids = collections.Counter()
        self.anchors = []
        self.labels = []
        self.controls = {}
        self.aria_controls = []
        self.imgs = []
        self.headings = []
        self.buttons_no_type = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids[a["id"]] += 1
        if tag == "a" and "href" in a:
            self.anchors.append(a["href"])
        if tag == "label" and "for" in a:
            self.labels.append(a["for"])
        if tag in ("input", "select", "textarea") and "id" in a:
            self.controls[a["id"]] = tag
        if "aria-controls" in a:
            self.aria_controls.append(a["aria-controls"])
        if tag == "img":
            self.imgs.append(a)
        if tag in ("h1", "h2", "h3", "h4"):
            self.headings.append(tag)
        if tag == "button" and "type" not in a:
            self.buttons_no_type.append(self.getpos())
        if tag not in VOID:
            self.stack.append((tag, self.getpos()))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            fails.append("%s: stray </%s>" % (self.path, tag))
            return
        if self.stack[-1][0] != tag:
            fails.append("%s: </%s> closes <%s> opened at %s"
                         % (self.path, tag, self.stack[-1][0], self.stack[-1][1]))
            while self.stack and self.stack[-1][0] != tag:
                self.stack.pop()
            if self.stack:
                self.stack.pop()
            return
        self.stack.pop()


def check(path):
    rel = os.path.relpath(path, DIST)
    src = open(path, encoding="utf-8").read()
    c = Checker(rel)
    c.feed(src)
    c.close()
    if c.stack:
        fails.append("%s: unclosed %s" % (rel, [t for t, _ in c.stack[:5]]))
    for i, n in c.ids.items():
        if n > 1:
            fails.append("%s: duplicate id %r x%d" % (rel, i, n))
    for f in c.labels:
        if f not in c.ids:
            fails.append("%s: <label for=%r> has no target" % (rel, f))
    for ac in c.aria_controls:
        if ac not in c.ids:
            fails.append("%s: aria-controls=%r has no target" % (rel, ac))
    for href in c.anchors:
        if href.startswith("#") and len(href) > 1:
            if href[1:] not in c.ids:
                fails.append("%s: dead in-page link %s" % (rel, href))
    for a in c.imgs:
        if "alt" not in a:
            fails.append("%s: <img> without alt (%s)" % (rel, a.get("src")))
    if c.headings.count("h1") != 1:
        fails.append("%s: %d <h1>" % (rel, c.headings.count("h1")))
    if c.buttons_no_type:
        warns.append("%s: %d <button> without type" % (rel, len(c.buttons_no_type)))

    # local asset references must exist
    for m in re.finditer(r'(?:href|src)="(\.\./assets/[^"]+)"', src):
        target = os.path.normpath(os.path.join(os.path.dirname(path), m.group(1)))
        if not os.path.exists(target):
            fails.append("%s: missing asset %s" % (rel, m.group(1)))

    # language hygiene
    lang = rel.split(os.sep)[0]
    if '<html lang="%s"' % lang not in src:
        fails.append("%s: wrong <html lang>" % rel)
    # data-keys carry search terms in both languages on purpose: the TOC filter
    # should find a section whichever language the reader types in.
    scan = re.sub(r"<script[\s\S]*?</script>", "", src)
    scan = re.sub(r'\sdata-keys="[^"]*"', "", scan)
    cyr = len(re.findall(r"[А-Яа-яЁё]", scan))
    if lang == "en" and cyr > 0:
        fails.append("%s: %d Cyrillic chars leaked into the EN page" % (rel, cyr))
    if lang == "ru" and cyr < 300:
        fails.append("%s: only %d Cyrillic chars on the RU page" % (rel, cyr))

    # no template leftovers
    for bad in ("%s", "%(", "{ru}", "None<", "<em></em>", "&amp;lt;", "&amp;amp;"):
        if bad in src:
            fails.append("%s: leftover %r" % (rel, bad))
    return c, src


pages = {}
for lang in ("ru", "en"):
    for f in ("index.html", "headers.html", "download.html", "start.html"):
        p = os.path.join(DIST, lang, f)
        if not os.path.exists(p):
            fails.append("missing %s/%s" % (lang, f))
            continue
        pages[(lang, f)] = check(p)

# ---- cross-language parity -------------------------------------------------
for f in ("index.html", "headers.html", "download.html", "start.html"):
    if (("ru", f) not in pages) or (("en", f) not in pages):
        continue
    ru, en = pages[("ru", f)][0], pages[("en", f)][0]
    ru_ids, en_ids = set(ru.ids), set(en.ids)
    # ids that encode structure must match exactly
    only_ru = sorted(i for i in ru_ids - en_ids)
    only_en = sorted(i for i in en_ids - ru_ids)
    if only_ru or only_en:
        fails.append("%s: id parity broken ru-only=%s en-only=%s" % (f, only_ru, only_en))
    for tag in ("section", "fieldset", "form", "table"):
        a = pages[("ru", f)][1].count("<%s" % tag)
        b = pages[("en", f)][1].count("<%s" % tag)
        if a != b:
            fails.append("%s: <%s> count ru=%d en=%d" % (f, tag, a, b))

# ---- JS contracts ----------------------------------------------------------
JSDIR = os.path.join(ROOT, "assets", "js")


def js(name):
    return open(os.path.join(JSDIR, name), encoding="utf-8").read()


def ids_in(src):
    return set(re.findall(r'id="([^"]+)"', src))


for lang in ("ru", "en"):
    # builder.js ↔ headers.html
    src = pages[(lang, "headers.html")][1]
    have = ids_in(src)
    b = js("builder.js")
    for i in set(re.findall(r"getElementById\('([A-Za-z0-9_-]+)'\)", b)):
        if i not in have:
            fails.append("%s/headers.html: builder.js needs #%s" % (lang, i))
    for f in set(re.findall(r"\bf_[a-z0-9_]+", b)):
        if f not in have:
            fails.append("%s/headers.html: builder.js needs control #%s" % (lang, f))
    keys = set(re.findall(r"\bs\('([A-Za-z0-9_]+)'\)", b))
    payload = json.loads(re.search(
        r'id="builder-strings">(.*?)</script>', src, re.S).group(1).replace("<\\/", "</"))
    for k in keys - set(payload):
        fails.append("%s/headers.html: builder-strings missing %r" % (lang, k))

    # downloads.js ↔ download.html
    src = pages[(lang, "download.html")][1]
    have = ids_in(src)
    dj = js("downloads.js")
    for i in set(re.findall(r"getElementById\('([A-Za-z0-9_-]+)'\)", dj)):
        if "' +" in i:
            continue
        if i not in have:
            fails.append("%s/download.html: downloads.js needs #%s" % (lang, i))
    for tpl in ("windows", "macos", "linux", "android", "ios"):
        if 'id="icon-%s"' % tpl not in src:
            fails.append("%s/download.html: missing <template id=icon-%s>" % (lang, tpl))
    dls = json.loads(re.search(
        r'id="dl-strings">(.*?)</script>', src, re.S).group(1).replace("<\\/", "</"))
    for k in ("os_windows", "os_macos", "os_linux", "os_android", "os_ios",
              "os_other", "files", "onGithub"):
        if k not in dls:
            fails.append("%s/download.html: dl-strings missing %r" % (lang, k))
    if 'id="downloads"' not in src or "data-repo=" not in src:
        fails.append("%s/download.html: #downloads[data-repo] missing" % lang)

    # core.js ↔ start.html (faq + deeplink)
    src = pages[(lang, "start.html")][1]
    if src.count('class="faq__q"') < 8:
        fails.append("%s/start.html: too few FAQ items" % lang)
    for need in ('class="deeplink"', "data-make", 'class="deeplink__out"',
                 'data-scheme="reclash"'):
        if need not in src:
            fails.append("%s/start.html: missing %s" % (lang, need))
    if src.count('class="step"') != 4:
        fails.append("%s/start.html: %d steps, expected 4" % (lang, src.count('class="step"')))

    # home.js / core.js ↔ index.html
    src = pages[(lang, "index.html")][1]
    for need in ('data-dashboard-demo', 'class="live-panel__viewport"',
                 'href="headers.html#builder"',
                 # the first-run panel mounts the same converter core.js wires
                 'id="get-started"', 'class="deeplink"', 'data-scheme="reclash"',
                 'class="deeplink__out"', "data-make"):
        if need not in src:
            fails.append("%s/index.html: missing %s" % (lang, need))
    for key in ("default", "nebula", "mono"):
        if src.count('data-demo-preset="%s"' % key) != 1:
            fails.append("%s/index.html: dashboard preset %s missing or duplicated" % (lang, key))
        if src.count('data-demo-panel="%s"' % key) != 1:
            fails.append("%s/index.html: dashboard panel %s missing or duplicated" % (lang, key))
    if 'data-demo-preset="default" aria-pressed="true"' not in src:
        fails.append("%s/index.html: dashboard default preset is not pressed" % lang)
    if 'data-demo-panel="default"' not in src or 'data-demo-panel="default" data-demo-label=' not in src:
        fails.append("%s/index.html: dashboard default panel state is invalid" % lang)
    for stale in ('class="dpi__stage"', 'id="dpi-strings"', 'data-mode="split"'):
        if stale in src:
            fails.append("%s/index.html: stale DPI demo hook %s" % (lang, stale))
    if src.count('class="launch__step reveal"') != 3:
        fails.append("%s/index.html: %d first-run steps, expected 3"
                     % (lang, src.count('class="launch__step reveal"')))

# ---- site-wide files -------------------------------------------------------
for f in ("index.html", "404.html", "robots.txt", "sitemap.xml", ".nojekyll"):
    if not os.path.exists(os.path.join(DIST, f)):
        fails.append("missing dist/%s" % f)

sm = open(os.path.join(DIST, "sitemap.xml"), encoding="utf-8").read()
if sm.count("<loc>") != 8:
    fails.append("sitemap has %d <loc>, expected 8" % sm.count("<loc>"))

# every CSS/JS referenced by a page exists, and nothing in assets is orphaned
refs = set()
for (lang, f), (c, src) in pages.items():
    refs |= set(re.findall(r'\.\./assets/(?:css|js)/([a-z0-9_.-]+)', src))
have_files = set(os.listdir(os.path.join(ROOT, "assets", "css"))) | \
             set(os.listdir(os.path.join(ROOT, "assets", "js")))
orphan = sorted(x for x in have_files - refs if x.endswith((".css", ".js")))
if orphan:
    warns.append("assets never referenced: %s" % orphan)

print("checked %d pages" % len(pages))
if warns:
    print("\nwarnings (%d):" % len(warns))
    for w in warns:
        print("  ~", w)
if fails:
    print("\nFAILURES (%d):" % len(fails))
    for x in fails:
        print("  -", x)
    sys.exit(1)
print("\nall checks passed")
