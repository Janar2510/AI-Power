# Assistant Skill Setup

## Purpose

This document explains the real setup state for the vendored UI UX Pro Max skill and how to use it with Cursor and Codex in this project.

## Current Project Truth

- The vendored skill source lives in `.cursor/skills/ui-ux-pro-max`.
- Cursor-facing rules already reference the skill through `.cursor/rules/agents/`.
- Codex skills on this machine are loaded from `$CODEX_HOME/skills` (defaults to `~/.codex/skills`).
- `uipro-cli` is an optional helper for initialization or refresh; it is not the source of truth for the skill content already committed in this repo.

## Setup States

Treat these as separate checks:

1. **Vendored skill present in repo**
   - Expected path: `.cursor/skills/ui-ux-pro-max/SKILL.md`
2. **Global prerequisites available**
   - `python3 --version`
   - `uipro --version`
3. **Cursor configured**
   - `.cursor/skills/ui-ux-pro-max` exists
   - `.cursor/rules/agents/ui-designer.mdc` and `.cursor/rules/agents/frontend-builder.mdc` reference the design system workflow
4. **Codex configured**
   - `~/.codex/skills/ui-ux-pro-max` exists
   - Best practice in this repo: symlink it to the vendored project copy instead of duplicating files

## macOS Prerequisites

### Python

The machine may already have `/usr/bin/python3`, but that can be an older system Python. For a newer local Python on macOS:

```bash
brew install python3
python3 --version
```

### UI Pro CLI

Install globally:

```bash
npm install -g uipro-cli
uipro --version
```

If the default macOS npm global prefix points to `/usr/local` and fails with `EACCES`, use the repo helper for a user-global install that targets `~/.local`, which is already on PATH in this environment:

```bash
bash scripts/install_uipro_cli_local.sh
uipro --version
```

## Cursor Setup

This repo is already Cursor-ready because the vendored skill and `.cursor` rules are present.

If you need to refresh from the CLI rather than rely on the vendored copy:

```bash
uipro init --ai cursor --offline
```

Use `--offline` when you want to keep the project aligned to bundled or vendored assets instead of downloading from GitHub.

## Codex Setup

Codex does not read project-local `.cursor/skills` directly. In this environment, skills are loaded from `~/.codex/skills`.

This repo provides a helper:

```bash
bash scripts/setup_ui_ux_pro_max_codex.sh
```

What it does:

- verifies the vendored project skill exists
- creates `~/.codex/skills` if needed
- links `~/.codex/skills/ui-ux-pro-max` to the vendored repo skill
- prints follow-up verification guidance

## Verification

Run:

```bash
bash scripts/check_ui_ux_pro_max_setup.sh
```

This checks:

- Python availability and version
- `uipro` availability and version
- vendored skill presence in the repo
- Cursor rule files
- Codex skill link presence and target

## Offline / Vendored Workflow

The project already contains the skill assets it depends on. That means:

- you can use the repo as the design-skill source without downloading the skill again
- `uipro init` is best treated as an assistant initialization or refresh command
- Codex should prefer a symlink to the vendored repo skill over a second copied install when using this project locally

## Files Involved

- `.cursor/skills/ui-ux-pro-max/`
- `.cursor/rules/agents/ui-designer.mdc`
- `.cursor/rules/agents/frontend-builder.mdc`
- `scripts/install_uipro_cli_local.sh`
- `scripts/setup_ui_ux_pro_max_codex.sh`
- `scripts/check_ui_ux_pro_max_setup.sh`
