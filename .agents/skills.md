# Skills

Repo-scoped skills live in `.agents/skills/<name>/SKILL.md`, each with YAML frontmatter (`name`, and a `description`
starting "Use when …" so the agent can match it to a task). `.claude/skills/<name>` are symlinks into these
directories, so a skill is authored once and both toolchains see it.

## Index

- **provider-sync** — recurring chore: pull new provider headers/widgets/tokens from the fork into the vendored
  standard, add RU/EN prose, wire the builder, rebuild, and keep every guard green.
