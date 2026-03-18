"""Phase 225: E2E tests for /health and /metrics endpoints."""

import pytest


def test_health_returns_ok(page, e2e_base_url: str) -> None:
    """GET /health returns status ok and db."""
    page.set_default_timeout(10000)
    resp = page.goto(f"{e2e_base_url}/health")
    assert resp is not None
    assert resp.status == 200
    body = resp.json()
    assert body.get("status") == "ok"
    assert "db" in body
    assert "version" in body


def test_metrics_returns_prometheus_format(page, e2e_base_url: str) -> None:
    """GET /metrics returns Prometheus text format."""
    page.set_default_timeout(10000)
    resp = page.goto(f"{e2e_base_url}/metrics")
    assert resp is not None
    assert resp.status == 200
    text = resp.text()
    assert "erp_request_duration_seconds" in text
    assert "erp_query_count" in text
