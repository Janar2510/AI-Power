"""Phase B1: stock.move action_split_by_qty / action_merge_with (mocked env)."""

import unittest
from unittest.mock import MagicMock

from addons.stock.models.stock_move import StockMove


class TestStockMoveSplitMergePhase771(unittest.TestCase):
    def test_split_creates_second_move(self):
        created = []

        def fake_create(vals):
            m = MagicMock()
            m.id = 902
            m.ids = [902]
            created.append(dict(vals))
            return m

        Move = MagicMock()
        Move.create = fake_create

        env = MagicMock()
        env.get.side_effect = lambda n: Move if n == "stock.move" else None

        rec = MagicMock()
        rec.ids = [1]
        rec.read.return_value = [
            {
                "state": "draft",
                "product_uom_qty": 10.0,
                "product_id": 5,
                "picking_id": 9,
                "location_id": 1,
                "location_dest_id": 2,
                "name": "Move A",
                "lot_id": False,
            }
        ]
        rec.write = MagicMock()

        RS = type("RS", (), {"env": env, "ids": [1], "__iter__": lambda self: iter([rec])})
        StockMove.action_split_by_qty(RS(), 3.0)
        rec.write.assert_called()
        self.assertEqual(created[0]["product_uom_qty"], 3.0)
        self.assertEqual(created[0]["picking_id"], 9)

    def test_merge_combines_qty_and_unlinks_other(self):
        rec = MagicMock()
        rec.ids = [1]
        rec.read.return_value = [
            {
                "state": "draft",
                "product_uom_qty": 2.0,
                "product_id": 5,
                "picking_id": 9,
                "location_id": 1,
                "location_dest_id": 2,
            }
        ]
        rec.write = MagicMock()

        other = MagicMock()
        other.ids = [2]
        other.read.return_value = [
            {
                "state": "draft",
                "product_uom_qty": 3.0,
                "product_id": 5,
                "picking_id": 9,
                "location_id": 1,
                "location_dest_id": 2,
            }
        ]
        other.unlink = MagicMock()

        Move = MagicMock()

        def browse(mid):
            if mid == 1:
                return rec
            if mid == 2:
                return other
            return MagicMock(ids=[])

        Move.browse = browse

        env = MagicMock()
        env.get.side_effect = lambda n: Move if n == "stock.move" else None

        RS = type("RS", (), {"env": env, "ids": [1]})
        StockMove.action_merge_with(RS(), 2)
        rec.write.assert_called_with({"product_uom_qty": 5.0})
        other.unlink.assert_called()
