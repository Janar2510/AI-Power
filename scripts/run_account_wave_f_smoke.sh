#!/usr/bin/env bash
# Fast account wave F smoke: no Postgres; only 3 test modules (3x load_module_graph).
# For DB-heavy bank/reconcile tests, run unittest on test_bank_statement_* / test_reconcile_wizard_* separately.
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
  tests.test_account_tax_compute_phase536
