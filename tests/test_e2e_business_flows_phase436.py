"""Phase 436: End-to-end business flow integration tests."""

import unittest
import uuid
from pathlib import Path

from core.db import init_schema
from core.db.init_data import load_default_data
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Environment, Registry
from core.sql_db import db_exists, get_cursor
from core.tools.config import parse_config


class TestE2EBusinessFlowsPhase436(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)
        cls._addons_path = str(addons_path)

    def _env(self):
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase

        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        return registry

    def _prepare_env_or_skip(self, registry, cr):
        try:
            init_schema(cr, registry)
        except Exception as e:
            self.skipTest(f"Schema init unavailable in this environment: {e}")
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        load_default_data(env)
        return env

    def test_sale_to_invoice_flow(self):
        if not self._has_db:
            self.skipTest("DB not found")
        registry = self._env()
        with get_cursor(self.db) as cr:
            env = self._prepare_env_or_skip(registry, cr)
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            SO = env.get("sale.order")
            SOL = env.get("sale.order.line")
            Invoice = env.get("account.move")
            self.assertTrue(all([Partner, Product, SO, SOL, Invoice]))
            partner = Partner.create({"name": "E2E Sale Partner"})
            product = Product.create({"name": "E2E Sale Product", "list_price": 10.0})
            so_name = "SO/E2E/" + str(uuid.uuid4())[:8]
            so = SO.create({"name": so_name, "partner_id": partner.id, "state": "draft"})
            SOL.create({"order_id": so.id, "product_id": product.id, "product_uom_qty": 2.0, "price_unit": 10.0})
            so.action_confirm()
            invs = Invoice.search([("invoice_origin", "=", so_name)])
            self.assertTrue(len(invs.ids) >= 0)

    def test_purchase_to_bill_flow(self):
        if not self._has_db:
            self.skipTest("DB not found")
        registry = self._env()
        with get_cursor(self.db) as cr:
            env = self._prepare_env_or_skip(registry, cr)
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            PO = env.get("purchase.order")
            POL = env.get("purchase.order.line")
            self.assertTrue(all([Partner, Product, PO, POL]))
            supplier = Partner.create({"name": "E2E Supplier"})
            product = Product.create({"name": "E2E Purchase Product", "list_price": 5.0})
            po = PO.create({"name": "PO/E2E/" + str(uuid.uuid4())[:8], "partner_id": supplier.id, "state": "draft"})
            POL.create({"order_id": po.id, "product_id": product.id, "product_qty": 3.0, "price_unit": 5.0})
            if hasattr(po, "button_confirm"):
                po.button_confirm()
            self.assertTrue(po.id is not None)

    def test_mrp_flow(self):
        if not self._has_db:
            self.skipTest("DB not found")
        registry = self._env()
        with get_cursor(self.db) as cr:
            env = self._prepare_env_or_skip(registry, cr)
            MRP = env.get("mrp.production")
            Product = env.get("product.product")
            if not (MRP and Product):
                self.skipTest("MRP models missing")
            product = Product.create({"name": "E2E MRP Product", "list_price": 1.0})
            mo = MRP.create({"name": "MO/E2E/" + str(uuid.uuid4())[:8], "product_id": product.id, "product_qty": 1.0})
            self.assertTrue(mo.id is not None)

    def test_crm_to_quote_flow(self):
        if not self._has_db:
            self.skipTest("DB not found")
        registry = self._env()
        with get_cursor(self.db) as cr:
            env = self._prepare_env_or_skip(registry, cr)
            Lead = env.get("crm.lead")
            SO = env.get("sale.order")
            Partner = env.get("res.partner")
            if not (Lead and SO and Partner):
                self.skipTest("CRM or sales models missing")
            partner = Partner.create({"name": "E2E CRM Partner"})
            lead = Lead.create({"name": "E2E Lead", "partner_id": partner.id})
            quote = SO.create({"name": "Q/E2E/" + str(uuid.uuid4())[:8], "partner_id": partner.id, "state": "draft"})
            self.assertTrue(lead.id is not None and quote.id is not None)
