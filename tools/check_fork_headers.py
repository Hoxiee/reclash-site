#!/usr/bin/env python3
"""Guard the site's provider standard against the ReClash fork.

The fork is the single source of truth. Its `tool/gen_provider_standard.dart`
reads the panel-header converter, the appearance model and the widget enum and
emits `provider_standard.g.json` — the machine-readable contract for every
response header, appearance token and dashboard widget the app understands. A
freshness test in the fork keeps that JSON in step with the model files.

The site *vendors* a copy of that JSON at gen/provider_standard.g.json and reads
its structure directly (spec.py derives the widget set, the reclash-view tokens
and the theme variants from it). What the site adds on top is RU/EN prose the
fork has nowhere to keep: the header purpose text, the alias labels, the widget
labels. This tool guards the one seam that stays hand-tended — the prose — and
the one copy that can go stale — the vendored JSON. It runs in two directions:

  spec.py  <->  vendored JSON   (always, even in CI without the fork)
    A wire key the fork reads but spec.py never documents is a header you added
    to the app and forgot on the site; the tool prints a paste-ready spec.py
    stub so the port is "paste, then write the prose". A reclash-*/flclashx-*
    the site still documents but the JSON no longer names is one you renamed or
    dropped. The derived halves (widgets, view tokens, theme variants) are
    checked for shape too, in case spec.py was hand-edited off its JSON source.

  vendored JSON  <->  fork      (only when the fork is checked out)
    If the committed JSON here differs from the fork's, the vendored copy is
    stale. Run this tool with --sync to regenerate it from the fork and copy it
    across in one step.

The fork is absent in CI (Cloudflare Pages has no clone), so the freshness leg
is a skip, not a failure. Point RECLASH_FORK elsewhere to override the default
checkout path.
"""
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from gen import spec

FORK = os.environ.get("RECLASH_FORK", "/home/hoshi/Projects/_NEW_NEW_NEW_/forks/ReClash")
FORK_JSON = os.path.join(FORK, "provider_standard.g.json")
FORK_GEN = os.path.join("tool", "gen_provider_standard.dart")  # relative to the fork
VENDOR = os.path.join(ROOT, "gen", "provider_standard.g.json")


def documented():
    """Every wire key the site documents, split by the section that owns it."""
    reclash = {h[0] for h in spec.RECLASH_HEADERS}
    common = {h[0] for h in spec.COMMON_HEADERS}
    # alias rows carry unit hints like "profile-update-interval ({h})" — the
    # header name is the first token, the "({h})" is display sugar.
    alias = {n.split()[0] for row in spec.ALIASES for n in row[2]}
    hwid = {h[0] for h in spec.HWID_REQUEST} | {h[0] for h in spec.HWID_RESPONSE}
    return reclash, common, alias, hwid


def stub(entry):
    """A paste-ready spec.py fragment for one undocumented JSON header."""
    keys = entry["sourceKeys"]
    head = keys[0]
    flclashx = [k for k in keys if k.startswith("flclashx-")]
    lines = ['  # %s  (canonicalKey: %s, transform: %s)'
             % (head, entry["canonical"], entry["transform"])]
    if head.startswith("reclash-"):
        lines.append('  # -> add to spec.RECLASH_HEADERS:')
        lines.append('    ("%s", "RU значение", "EN value",' % head)
        lines.append('     "RU назначение.", "EN purpose."),')
    else:
        lines.append('  # -> add to spec.COMMON_HEADERS:')
        lines.append('    ("%s", "RU значение", "EN value",' % head)
        lines.append('     "RU поведение.", "EN behaviour."),')
    if flclashx:
        lines.append('  # -> and a spec.ALIASES row (fork pairs it with %s):'
                     % ", ".join(flclashx))
        lines.append('    ("RU метка", "EN label", %r),' % keys)
    return "\n".join(lines)


def check_spec(std):
    """spec.py prose and derived tables against the vendored standard."""
    fails = []
    reclash, common, alias, hwid = documented()
    doc = reclash | common | alias | hwid

    wire = [k for h in std["headers"] for k in h["sourceKeys"]]
    wire_set = set(wire) | set(std["externalCommon"])

    # a header the fork reads but the site never mentions
    undoc = [h for h in std["headers"] if any(k not in doc for k in h["sourceKeys"])]
    undoc += [{"sourceKeys": [k], "canonical": "(external)", "transform": "none"}
              for k in std["externalCommon"] if k not in doc]
    # a reclash-*/flclashx-* the site still documents but the fork dropped
    owned = reclash | {a for a in alias if a.startswith("flclashx-")}
    stale = sorted(owned - wire_set)

    if undoc:
        fails.append(("read by the fork but undocumented in spec.py: "
                      + ", ".join(h["sourceKeys"][0] for h in undoc), undoc))
    if stale:
        fails.append(("documented in spec.py but no longer read by the fork: "
                      + ", ".join(stale), None))

    # the derived halves: spec.py must still mirror its JSON source exactly
    want_w = [(w["id"], sorted(w["platforms"]))
              for w in std["widgets"] if w["modes"] != ["byedpi"]]
    got_w = [(w[0], sorted({"all": ["Android", "Linux", "MacOS", "Windows"],
                            "desktop": ["Linux", "MacOS", "Windows"],
                            "android": ["Android"]}[w[1]])) for w in spec.WIDGETS]
    if got_w != want_w:
        fails.append(("spec.WIDGETS drifted from the vendored widget set "
                      "(id/platform/order)", None))
    if [t[0] for t in spec.VIEW_TOKENS] != list(std["tokens"]["view"]) or \
            any(list(t[1]) != std["tokens"]["view"][t[0]] for t in spec.VIEW_TOKENS):
        fails.append(("spec.VIEW_TOKENS drifted from the vendored view tokens", None))
    if [t[0] for t in spec.THEME_VARIANTS] != std["tokens"]["themeVariants"]:
        fails.append(("spec.THEME_VARIANTS drifted from the vendored theme variants",
                      None))
    return fails, undoc


