#!/usr/bin/env bash
# One module = one load_module_graph + one load_default_data (phases 539–541 DB tests).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PY="${PYTHON:-${ROOT}/.venv/bin/python}"
if [[ ! -x "$PY" ]] && command -v python3 >/dev/null 2>&1; then
  PY="python3"
fi
exec "$PY" -m unittest tests.test_phases_539_541_stock_mrp_sale_db
