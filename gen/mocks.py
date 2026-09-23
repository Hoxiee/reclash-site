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
#   title      Profile-Title (the imported profile's name)
#   servicename ReClash-ServiceName (provider name in the dashboard)
#   activetext ReClash-ActiveText (connection-screen headline)
#   hex        ReClash-Hex theme seed (6 or 8 hex digits, no #)
#   heroring   (c1, c2, c3) ReClash-HeroRing gradient, or None
#   heroeffect ReClash-HeroEffect ("aurora"), or None
#   logo       file in assets/mock/ for ReClash-ServiceLogo, or None
#   bg         (file, opacity) for ReClash-Background, or None
#   widgets    ReClash-Widgets (comma-separated), or None
#   view       ReClash-View tokens, or None
#   support    ReClash-SupportURL, or None
#   buyplan    ReClash-BuyPlan, or None
#   buytraffic ReClash-BuyTraffic, or None
#   announce   (ru, en) ReClash-Announce, or None
#   quota      {up_gb, down_gb, total_gb, expire_days} -> Subscription-Userinfo,
#              or None for an unlimited plan (no quota header)
#   update_min ReClash-AutoUpdateInterval in minutes, or None
#   nodes      how many proxies the profile body carries
MOCKS = [
    {
        "key": "standard",
        "tone": "",
        "name": ("Стандарт", "Standard"),
        "blurb": ("полная подписка с квотой и сроком",
                  "a full subscription with a quota and an expiry"),
        "title": "Standard demo",
        "servicename": "Demo Provider",
        "activetext": None,
        "hex": None,
        "heroring": None,
        "logo": "logo-standard.svg",
        "bg": None,
        "widgets": "networkSpeed,trafficUsage,serviceInfo,changeServerButton",
        "view": None,
        "support": "https://t.me/ReClashApp",
        "buyplan": None,
        "buytraffic": None,
        "announce": None,
        "quota": {"up_gb": 20, "down_gb": 25, "total_gb": 200, "expire_days": 21},
        "update_min": 720,
        "nodes": 4,
    },
    {
        "key": "expiring",
        "tone": "warn",
        "name": ("На исходе", "Expiring"),
        "blurb": ("квота почти исчерпана, срок близко",
                  "quota nearly spent, expiry near"),
        "title": "Expiring demo",
        "servicename": "Demo Provider",
        "activetext": None,
        "hex": None,
        "heroring": None,
        "logo": "logo-standard.svg",
        "bg": None,
        "widgets": "networkSpeed,trafficUsage,serviceInfo,changeServerButton",
        "view": None,
        "support": "https://t.me/ReClashApp",
        "buyplan": "https://t.me/ReClashApp",
        "buytraffic": "https://t.me/ReClashApp",
        "announce": None,
        "quota": {"up_gb": 96, "down_gb": 100, "total_gb": 200, "expire_days": 2},
        "update_min": 360,
        "nodes": 3,
    },
    {
        "key": "unlimited",
        "tone": "",
        "name": ("Безлимит", "Unlimited"),
        "blurb": ("без ограничения трафика и срока",
                  "no traffic cap, no expiry"),
        "title": "Unlimited demo",
        "servicename": "Demo Provider",
        "activetext": None,
        "hex": None,
        "heroring": None,
        "logo": "logo-standard.svg",
        "bg": None,
        "widgets": "networkSpeed,serviceInfo,changeServerButton,smartRouting",
        "view": None,
        "support": "https://t.me/ReClashApp",
        "buyplan": None,
        "buytraffic": None,
        "announce": None,
        "quota": None,
        "update_min": 1440,
        "nodes": 6,
    },
    {
        "key": "themed",
        "tone": "themed",
        "name": ("С оформлением", "Themed"),
        "blurb": ("свой логотип, тема, фон и объявление",
                  "custom logo, theme, background and announce"),
        "title": "Themed demo",
        "servicename": "Aurora VPN",
        "activetext": "Aurora on",
        "hex": "7C5CFF",
        "heroring": ("7C5CFF", "3686ED", "2FD3B6"),
        "heroeffect": "aurora",
        "logo": "logo-aurora.svg",
        "bg": ("bg-aurora.svg", 22),
        "widgets": "networkSpeed,trafficUsage,serviceInfo,changeServerButton,announce",
        "view": "type:tab; sort:delay; layout:standard; icon:standard; card:expand",
        "support": "https://t.me/ReClashApp",
        "buyplan": "https://t.me/ReClashApp",
        "buytraffic": None,
        # non-ASCII on purpose: exercises the base64: path in the app
        "announce": ("Тестовое объявление провайдера — это мок-данные.",
                     "Test provider announcement — this is mock data."),
        "quota": {"up_gb": 5, "down_gb": 8, "total_gb": 100, "expire_days": 88},
        "update_min": 720,
        "nodes": 5,
    },
]


def by_key(key):
    for m in MOCKS:
        if m["key"] == key:
            return m
    return None
