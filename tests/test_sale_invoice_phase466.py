"""Phase 466: invoice creation should skip empty invoices."""

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


class _FakeMoveWithExistingDraftInvoice(_FakeMove):
    """Simulates a draft customer invoice already linked to this SO (duplicate guard)."""

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
        if origin == "SO/DUP" and mtype == "out_invoice" and state == "draft":
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
        return _FakeResult([7])


class _FakeAccount:
    def search(self, domain, limit=None):
        account_type = None
        for field, op, value in domain:
            if field == "account_type" and op == "=":
                account_type = value
                break
        if account_type == "income":
            return _FakeResult([41])
        if account_type == "asset_receivable":
            return _FakeResult([42])
        return _FakeResult([])


class _FakeSaleLineModel:
    def search(self, domain):
        return _FakeResult([])


class _FakeSaleLineRecord:
    def __init__(self):
        self.ids = [1]

    def read(self, fields):
        return [
            {
                "product_id": 20,
                "product_uom_qty": 3.0,
                "price_unit": 10.0,
                "price_subtotal": 30.0,
                "name": "Line",
            }
        ]


class _FakeSaleLineIterable:
    def __init__(self, items):
        self._items = items

    def __iter__(self):
        return iter(self._items)


class _FakeSaleLineModelWithLines:
    def search(self, domain):
        return _FakeSaleLineIterable([_FakeSaleLineRecord()])


class _FakeIrSequence:
    def next_by_code(self, code):
        return 123


class _FakeEnv:
    def __init__(self, move_model, move_line_model, sale_line_model=None):
        self.models = {
            "account.move": move_model,
            "account.move.line": move_line_model,
            "account.journal": _FakeJournal(),
            "account.account": _FakeAccount(),
            "sale.order.line": sale_line_model if sale_line_model is not None else _FakeSaleLineModel(),
            "ir.sequence": _FakeIrSequence(),
        }

    def get(self, model_name):
        return self.models.get(model_name)


class _FakeOrder:
    def __init__(self):
        self.ids = [1]
        self.id = 1
        self.writes = []

    def read(self, fields):
        result = {"id": 1}
        for field in fields:
            if field == "state":
                result[field] = "sale"
            elif field == "name":
                result[field] = "SO/EMPTY"
            elif field == "partner_id":
                result[field] = 9
            elif field == "currency_id":
                result[field] = None
            elif field == "date_order":
                result[field] = "2026-03-23T08:00:00"
            elif field == "payment_term_id":
                result[field] = None
        return [result]

    def write(self, vals):
        self.writes.append(vals)
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
            rows = [dict(rows[0], name="SO/DUP")]
        return rows


class _FakeOrderPart(_FakeOrder):
    def read(self, fields):
        rows = super().read(fields)
        if rows and "name" in fields:
            rows = [dict(rows[0], name="SO/PARTIAL-2")]
        return rows


class TestSaleInvoicePhase466(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase466")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_create_invoice_with_no_invoiceable_lines_skips_move_creation(self):
        sale_order_model = self.registry.get("sale.order")
        self.assertIsNotNone(sale_order_model, "sale.order should load into registry")

        move_model = _FakeMove()
        move_line_model = _FakeMoveLine()
        fake_env = _FakeEnv(move_model, move_line_model)
        order = _FakeOrder()
        recordset = _FakeOrderRecordset(fake_env, [order])

        sale_order_model._create_invoice_with_quantities(recordset, None)

        self.assertEqual(move_model.created, [])
        self.assertEqual(move_line_model.created, [])
        self.assertNotIn({"invoice_status": "invoiced"}, order.writes)

    def test_create_invoice_skips_when_draft_invoice_exists_for_origin(self):
        sale_order_model = self.registry.get("sale.order")
        self.assertIsNotNone(sale_order_model)

        move_model = _FakeMoveWithExistingDraftInvoice()
        move_line_model = _FakeMoveLine()
        fake_env = _FakeEnv(move_model, move_line_model)
        order = _FakeOrderDup()
        recordset = _FakeOrderRecordset(fake_env, [order])

        sale_order_model._create_invoice_with_quantities(recordset, None)

        self.assertEqual(move_model.created, [])
        self.assertEqual(move_line_model.created, [])
        self.assertNotIn({"invoice_status": "invoiced"}, order.writes)

    def test_create_invoice_when_no_draft_duplicate_creates_move(self):
        sale_order_model = self.registry.get("sale.order")
        self.assertIsNotNone(sale_order_model)

        move_model = _FakeMove()
        move_line_model = _FakeMoveLine()
        fake_env = _FakeEnv(
            move_model,
            move_line_model,
            sale_line_model=_FakeSaleLineModelWithLines(),
        )
        order = _FakeOrderPart()
        recordset = _FakeOrderRecordset(fake_env, [order])

        sale_order_model._create_invoice_with_quantities(recordset, None)

        self.assertEqual(len(move_model.created), 1)
        self.assertEqual(move_model.created[0].get("move_type"), "out_invoice")
        self.assertEqual(move_model.created[0].get("invoice_origin"), "SO/PARTIAL-2")
        self.assertGreaterEqual(len(move_line_model.created), 2)
        self.assertIn({"invoice_status": "invoiced"}, order.writes)

