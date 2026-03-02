"""
Integration tour: login → list view → create record (form).

Prerequisites:
- Database initialized: ./erp-bin db init -d erp
- Server running on port 8069, or use:
  python scripts/with_server.py --server "./erp-bin server" --port 8069 -- \
    pytest tests/e2e/test_login_list_form_tour.py -v
"""

import pytest


def test_login_list_form_tour(
    page,
    e2e_base_url: str,
    e2e_login: str,
    e2e_password: str,
    e2e_db: str,
) -> None:
    """E2E tour: login, navigate to Contacts list, create new contact."""
    page.set_default_timeout(30000)
    page.set_default_navigation_timeout(30000)

    # 1. Login
    page.goto(f"{e2e_base_url}/web/login")
    page.wait_for_load_state("networkidle")

    page.get_by_placeholder("Login").fill(e2e_login)
    page.get_by_placeholder("Password").fill(e2e_password)
    page.get_by_role("button", name="Log in").click()

    page.wait_for_load_state("networkidle")

    # Expect webclient (navbar with ERP Platform)
    page.get_by_text("ERP Platform").first.wait_for(state="visible", timeout=10000)

    # 2. Navigate to Contacts list
    page.get_by_role("link", name="Contacts").click()
    page.wait_for_load_state("networkidle")

    # Expect Contacts heading
    page.get_by_role("heading", name="Contacts").wait_for(state="visible", timeout=10000)

    # 3. Open new contact form
    page.get_by_role("button", name="Add contact").click()
    page.wait_for_load_state("networkidle")

    # Expect New contact form
    page.get_by_role("heading", name="New contact").wait_for(state="visible", timeout=10000)

    # 4. Fill and submit form
    page.get_by_label("name *").fill("E2E Test Contact")
    page.get_by_label("email").fill("e2e@example.com")
    page.get_by_label("phone").fill("+1234567890")
    page.get_by_label("street").fill("123 Test St")
    page.get_by_label("city").fill("Test City")
    page.get_by_label("country").fill("Test Country")

    page.get_by_role("button", name="Save").click()
    page.wait_for_load_state("networkidle")

    # 5. Verify back on list with new record
    page.get_by_role("heading", name="Contacts").wait_for(state="visible", timeout=10000)
    page.get_by_text("E2E Test Contact").wait_for(state="visible", timeout=10000)
