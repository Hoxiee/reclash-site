"""Shared mock-subscription logic: profile body, response headers, and the two
things the "living manual" needs on top of them — a per-header explanation
table and an "open in the builder" #cfg deep link.

build.py writes the body and the ReClash-* headers into dist/; the mock-subs
page reads the *same* functions to show, in a modal, exactly what a card sends
and to hand the builder a pre-filled configuration. One source, so the card,
the served response and the manual can never drift apart.
"""

import base64 as _b64
import datetime
import json as _json

from . import mocks, spec

GB = mocks.GB


def hval(text):
    """A header value: plain ASCII as-is, anything else as base64:<...> — the
    same rule the headers builder applies to non-ASCII fields."""
    if text is None:
        return None
    if all(0x20 <= ord(c) <= 0x7e for c in text):
        return text
    return "base64:" + _b64.b64encode(text.encode("utf-8")).decode("ascii")


def mock_body(m):
    """A minimal, valid mihomo profile with fake nodes — enough to import and
    exercise the UI; the nodes do not route anywhere. A fixture may ship a raw
    `body` (its own named nodes and groups); we serve it verbatim under the
    same mock-only warning comment."""
    if m.get("body"):
        return ("# Mock subscription: %s. Fake nodes, for testing ReClash only.\n%s"
                % (m["key"], m["body"]))
    group = m["servicename"]
    n = m.get("nodes", 3)
    nodes = "\n".join(
        '  - {name: "%s %02d", type: ss, server: 127.0.0.1, port: %d, '
        'cipher: aes-256-gcm, password: mock}' % (group, i + 1, 8388 + i)
        for i in range(n)
    )
    names = ", ".join('"%s %02d"' % (group, i + 1) for i in range(n))
    return (
        "# Mock subscription: %s. Fake nodes, for testing ReClash only.\n"
        "mixed-port: 7890\n"
        "mode: rule\n"
        "proxies:\n%s\n"
        'proxy-groups:\n  - {name: "%s", type: select, proxies: [%s, DIRECT]}\n'
        "rules:\n  - MATCH,%s\n"
        % (m["key"], nodes, group, names, group)
    )


def _expire(q):
    """Unix expiry for a quota block: a fixed date if given, else N days out."""
    if q.get("expire_abs"):
        return q["expire_abs"]
    now = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
    return now + q["expire_days"] * 86400


def mock_headers(m):
    """Ordered (name, value) header pairs for one subscription. Values may
    carry the {BASE} origin token; the caller substitutes it."""
    h = [
        ("Content-Type", "text/yaml; charset=utf-8"),
        ("Content-Disposition", 'attachment; filename="%s.yaml"' % m["key"]),
        ("Profile-Title", hval(m.get("title"))),
        ("ReClash-ServiceName", hval(m.get("servicename"))),
        ("ReClash-ServerInfo", hval(m.get("serverinfo"))),
        ("ReClash-ActiveText", hval(m.get("activetext"))),
        ("ReClash-Hex", m.get("hex")),
        ("ReClash-HeroRing", ";".join(m["heroring"]) if m.get("heroring") else None),
        ("ReClash-HeroEffect", m.get("heroeffect")),
        ("ReClash-ServiceLogo",
         "{BASE}/assets/mock/%s" % m["logo"] if m.get("logo") else None),
        ("ReClash-Background",
         "{BASE}/assets/mock/%s,%d" % (m["bg"][0], m["bg"][1]) if m.get("bg") else None),
        ("ReClash-Widgets", m.get("widgets")),
        ("ReClash-Custom", m.get("custom")),
        ("ReClash-Settings", m.get("settings")),
        ("ReClash-View", m.get("view")),
        ("ReClash-SupportURL", m.get("support")),
        ("ReClash-ReportURL", m.get("reporturl")),
        ("ReClash-WebPageURL", m.get("webpageurl")),
        ("ReClash-BuyPlan", m.get("buyplan")),
        ("ReClash-BuyTraffic", m.get("buytraffic")),
        ("ReClash-Announce", hval(m["announce"][0]) if m.get("announce") else None),
        ("ReClash-AnnounceURL", m.get("announceurl")),
        ("ReClash-AutoUpdateInterval",
         str(m["update_min"]) if m.get("update_min") else None),
        ("ReClash-ExpireDays", m.get("expiredays")),
        ("ReClash-TrafficPercent", m.get("trafficpercent")),
        ("ReClash-NewDomain", m.get("newdomain")),
        ("ReClash-FallbackHosts", m.get("fallbackhosts")),
        # a service header: the server sets it on the response, the provider
        # does not configure it in the builder
        ("X-Hwid-Max-Devices-Reached", "1" if m.get("hwid_limit") else None),
    ]
    q = m.get("quota")
    if q:
        h.append(("Subscription-Userinfo",
                  "upload=%d; download=%d; total=%d; expire=%d"
                  % (q["up_gb"] * GB, q["down_gb"] * GB,
                     q["total_gb"] * GB, _expire(q))))
    return [(k, v) for k, v in h if v is not None]


