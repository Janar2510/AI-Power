"""Phase 225: E2E test for dashboard customize (Phase 223)."""

import pytest


def test_dashboard_customize_button(
    page,
    e2e_base_url: str,
    e2e_login: str,
    e2e_password: str,
) -> None:
    """Login, go to home, click Customize, verify drawer opens."""
    page.set_default_timeout(30000)
    page.goto(f"{e2e_base_url}/web/login")
    page.wait_for_load_state("networkidle")
    page.get_by_placeholder("Login").fill(e2e_login)
    page.get_by_placeholder("Password").fill(e2e_password)
    page.get_by_role("button", name="Log in").click()
    page.wait_for_load_state("networkidle")
    page.get_by_text("ERP Platform").first.wait_for(state="visible", timeout=10000)
    page.goto(f"{e2e_base_url}/#home")
    page.wait_for_load_state("networkidle")
    customize_btn = page.get_by_role("button", name="Customize")
    customize_btn.wait_for(state="visible", timeout=5000)
    customize_btn.click()
    page.get_by_text("Customize Dashboard").wait_for(state="visible", timeout=5000)
    page.get_by_role("button", name="Close").click()
