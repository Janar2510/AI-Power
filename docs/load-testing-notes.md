# Load testing (Phase 517–520)

## Target

- ≥ 1000 rows per hot model (`product.product`, `stock.move`, `account.move`) in staging.
- Measure p95 latency on `/web/dataset/search_read` and `/jsonrpc` call paths.

## Procedure (outline)

1. Seed data via `erp-bin` or CSV import with realistic distributions.
2. Run `k6` or `locust` against authenticated sessions (capture cookie once).
3. Correlate with `/metrics` and application logs; use `core.tools.sql_debug.summarize_slow_queries` behind a debug flag.

## Readiness

- Use **`GET /readiness`** for orchestrator probes (503 when DB missing).
