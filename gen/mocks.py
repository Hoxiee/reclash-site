"""Single source of truth for the mock subscriptions.

One entry per subscription. build.py turns each entry into three things that
have to agree: a card on the mock-subscriptions page, a profile body served at
/mock/<key>, and a block of ReClash-* response headers in dist/_headers. The
media (logo, background) are real files under assets/mock/ referenced by name
here; the generator rewrites them to absolute HTTPS URLs, exactly as a provider
would put in ReClash-ServiceLogo / ReClash-Background.

Values are stored raw and human-readable. The generator applies the same rules
the headers builder does: non-ASCII text goes out as base64:<...>, GB figures
become bytes, and "expires in N days" becomes a Unix timestamp at build time.
"""

GB = 1073741824

# Each dict is one subscription. Only `key`, `name`, `blurb` and `profile` are
# required; everything else is an optional header the app will honour.
#
#   key        path segment and file stem (/mock/<key>)
#   tone       card accent: "" | "warn" | "themed"
#   name/blurb (ru, en) shown on the card
#   teaches    (ru, en) lead line for the detail modal: what this stand shows
#   title      Profile-Title (the imported profile's name)
#   servicename ReClash-ServiceName (provider name in the dashboard)
#   serverinfo ReClash-ServerInfo (proxy group the active server comes from)
#   activetext ReClash-ActiveText (connection-screen headline)
#   hex        ReClash-Hex theme seed ("<hex>" or "<hex>:<variant>")
#   heroring   (c1, c2, c3) ReClash-HeroRing gradient, or None
#   heroeffect ReClash-HeroEffect ("aurora"), or None
#   logo       file in assets/mock/ for ReClash-ServiceLogo, or None
#   bg         (file, opacity) for ReClash-Background, or None
#   widgets    ReClash-Widgets (comma-separated), or None
#   custom     ReClash-Custom merge mode ("add" | "update"), or None
#   settings   ReClash-Settings (comma-separated setting tokens), or None
#   view       ReClash-View tokens, or None
#   support    ReClash-SupportURL, or None
#   buyplan    ReClash-BuyPlan, or None
#   buytraffic ReClash-BuyTraffic, or None
#   reporturl  ReClash-ReportURL, or None
#   webpageurl ReClash-WebPageURL, or None
#   announceurl ReClash-AnnounceURL, or None
#   expiredays ReClash-ExpireDays ("7,3,1"), or None
#   trafficpercent ReClash-TrafficPercent ("80,95"), or None
#   newdomain  ReClash-NewDomain (host, optional :port), or None
#   fallbackhosts ReClash-FallbackHosts (comma-separated hosts), or None
#   hwid_limit True -> X-Hwid-Max-Devices-Reached (a service header), or None
#   announce   (ru, en) ReClash-Announce, or None
#   quota      {up_gb, down_gb, total_gb, expire_days} -> Subscription-Userinfo,
#              or {..., expire_abs: <unix-seconds>} for a fixed date, or None
#              for an unlimited plan (no quota header)
#   update_min ReClash-AutoUpdateInterval in minutes, or None
#   nodes      how many proxies the card advertises
#   body       a raw mihomo profile served verbatim, or None to auto-generate
MOCKS = [
    {
        "key": "ember",
        "tone": "themed",
        "name": ("Ember Line", "Ember Line"),
        "blurb": ("полный стенд: квота, виджеты, тема, фон и объявление",
                  "the full stand: quota, widgets, theme, background and announce"),
        "teaches": (
            "Полный эталонный стенд. Показывает почти каждый заголовок ReClash "
            "сразу: квоту и срок, полный набор виджетов с режимом слияния, тему "
            "(цвет и вариант палитры), градиент кольца, фон, логотип, объявление, "
            "вид страницы прокси, настройки по умолчанию и ссылки на поддержку и "
            "оплату — всё в одном ответе.",
            "The full reference stand. It exercises almost every ReClash header at "
            "once: quota and expiry, the complete widget set with a merge mode, a "
            "theme (colour and palette variant), the hero-ring gradient, a "
            "background, a logo, an announcement, the proxy-page view, default "
            "settings and support/billing links — all in a single response.",
        ),
        "title": "Ember Line",
        "servicename": "Ember Line",
        "serverinfo": "Ember Select",
        "activetext": "Ember Line is live",
        "hex": "FF6B1A:vibrant",
        "heroring": ("FFC46B", "FF6B1A", "D9380A"),
        "heroeffect": None,
        "logo": "logo-ember.svg",
        "bg": ("bg-ember.svg", 22),
        "widgets": ("networkSpeed,trafficUsage,serviceInfo,changeServerButton,"
                    "announce,networkDetection,memoryInfo,"
                    "metaInfo,intranetIp,tunButton,vpnButton,systemProxyButton"),
        "custom": "update",
        "settings": "autorun,autoupdate,minimize",
        "view": "type:list; sort:delay; layout:tight; icon:standard; card:min",
        "support": "https://example.com/support",
        "buyplan": "https://example.com/plans",
        "buytraffic": "https://example.com/traffic",
        "reporturl": None,
        "announce": (
            "Капитан, стенд Ember Line развёрнут: квота, виджеты, тема и фон в одной фикстуре.",
            "Captain, the Ember Line stand is live: quota, widgets, theme, and background in one fixture.",
        ),
        "quota": {"up_gb": 1, "down_gb": 20, "total_gb": 100, "expire_abs": 1924992000},
        "update_min": 60,
        "nodes": 3,
        "body": """mixed-port: 7890
mode: rule
log-level: info
proxies:
  - name: Ember Berlin
    type: ss
    server: 127.0.0.1
    port: 8395
    cipher: aes-256-gcm
    password: ember-berlin
  - name: Ember Tokyo
    type: ss
    server: 127.0.0.1
    port: 8396
    cipher: aes-256-gcm
    password: ember-tokyo
  - name: Ember Seattle
    type: ss
    server: 127.0.0.1
    port: 8397
    cipher: aes-256-gcm
    password: ember-seattle
proxy-groups:
  - name: Ember Select
    type: select
    proxies: [Ember Berlin, Ember Tokyo, Ember Seattle, DIRECT]
  - name: Ember Fastest
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies: [Ember Berlin, Ember Tokyo, Ember Seattle]
rules:
  - MATCH,Ember Select
""",
    },
    {
        "key": "aurora",
        "tone": "themed",
        "name": ("Aurora Pass", "Aurora Pass"),
        "blurb": ("только визуал: тема, кольцо, живой эффект и фон",
                  "visual only: theme, ring, living effect and background"),
        "teaches": (
            "Оформление и ничего больше. Показывает, как подписка перекрашивает "
            "клиент, не трогая данные: цвет темы с вариантом палитры и чистым "
            "чёрным фоном (pureblack), градиент кольца в тон, живой эффект "
            "«aurora» за кольцом и фоновую картинку панели. Ни квоты, ни виджетов, "
            "ни объявления — только вид.",
            "Theming and nothing else. It shows how a subscription recolours the "
            "client without touching data: a theme colour with a palette variant "
            "and a pure-black background, a matching hero-ring gradient, the living "
            "“aurora” effect behind the ring and a panel background image. No quota, "
            "no widgets, no announcement — appearance only.",
        ),
        "title": "Aurora Pass",
        "servicename": "Aurora Pass",
        "activetext": "Aurora Pass",
        "hex": "6E55F5:vibrant:pureblack",
        "heroring": ("7C5CFF", "22D3EE", "2FD3B6"),
        "heroeffect": "aurora",
        "logo": "logo-aurora.svg",
        "bg": ("bg-aurora.svg", 30),
        "nodes": 4,
    },
    {
        "key": "nimbus",
        "tone": "",
        "name": ("Nimbus Free", "Nimbus Free"),
        "blurb": ("безлимит без оформления: только имя и узлы",
                  "unlimited and unstyled: just a name and nodes"),
        "teaches": (
            "Противоположность эталонному стенду: почти пустой ответ. Нет "
            "заголовка Subscription-Userinfo — приложение показывает «без лимита» и "
            "«бессрочно». Ни темы, ни фона, ни виджетов: только имя профиля, имя "
            "сервиса и вид страницы прокси вкладками. Так выглядит минимальная "
            "рабочая подписка.",
            "The opposite of the reference stand: an almost empty response. There "
            "is no Subscription-Userinfo header, so the app shows “unlimited” and "
            "“never”. No theme, no background, no widgets — just the profile title, "
            "the service name and the tabbed proxy-page view. This is what a minimal "
            "working subscription looks like.",
        ),
        "title": "Nimbus Free",
        "servicename": "Nimbus Free",
        "view": "type:tab; sort:name; layout:standard; icon:standard; card:expand",
        "nodes": 6,
    },
    {
        "key": "sentinel",
        "tone": "warn",
        "name": ("Sentinel Trial", "Sentinel Trial"),
        "blurb": ("пробный тариф на исходе: квота, срок и оплата",
                  "trial running out: quota, expiry and billing"),
        "teaches": (
            "Всё на грани. Квота почти израсходована, а срок задан относительно "
            "(«через 2 дня») — при каждой сборке он снова близко, так что "
            "предупреждения о лимите видно всегда. Объявление зовёт продлить, "
            "виджеты трафика и объявления держат это на виду, а действия «Продлить» "
            "и «Докупить трафик» ведут к оплате.",
            "Everything on the edge. The quota is nearly spent and the expiry is "
            "relative (“in 2 days”), so every build keeps it close and the limit "
            "warnings always show. An announcement asks the user to renew, the "
            "traffic and announce widgets keep it in view, and the renew / top-up "
            "actions lead to billing.",
        ),
        "title": "Sentinel Trial",
        "servicename": "Sentinel Trial",
        "activetext": "Sentinel Trial",
        "widgets": "trafficUsage,metaInfo,announce,serviceInfo,changeServerButton",
        "support": "https://example.com/support",
        "buyplan": "https://example.com/renew",
        "buytraffic": "https://example.com/topup",
        "announce": (
            "Пробный период почти закончился. Продлите, чтобы не потерять доступ.",
            "Your trial is almost over. Renew to keep your access.",
        ),
        "quota": {"up_gb": 9, "down_gb": 38, "total_gb": 50, "expire_days": 2},
        "update_min": 720,
        "nodes": 2,
    },
    {
        "key": "relay",
        "tone": "",
        "name": ("Relay Shift", "Relay Shift"),
        "blurb": ("миграция домена и запасные хосты",
                  "domain migration and fallback hosts"),
        "teaches": (
            "Провайдер переезжает. ReClash-NewDomain предлагает клиенту сменить "
            "адрес подписки на новый домен — после проверок, а ReClash-FallbackHosts "
            "даёт запасные хосты на случай временных сбоёв загрузки. Объявление "
            "предупреждает о переезде; в остальном это обычная подписка с квотой.",
            "The provider is moving. ReClash-NewDomain proposes that the client "
            "switch the subscription address to a new domain — subject to checks — "
            "and ReClash-FallbackHosts supplies backup hosts for transient fetch "
            "failures. An announcement warns about the move; otherwise it is an "
            "ordinary subscription with a quota.",
        ),
        "title": "Relay Shift",
        "servicename": "Relay Shift",
        "newdomain": "relay-new.example.com",
        "fallbackhosts": "relay-b.example.com,relay-c.example.com",
        "support": "https://example.com/support",
        "announce": (
            "Мы переезжаем на новый домен. Клиент предложит обновить адрес подписки.",
            "We are moving to a new domain. The client will offer to update your "
            "subscription address.",
        ),
        "quota": {"up_gb": 5, "down_gb": 60, "total_gb": 300, "expire_days": 60},
        "update_min": 180,
        "nodes": 4,
    },
    {
        "key": "gatekeeper",
        "tone": "warn",
        "name": ("Gatekeeper", "Gatekeeper"),
        "blurb": ("сервисный ответ: достигнут лимит устройств",
                  "service response: device limit reached"),
        "teaches": (
            "Не оформление, а сигнал сервера. Заголовок X-Hwid-Max-Devices-Reached "
            "приложение читает как «достигнут лимит устройств»: оно показывает "
            "соответствующее сообщение и предлагает страницу поддержки из "
            "ReClash-SupportURL. Такие X-Hwid-заголовки провайдер не настраивает в "
            "конструкторе — их ставит сервер в ответе по железу устройства.",
            "Not styling but a server signal. The app reads the "
            "X-Hwid-Max-Devices-Reached header as “device limit reached”: it shows "
            "the matching message and offers the support page from "
            "ReClash-SupportURL. These X-Hwid headers are not configured in the "
            "builder — the server sets them on the response based on the device.",
        ),
        "title": "Gatekeeper",
        "servicename": "Gatekeeper",
        "support": "https://example.com/support",
        "hwid_limit": True,
        "nodes": 2,
    },
    {
        "key": "meridian",
        "tone": "",
        "name": ("Meridian", "Meridian"),
        "blurb": ("средний тариф: квота, виджеты и ссылки без оформления",
                  "the average plan: quota, widgets and links with no theming"),
        "teaches": (
            "Точка отсчёта среди моков: обычный здоровый тариф. Нет ни темы, ни "
            "кольца, ни фона, ни логотипа — клиент выглядит стоково. Есть квота "
            "середины срока, базовые виджеты, вид по умолчанию и ссылки на "
            "поддержку и оплату. Так выглядит провайдер, который ничего не "
            "кастомизирует.",
            "The baseline among the mocks: an ordinary healthy plan. No theme, "
            "no ring, no background, no logo — the client looks stock. It has "
            "a mid-term quota, the default widgets, the default view and "
            "support/billing links. This is what a provider that customises "
            "nothing looks like.",
        ),
        "title": "Meridian",
        "servicename": "Meridian",
        "serverinfo": "Meridian",
        "activetext": "Meridian online",
        "widgets": ("serviceInfo,changeServerButton,networkSpeed,"
                    "trafficUsage,metaInfo"),
        "custom": "update",
        "settings": "autorun,autoupdate",
        "view": "type:list; sort:default; layout:standard; icon:standard; card:expand",
        "support": "https://example.com/support",
        "buyplan": "https://example.com/plans",
        "announce": (
            "Тариф Meridian активен. Новости провайдера появятся здесь.",
            "Your Meridian plan is active. Provider news will appear here.",
        ),
        "quota": {"up_gb": 8, "down_gb": 27, "total_gb": 100, "expire_days": 27},
        "update_min": 360,
        "nodes": 5,
    },
    {
        "key": "ledger",
        "tone": "",
        "name": ("Ledger", "Ledger"),
        "blurb": ("напоминания и ссылки: отчёт, кабинет, дни и проценты",
                  "reminders and links: report, account, days and percents"),
        "teaches": (
            "Редкие заголовки, которых нет в остальных моках. Объявление-ссылка "
            "ведёт на новости, ReClash-WebPageURL — в личный кабинет, "
            "ReClash-ReportURL — на жалобу, а ReClash-ExpireDays и "
            "ReClash-TrafficPercent задают свои пороги напоминаний. Виджеты "
            "сливаются режимом add, в наборе — пульт управления: статус, "
            "соединения, группы, профили и аптайм.",
            "The rare headers no other mock sends. The announcement links to "
            "news, ReClash-WebPageURL leads to the account page, "
            "ReClash-ReportURL to issue reporting, and ReClash-ExpireDays with "
            "ReClash-TrafficPercent set custom reminder thresholds. Widgets "
            "merge with mode add, and the set is a control room: status, "
            "connections, groups, profiles and uptime.",
        ),
        "title": "Ledger",
        "servicename": "Ledger",
        "serverinfo": "Ledger",
        "activetext": "Ledger",
        "logo": "logo-standard.svg",
        "widgets": ("serviceStatus,connections,proxyGroups,profiles,"
                    "smartRouting,runTime,announce,serviceInfo"),
        "custom": "add",
        "settings": "shadowstart,autostart,openlogs,closeconnections",
        "view": "type:list; sort:none; layout:loose; icon:none; card:shrink",
        "support": "https://example.com/support",
        "buyplan": "https://example.com/plans",
        "reporturl": "https://example.com/report",
        "webpageurl": "https://example.com/account",
        "announce": (
            "Напоминания настроены провайдером. Подробности — по ссылке.",
            "Reminders are set by the provider. Follow the link for details.",
        ),
        "announceurl": "https://example.com/news",
        "expiredays": "7,3,1",
        "trafficpercent": "80,95",
        "quota": {"up_gb": 10, "down_gb": 20, "total_gb": 120, "expire_days": 30},
        "update_min": 1440,
        "nodes": 4,
    },
]


def by_key(key):
    for m in MOCKS:
        if m["key"] == key:
            return m
    return None
