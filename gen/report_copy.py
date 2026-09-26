"""Site-owned copy for the subscription-report decoder.

The app ships machine facts (fault codes, counters, node-NN aliases); the site
owns how they read. This module is the single source of truth for every string
report.js paints at runtime, in both languages — mirrored into the page as a
`report-strings` JSON block, exactly like the header builder's `builder-strings`.

Fault wording mirrors the intent of the app's own l10n: inconclusive/unknown
are never phrased as an accusation against the provider. Runtime placeholders
use `{n}` (never printf %-style), so a rendered value can never look like an
un-substituted template to the site's own leftover checks.
"""

# fault -> ((ru, en) headline, (ru, en) body). Keys are SubscriptionFault:
# yourNetwork, client, subscription, server, inconclusive, unknown.
_FAULT = {
    "yourNetwork": (
        ("Похоже на вашу сеть", "Looks like your network"),
        ("Сбои локальны: провод, Wi-Fi или интернет-провайдер вероятнее узлов.",
         "Failures look local: cabling, Wi-Fi or your ISP is likelier than the nodes."),
    ),
    "client": (
        ("Похоже на клиент или устройство", "Looks like the client or device"),
        ("Признаки указывают на настройку приложения или само устройство.",
         "The signs point at the app's configuration or the device itself."),
    ),
    "subscription": (
        ("Похоже на подписку", "Looks like the subscription"),
        ("Проблема на стороне выдачи подписки, а не сети.",
         "The problem is on the subscription-delivery side, not the network."),
    ),
    "server": (
        ("Похоже на провайдера", "Looks like the provider"),
        ("Узлы подписки массово не отвечают.",
         "The subscription's nodes are failing to answer en masse."),
    ),
    "inconclusive": (
        ("Единой причины не видно", "No single cause stands out"),
        ("Ни один фактор не выделяется; данных на вердикт мало.",
         "No one factor dominates; there is little to base a verdict on."),
    ),
    "unknown": (
        ("Недостаточно данных", "Not enough data"),
        ("Слишком мало сигналов, чтобы указать на причину.",
         "Too few signals to point at a cause."),
    ),
}

# fault -> banner tone. subscription/server are the only BAD tones. `server` is
# sample-guarded (min attempts + contrasting egress), so it is never reached on
# thin data; `subscription` fires only on an observed failed update and is
# ordered after the local checks, so neither banner accuses the provider wrongly.
_TONE = {
    "yourNetwork": "caution",
    "client": "caution",
    "subscription": "bad",
    "server": "bad",
    "inconclusive": "neutral",
    "unknown": "neutral",
}


def tone_of(fault):
    return _TONE.get(fault, "neutral")


