#!/usr/bin/env python3
"""Assert that the rendered headers page satisfies the builder.js contract."""
import os, re, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from gen.layout import Ctx
from gen import page_headers, layout, spec

JS = open(os.path.join(ROOT, "assets/js/builder.js"), encoding="utf-8").read()

VAL = sorted(set(re.findall(r"val\('([a-z0-9_]+)'\)", JS)))
ON = sorted(set(re.findall(r"\bon\('([a-z0-9_]+)'\)", JS)))
IDS = sorted(set(re.findall(r"getElementById\('([a-zA-Z0-9_-]+)'\)", JS)))
# s('key') is the direct lookup; plural('key', n) reaches the table too
KEYS = set(re.findall(r"\b(?:s|plural)\('([A-Za-z0-9_]+)'", JS))
# the VTILE value-card map names its label with a `key:` field, not a literal
# s('…'); those strings are consumed through s(v.key) at render time
KEYS |= set(re.findall(r"key:\s*'([A-Za-z0-9_]+)'", JS))
KEYS = sorted(KEYS)
FIELDS = sorted(set(re.findall(r"\bf_[a-z0-9_]+", JS)))

fails = []
for lang in ("ru", "en"):
    ctx = Ctx(lang, "https://example.test")
    data = page_headers.render(ctx)
    html = layout.document(ctx, active=data["active"], title=data["title"],
                           description=data["description"], body=data["body"],
                           css=data["css"], js=data["js"])

    def need(pat, what):
        if not re.search(pat, html):
            fails.append("%s: missing %s" % (lang, what))

    for f in FIELDS:
        need(r'id="%s"' % f, "form control #%s" % f)
    for i in IDS:
        need(r'id="%s"' % re.escape(i), "element #%s" % i)
    for sel_, what in [
        (r'data-setting="', "data-setting boxes"),
        (r'data-preset="minimal"', "preset minimal"),
        (r'data-preset="brand"', "preset brand"),
        (r'data-preset="full"', "preset full"),
        (r'data-pv="dash"', "preview tab dash"),
        (r'data-pv="proxy"', "preview tab proxy"),
        (r'class="fab__ring"', "fab ring"),
        (r'<form[^>]+id="builder"', "<form id=builder>"),
    ]:
        need(sel_, what)
    for k in ("http", "nginx", "caddy", "php", "go", "py"):
        need(r'id="out-%s"' % k, "#out-%s" % k)

    m = re.search(r'<script type="application/json" id="builder-strings">(.*?)</script>',
                  html, re.S)
    if not m:
        fails.append("%s: no #builder-strings" % lang)
    else:
        payload = json.loads(m.group(1).replace("<\\/", "</"))
        for k in KEYS:
            if k not in payload:
                fails.append("%s: builder-strings missing %r" % (lang, k))
        extra = sorted(set(payload) - set(KEYS) - {"presets"})
        if extra:
            fails.append("%s: builder-strings unused keys %s" % (lang, extra))
        for pname, pdata in payload.get("presets", {}).items():
            for key in pdata:
                if key == "widgets":
                    continue
                if not re.search(r'id="%s"' % key, html):
                    fails.append("%s: preset %s sets unknown id %r" % (lang, pname, key))
        if "{n}" not in payload.get("warnPlatform", ""):
            fails.append("%s: warnPlatform lacks {n}" % lang)
        for ph in ("{n}", "{b}"):
            if ph not in payload.get("countLabel", ""):
                fails.append("%s: countLabel lacks %s" % (lang, ph))

    m = re.search(r'<script type="application/json" id="widget-spec">(.*?)</script>',
                  html, re.S)
    if not m:
        fails.append("%s: no #widget-spec" % lang)
    else:
        ws = json.loads(m.group(1).replace("<\\/", "</"))
        if len(ws) != len(spec.WIDGETS):
            fails.append("%s: widget-spec %d entries, expected %d"
                         % (lang, len(ws), len(spec.WIDGETS)))
        for w in ws:
            if set(w) != {"id", "label", "plat", "on"}:
                fails.append("%s: widget-spec entry shape %s" % (lang, sorted(w)))

    for href in set(re.findall(r'<li data-keys="[^"]*"><a href="#([a-z-]+)"', html)):
        if 'id="%s"' % href not in html:
            fails.append("%s: TOC points at missing #%s" % (lang, href))

    for bad in ("{}", "%s", "None</", "</p></p>", "&amp;lt;"):
        if bad in html:
            fails.append("%s: rendered HTML contains %r" % (lang, bad))

    for tag in ("form", "fieldset", "select", "textarea", "table", "dl", "ol", "nav", "section"):
        o = len(re.findall(r"<%s\b" % tag, html))
        c = len(re.findall(r"</%s>" % tag, html))
        if o != c:
            fails.append("%s: <%s> %d open vs %d close" % (lang, tag, o, c))

print("contract: %d controls, %d ids, %d strings" % (len(FIELDS), len(IDS), len(KEYS)))
if fails:
    print("\nFAILURES (%d):" % len(fails))
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("headers page: contract satisfied")
