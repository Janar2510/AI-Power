# Codex Project Notes

This project vendors the UI UX Pro Max skill at `.cursor/skills/ui-ux-pro-max`, but Codex on this machine loads skills from `~/.codex/skills`.

To wire the vendored skill into Codex without duplicating files:

```bash
bash scripts/setup_ui_ux_pro_max_codex.sh
```

To verify the full Cursor + Codex setup:

```bash
bash scripts/check_ui_ux_pro_max_setup.sh
```

See `docs/assistant-skill-setup.md` for the full setup model, prerequisites, offline notes, and verification details.
