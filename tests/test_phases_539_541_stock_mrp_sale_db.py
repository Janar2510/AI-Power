"""Phases 539–541: one DB bootstrap for stock valuation, MRP cost lines, sale/purchase domains.

Running these as a single module avoids three separate load_module_graph() + load_default_data() cycles.
"""

import unittest
import uuid
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.orm.models import ModelBase

DB = "_test_rpc_read"
_ADDONS_PATH = str((Path(__file__).resolve().parent.parent / "addons").resolve())

_cr_ctx = None
_cr = None
_registry = None
_env = None
_has_db = False


def setUpModule():
    global _cr_ctx, _cr, _registry, _env, _has_db
    parse_config(["--addons-path=" + _ADDONS_PATH])
    _has_db = db_exists(DB)
    if not _has_db:
        return
    _registry = Registry(DB)
    ModelBase._registry = _registry
    clear_loaded_addon_modules()
    load_module_graph()
    _cr_ctx = get_cursor(DB)
    _cr = _cr_ctx.__enter__()
    init_schema(_cr, _registry)
    _env = Environment(_registry, cr=_cr, uid=1)
    _registry.set_env(_env)
    load_default_data(_env)


def tearDownModule():
    global _cr_ctx
    if _cr_ctx is not None:
        _cr_ctx.__exit__(None, None, None)
        _cr_ctx = None


