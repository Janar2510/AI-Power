#!/usr/bin/env bash
# No-DB regression: account posting/tax + sale/purchase invoice helpers (5x load_module_graph).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PY="${PYTHON:-${ROOT}/.venv/bin/python}"
if [[ ! -x "$PY" ]] && command -v python3 >/dev/null 2>&1; then
  PY="python3"
fi
exec "$PY" -m unittest \
  tests.test_account_post_phase467 \
  tests.test_account_post_phase535 \
  tests.test_account_tax_compute_phase536 \
  tests.test_sale_invoice_phase466 \
  tests.test_purchase_bill_phase471
