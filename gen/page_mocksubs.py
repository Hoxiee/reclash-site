"""Mock subscriptions: fake subscription links for exercising the client.

The cards, the profile bodies and the ReClash-* headers all come from the one
source in gen/mocks.py (via gen/mockhdr.py), so a card can never claim
something the served response does not carry. Each card opens a detail modal —
a small "living manual": the lead says what the stand demonstrates, a table
annotates every header it sends (explanations from gen/spec.py), and two
actions import it into ReClash (reclash://install-config) or open it pre-filled
in the header builder.
"""

import datetime

from . import ui, mocks, mockhdr
from .ui import esc, chip, btn, _uri

_EN_MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def _facts(ctx, m):
    t = ctx.t
    q = m.get("quota")
    if q:
        used = q["up_gb"] + q["down_gb"]
        traffic = t("%d / %d ГБ" % (used, q["total_gb"]),
                    "%d / %d GB" % (used, q["total_gb"]))
        if q.get("expire_abs"):
            d = datetime.datetime.fromtimestamp(q["expire_abs"], datetime.timezone.utc)
            expires = t("до %02d.%02d.%d" % (d.day, d.month, d.year),
                        "until %s %d, %d" % (_EN_MONTHS[d.month - 1], d.day, d.year))
        else:
            days = q["expire_days"]
            expires = t("через %d дн." % days, "in %d days" % days)
    else:
        traffic = t("без лимита", "unlimited")
        expires = t("бессрочно", "never")
    return (
        (t("Трафик", "Traffic"), traffic),
        (t("Срок", "Expires"), expires),
        (t("Узлов", "Nodes"), str(m.get("nodes", 0))),
    )


def section_hero(ctx):
    t = ctx.t
    return (
        '<section class="pagehead"><div class="shell">'
        '<p class="eyebrow">' + esc(t("Для тестирования", "For testing")) + "</p>"
        "<h1>" + t('Мок-<span class="grad">подписки</span>',
                   'Mock <span class="grad">subscriptions</span>') + "</h1>"
        '<p class="lede">' + esc(t(
            "Фейковые подписки, чтобы гонять клиент: импорт, показ квоты и срока, "
            "оформление под провайдера и объявления — без настоящего провайдера и "
            "без реального доступа.",
            "Fake subscriptions for exercising the client: import, quota and expiry "
            "display, provider theming and announcements — with no real provider and "
            "no real access.",
        )) + "</p>"
        '<p class="pagehead__meta">'
        + chip(t("Тестовые данные", "Test data"))
        + chip(t("Ничего настоящего", "Nothing real"))
        + chip("reclash://") + "</p></div></section>"
    )


def section_warn(ctx):
    t = ctx.t
    return (
        '<section class="section section--tight"><div class="shell">'
        + ui.notice("<span>" + t(
            "Это не рабочий доступ. Ссылки и цифры вымышлены и существуют только для "
            "проверки функционала приложения. Не используйте их как подписку.",
            "This is not working access. The links and figures are invented and exist "
            "only to test the app. Do not use them as a subscription.",
        ) + "</span>", "notice--warn")
        + "</div></section>"
    )


def _sub_url(ctx, m):
    return "%s/mock/%s" % (ctx.base_url, m["key"])


def _deeplink(ctx, m):
    return "reclash://install-config?url=" + _uri(_sub_url(ctx, m))


def card(ctx, m):
    t = ctx.t
    name = t(*m["name"])
    sub = t(*m["blurb"])
    tone = "mock--" + m["tone"] if m.get("tone") else ""
    facts = "".join(
        '<div class="mock__fact"><dt>%s</dt><dd>%s</dd></div>' % (esc(a), esc(b))
        for a, b in _facts(ctx, m)
    )
    modal_id = "m-" + m["key"]
    acts = (
        btn("#" + modal_id, t("Подробнее", "Details"), "btn--sm btn--ghost",
            icon_name="eye", attrs='data-modal="%s"' % modal_id)
        + btn(_deeplink(ctx, m), t("Импорт", "Import"), "btn--sm",
              icon_name="download")
    )
    return (
        '<article class="mock %s">'
        '<header class="mock__head">'
        '<h3 class="mock__name">%s</h3>'
        '<p class="mock__sub">%s</p></header>'
        '<dl class="mock__facts">%s</dl>'
        '<code class="mock__url">%s</code>'
        '<div class="mock__acts">%s</div>'
        "</article>"
    ) % (
        tone, esc(name), esc(sub), facts, esc(_sub_url(ctx, m)), acts,
    )