def strings(ctx):
    """The full report-strings map for the current build language."""
    t = ctx.t
    out = {}
    for key, (head, body) in _FAULT.items():
        out["fault_" + key + "_head"] = t(*head)
        out["fault_" + key + "_body"] = t(*body)
        out["tone_" + key] = _TONE[key]

    out.update({
        "ticket": t("Обращение #{n}", "Ticket #{n}"),
        "health": t("состояние", "health"),
        "cause": t("код причины", "cause code"),
        "layer": t("слой", "layer"),

        "facts_dials": t("Дозвоны", "Dials"),
        "facts_dials_sub": t("успешных из попыток", "successful of attempts"),
        "facts_flagged": t("Отмеченных узлов", "Flagged nodes"),
        "facts_update": t("Обновление подписки", "Subscription update"),
        "facts_update_sub": t("сбоев из попыток", "failures of attempts"),
        "not_run": t("не выполнялось", "not run"),

        "sec_nodes": t("Отмеченные узлы", "Flagged nodes"),
        "sec_dial": t("Разбивка дозвонов", "Dial breakdown"),
        "sec_update": t("Обновление подписки", "Subscription update"),
        "sec_env": t("Окружение", "Environment"),

        "col_alias": t("узел", "node"),
        "col_proto": t("протокол", "protocol"),
        "col_transport": t("транспорт", "transport"),
        "col_egress": t("выход", "egress"),
        "col_groups": t("группы", "groups"),
        "col_attempts": t("попытки", "attempts"),
        "col_fails": t("сбои", "fails"),
        "col_success": t("успехи", "success"),
        "col_streak": t("серия", "streak"),
        "col_class": t("класс", "class"),
        "col_delay": t("задержка", "delay"),
        "col_key": t("ключ", "key"),
        "col_failure": t("сбои", "failure"),
        "col_count": t("счётчик", "count"),
        "col_stage": t("этап", "stage"),
        "col_host": t("хост", "host"),
        "col_lasterror": t("последняя ошибка", "last error"),
        "delay_le": t("≤{n} мс", "≤{n} ms"),

        "dl_transport": t("По транспорту", "By transport"),
        "dl_protocol": t("По протоколу", "By protocol"),
        "dl_group": t("По группам", "By group"),
        "dl_egress": t("По выходу", "By egress"),
        "dl_class": t("По классам ошибок", "By error class"),

        "up_succeeded": t("успешно", "succeeded"),
        "up_hwid": t("отказ по HWID", "HWID rejected"),
        "up_empty": t("пустой ответ", "empty response"),
        "up_undialable": t("недозвон", "undialable"),
        "up_dominant": t("доминирующая ошибка", "dominant error"),
        "up_bystage": t("По этапам", "By stage"),
        "up_hosts": t("Хосты", "Hosts"),

        "env_terrain": t("местность", "terrain"),
        "env_env": t("среда", "env"),
        "env_presets": t("пресеты", "presets"),
        "env_platform": t("платформа", "platform"),
        "env_app": t("версия приложения", "app version"),
        "env_core": t("версия ядра", "core version"),
        "env_window": t("окно наблюдения", "observation window"),
        "env_nodes": t("узлов: в конфиге / наблюдалось",
                       "nodes: in config / observed"),
        "env_dropped": t("потеряно событий", "dropped events"),

        "act_copy": t("Скопировать JSON", "Copy JSON"),
        "act_copy_done": t("Скопировано", "Copied"),
        "act_download": t("Скачать JSON", "Download JSON"),

        # paste-and-match: the provider owns the subscription, so pasting its
        # body here resolves each node-NN back to a real name — parsed in the
        # browser, no network request, connect-src 'none' stays intact.
        "map_title": t("Раскрыть имена узлов",
                       "Reveal the node names"),
        "map_lede": t(
            "Псевдонимы node-NN анонимны специально. Если у вас есть сама "
            "подписка (а у провайдера она есть), вставьте её тело — конфиг "
            "Clash/mihomo или его base64 — и страница сопоставит отмеченные "
            "узлы с реальными именами. Разбор идёт только в браузере: страница "
            "по-прежнему не делает ни одного сетевого запроса, ссылку она не "
            "открывает.",
            "The node-NN aliases are anonymous on purpose. If you hold the "
            "subscription itself (the provider does), paste its body — a "
            "Clash/mihomo config or its base64 — and the page maps the flagged "
            "nodes back to real names. Parsing happens only in the browser: the "
            "page still makes no network request and never opens the link."),
        "map_input_label": t("Тело подписки", "Subscription body"),
        "map_placeholder": t(
            "proxies:\n  - {name: …, type: vless, server: …}\nproxy-groups: …  "
            "(или base64)",
            "proxies:\n  - {name: …, type: vless, server: …}\nproxy-groups: …  "
            "(or base64)"),
        "map_go": t("Сопоставить", "Match"),
        "map_example": t("Подставить пример", "Use the example"),
        "map_col_real": t("реальный узел", "real node"),
        "map_matched": t("Сопоставлено узлов", "Nodes matched"),
        "map_parse_fail": t(
            "Не удалось разобрать подписку. Ожидается YAML-конфиг Clash/mihomo "
            "(секции proxies и proxy-groups) или его base64.",
            "Could not parse the subscription. A Clash/mihomo YAML config "
            "(proxies and proxy-groups) or its base64 is expected."),
        "map_no_nodes": t(
            "В подписке не нашлось узлов.", "No nodes found in the subscription."),
        "conf_exact": t("точное", "exact"),
        "conf_likely": t("вероятно", "likely"),
        "conf_ambiguous": t("неоднозначно", "ambiguous"),
        "conf_none": t("нет в подписке", "not in subscription"),
        "cand_n": t("кандидатов: {n}", "candidates: {n}"),

        "yes": t("да", "yes"),
        "no": t("нет", "no"),

        "err_corrupt": t(
            "Ссылка повреждена или скопирована не полностью.",
            "The link is corrupt or was not copied in full."),
        "err_unsupported": t(
            "Отчёт создан более новой версией. Обновите страницу-декодер.",
            "This report was made by a newer version. Update the decoder page."),
        "err_empty": t("В отчёте нет данных.", "The report carries no data."),
        "err_nogzip": t(
            "Браузер не умеет распаковку gzip. Обновите браузер.",
            "This browser cannot gunzip. Please update it."),
    })
    return out
