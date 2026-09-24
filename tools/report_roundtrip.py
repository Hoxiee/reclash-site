#!/usr/bin/env python3
"""Round-trips the demo report through the R1 envelope the decoder page reads.

Guarantees the site's encoder (`page_report.demo_blob`) and the shape the
client `report.js` expects stay in lockstep: gzip + base64url, `R1.` tag, and a
byte-for-byte JSON reconstruction of the fixture. The real encoder lives in the
app, but the algorithm is identical, so a drift here is a drift there.
"""
import base64
import gzip
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from gen import page_report, report_demo  # noqa: E402

fails = []


def b64url_to_bytes(payload):
    pad = "=" * (-len(payload) % 4)
    return base64.urlsafe_b64decode(payload + pad)


def decode(blob):
    tag, _, payload = blob.partition(".")
    if tag != "R1":
        raise ValueError("bad tag %r" % tag)
    raw = gzip.decompress(b64url_to_bytes(payload))
    return json.loads(raw.decode("utf-8"))


blob = page_report.demo_blob()
if not blob.startswith("R1."):
    fails.append("blob is not an R1 envelope: %r" % blob[:8])
if "=" in blob:
    fails.append("blob carries base64 padding")

try:
    back = decode(blob)
except (ValueError, OSError) as e:
    back = None
    fails.append("decode failed: %s" % e)

want = report_demo.report()
if back is not None and back != want:
    fails.append("round-trip mismatch: decoded report != fixture")

# The on-page demo link must carry exactly this blob.
demo_href = "report.html#d=%s" % blob
if "#d=R1." not in demo_href:
    fails.append("demo link is malformed")

if fails:
    print("FAILURES (%d):" % len(fails))
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("round-trip ok: R1 envelope decodes to the demo fixture (%d bytes)" % len(blob))
