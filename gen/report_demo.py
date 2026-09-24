"""A plausible SubscriptionReport fixture, as the app's `toJson()` would emit it.

Mirrors `lib/models/subscription_report.dart` field for field (camelCase keys,
`byErrorClass` entries keyed `class`, `fault` as the enum name). Two consumers
share it: `page_report.render` gzips it into the on-page demo link, and the
round-trip test asserts the decoder reconstructs it byte for byte — so the demo
can never drift from the real envelope format.

Timestamps are fixed, not `now()`, to keep every build reproducible.
"""

_GENERATED_AT = 1758758400
_WINDOW = 3600


def report():
    """One anonymized report: a provider-side outage (fault=server)."""
    return {
        "verdict": {
            "headline": "",
            "fault": "server",
            "health": "degraded",
            "causeCode": "egress_unreachable",
            "layer": "transport",
            "terrain": "ru-home",
            "env": "cellular",
        },
        "schemaVersion": 1,
        "generatedAt": _GENERATED_AT,
        "coreVersion": "mihomo 1.19.15",
        "appVersion": "ReClash 1.7.0",
        "platform": "android",
        "architecture": "arm64",
        "windowStart": _GENERATED_AT - _WINDOW,
        "windowEnd": _GENERATED_AT,
        "terrain": "ru-home",
        "env": "cellular",
        "presets": ["route=auto", "desync=off"],
        "droppedEvents": 0,
        "configNodeCount": 24,
        "observedNodeCount": 18,
        "subscriptionUpdate": {
            "attempted": True,
            "succeeded": False,
            "generatedAt": _GENERATED_AT,
            "hostCount": 2,
            "attempts": 6,
            "failures": 5,
            "hwidRejected": False,
            "emptyResponse": False,
            "undialable": True,
            "dominantError": "timeout",
            "byStage": [
                {"stage": "fetch", "attempts": 4, "failures": 4,
                 "dominantError": "timeout"},
                {"stage": "parse", "attempts": 2, "failures": 1,
                 "dominantError": "empty"},
            ],
            "hosts": [
                {"host": "host-01", "attempts": 4, "failures": 4,
                 "succeeded": False, "lastError": "timeout"},
                {"host": "host-02", "attempts": 2, "failures": 1,
                 "succeeded": True, "lastError": ""},
            ],
        },
        "runtimeDial": {
            "attempts": 210,
            "success": 61,
            "failure": 149,
            "byTransport": [
                {"key": "tcp", "attempts": 150, "failure": 120},
                {"key": "ws", "attempts": 60, "failure": 29},
            ],
            "byStage": [
                {"key": "connect", "attempts": 210, "failure": 132},
                {"key": "handshake", "attempts": 78, "failure": 17},
            ],
            "byErrorClass": [
                {"class": "timeout", "count": 96},
                {"class": "reset", "count": 41},
                {"class": "refused", "count": 12},
            ],
            "byProtocol": [
                {"key": "vless", "attempts": 130, "failure": 101},
                {"key": "trojan", "attempts": 80, "failure": 48},
            ],
            "byGroup": [
                {"group": "Netherlands", "attempts": 120, "failure": 98},
                {"group": "Germany", "attempts": 90, "failure": 51},
            ],
            "byEgress": [
                {"key": "NL", "attempts": 120, "failure": 98},
                {"key": "DE", "attempts": 90, "failure": 51},
            ],
        },
        "nodes": [
            {"alias": "node-07", "protocol": "vless", "transport": "tcp",
             "egressCountry": "NL", "groups": ["Netherlands", "Premium"],
             "positionHint": 7, "attempts": 60, "failures": 58,
             "successes": 2, "failStreak": 21, "dominantClass": "timeout",
             "delayBucketMs": 2000},
            {"alias": "node-12", "protocol": "vless", "transport": "ws",
             "egressCountry": "NL", "groups": ["Netherlands"],
             "positionHint": 12, "attempts": 45, "failures": 40,
             "successes": 5, "failStreak": 9, "dominantClass": "reset",
             "delayBucketMs": 1000},
            {"alias": "node-03", "protocol": "trojan", "transport": "tcp",
             "egressCountry": "DE", "groups": ["Germany"],
             "positionHint": 3, "attempts": 50, "failures": 31,
             "successes": 19, "failStreak": 4, "dominantClass": "refused",
             "delayBucketMs": 500},
        ],
    }
