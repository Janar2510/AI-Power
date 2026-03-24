"""Phase 546: minimal account.fiscal.position tax mapping on sale orders (DB optional)."""

import unittest
import uuid

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


class TestAccountFiscalPhase546(unittest.TestCase):
    """Fiscal position remaps sale line taxes via apply_fiscal_position_taxes()."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_fiscal_position_maps_sale_line_tax(self):
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            registry = Registry(self.db)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)

            Tax = env.get("account.tax")
            FP = env.get("account.fiscal.position")
            FPLine = env.get("account.fiscal.position.tax")
            Partner = env.get("res.partner")
            Sale = env.get("sale.order")
            SaleLine = env.get("sale.order.line")
            if not all([Tax, FP, FPLine, Partner, Sale, SaleLine]):
                self.skipTest("models missing")

            t_dom = Tax.create(
                {
                    "name": "546-Dom-" + uuid.uuid4().hex[:4],
                    "amount": 20.0,
                    "amount_type": "percent",
                    "type_tax_use": "sale",
                }
            )
            t_b2b = Tax.create(
                {
                    "name": "546-B2B-" + uuid.uuid4().hex[:4],
                    "amount": 10.0,
                    "amount_type": "percent",
                    "type_tax_use": "sale",
                }
            )
            tid_dom = t_dom.ids[0]
            tid_b2b = t_b2b.ids[0]

            fp = FP.create({"name": "546 FP " + uuid.uuid4().hex[:4]})
            fp_id = fp.ids[0]
            FPLine.create({"fiscal_position_id": fp_id, "tax_src_id": tid_dom, "tax_dest_id": tid_b2b})

            partner = Partner.create({"name": "546 Customer"})
            pid = partner.ids[0]
            so = Sale.create({"partner_id": pid, "state": "draft"})
            so_id = so.ids[0]
            SaleLine.create(
                {
                    "order_id": so_id,
                    "name": "Line",
                    "product_uom_qty": 1.0,
                    "price_unit": 100.0,
                    "tax_id": [(6, 0, [tid_dom])],
                }
            )
            Sale.browse(so_id).write({"fiscal_position_id": fp_id})
            order_rec = Sale.browse(so_id)
            order_rec.apply_fiscal_position_taxes()

            lines = SaleLine.search([("order_id", "=", so_id)])
            self.assertTrue(lines.ids)
            tax_after = lines.read(["tax_id"])[0].get("tax_id") or []
            ids_flat = [x[0] if isinstance(x, (list, tuple)) and x else x for x in tax_after]
            self.assertEqual(ids_flat, [tid_b2b])

    def test_map_tax_ids_helper(self):
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            registry = Registry(self.db)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Fiscal = registry.get("account.fiscal.position")
            Tax = env.get("account.tax")
            FPLine = env.get("account.fiscal.position.tax")
            if not all([Fiscal, Tax, FPLine]):
                self.skipTest("models missing")
            a = Tax.create(
                {"name": "546-A", "amount": 1.0, "amount_type": "percent", "type_tax_use": "sale"}
            ).ids[0]
            b = Tax.create(
                {"name": "546-B", "amount": 2.0, "amount_type": "percent", "type_tax_use": "sale"}
            ).ids[0]
            c = Tax.create(
                {"name": "546-C", "amount": 3.0, "amount_type": "percent", "type_tax_use": "sale"}
            ).ids[0]
            fp_rec = env["account.fiscal.position"].create({"name": "Map test"})
            fp_id = fp_rec.ids[0]
            FPLine.create({"fiscal_position_id": fp_id, "tax_src_id": a, "tax_dest_id": b})
            out = Fiscal.map_tax_ids(env, fp_id, [a, c])
            self.assertEqual(out, [b, c])
