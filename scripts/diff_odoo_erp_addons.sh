#!/usr/bin/env bash
# Phase 667: compare Odoo 19 addons/ folder names vs erp-platform/addons/ (see docs/odoo19_erp_addon_inventory_audit.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ODOO="${ODOO19_ADDONS:-$ROOT/../odoo-19.0/addons}"
ERP="$ROOT/addons"
OUT="${1:-}"

if [[ ! -d "$ODOO" ]]; then
  echo "diff_odoo_erp_addons: Odoo addons dir not found: $ODOO" >&2
  echo "Set ODOO19_ADDONS to your odoo-19.0/addons path." >&2
  exit 1
fi
if [[ ! -d "$ERP" ]]; then
  echo "diff_odoo_erp_addons: ERP addons dir not found: $ERP" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ls -1 "$ODOO" | sort >"$TMP/odoo.txt"
ls -1 "$ERP" | grep -vE '^(__pycache__|__init__\.py)$' | sort >"$TMP/erp.txt"

report() {
  echo "=== In Odoo only ($(comm -23 "$TMP/odoo.txt" "$TMP/erp.txt" | wc -l | tr -d ' ')) ==="
  comm -23 "$TMP/odoo.txt" "$TMP/erp.txt"
  echo ""
  echo "=== In ERP only ($(comm -13 "$TMP/odoo.txt" "$TMP/erp.txt" | wc -l | tr -d ' ')) ==="
  comm -13 "$TMP/odoo.txt" "$TMP/erp.txt"
}

if [[ -n "$OUT" ]]; then
  report >"$OUT"
  echo "Wrote $OUT"
else
  report
fi

# Phase 678: optional CI guard — ERP addons dir must contain core modules (low-noise default: unset).
if [[ "${ERP_DIFF_REQUIRE_CORE:-}" == "1" ]]; then
  for _need in web sale account; do
    if ! grep -qx "$_need" "$TMP/erp.txt"; then
      echo "diff_odoo_erp_addons: missing required ERP addon folder: $_need (set ERP_DIFF_REQUIRE_CORE=0 to skip)" >&2
      exit 1
    fi
  done
fi
