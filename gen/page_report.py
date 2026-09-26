"""The subscription-report decoder page.

Server-side this is a thin shell: a paste box, a demo link and the empty
regions report.js fills in on the client. The report itself never touches the
server — it rides in the URL fragment, and `connect-src 'none'` (set in the CSP
below and again in dist/_headers) makes it physically impossible for the page
to send anything anywhere.
"""

import base64
import gzip
import json

from . import report_copy, report_demo
from .ui import esc, chip, json_block

# The in-site page is multi-file and same-origin, so its CSP is 'self' rather
# than the single-file export's 'none'. The real lock is connect-src 'none':
# no fetch/XHR/beacon can run, so the fragment has nowhere to leak. img-src
# forbids pixel exfiltration too; base-uri/form-action close the rest.
# 'unsafe-inline' is unavoidable — the shared layout emits inline bootstrap
# scripts and inline style attributes — and costs nothing here: with no network
# sink, inline script cannot exfiltrate either. frame-ancestors is header-only
# (ignored in meta), so it lives in dist/_headers, not here.
CSP = ("default-src 'self'; connect-src 'none'; img-src 'self' data:; "
       "style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; "
       "base-uri 'none'; form-action 'none'")

# A worked Clash subscription behind the demo report: its groups/positions map
# node-01/02/03 back to real names when pasted into the match box. Kept ASCII so
# it stays language-neutral, and inert (type="text/plain") so it never executes.
DEMO_SUB = """proxies:
  - name: "NL Amsterdam A"
    type: vless
    server: ams-a.demo.example
    port: 443
    network: tcp
  - name: "NL Amsterdam B"
    type: vless
    server: ams-b.demo.example
    port: 443
    network: tcp
  - name: "NL Rotterdam C"
    type: vless
    server: rot-c.demo.example
    port: 443
    network: tcp
  - name: "NL Amsterdam D"
    type: vless
    server: ams-d.demo.example
    port: 443
    network: ws
  - name: "DE Frankfurt 1"
    type: trojan
    server: fra1.demo.example
    port: 443
  - name: "DE Frankfurt 2"
    type: trojan
    server: fra2.demo.example
    port: 443
proxy-groups:
  - name: Netherlands
    type: select
    proxies:
      - "NL Amsterdam A"
      - "NL Amsterdam B"
      - "NL Rotterdam C"
      - "NL Amsterdam D"
  - name: Germany
    type: select
    proxies:
      - "DE Frankfurt 1"
      - "DE Frankfurt 2"
  - name: Premium
    type: select
    proxies:
      - "NL Amsterdam B"
"""


def demo_blob():
    """The demo report as an `R1.` envelope: gzip + base64url, no padding."""
    raw = json.dumps(report_demo.report(), ensure_ascii=False,
                     separators=(",", ":")).encode("utf-8")
    packed = gzip.compress(raw, compresslevel=9, mtime=0)
    b64 = base64.urlsafe_b64encode(packed).decode("ascii").rstrip("=")
    return "R1." + b64


