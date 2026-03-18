"""Phase 206: Multi-step approval chains."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from pathlib import Path


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestApprovalPhase206(unittest.TestCase):
    """Test approval chains, delegation, and auto-trigger."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_approval_rule_parent_chain(self):
        """approval.rule has parent_rule_id for chaining."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            ApprovalRule = env.get("approval.rule")
            ApprovalRequest = env.get("approval.request")
            self.assertIsNotNone(ApprovalRule)
            self.assertIsNotNone(ApprovalRequest)
            self.assertTrue(hasattr(ApprovalRule, "parent_rule_id"))
            self.assertTrue(hasattr(ApprovalRequest, "step"))
            self.assertTrue(hasattr(ApprovalRequest, "next_rule_id"))
            self.assertTrue(hasattr(ApprovalRequest, "delegate_to_user_id"))

    def test_approval_request_approve_creates_next_step(self):
        """Approving a chained request creates next step."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            ApprovalRule = env.get("approval.rule")
            ApprovalRequest = env.get("approval.request")
            if not all([ApprovalRule, ApprovalRequest]):
                self.skipTest("Models not loaded")
            Partner = env.get("res.partner")
            SaleOrder = env.get("sale.order")
            partner = Partner.search([], limit=1)
            if not partner.ids:
                partner = Partner.create({"name": "Approval Test"})
            order = SaleOrder.create({"partner_id": partner.ids[0], "state": "draft"})
            oid = order.ids[0] if order.ids else order.id
            rule2 = ApprovalRule.create({
                "name": "Step 2",
                "model": "sale.order",
                "min_amount": 0,
            })
            rule1 = ApprovalRule.create({
                "name": "Step 1",
                "model": "sale.order",
                "min_amount": 0,
                "parent_rule_id": rule2.ids[0] if rule2.ids else rule2.id,
            })
            r1id = rule1.ids[0] if rule1.ids else rule1.id
            req = ApprovalRequest.create({
                "rule_id": r1id,
                "res_model": "sale.order",
                "res_id": oid,
                "step": 1,
            })
            req_id = req.ids[0] if req.ids else req.id
            count_before = ApprovalRequest.search_count([("state", "=", "pending")])
            ApprovalRequest.browse(req_id).action_approve()
            count_after = ApprovalRequest.search_count([("state", "=", "pending")])
            next_req = ApprovalRequest.search([
                ("res_model", "=", "sale.order"),
                ("res_id", "=", oid),
                ("step", "=", 2),
            ], limit=1)
            self.assertTrue(next_req.ids or next_req, "Next step request should be created")
