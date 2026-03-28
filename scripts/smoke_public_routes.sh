#!/usr/bin/env bash
# Phase D1/E1: optional curl smoke when server is already running (8069).
set -euo pipefail
BASE="${1:-http://127.0.0.1:8069}"
curl -sf "$BASE/health" | head -c 200 || { echo "health failed"; exit 1; }
curl -sf "$BASE/metrics" | head -c 200 || { echo "metrics failed"; exit 1; }
echo "smoke ok: $BASE"
