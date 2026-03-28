"""Phase 739: portal invoice payment browser tour."""

import secrets

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Environment, Registry
from core.sql_db import get_cursor
from core.tools.config import parse_config
from tests.payment_test_bootstrap import (
    configure_addons_path,
    ensure_bank_journal_for_payment_record,
    ensure_demo_payment_provider,
    ensure_minimal_sale_invoice_chart,
)


def _seed_portal_invoice(dbname: str) -> tuple[str, int]:
    addons_path = configure_addons_path()
    parse_config(["--addons-path=" + addons_path])
    registry = Registry(dbname)
    from core.orm.models import ModelBase

    ModelBase._registry = registry
    clear_loaded_addon_modules()
    load_module_graph()

    with get_cursor(dbname) as cr:
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        User = env.get("res.users")
        Move = env.get("account.move")
        MoveLine = env.get("account.move.line")
        Partner = env.get("res.partner")
        Groups = env.get("res.groups")
        Provider = env.get("payment.provider")
        assert User and Move and MoveLine and Partner and Groups and Provider

        journal_id, income_id, receivable_id = ensure_minimal_sale_invoice_chart(env)
        assert journal_id and income_id and receivable_id
        provider_id = ensure_demo_payment_provider(env)
        if not provider_id:
            cr.execute(
                "INSERT INTO payment_provider (name, code, state) VALUES (%s, %s, %s) RETURNING id",
                ("Phase 739 Demo", "demo", "enabled"),
            )
            row = cr.fetchone()
            provider_id = row["id"] if isinstance(row, dict) else row[0]
        cr.execute("SELECT id FROM payment_provider WHERE code = %s ORDER BY id LIMIT 1", ("demo",))
        row = cr.fetchone()
        if row:
            provider_id = row["id"] if isinstance(row, dict) else row[0]
        assert provider_id
        assert ensure_bank_journal_for_payment_record(env)

        admin = User.search([("login", "=", "admin")], limit=1)
        portal_group = Groups.search([("full_name", "=", "base.group_portal")], limit=1)
        assert admin.ids and portal_group.ids
        cr.execute(
            """
            INSERT INTO res_users_res_groups_rel (user_id, group_id)
            SELECT %s, %s
            WHERE NOT EXISTS (
                SELECT 1 FROM res_users_res_groups_rel WHERE user_id = %s AND group_id = %s
            )
            """,
            (admin.ids[0], portal_group.ids[0], admin.ids[0], portal_group.ids[0]),
        )
        user = User.browse(admin.ids[0])
        partner_val = user.read(["partner_id"])[0].get("partner_id")
        partner_id = partner_val[0] if isinstance(partner_val, (list, tuple)) and partner_val else partner_val
        if not partner_id:
            partner = Partner.create({"name": "Admin Portal Partner", "email": "admin@example.com", "type": "contact"})
            assert partner.ids
            cr.execute("UPDATE res_users SET partner_id = %s WHERE id = %s", (partner.ids[0], admin.ids[0]))
            partner_id = partner.ids[0]
        assert partner_id

        invoice_name = "PHASE739-" + str(secrets.token_hex(4)).upper()
        move = Move.create(
            {
                "name": invoice_name,
                "journal_id": journal_id,
                "partner_id": partner_id,
                "move_type": "out_invoice",
                "state": "draft",
                "invoice_origin": "Phase 739 Portal Tour",
            }
        )
        MoveLine.create(
            {
                "move_id": move.ids[0],
                "account_id": income_id,
                "name": "Portal payment line",
                "debit": 0.0,
                "credit": 50.0,
                "partner_id": partner_id,
            }
        )
        MoveLine.create(
            {
                "move_id": move.ids[0],
                "account_id": receivable_id,
                "name": "Receivable",
                "debit": 50.0,
                "credit": 0.0,
                "partner_id": partner_id,
            }
        )
        move.write({"state": "posted"})
        return invoice_name, move.ids[0]


def test_portal_invoice_payment_tour_phase739(
    page,
    e2e_base_url: str,
    e2e_login: str,
    e2e_password: str,
    e2e_db: str,
) -> None:
    """Portal user logs in, opens invoice, pays with demo provider, sees paid status."""
    page.set_default_timeout(30000)
    page.set_default_navigation_timeout(30000)

    invoice_name, move_id = _seed_portal_invoice(e2e_db)

    page.goto(f"{e2e_base_url}/web/login?db={e2e_db}")
    page.wait_for_load_state("networkidle")
    page.get_by_placeholder("Login").fill(e2e_login)
    page.get_by_placeholder("Password").fill(e2e_password)
    page.get_by_role("button", name="Log in").click()

    page.goto(f"{e2e_base_url}/my/invoices")
    page.get_by_role("heading", name="My Invoices").wait_for(state="visible", timeout=10000)
    page.get_by_role("link", name=invoice_name).click()

    page.get_by_role("heading", name=f"Invoice {invoice_name}").wait_for(state="visible", timeout=10000)
    page.get_by_role("link", name="Pay Online").click()

    page.get_by_role("heading", name="Pay Invoice").wait_for(state="visible", timeout=10000)
    page.locator('select[name="provider"]').select_option("demo")
    page.get_by_role("button", name="Pay Now").click()

    page.get_by_role("heading", name=f"Invoice {invoice_name}").wait_for(state="visible", timeout=10000)
    page.wait_for_url(f"{e2e_base_url}/my/invoices/{move_id}", timeout=10000)
    page.get_by_text("Status:").wait_for(state="visible", timeout=10000)
    page.get_by_text("paid").wait_for(state="visible", timeout=10000)
