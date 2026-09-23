"""Mock subscriptions: fake subscription links for exercising the client.

The cards, the profile bodies and the ReClash-* headers all come from the one
source in gen/mocks.py, so a card can never claim something the served
response does not carry. The import button is a real reclash://install-config
deep link pointing at /mock/<key> on this host.
"""

from . import ui, mocks
from .ui import esc, chip, btn, _uri


def _facts(ctx, m):
    t = ctx.t
    q = m.get("quota")
    if q:
        used = q["up_gb"] + q["down_gb"]
        traffic = t("%d / %d ГБ" % (used, q["total_gb"]),
                    "%d / %d GB" % (used, q["total_gb"]))
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


def card(ctx, m):
    t = ctx.t
    name = t(*m["name"])
    sub = t(*m["blurb"])
    tone = "mock--" + m["tone"] if m.get("tone") else ""
    facts = "".join(
        '<div class="mock__fact"><dt>%s</dt><dd>%s</dd></div>' % (esc(a), esc(b))
        for a, b in _facts(ctx, m)
    )
    sub_url = "%s/mock/%s" % (ctx.base_url, m["key"])
    deeplink = "reclash://install-config?url=" + _uri(sub_url)
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
        tone, esc(name), esc(sub), facts, esc(sub_url),
        btn(deeplink, t("Импорт в ReClash", "Import into ReClash"), "btn--sm",
            icon_name="download"),
    )


def section_cards(ctx):
    cards = "".join(card(ctx, m) for m in mocks.MOCKS)
    return (
        '<section class="section"><div class="shell">'
        '<div class="mocks">%s</div>'
        "</div></section>" % cards
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
        "js": (),
    }
