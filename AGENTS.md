# AGENTS.md

Entry point for AI coding agents working on the ReClash site. Keep this file small: detail lives under `.agents/`,
and repeatable workflows live under `.agents/skills/*/SKILL.md`.

## Start Here

Read these before making changes:

- [.agents/project.md](.agents/project.md): what the site is, its constraints, and its layout.
- [.agents/commands.md](.agents/commands.md): build, serve, and every check command.
- [.agents/rules.md](.agents/rules.md): source-of-truth seam, bilingual text, dist noise, commits.

Read these only when the task touches their area:

- [.agents/architecture.md](.agents/architecture.md): the generator, `spec.py`, the builder, the checks.
- [.agents/skills.md](.agents/skills.md): index of repo-scoped skills.

## Highest Priority Rules

- Static by construction: pure Python 3 stdlib, no npm, no bundler, no runtime CDN, no network at build time. Do not
  add a dependency to render a page.
- The fork is the single source of truth for the provider standard's **structure**. `gen/provider_standard.g.json` is
  vendored from the fork and read by `gen/spec.py`; never hand-edit it — re-vendor with
  `python tools/check_fork_headers.py --sync`. The site owns only the RU/EN **prose**.
- Every user-facing string is bilingual in place — `t("текст", "text")`. A missing translation is a missing argument,
  not a silent gap. Never ship a one-language string.
- After any source change, run `python3 build.py`, then revert the timestamp-only churn in `dist/` (see
  [.agents/rules.md](.agents/rules.md)) so a commit carries content, not date noise.
- Before committing, the guards must be green: `tools/check_fork_headers.py`, `tools/verify.py`,
  `tools/check_headers.py`, `tools/check_widgets.py`.
- Repo content — code, comments, docs — is English. Chat is Russian.
- No emoji anywhere in the site or its assets.
- No plans, roadmaps, phase notes, or essays in the repo. Temporary code carries a single `TODO: <topic>` line.

## Repo Skills

Use a skill from `.agents/skills/` when a task matches its description. `provider-sync` covers the recurring chore of
following a fork header/widget/appearance-token change through the site.
