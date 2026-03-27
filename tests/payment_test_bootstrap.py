"""Shared DB bootstrap for payment.transaction + out_invoice tests (Phases 733–734).

Used by **test_portal_invoice_pay_phase199**, **test_payment_transaction_invoice_db_phase733**,
**test_payment_transaction_write_done_phase734**.
"""

import secrets
from pathlib import Path

from core.tools.config import parse_config
from core.sql_db import db_exists


def configure_addons_path():
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return str(addons_path)


def test_db_exists(dbname: str) -> bool:
    configure_addons_path()
    return db_exists(dbname)


def ensure_minimal_sale_invoice_chart(env):
    """Return ``(journal_id, income_id, receivable_id)`` for **out_invoice** tests."""
    Journal = env.get("account.journal")
    Account = env.get("account.account")
    Company = env.get("res.company")
    if not Journal or not Account:
        return None, None, None
    journal = Journal.search([("type", "=", "sale")], limit=1)
    income = Account.search([("account_type", "=", "income")], limit=1)
    receivable = Account.search([("account_type", "=", "asset_receivable")], limit=1)
    if journal.ids and income.ids and receivable.ids:
        return journal.ids[0], income.ids[0], receivable.ids[0]
    tag = secrets.token_hex(3)
    cid = None
    if Company:
        co = Company.search([], limit=1)
        if co.ids:
            cid = co.ids[0]
    if not income.ids:
        income = Account.create(
            {
                "name": "PayBoot Income",
                "code": f"PBI{tag}",
                "account_type": "income",
            }
        )
    if not receivable.ids:
        receivable = Account.create(
            {
                "name": "PayBoot Receivable",
                "code": f"PBR{tag}",
                "account_type": "asset_receivable",
            }
        )
    if not journal.ids:
        jvals = {
            "name": "PayBoot Sales",
            "code": f"S{tag[:4]}",
            "type": "sale",
        }
        if cid:
            jvals["company_id"] = cid
        journal = Journal.create(jvals)
    jid = journal.ids[0] if journal.ids else None
    iid = income.ids[0] if getattr(income, "ids", None) else None
    rid = receivable.ids[0] if getattr(receivable, "ids", None) else None
    if not all([jid, iid, rid]):
        return None, None, None
    return jid, iid, rid


def ensure_demo_payment_provider(env):
    Provider = env.get("payment.provider")
    if not Provider:
        return None
    prov = Provider.search([("code", "=", "demo")], limit=1)
    if prov.ids:
        return prov.ids[0]
    p = Provider.create({"name": "PayBoot Demo", "code": "demo", "state": "enabled"})
    return p.ids[0] if p.ids else None


def ensure_bank_journal_for_payment_record(env):
    """``payment_transaction._ensure_account_payment_record`` searches bank then general."""
    Journal = env.get("account.journal")
    Company = env.get("res.company")
    if not Journal:
        return None
    j = Journal.search([("type", "=", "bank")], limit=1)
    if j.ids:
        return j.ids[0]
    j = Journal.search([("type", "=", "general")], limit=1)
    if j.ids:
        return j.ids[0]
    cid = None
    if Company:
        co = Company.search([], limit=1)
        if co.ids:
            cid = co.ids[0]
    tag = secrets.token_hex(2)
    vals = {"name": "PayBoot Bank", "code": f"B{tag}", "type": "bank"}
    if cid:
        vals["company_id"] = cid
    created = Journal.create(vals)
    return created.ids[0] if getattr(created, "ids", None) else None
