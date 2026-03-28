"""Phase 748: stock.scrap — fields and action_validate (mock tests, no DB)."""

import unittest
from unittest.mock import MagicMock

from addons.stock.models.stock_scrap import StockScrap


class TestStockScrapPhase748(unittest.TestCase):
    def test_model_and_key_fields_exist(self):
        self.assertEqual(StockScrap._name, "stock.scrap")
        self.assertIsNotNone(getattr(StockScrap, "product_id", None))
        self.assertIsNotNone(getattr(StockScrap, "scrap_qty", None))
        self.assertIsNotNone(getattr(StockScrap, "location_id", None))
        self.assertIsNotNone(getattr(StockScrap, "scrap_location_id", None))
        self.assertIsNotNone(getattr(StockScrap, "move_ids", None))
        self.assertIsNotNone(getattr(StockScrap, "state", None))

    def test_action_validate_creates_move_and_sets_done(self):
        created_moves = []

        def fake_create(vals):
            m = MagicMock()
            m.id = 501
            m.ids = [501]
            created_moves.append(dict(vals))
            return m

        browse_mock = MagicMock()
        Move = MagicMock()
        Move.create = fake_create
        Move.browse = lambda _ids: browse_mock

        Product = MagicMock()
        Product.browse.return_value.read.return_value = [{"uom_id": 8}]

        env = MagicMock()

        def env_get(name):
            if name == "stock.move":
                return Move
            if name == "product.product":
                return Product
            return None

        env.get.side_effect = env_get

        scrap_rec = MagicMock()
        scrap_rec.ids = [77]
        scrap_rec.read.return_value = [
            {
                "state": "draft",
                "product_id": 10,
                "scrap_qty": 3.0,
                "location_id": 20,
                "scrap_location_id": 40,
                "picking_id": False,
                "lot_id": False,
                "product_uom_id": False,
                "name": "SC/001",
            }
        ]
        scrap_rec.write = MagicMock()

        class ScrapRS:
            def __init__(self, environment, rec):
                self.env = environment
                self._rec = rec
                self.ids = [77]

            def __iter__(self):
                return iter([self._rec])

        rs = ScrapRS(env, scrap_rec)

        StockScrap.action_validate(rs)

        self.assertEqual(len(created_moves), 1)
        self.assertEqual(created_moves[0]["product_id"], 10)
        self.assertEqual(created_moves[0]["product_uom_qty"], 3.0)
        self.assertEqual(created_moves[0]["location_id"], 20)
        self.assertEqual(created_moves[0]["location_dest_id"], 40)
        self.assertEqual(created_moves[0]["scrap_id"], 77)
        browse_mock.write.assert_called_once()
        self.assertEqual(browse_mock.write.call_args[0][0], {"state": "done"})
        scrap_rec.write.assert_called_once_with({"state": "done"})

    def test_stock_move_has_scrap_id_field(self):
        from addons.stock.models.stock_scrap import StockMove as StockMoveWithScrap

        self.assertIsNotNone(getattr(StockMoveWithScrap, "scrap_id", None))