# Canonical headers the interactive builder is not expected to emit: the two
# HWID verdicts are runtime answers the client reads, not values a provider
# authors in a response. Everything else the fork reads, the builder must be
# able to write, or the "keep the builder in sync" chore has silently lapsed.
BUILDER_SKIP = {"hwidMaxDevicesReached", "hwidNotSupported"}
BUILDER_JS = os.path.join(ROOT, "assets", "js", "builder.js")


def check_builder(std):
    """Every provider-authorable header the fork reads must have a push() in
    builder.js — the guard that makes forgetting the builder fail the build."""
    if not os.path.isfile(BUILDER_JS):
        return [("assets/js/builder.js missing — cannot check builder coverage",
                 None)]
    src = open(BUILDER_JS, encoding="utf-8").read()
    emitted = {m.lower() for m in re.findall(r"push\('([^']+)'", src)}
    # A canonical header can have several converter entries (the reclash-* form
    # plus a compat alias with its own transform); the builder writes one wire
    # spelling. Gather every wire key per canonical and count it covered when
    # any spelling is emitted, so an alias row never demands a second field.
    keys = {}
    for h in std["headers"]:
        if h["canonical"] in BUILDER_SKIP:
            continue
        keys.setdefault(h["canonical"], []).extend(h["sourceKeys"])
    missing = sorted(
        next(k for k in ks if k.startswith("reclash-")) if any(
            k.startswith("reclash-") for k in ks) else ks[0]
        for ks in keys.values()
        if not any(k.lower() in emitted for k in ks)
    )
    if missing:
        return [("read by the fork but the builder never emits it: "
                 + ", ".join(sorted(missing))
                 + " — add a field in gen/page_headers.py and a push() in "
                 "assets/js/builder.js", None)]
    return []


def do_sync():
    """Regenerate the standard in the fork and copy it into the site."""
    if not os.path.isdir(FORK):
        print("--sync: fork not found at %s (set RECLASH_FORK)" % FORK)
        return 1
    gen = os.path.join(FORK, FORK_GEN)
    if os.path.isfile(gen) and shutil.which("dart"):
        print("--sync: regenerating in the fork via %s" % FORK_GEN)
        r = subprocess.run(["dart", "run", FORK_GEN], cwd=FORK,
                           capture_output=True, text=True)
        if r.returncode != 0:
            sys.stdout.write(r.stdout)
            sys.stderr.write(r.stderr)
            print("--sync: fork generator failed — vendored JSON left untouched")
            return 1
    else:
        print("--sync: dart or generator unavailable — copying the committed JSON")
    if not os.path.isfile(FORK_JSON):
        print("--sync: %s not found — nothing to copy" % FORK_JSON)
        return 1
    shutil.copyfile(FORK_JSON, VENDOR)
    print("--sync: vendored %s -> gen/provider_standard.g.json" % FORK_JSON)
    return 0


def check_freshness():
    """Warn when the vendored JSON has fallen behind the fork's own copy."""
    if not os.path.isfile(FORK_JSON):
        print("freshness: fork not found at %s — skipping" % FORK_JSON)
        return []
    fork = open(FORK_JSON, encoding="utf-8").read()
    vendor = open(VENDOR, encoding="utf-8").read()
    if fork != vendor:
        return ["vendored gen/provider_standard.g.json is stale vs the fork — "
                "run `python tools/check_fork_headers.py --sync`"]
    print("freshness: vendored JSON matches the fork")
    return []


def main(argv):
    if "--sync" in argv:
        rc = do_sync()
        if rc:
            return rc

    if not os.path.isfile(VENDOR):
        print("check_fork_headers: vendored %s missing — run --sync with the fork"
              % os.path.relpath(VENDOR, ROOT))
        return 1
    std = json.load(open(VENDOR, encoding="utf-8"))

    fails, undoc = check_spec(std)
    fails += check_builder(std)
    fails += [(m, None) for m in check_freshness()]

    print("check_fork_headers: %d headers, %d widgets, %d view tokens, %d theme "
          "variants in the vendored standard"
          % (len(std["headers"]), len(std["widgets"]),
             len(std["tokens"]["view"]), len(std["tokens"]["themeVariants"])))

    if fails:
        print("\nDRIFT (%d):" % len(fails))
        for msg, _ in fails:
            print("  -", msg)
        if undoc:
            print("\nPaste these into gen/spec.py, then write the RU/EN text:\n")
            for h in undoc:
                print(stub(h))
                print()
        return 1
    print("headers: spec documents every header the fork reads, the builder "
          "emits every authorable one, tables in sync")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
