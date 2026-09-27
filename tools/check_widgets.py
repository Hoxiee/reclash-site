#!/usr/bin/env python3
"""Guard spec.WIDGETS against the fork's DashboardWidget enum.

The builder mirrors the application's dashboard widgets by hand. When the fork
adds, drops or reorders a widget, this catches the drift before the preview
starts lying about the app. It reads the fork's enum directly, so there is one
source of truth and the reviewer sees the difference as a diff, not a surprise.

The fork is not present in CI (Cloudflare Pages has no clone), so a missing
fork is a skip, not a failure. Point RECLASH_FORK elsewhere to override the
default checkout path.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from gen import spec

FORK = os.environ.get("RECLASH_FORK", "/home/hoshi/Projects/_NEW_NEW_NEW_/forks/ReClash")
ENUM = os.path.join(FORK, "lib/enum/enum.dart")

# byedpi-only widgets: the builder targets VPN/common profiles, so these three
# are intentionally absent from spec.WIDGETS and must not read as drift.
ALLOW = {"desyncStrategy", "desyncTest", "desyncEngine"}


def fork_widgets(text):
    """The DashboardWidget constants, in declaration order."""
    m = re.search(r"enum\s+DashboardWidget\s*\{(.*?);", text, re.S)
    if not m:
        return None
    body = re.sub(r"\([^)]*\)", "", m.group(1))  # drop (platforms: …)/(modes: …)
    out = []
    for chunk in body.split(","):
        name = chunk.strip()
        if re.fullmatch(r"[a-z][A-Za-z0-9]*", name):
            out.append(name)
    return out


def main():
    if not os.path.isfile(ENUM):
        print("check_widgets: fork not found at %s — skipping" % ENUM)
        return 0

    fork = fork_widgets(open(ENUM, encoding="utf-8").read())
    if not fork:
        print("check_widgets: DashboardWidget enum not found in %s" % ENUM)
        return 1

    ours = [w[0] for w in spec.WIDGETS]
    fork_kept = [w for w in fork if w not in ALLOW]

    fset, oset = set(fork_kept), set(ours)
    missing = [w for w in fork_kept if w not in oset]   # in the app, not in spec
    stale = [w for w in ours if w not in fset]           # in spec, gone from app

    fails = []
    if missing:
        fails.append("widgets in the app but missing from spec.WIDGETS: " + ", ".join(missing))
    if stale:
        fails.append("widgets in spec.WIDGETS but gone from the app: " + ", ".join(stale))
    if not missing and not stale and fork_kept != ours:
        fails.append("widget order differs from the enum:\n    app:  %s\n    spec: %s"
                     % (", ".join(fork_kept), ", ".join(ours)))

    print("check_widgets: %d app widgets (%d after allowlist), %d in spec"
          % (len(fork), len(fork_kept), len(ours)))
    if fails:
        print("\nDRIFT (%d):" % len(fails))
        for f in fails:
            print("  -", f)
        return 1
    print("widgets: spec matches the fork enum")
    return 0


if __name__ == "__main__":
    sys.exit(main())