# --------------------------------------------------------------- the manual
#
# Per-header explanations, keyed by the header's lowercase name. The reclash-*
# purposes and the common-header behaviours come straight from spec.py, so the
# modal manual reads from the same source as the reference page. A couple of
# transport headers the reference does not catalogue get a local line.

_LOCAL_HELP = {
    "content-type": (
        "Тип ответа — профиль mihomo в YAML.",
        "The response type — a mihomo profile in YAML.",
    ),
}


def _header_help():
    out = dict(_LOCAL_HELP)
    for name, _ruval, _enval, ru, en in spec.COMMON_HEADERS:
        out[name] = (ru, en)
    for name, _ruval, _enval, ru, en in spec.RECLASH_HEADERS:
        out[name] = (ru, en)
    # X-Hwid-* are service headers the server sets on the response; their
    # explanations live in spec.HWID_RESPONSE as (name, ru, en) triples.
    for name, ru, en in spec.HWID_RESPONSE:
        out[name] = (ru, en)
    return out


HEADER_HELP = _header_help()


# Header names that have a card on the reference page (id "h-<name>"), so the
# manual can deep-link each header to its full entry. Content-Type and other
# local-only lines are not catalogued there and get no link.
_REF_HEADERS = set()
for _tbl in (spec.COMMON_HEADERS, spec.RECLASH_HEADERS):
    for _row in _tbl:
        _REF_HEADERS.add(_row[0])
for _tbl in (spec.HWID_REQUEST, spec.HWID_RESPONSE):
    for _row in _tbl:
        _REF_HEADERS.add(_row[0])


def ref_anchor(name):
    """The reference-page anchor for a header ("h-<name>"), or None when the
    header has no card there."""
    key = name.lower()
    return "h-" + key if key in _REF_HEADERS else None


def header_rows(m, base_url, lang):
    """(name, wire-value, help-html, ref-anchor) for every header this mock
    sends. The value is exactly what dist/_headers carries — base64:<...> and
    all — so the manual shows the real response, not a prettified one; the
    anchor deep-links the name to its reference card, or is None if uncatalogued."""
    idx = 0 if lang == "ru" else 1
    rows = []
    for name, value in mock_headers(m):
        help_pair = HEADER_HELP.get(name.lower())
        rows.append((
            name,
            value.replace("{BASE}", base_url),
            help_pair[idx] if help_pair else "",
            ref_anchor(name),
        ))
    return rows


# ------------------------------------------------ open-in-the-builder link
#
# The builder loads a full configuration from a `#cfg=<base64-json>` hash: a
# flat map of every form-field id to its value (checkboxes as 0/1), plus
# __order/__w for the widget list. We emit exactly what the builder's own
# syncHash() would, so "Open in builder" lands on a fully-defined form rather
# than one where unset fields keep stray defaults. See assets/js/builder.js.

_VARIANTS = {v[0] for v in spec.THEME_VARIANTS}
_SETTINGS = [tok[0] for tok in spec.SETTINGS_TOKENS]


