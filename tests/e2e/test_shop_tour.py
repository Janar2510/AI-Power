"""
Integration tour: shop → product → cart → checkout → confirmation (Phase 143).

Prerequisites:
- Database initialized: ./erp-bin db init -d erp (creates demo products)
- Server running on port 8069, or use:
  python scripts/with_server.py --server "./erp-bin server" --port 8069 -- \
    pytest tests/e2e/test_shop_tour.py -v
"""

import pytest


def test_shop_cart_checkout_tour(
    page,
    e2e_base_url: str,
) -> None:
    """E2E tour: browse shop, add to cart, checkout, confirm order."""
    page.set_default_timeout(30000)
    page.set_default_navigation_timeout(30000)

    # 1. Go to shop
    page.goto(f"{e2e_base_url}/shop")
    page.wait_for_load_state("networkidle")

    page.get_by_role("heading", name="Products").wait_for(state="visible", timeout=10000)

    # 2. Click first product (Widget A from demo data)
    page.get_by_text("Widget A").first.click()
    page.wait_for_load_state("networkidle")

    page.get_by_role("heading", name="Widget A").wait_for(state="visible", timeout=10000)

    # 3. Add to cart
    page.get_by_role("link", name="Add to Cart").click()
    page.wait_for_load_state("networkidle")

    # 4. View cart
    page.get_by_role("link", name="Cart").click()
    page.wait_for_load_state("networkidle")

    page.get_by_role("heading", name="Cart").wait_for(state="visible", timeout=10000)
    page.get_by_text("Widget A").wait_for(state="visible", timeout=5000)

    # 5. Proceed to checkout
    page.get_by_role("link", name="Proceed to Checkout").click()
    page.wait_for_load_state("networkidle")

    page.get_by_role("heading", name="Checkout").wait_for(state="visible", timeout=10000)

    # 6. Fill checkout form
    page.get_by_label("Name *").fill("E2E Shop Customer")
    page.get_by_label("Email *").fill("e2e-shop@example.com")
    page.get_by_label("Address").fill("123 Test Street")
    page.get_by_label("City").fill("Test City")
    page.get_by_role("button", name="Place Order").click()
    page.wait_for_load_state("networkidle")

    # 7. Verify confirmation page
    page.get_by_role("heading", name="Thank you!").wait_for(state="visible", timeout=10000)
    page.get_by_text("Your order has been placed.").wait_for(state="visible", timeout=5000)
    page.get_by_text("Order reference:").wait_for(state="visible", timeout=5000)