class TestPhases539to541Db(unittest.TestCase):
    """539: valuation_state; 540: balanced MO cost move; 541: picking_count / receipt_count by origin."""

    def setUp(self):
        if not _has_db:
            self.skipTest("DB not found")

    def test_phase539_valuation_state_posted_when_done(self):
        env = _env
        registry = _registry
        Picking = env.get("stock.picking")
        Move = env.get("stock.move")
        Quant = env.get("stock.quant")
        Pt = env.get("stock.picking.type")
        Product = env.get("product.product")
        if not all([Picking, Move, Quant, Pt, Product]):
            self.skipTest("models missing")
        Sp = registry.get("stock.picking")
        fg = Sp.fields_get([]) if Sp else {}
        if "valuation_state" not in fg:
            self.skipTest("stock_account not loaded — no valuation_state on picking")
        inc = Pt.search([("code", "=", "incoming")], limit=1)
        if not inc.ids:
            self.skipTest("no incoming picking type")
        ptr = Pt.browse(inc.ids[0]).read(["default_location_src_id", "default_location_dest_id"])[0]
        src_id = ptr.get("default_location_src_id")
        dst_id = ptr.get("default_location_dest_id")
        if isinstance(src_id, (list, tuple)) and src_id:
            src_id = src_id[0]
        if isinstance(dst_id, (list, tuple)) and dst_id:
            dst_id = dst_id[0]
        if not src_id or not dst_id:
            self.skipTest("picking type locations missing")
        prod = Product.create({"name": "P539-" + uuid.uuid4().hex[:6]})
        pid = prod.ids[0]
        IrSequence = env.get("ir.sequence")
        next_val = IrSequence.next_by_code("stock.picking") if IrSequence else None
        name = f"IN/P539/{next_val}" if next_val is not None else "New"
        pick = Picking.create({
            "name": name,
            "picking_type_id": inc.ids[0],
            "location_id": src_id,
            "location_dest_id": dst_id,
            "state": "draft",
        })
        Move.create({
            "name": "recv",
            "product_id": pid,
            "product_uom_qty": 2.0,
            "picking_id": pick.ids[0],
            "location_id": src_id,
            "location_dest_id": dst_id,
            "state": "draft",
        })
        self.assertEqual(pick.read(["valuation_state"])[0].get("valuation_state"), "pending")
        pick.action_validate()
        self.assertEqual(pick.read(["state"])[0].get("state"), "done")
        self.assertEqual(pick.read(["valuation_state"])[0].get("valuation_state"), "posted")

    def test_phase540_cost_draft_move_balanced_after_done(self):
        env = _env
        registry = _registry
        Account = env.get("account.account")
        if not Account:
            self.skipTest("no account")
        exp = Account.search([("account_type", "=", "expense")], limit=1)
        cur = Account.search([("account_type", "=", "asset_current")], limit=1)
        # Phase 545: seed minimal accounts so the test runs on plain db init (no demo chart).
        suf = uuid.uuid4().hex[:6]
        if not exp.ids:
            exp = Account.create(
                {"name": "P545 Expense", "code": f"E{suf}"[:16], "account_type": "expense"}
            )
        if not cur.ids:
            cur = Account.create(
                {"name": "P545 Current Asset", "code": f"A{suf}"[:16], "account_type": "asset_current"}
            )
        Production = env.get("mrp.production")
        Bom = env.get("mrp.bom")
        BomLine = env.get("mrp.bom.line")
        Product = env.get("product.product")
        Template = env.get("product.template")
        Move = env.get("account.move")
        MoveLine = env.get("account.move.line")
        if not all([Production, Bom, BomLine, Product, Template, Move, MoveLine]):
            self.skipTest("models missing")
        raw_rec = Product.create({"name": "Raw P540-" + uuid.uuid4().hex[:4], "list_price": 1.0})
        fin_rec = Product.create({"name": "Fin P540-" + uuid.uuid4().hex[:4], "list_price": 5.0})
        raw_id = raw_rec.ids[0]
        fin_id = fin_rec.ids[0]

        def _tmpl_id(pid):
            ref = Product.browse(pid).read(["product_template_id"])[0].get("product_template_id")
            if isinstance(ref, (list, tuple)) and ref:
                return ref[0]
            return ref

        tid_raw = _tmpl_id(raw_id)
        tid_fin = _tmpl_id(fin_id)
        Template.browse(tid_raw).write({"standard_price": 5.0})
        Template.browse(tid_fin).write({"standard_price": 99.0})
        bom = Bom.create({"name": "BOM P540-" + uuid.uuid4().hex[:4], "product_id": fin_id, "product_qty": 1.0})
        BomLine.create({"bom_id": bom.ids[0], "product_id": raw_id, "product_qty": 1.0})
        mo = Production.create(
            {
                "product_id": fin_id,
                "bom_id": bom.ids[0],
                "product_qty": 1.0,
                "state": "draft",
            }
        )
        mo.action_confirm()
        mo.action_start()
        mo.action_done()
        row = mo.read(["cost_draft_move_id", "cost_estimate"])[0]
        cmd = row.get("cost_draft_move_id")
        mid = cmd[0] if isinstance(cmd, (list, tuple)) and cmd else cmd
        if not mid:
            self.skipTest("mrp_account did not create cost draft move")
        ce = float(row.get("cost_estimate") or 0)
        self.assertGreater(ce, 0, "cost_estimate should be positive")
        lines = MoveLine.search([("move_id", "=", mid)])
        self.assertEqual(len(lines.ids), 2, "expected two balanced lines on draft move")
        rows = lines.read(["debit", "credit"])
        td = sum(float(r.get("debit") or 0) for r in rows)
        tc = sum(float(r.get("credit") or 0) for r in rows)
        self.assertAlmostEqual(td, tc, places=5)
        self.assertAlmostEqual(td, ce, places=5)

    def test_phase541_picking_count_includes_origin_without_sale_id(self):
        env = _env
        registry = _registry
        Sale = env.get("sale.order")
        Picking = env.get("stock.picking")
        Pt = env.get("stock.picking.type")
        Partner = env.get("res.partner")
        Product = env.get("product.product")
        if not all([Sale, Picking, Pt, Partner, Product]):
            self.skipTest("models missing")
        fg = registry.get("sale.order").fields_get([]) if registry.get("sale.order") else {}
        if "picking_count" not in fg:
            self.skipTest("sale_stock not loaded")
        out = Pt.search([("code", "=", "outgoing")], limit=1)
        if not out.ids:
            self.skipTest("no outgoing picking type")
        ptr = Pt.browse(out.ids[0]).read(["default_location_src_id", "default_location_dest_id"])[0]
        src_id = ptr.get("default_location_src_id")
        dst_id = ptr.get("default_location_dest_id")
        if isinstance(src_id, (list, tuple)) and src_id:
            src_id = src_id[0]
        if isinstance(dst_id, (list, tuple)) and dst_id:
            dst_id = dst_id[0]
        if not src_id or not dst_id:
            self.skipTest("outgoing locations missing")
        partner = Partner.search([], limit=1)
        pid = partner.ids[0] if partner.ids else Partner.create({"name": "P541"}).ids[0]
        Product.create({"name": "P541-" + uuid.uuid4().hex[:6], "list_price": 10.0})
        so = Sale.create({"partner_id": pid, "state": "draft"})
        so_name = so.read(["name"])[0].get("name") or "SO541"
        Picking.create(
            {
                "name": "OUT/P541/manual",
                "picking_type_id": out.ids[0],
                "location_id": src_id,
                "location_dest_id": dst_id,
                "origin": so_name,
                "state": "draft",
            }
        )
        row = Sale.browse(so.ids[0]).read(["picking_count", "name"])[0]
        self.assertGreaterEqual(int(row.get("picking_count") or 0), 1)

    def test_phase541_receipt_count_includes_origin_without_purchase_id(self):
        env = _env
        registry = _registry
        Po = env.get("purchase.order")
        Picking = env.get("stock.picking")
        Pt = env.get("stock.picking.type")
        Partner = env.get("res.partner")
        if not all([Po, Picking, Pt, Partner]):
            self.skipTest("models missing")
        fg = registry.get("purchase.order").fields_get([]) if registry.get("purchase.order") else {}
        if "receipt_count" not in fg:
            self.skipTest("purchase_stock not loaded")
        inc = Pt.search([("code", "=", "incoming")], limit=1)
        if not inc.ids:
            self.skipTest("no incoming picking type")
        ptr = Pt.browse(inc.ids[0]).read(["default_location_src_id", "default_location_dest_id"])[0]
        src_id = ptr.get("default_location_src_id")
        dst_id = ptr.get("default_location_dest_id")
        if isinstance(src_id, (list, tuple)) and src_id:
            src_id = src_id[0]
        if isinstance(dst_id, (list, tuple)) and dst_id:
            dst_id = dst_id[0]
        if not src_id or not dst_id:
            self.skipTest("incoming locations missing")
        partner = Partner.search([], limit=1)
        pid = partner.ids[0] if partner.ids else Partner.create({"name": "P541b"}).ids[0]
        po = Po.create({"partner_id": pid, "state": "draft"})
        po_name = po.read(["name"])[0].get("name") or "PO541"
        Picking.create(
            {
                "name": "IN/P541/manual",
                "picking_type_id": inc.ids[0],
                "location_id": src_id,
                "location_dest_id": dst_id,
                "origin": po_name,
                "state": "draft",
            }
        )
        row = Po.browse(po.ids[0]).read(["receipt_count"])[0]
        self.assertGreaterEqual(int(row.get("receipt_count") or 0), 1)
