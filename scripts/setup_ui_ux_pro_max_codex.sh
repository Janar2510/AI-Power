#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_SKILL_DIR="$ROOT_DIR/.cursor/skills/ui-ux-pro-max"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
DEST_SKILL_DIR="$CODEX_HOME_DIR/skills/ui-ux-pro-max"

if [[ ! -f "$SOURCE_SKILL_DIR/SKILL.md" ]]; then
  echo "Vendored skill not found: $SOURCE_SKILL_DIR/SKILL.md" >&2
  exit 1
fi

mkdir -p "$CODEX_HOME_DIR/skills"

if [[ -L "$DEST_SKILL_DIR" ]]; then
  CURRENT_TARGET="$(readlink "$DEST_SKILL_DIR")"
  if [[ "$CURRENT_TARGET" == "$SOURCE_SKILL_DIR" ]]; then
    echo "Codex skill link already configured:"
    echo "  $DEST_SKILL_DIR -> $CURRENT_TARGET"
    exit 0
  fi
  echo "Existing Codex skill symlink points elsewhere:" >&2
  echo "  $DEST_SKILL_DIR -> $CURRENT_TARGET" >&2
  echo "Remove or rename it before relinking." >&2
  exit 1
fi

if [[ -e "$DEST_SKILL_DIR" ]]; then
  echo "Codex skill destination already exists and is not a symlink:" >&2
  echo "  $DEST_SKILL_DIR" >&2
  echo "Move or remove it before linking the vendored project skill." >&2
  exit 1
fi

ln -s "$SOURCE_SKILL_DIR" "$DEST_SKILL_DIR"

echo "Codex skill configured:"
echo "  $DEST_SKILL_DIR -> $SOURCE_SKILL_DIR"
echo
echo "Next:"
echo "  1. Restart Codex to pick up the new skill."
echo "  2. Run: bash scripts/check_ui_ux_pro_max_setup.sh"