def modal(ctx, m):
    """The per-subscription detail modal: lead, facts, a header manual and the
    profile body, plus import / open-in-builder / copy actions. Rendered hidden;
    core.js opens it, and it also opens via :target when JavaScript is off."""
    t = ctx.t
    mid = "m-" + m["key"]
    tone = " mockmodal--" + m["tone"] if m.get("tone") else ""
    name = t(*m["name"])
    teaches = t(*m["teaches"]) if m.get("teaches") else ""

    facts = "".join(
        '<div class="mock__fact"><dt>%s</dt><dd>%s</dd></div>' % (esc(a), esc(b))
        for a, b in _facts(ctx, m)
    )

    ref = ctx.page("reference")
    hint = t("Открыть в справочнике", "Open in the reference")

    def _name_cell(name_, anchor):
        # a catalogued header links to its reference card; the rest stay plain
        if anchor:
            return ('<a class="hdrman__name hdrman__name--link" href="%s#%s" '
                    'title="%s">%s</a>' % (ref, anchor, esc(hint), esc(name_)))
        return '<code class="hdrman__name">%s</code>' % esc(name_)

    rows = "".join(
        '<tr><th scope="row">%s'
        '<code class="hdrman__val">%s</code></th>'
        '<td class="hdrman__why">%s</td></tr>'
        % (_name_cell(name_, anchor), esc(value), why)
        for name_, value, why, anchor in mockhdr.header_rows(m, ctx.base_url, ctx.lang)
    )
    table = (
        '<table class="hdrman"><thead><tr>'
        "<th>%s</th><th>%s</th></tr></thead><tbody>%s</tbody></table>"
        % (esc(t("Заголовок и значение", "Header and value")),
           esc(t("Назначение", "Purpose")), rows)
    )

    body_code = ui.codeblock(
        mockhdr.mock_body(m),
        t("Копировать", "Copy"), t("Скопировано", "Copied"), "lang-yaml")
    url_code = ui.codeblock(
        _sub_url(ctx, m),
        t("Копировать ссылку", "Copy link"), t("Скопировано", "Copied"))

    builder_href = ctx.page("builder") + mockhdr.builder_cfg(m, ctx.base_url, ctx.lang)
    acts = (
        btn(_deeplink(ctx, m), t("Импорт в ReClash", "Import into ReClash"),
            "btn--sm", icon_name="download")
        + btn(builder_href, t("Открыть в конструкторе", "Open in the builder"),
              "btn--sm btn--ghost", icon_name="wrench")
    )

    return (
        '<div class="mockmodal%(tone)s" id="%(mid)s" role="dialog" aria-modal="true" '
        'aria-labelledby="%(mid)s-t">'
        '<a class="mockmodal__scrim" href="#main" tabindex="-1" '
        'aria-label="%(close)s"></a>'
        '<div class="mockmodal__panel">'
        '<button class="mockmodal__x" type="button" data-close '
        'aria-label="%(close)s">&times;</button>'
        '<p class="eyebrow">%(eyebrow)s</p>'
        '<h2 id="%(mid)s-t" class="mockmodal__name">%(name)s</h2>'
        '<p class="mockmodal__teaches">%(teaches)s</p>'
        '<dl class="mock__facts mockmodal__facts">%(facts)s</dl>'
        '<div class="mockmodal__acts">%(acts)s</div>'
        '<h3 class="mockmodal__h">%(hdr_h)s</h3>'
        '<div class="mockmodal__url">%(url)s</div>'
        '<div class="mockmodal__tablewrap" data-fade>%(table)s</div>'
        '<h3 class="mockmodal__h">%(body_h)s</h3>'
        "%(body)s"
        "</div></div>"
    ) % {
        "mid": mid,
        "tone": tone,
        "close": esc(t("Закрыть", "Close")),
        "eyebrow": esc(t("Мок-подписка", "Mock subscription")),
        "name": esc(name),
        "teaches": esc(teaches),
        "facts": facts,
        "acts": acts,
        "hdr_h": esc(t("Заголовки ответа", "Response headers")),
        "url": url_code,
        "table": table,
        "body_h": esc(t("Тело профиля", "Profile body")),
        "body": body_code,
    }


def section_cards(ctx):
    cards = "".join(card(ctx, m) for m in mocks.MOCKS)
    modals = "".join(modal(ctx, m) for m in mocks.MOCKS)
    return (
        '<section class="section"><div class="shell">'
        '<div class="mocks">%s</div>'
        "</div></section>%s" % (cards, modals)
    )


def section_how(ctx):
    t = ctx.t
    items = (
        (t("Скопируйте ссылку", "Copy a link"),
         t("Возьмите URL любой карточки выше.",
           "Grab the URL from any card above.")),
        (t("Добавьте как профиль", "Add it as a profile"),
         t("В клиенте: «Профили» → «Добавить» → вставьте URL, или нажмите «Импорт».",
           "In the client: “Profiles” → “Add” → paste the URL, or tap Import.")),
        (t("Проверьте поведение", "Check the behaviour"),
         t("Квота, срок, тема, логотип и объявление приходят в заголовках ответа.",
           "Quota, expiry, theme, logo and announce arrive in the response headers.")),
    )
    li = "".join(
        "<li><h3>%s</h3><p>%s</p></li>" % (esc(a), esc(b)) for a, b in items
    )
    return (
        '<section class="section section--tight"><div class="shell">'
        + ui.rubric("→", ctx.t("Как пользоваться", "How to use"))
        + '<ol class="mock-how">%s</ol>' % li
        + "</div></section>"
    )


def render(ctx):
    t = ctx.t
    body = "".join([
        section_hero(ctx),
        section_warn(ctx),
        section_cards(ctx),
        section_how(ctx),
    ])
    return {
        "active": "mock",
        "title": t("Мок-подписки", "Mock subscriptions"),
        "description": t(
            "Фейковые тестовые подписки для проверки импорта, квоты и оформления в "
            "ReClash. Не рабочий доступ.",
            "Fake test subscriptions for checking import, quota and theming in "
            "ReClash. Not working access.",
        ),
        "body": body,
        "css": ("mock.css",),
        "js": ("mock.js",),
    }