def _cfg_base():
    d = {
        "f_up": "", "f_down": "", "f_total": "", "f_expire": "",
        "f_title": "", "f_svcname": "", "f_svcname_b64": 0, "f_activetext": "",
        "f_logo": "", "f_serverinfo": "",
        "f_support": "", "f_report": "", "f_webpage": "", "f_buyplan": "", "f_buytraffic": "",
        "f_announce": "", "f_announce_b64": 0, "f_announceurl": "", "f_interval": "",
        "f_expiredays": "", "f_trafficpercent": "",
        "f_hex": "7C5CFF", "f_variant": "tonalspot", "f_theme": 0, "f_pureblack": 0,
        "f_bg": 0, "f_bgurl": "", "f_bgop": "10",
        "f_ring": 0, "f_ring1": "7C5CFF", "f_ring2": "3686ED", "f_ring3": "2FD3B6",
        "f_heroeffect": 0,
        "f_view": 0, "f_view_type": "tab", "f_view_sort": "default",
        "f_view_layout": "standard", "f_view_icon": "standard", "f_view_card": "expand",
        "f_widgets": 0, "f_custom": "", "f_settings": 0,
        "f_newdomain": "", "f_fallback": "", "f_aliases": 0,
    }
    for tok in _SETTINGS:
        d["set:" + tok] = 0
    return d


def builder_cfg(m, base_url, lang):
    """The `#cfg=<...>` fragment that opens the builder pre-filled with `m`."""
    d = _cfg_base()

    if m.get("title"):
        d["f_title"] = m["title"]
    if m.get("servicename"):
        d["f_svcname"] = m["servicename"]
    if m.get("activetext"):
        d["f_activetext"] = m["activetext"]
    if m.get("serverinfo"):
        d["f_serverinfo"] = m["serverinfo"]
    if m.get("logo"):
        d["f_logo"] = "%s/assets/mock/%s" % (base_url, m["logo"])
    for field, key in (("f_support", "support"), ("f_report", "reporturl"),
                       ("f_webpage", "webpageurl"), ("f_buyplan", "buyplan"),
                       ("f_buytraffic", "buytraffic"),
                       ("f_announceurl", "announceurl")):
        if m.get(key):
            d[field] = m[key]
    if m.get("announce"):
        d["f_announce"] = m["announce"][0 if lang == "ru" else 1]
    if m.get("update_min"):
        d["f_interval"] = str(m["update_min"])
    if m.get("expiredays"):
        d["f_expiredays"] = m["expiredays"]
    if m.get("trafficpercent"):
        d["f_trafficpercent"] = m["trafficpercent"]

    if m.get("hex"):
        parts = m["hex"].split(":")
        d["f_hex"] = parts[0]
        d["f_theme"] = 1
        for tok in parts[1:]:
            if tok == "pureblack":
                d["f_pureblack"] = 1
            elif tok in _VARIANTS:
                d["f_variant"] = tok
    if m.get("heroring"):
        d["f_ring"] = 1
        d["f_ring1"], d["f_ring2"], d["f_ring3"] = m["heroring"]
    if m.get("heroeffect") == "aurora":
        d["f_heroeffect"] = 1
    if m.get("bg"):
        d["f_bg"] = 1
        d["f_bgurl"] = "%s/assets/mock/%s" % (base_url, m["bg"][0])
        d["f_bgop"] = str(m["bg"][1])
    if m.get("view"):
        d["f_view"] = 1
        for part in m["view"].split(";"):
            part = part.strip()
            if ":" in part:
                k, v = part.split(":", 1)
                d["f_view_" + k.strip()] = v.strip()

    widget_list = []
    if m.get("widgets"):
        d["f_widgets"] = 1
        widget_list = [w.strip() for w in m["widgets"].split(",") if w.strip()]
        if m.get("custom"):
            d["f_custom"] = m["custom"]
    if m.get("settings"):
        d["f_settings"] = 1
        for tok in (s.strip() for s in m["settings"].split(",")):
            if ("set:" + tok) in d:
                d["set:" + tok] = 1
    if m.get("newdomain"):
        d["f_newdomain"] = m["newdomain"]
    if m.get("fallbackhosts"):
        d["f_fallback"] = m["fallbackhosts"]

    q = m.get("quota")
    if q:
        d["f_up"] = str(q["up_gb"])
        d["f_down"] = str(q["down_gb"])
        d["f_total"] = str(q["total_gb"])
        exp = datetime.datetime.fromtimestamp(_expire(q), datetime.timezone.utc)
        d["f_expire"] = "%04d-%02d-%02d" % (exp.year, exp.month, exp.day)

    d["__order"] = ",".join(widget_list)
    d["__w"] = ",".join(widget_list)

    raw = _json.dumps(d, ensure_ascii=False, separators=(",", ":"))
    payload = _b64.b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")
    return "#cfg=" + payload
