#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
SOURCE_SKILL_DIR="$ROOT_DIR/.cursor/skills/ui-ux-pro-max"
CODEX_SKILL_DIR="$CODEX_HOME_DIR/skills/ui-ux-pro-max"

echo "== UI UX Pro Max setup check =="
echo

echo "-- Python --"
if command -v python3 >/dev/null 2>&1; then
  python3 --version
else
  echo "python3: missing"
fi
echo

echo "-- UI Pro CLI --"
if command -v uipro >/dev/null 2>&1; then
  uipro --version
else
  echo "uipro: missing"
fi
echo

echo "-- Vendored skill --"
if [[ -f "$SOURCE_SKILL_DIR/SKILL.md" ]]; then
  echo "present: $SOURCE_SKILL_DIR"
else
  echo "missing: $SOURCE_SKILL_DIR"
fi
echo

echo "-- Cursor rules --"
for path in \
  "$ROOT_DIR/.cursor/rules/agents/ui-designer.mdc" \
  "$ROOT_DIR/.cursor/rules/agents/frontend-builder.mdc"
do
  if [[ -f "$path" ]]; then
    echo "present: $path"
  else
    echo "missing: $path"
  fi
done
echo

echo "-- Codex skill --"
if [[ -L "$CODEX_SKILL_DIR" ]]; then
  echo "linked: $CODEX_SKILL_DIR -> $(readlink "$CODEX_SKILL_DIR")"
elif [[ -e "$CODEX_SKILL_DIR" ]]; then
  echo "present (not symlink): $CODEX_SKILL_DIR"
else
  echo "missing: $CODEX_SKILL_DIR"
fi
