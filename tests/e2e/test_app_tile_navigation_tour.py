"""
E2E: Home app grid → first app tile → main column shows content.

Requires DB + server like test_login_list_form_tour.py.
"""

import pytest


def test_app_tile_opens_main_content(
    page,
    e2e_base_url: str,
    e2e_login: str,
    e2e_password: str,
    e2e_db: str,
) -> None:
    page.set_default_timeout(30000)
    page.set_default_navigation_timeout(30000)

    page.goto(f"{e2e_base_url}/web/login")
    page.wait_for_load_state("networkidle")

    page.get_by_placeholder("Login").fill(e2e_login)
    page.get_by_placeholder("Password").fill(e2e_password)
    page.get_by_role("button", name="Log in").click()
    page.wait_for_load_state("networkidle")

    page.get_by_text("ERP Platform").first.wait_for(state="visible", timeout=10000)

    page.goto(f"{e2e_base_url}/web#home")
    page.wait_for_load_state("networkidle")

    page.get_by_role("heading", name="Apps").wait_for(state="visible", timeout=10000)

    tiles = page.locator(".o-app-tile")
    count = tiles.count()
    assert count > 0, "Expected at least one app tile on Home"
    tiles.first.click()
    page.wait_for_load_state("networkidle")

    # Main column must leave the Home app grid (Post-1.249 navigation guard).
    page.wait_for_function(
        """() => {
          const m = document.getElementById('action-manager');
          if (!m) return false;
          return !m.querySelector('.o-home-apps');
        }""",
        timeout=20000,
    )

    main = page.locator("#action-manager")
    main.locator("h2, table, .o-list-fallback-table").first.wait_for(
        state="visible", timeout=10000
    )