def render(ctx):
    t = ctx.t
    demo_href = "%s#d=%s" % (ctx.page("report"), demo_blob())

    head = (
        '<section class="pagehead"><div class="shell">'
        '<p class="eyebrow">%s</p>'
        "<h1>%s</h1>"
        '<p class="lede">%s</p>'
        '<p class="pagehead__meta">%s%s</p>'
        "</div></section>"
    ) % (
        esc(t("Диагностика для провайдера", "Diagnostics for the provider")),
        t('Отчёт <span class="grad">подписки</span>',
          'Subscription <span class="grad">report</span>'),
        esc(t(
            "Вставьте ссылку из приложения — отчёт раскроется прямо в браузере. "
            "Он едет во фрагменте адреса, который никогда не уходит на сервер, "
            "и эта страница не делает ни одного сетевого запроса.",
            "Paste the link from the app and the report opens right in your "
            "browser. It rides in the address fragment, which never leaves for "
            "a server, and this page makes no network request at all.")),
        chip(t("Приватно", "Private")),
        chip(t("Ничего не покидает браузер", "Nothing leaves the browser")),
    )

    paste = (
        '<div class="report__paste" id="report-paste">'
        '<label class="report__cap" for="report-input">%s</label>'
        '<textarea id="report-input" rows="3" spellcheck="false" '
        'autocomplete="off" placeholder="%s"></textarea>'
        '<div class="row gap-2 report__paste-act">'
        '<button class="btn" type="button" id="report-go">%s</button>'
        '<span class="faint">%s <a class="link link--cyan" href="%s">%s</a></span>'
        "</div>"
        "</div>"
    ) % (
        esc(t("Вставьте ссылку или код отчёта",
              "Paste the report link or code")),
        esc(t("https://…/report.html#d=R1.… или сам код R1.…",
              "https://…/report.html#d=R1.… or the R1.… code itself")),
        esc(t("Показать отчёт", "Show the report")),
        esc(t("Или", "Or")),
        esc(demo_href),
        esc(t("посмотрите на примере", "see a worked example")),
    )

    actions = (
        '<div class="report__actions" id="report-actions" hidden>'
        '<button class="btn btn--sm" type="button" id="report-copy" '
        'data-done-label="%s">%s</button>'
        '<button class="btn btn--sm" type="button" id="report-download">%s</button>'
        '<button class="btn btn--sm btn--ghost" type="button" id="report-reset">%s</button>'
        "</div>"
    ) % (
        esc(t("Скопировано", "Copied")),
        esc(t("Скопировать JSON", "Copy JSON")),
        esc(t("Скачать JSON", "Download JSON")),
        esc(t("Загрузить другой отчёт", "Load another report")),
    )

    mapping = (
        '<div class="report__map" id="report-map" hidden>'
        "<h3>%s</h3>"
        '<p class="report__map-lede faint">%s</p>'
        '<label class="report__cap" for="report-map-input">%s</label>'
        '<textarea id="report-map-input" rows="4" spellcheck="false" '
        'autocomplete="off" placeholder="%s"></textarea>'
        '<div class="row gap-2 report__paste-act">'
        '<button class="btn btn--sm" type="button" id="report-map-go">%s</button>'
        '<button class="btn btn--sm btn--ghost" type="button" '
        'id="report-map-example">%s</button>'
        "</div>"
        '<p class="report__map-msg faint" id="report-map-msg" '
        'aria-live="polite"></p>'
        "</div>"
    ) % (
        esc(t("Раскрыть имена узлов", "Reveal the node names")),
        esc(t(
            "Псевдонимы node-NN анонимны специально. Вставьте тело самой "
            "подписки — конфиг Clash/mihomo или его base64 — и страница "
            "сопоставит отмеченные узлы с реальными именами. Разбор идёт только "
            "в браузере: ни одного сетевого запроса, ссылка не открывается.",
            "The node-NN aliases are anonymous on purpose. Paste the body of "
            "the subscription itself — a Clash/mihomo config or its base64 — "
            "and the page maps the flagged nodes back to real names. Parsing "
            "runs only in the browser: no network request, the link is never "
            "opened.")),
        esc(t("Тело подписки", "Subscription body")),
        esc(t("proxies: … proxy-groups: …  (или base64)",
              "proxies: … proxy-groups: …  (or base64)")),
        esc(t("Сопоставить", "Match")),
        esc(t("Подставить пример", "Use the example")),
    )

    demo_sub = ('<script type="text/plain" id="report-demo-sub">%s</script>'
                % DEMO_SUB)

    body = (
        head
        + '<section class="section"><div class="shell report" '
        'data-report>'
        '<noscript><p class="notice notice--warn">%s</p></noscript>'
        '<p class="notice notice--bad" id="report-error" role="alert" hidden></p>'
        "%s"
        '<div class="report__out" id="report-out" aria-live="polite"></div>'
        "%s"
        "%s"
        "%s"
        "%s"
        "</div></section>"
    ) % (
        esc(t("Для расшифровки отчёта нужен JavaScript — он работает только в "
              "вашем браузере и никуда ничего не отправляет.",
              "Decoding the report needs JavaScript — it runs only in your "
              "browser and sends nothing anywhere.")),
        paste,
        actions,
        mapping,
        demo_sub,
        json_block("report-strings", report_copy.strings(ctx)),
    )

    return {
        "active": "report",
        "title": t("Отчёт подписки", "Subscription report"),
        "description": t(
            "Декодер анонимного отчёта диагностики ReClash. Отчёт "
            "раскрывается прямо в браузере, ничего не уходит на сервер.",
            "Decoder for ReClash's anonymized diagnostic report. It opens "
            "right in your browser; nothing is sent to any server."),
        "body": body,
        "css": ("report.css",),
        "js": ("report.js",),
        "head_extra": (
            '<meta http-equiv="Content-Security-Policy" content="%s">\n'
            '<meta name="referrer" content="no-referrer">\n' % esc(CSP)
        ),
    }
