# Rules

## The fork owns structure; the site owns prose

`gen/provider_standard.g.json` is **vendored from the fork** — the fork's `tool/gen_provider_standard.dart` derives
it from the model files. Never hand-edit it. To pull new headers, widgets or tokens, re-vendor:

```
python3 tools/check_fork_headers.py --sync
```

The site adds only the bilingual RU/EN prose (in `gen/spec.py`) and the interactive builder. `spec.py`'s `_cover()`
guards fail the build the moment a derived header/widget/token has no prose, so a fork change surfaces here as a hard
error, never as silent drift.

## Bilingual

Every user-facing string is a pair. Use `ctx.t("русский", "english")` for inline text and the paired-tuple prose in
`spec.py`; index paired lists with `L = 0 if ctx.lang == "ru" else 1`. `verify.py` enforces RU/EN parity — a page that
renders in one language and not the other fails.

## Rebuild, then revert date noise

Rebuilding rewrites a few `dist/` files with only a timestamp or relative-date change. Revert them before staging:

```
git checkout -- dist/_headers dist/mock/_headers.json dist/*/mock-subs.html dist/sitemap.xml
```

Commit real content changes only; a diff that is nothing but dates does not belong in history.

## House style

- **English** for everything in the repo — code, comments, docs, commit messages. Chat is Russian.
- **No emoji** anywhere in the site or its assets.
- **No plans, roadmaps, phase notes or essays** in the repo. Temporary code carries one `TODO: <topic>` line.
- Commit messages follow Conventional Commits, subject lowercase and ≤100 chars with no trailing period; a body only
  when a fact is not visible from the subject and diff, as `- ` bullets. Never add a `Co-authored-by` trailer for a
  coding agent.

## Fork path

Tools that read the fork resolve it from `RECLASH_FORK`, else the default sibling checkout. CI has no fork, so those
legs skip; do not make a green build depend on the fork being present.
