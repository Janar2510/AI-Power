"""Test SO-driven MO creation via sale_mrp bridge (Track P1)."""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest


class _Registry:
    def __init__(self, models):
        self._models = models
        self._env = self

    def get(self, name):
        return self._models.get(name)


class _Rec:
    _next_id = 1

    def __init__(self, model, vals, registry):
        self.id = _Rec._next_id
        _Rec._next_id += 1
        self._model = model
        self._vals = dict(vals)
        self._vals.setdefault("id", self.id)
        self.ids = [self.id]
        self.env = registry

    def read(self, fields):
        return [{f: self._vals.get(f) for f in fields}]

    def write(self, vals):
        self._vals.update(vals)
        return True

    def browse(self, id_):
        return self

    def search(self, domain, limit=None):
        return self

    def create(self, vals):
        return _Rec(self._model, vals, self.env)

    def action_confirm(self):
        self._vals["state"] = "confirmed"
        return True


# ---------------------------------------------------------------------------

def _make_registry():
    """Build a minimal in-memory registry for sale_mrp bridge testing."""
    store = {}

    class MockModel:
        def __init__(self, name):
            self._name = name
            self._rows = {}  # id → dict
            self._next = 1
            self._registry = None

        def _bind(self, registry):
            self._registry = registry
            return self

        def create(self, vals):
            rid = self._next
            self._next += 1
            row = dict(vals, id=rid)
            self._rows[rid] = row
            rec = _RowProxy(self, rid)
            return rec

        def browse(self, rid):
            return _RowProxy(self, rid)

        def search(self, domain, limit=None):
            rows = list(self._rows.values())
            for (field, op, val) in domain:
                rows = [r for r in rows if _match(r, field, op, val)]
            if limit:
                rows = rows[:limit]
            return _MultiProxy(self, [r["id"] for r in rows])

    class _RowProxy:
        def __init__(self, model, rid):
            self._model = model
            self.id = rid
            self.ids = [rid]
            self.env = None

        def read(self, fields):
            row = self._model._rows.get(self.id, {})
            return [{f: row.get(f) for f in fields}]

        def write(self, vals):
            if self.id in self._model._rows:
                self._model._rows[self.id].update(vals)
            return True

        def action_confirm(self):
            self.write({"state": "confirmed"})
            # Trigger workorder + move creation stubs silently
            return True

        def _mrp_apply_done_moves_to_quants(self):
            return True

    class _MultiProxy:
        def __init__(self, model, ids):
            self._model = model
            self.ids = ids

        def write(self, vals):
            for rid in self.ids:
                self._model._rows[rid].update(vals)
            return True

    def _match(row, field, op, val):
        rv = row.get(field)
        if op == "=":
            return rv == val
        if op == "in":
            return rv in val
        if op == "not in":
            return rv not in val
        return True

    models = {}
    for name in [
        "sale.order", "sale.order.line", "mrp.production", "mrp.bom",
        "product.product", "product.template", "mrp.workorder",
    ]:
        models[name] = MockModel(name)

    class Reg:
        def get(self, n):
            m = models.get(n)
            if m:
                m._registry = self
            return m

    reg = Reg()
    for m in models.values():
        m._registry = reg

    return reg, models


def test_so_confirm_creates_mo():
    """When a SO line product has manufacture_on_order and a BOM, confirm creates an MO."""
    reg, models = _make_registry()

    # Setup: product template with manufacture_on_order
    tmpl = models["product.template"].create({"name": "Widget", "manufacture_on_order": True})
    prod = models["product.product"].create({"name": "Widget", "product_template_id": tmpl.id})
    bom = models["mrp.bom"].create({
        "product_id": prod.id, "product_qty": 1.0, "type": "normal",
        "bom_line_ids": [],
    })
    so = models["sale.order"].create({"name": "SO/001", "state": "sale"})
    sol = models["sale.order.line"].create({
        "order_id": so.id,
        "product_id": prod.id,
        "product_uom_qty": 3.0,
        "mrp_production_ids": [],
    })

    # Attach registry to sale order
    from addons.sale_mrp.models.sale_order import SaleOrderMrp

    class TestOrder:
        def __init__(self):
            self.ids = [so.id]
            self.env = reg

        def read(self, fields):
            return [{"id": so.id}]

    order = TestOrder()
    SaleOrderMrp._sale_mrp_create_manufacturing_orders(order)

    # Verify MO was created for the product
    mos = list(models["mrp.production"]._rows.values())
    assert any(m.get("product_id") == prod.id for m in mos), \
        f"Expected MO for product {prod.id}, got {mos}"
    mo = next(m for m in mos if m.get("product_id") == prod.id)
    assert mo.get("product_qty") == 3.0
    assert mo.get("origin_sale_line_id") == sol.id


def test_workorder_action_done_with_quant():
    """action_done_with_quant marks WO done; if all WOs done triggers quant apply."""
    from addons.mrp.models.mrp_workorder import MrpWorkorder

    reg, models = _make_registry()
    prod = models["product.product"].create({"name": "P"})
    mo = models["mrp.production"].create({
        "product_id": prod.id, "product_qty": 1.0, "state": "confirmed",
    })
    wo = models["mrp.workorder"].create({
        "name": "Op1", "production_id": mo.id, "state": "progress",
    })

    class TestWo:
        def __init__(self):
            self.ids = [wo.id]
            self.env = reg

        def read(self, fields):
            return [{"state": "progress", "production_id": mo.id}]

        def write(self, vals):
            models["mrp.workorder"]._rows[wo.id].update(vals)
            return True

    result = MrpWorkorder.action_done_with_quant(TestWo())
    assert result is True
    assert models["mrp.workorder"]._rows[wo.id].get("state") == "done"
