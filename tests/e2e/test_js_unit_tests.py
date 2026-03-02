"""
Integration test: run JS unit tests via test_runner.html.

Opens /web/static/tests/test_runner.html and asserts all tests pass.
Server must be running for static to be served. No auth required.

Requires: pip install playwright && playwright install chromium
"""

import pytest


def test_js_unit_tests_pass(page, e2e_base_url: str) -> None:
    """E2E: run JS unit tests in browser; assert 0 failures."""
    page.set_default_timeout(15000)
    page.goto(f"{e2e_base_url}/web/static/tests/test_runner.html")
    page.wait_for_load_state("networkidle")

    # Wait for test runner to finish (DOMContentLoaded + async tests)
    page.wait_for_selector("#test-results p", timeout=10000)

    # Check result via JS
    result = page.evaluate("window.__jsTestResult")
    assert result is not None, "JS test result not set"
    assert result.get("fail", 0) == 0, (
        f"JS unit tests failed: {result.get('fail', 0)} failures. "
        f"Errors: {result.get('errors', [])}"
    )
    assert result.get("pass", 0) > 0, "No JS tests passed"
