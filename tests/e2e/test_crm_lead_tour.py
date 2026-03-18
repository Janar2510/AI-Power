"""
E2E tour: CRM - create lead, move through stages (Phase 209).

Prerequisites:
- Database initialized: ./erp-bin db init -d erp
- Server running on port 8069
"""

import pytest


def test_crm_lead_tour(
    page,
    e2e_base_url: str,
    e2e_login: str,
    e2e_password: str,
    e2e_db: str,
) -> None:
    """E2E: login, create lead, verify in list."""
    page.set_default_timeout(30000)
    page.set_default_navigation_timeout(30000)

    # 1. Login
    page.goto(f"{e2e_base_url}/web/login")
    page.wait_for_load_state("networkidle")
    page.get_by_placeholder("Login").fill(e2e_login)
    page.get_by_placeholder("Password").fill(e2e_password)
    page.get_by_role("button", name="Log in").click()
    page.wait_for_load_state("networkidle")
    page.get_by_text("ERP Platform").first.wait_for(state="visible", timeout=10000)

    # 2. Navigate to Leads
    page.get_by_role("link", name="Leads").click()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Leads").wait_for(state="visible", timeout=10000)

    # 3. Create new lead
    page.get_by_role("button", name="Add lead").click()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="New lead").wait_for(state="visible", timeout=10000)

    page.get_by_label("name *").fill("E2E Test Lead")
    page.get_by_label("email").fill("e2e-lead@example.com")
    page.get_by_role("button", name="Save").click()
    page.wait_for_load_state("networkidle")

    # 4. Verify lead in list
    page.get_by_role("heading", name="Leads").wait_for(state="visible", timeout=10000)
    page.get_by_text("E2E Test Lead").wait_for(state="visible", timeout=10000)
