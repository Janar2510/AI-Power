"""Phase 471: vendor bill creation should skip empty bills."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakeResult:
    def __init__(self, ids=None):
        self.ids = list(ids or [])

    def __iter__(self):
        return iter([])

    def write(self, vals):
        return True


class _FakeMove:
    def __init__(self):
        self.created = []

    def search(self, domain, limit=None):
        return _FakeResult([])

    def create(self, vals):
        self.created.append(vals)
        return _FakeResult([1])


class _FakeMoveWithExistingBill(_FakeMove):
    """Returns an id only when duplicate-check domain matches a draft vendor bill (Phase 472)."""

    def search(self, domain, limit=None):
        origin = None
        mtype = None
        state = None
        for item in domain:
            if len(item) >= 3:
                field, op, value = item[0], item[1], item[2]
                if field == "invoice_origin" and op == "=":
                    origin = value
                if field == "move_type" and op == "=":
                    mtype = value
                if field == "state" and op == "=":
                    state = value
        if origin == "PO/DUP" and mtype == "in_invoice" and state == "draft":
            return _FakeResult([100])
        return _FakeResult([])


class _FakeMoveLine:
    def __init__(self):
        self.created = []

    def create(self, vals):
        self.created.append(vals)
        return _FakeResult([1])


class _FakeJournal:
    def search(self, domain, limit=None):
        return _FakeResult([9])


class _FakeAccount:
    def search(self, domain, limit=None):
        account_type = None
        for field, op, value in domain:
            if field == "account_type" and op == "=":
                account_type = value
                break
        if account_type == "expense":
            return _FakeResult([51])
        if account_type == "liability_payable":
            return _FakeResult([52])
        return _FakeResult([])


class _FakePoLineModel:
    def search(self, domain):
        return _FakeResult([])


class _FakePoLineRecord:
    def __init__(self):
        self.ids = [1]

    def read(self, fields):
        return [{"product_id": 10, "product_qty": 2.0, "price_unit": 5.0, "name": "Item"}]


class _FakePoLineModelWithLines:
    def search(self, domain):
        return _FakePoLineIterable([_FakePoLineRecord()])


class _FakePoLineIterable:
    def __init__(self, items):
        self._items = items

    def __iter__(self):
        return iter(self._items)


class _FakeIrSequence:
    def next_by_code(self, code):
        return 456


class _FakeEnv:
    def __init__(self, move_model, move_line_model, po_line_model=None):
        self.models = {
            "account.move": move_model,
            "account.move.line": move_line_model,
            "account.journal": _FakeJournal(),
            "account.account": _FakeAccount(),
            "purchase.order.line": po_line_model if po_line_model is not None else _FakePoLineModel(),
            "ir.sequence": _FakeIrSequence(),
        }

    def get(self, model_name):
        return self.models.get(model_name)


class _FakeOrder:
    def __init__(self):
        self.ids = [1]
        self.id = 1
        self.update_calls = []

    def read(self, fields):
        result = {"id": 1}
        for field in fields:
            if field == "state":
                result[field] = "purchase"
            elif field == "name":
                result[field] = "PO/EMPTY"
            elif field == "partner_id":
                result[field] = 9
            elif field == "currency_id":
                result[field] = None
            elif field == "payment_term_id":
                result[field] = None
        return [result]

    def _update_bill_status(self):
        self.update_calls.append("_update_bill_status")
        return True


class _FakeOrderRecordset:
    def __init__(self, env, orders):
        self.env = env
        self._orders = orders

    def __iter__(self):
        return iter(self._orders)


class _FakeOrderDup(_FakeOrder):
    def read(self, fields):
        rows = super().read(fields)
        if rows and "name" in fields:
            rows = [dict(rows[0], name="PO/DUP")]
        return rows


class _FakeOrderPart(_FakeOrder):
    def read(self, fields):
        rows = super().read(fields)
        if rows and "name" in fields:
            rows = [dict(rows[0], name="PO/PARTIAL-2")]
        return rows


class TestPurchaseBillPhase471(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase471")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_create_bill_with_no_billable_lines_skips_move_creation(self):
        po_model = self.registry.get("purchase.order")
        self.assertIsNotNone(po_model, "purchase.order should load into registry")

        move_model = _FakeMove()
        move_line_model = _FakeMoveLine()
        fake_env = _FakeEnv(move_model, move_line_model)
        order = _FakeOrder()
        recordset = _FakeOrderRecordset(fake_env, [order])

        po_model._create_bill_with_quantities(recordset, None)

        self.assertEqual(move_model.created, [])
        self.assertEqual(move_line_model.created, [])
        self.assertEqual(order.update_calls, [])

    def test_create_bill_skips_when_draft_vendor_bill_exists_for_origin(self):
        po_model = self.registry.get("purchase.order")
        self.assertIsNotNone(po_model, "purchase.order should load into registry")

        move_model = _FakeMoveWithExistingBill()
        move_line_model = _FakeMoveLine()
        fake_env = _FakeEnv(move_model, move_line_model)
        order = _FakeOrderDup()
        recordset = _FakeOrderRecordset(fake_env, [order])

        po_model._create_bill_with_quantities(recordset, None)

        self.assertEqual(move_model.created, [])
        self.assertEqual(move_line_model.created, [])
        self.assertEqual(order.update_calls, [])

    def test_create_bill_proceeds_when_only_posted_bills_exist_for_origin(self):
        """When duplicate check finds no draft bill for origin, a new vendor bill is created (Phase 475)."""

        po_model = self.registry.get("purchase.order")
        self.assertIsNotNone(po_model)

        move_model = _FakeMove()
        move_line_model = _FakeMoveLine()
        fake_env = _FakeEnv(
            move_model,
            move_line_model,
            po_line_model=_FakePoLineModelWithLines(),
        )
        order = _FakeOrderPart()
        recordset = _FakeOrderRecordset(fake_env, [order])

        po_model._create_bill_with_quantities(recordset, None)

        self.assertEqual(len(move_model.created), 1)
        self.assertEqual(move_model.created[0].get("move_type"), "in_invoice")
        self.assertEqual(move_model.created[0].get("invoice_origin"), "PO/PARTIAL-2")
        self.assertGreaterEqual(len(move_line_model.created), 2)
        self.assertEqual(order.update_calls, ["_update_bill_status"])
