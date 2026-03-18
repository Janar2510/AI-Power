"""
E2E tour: Sales - navigate to Orders (Phase 209).

Prerequisites:
- Database initialized: ./erp-bin db init -d erp
- Server running on port 8069
"""

import pytest


def test_orders_list_tour(
    page,
    e2e_base_url: str,
    e2e_login: str,
    e2e_password: str,
) -> None:
    """E2E: login, navigate to Orders list."""
    page.set_default_timeout(30000)
    page.set_default_navigation_timeout(30000)

    page.goto(f"{e2e_base_url}/web/login")
    page.wait_for_load_state("networkidle")
    page.get_by_placeholder("Login").fill(e2e_login)
    page.get_by_placeholder("Password").fill(e2e_password)
    page.get_by_role("button", name="Log in").click()
    page.wait_for_load_state("networkidle")
    page.get_by_text("ERP Platform").first.wait_for(state="visible", timeout=10000)

    page.get_by_role("link", name="Orders").click()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Orders").wait_for(state="visible", timeout=10000)
