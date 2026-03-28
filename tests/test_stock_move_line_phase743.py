"""Phase 743: stock.move.line — quantity constraint when move is done (unit tests, no DB)."""

import unittest
from unittest.mock import MagicMock

from core.orm.api import ValidationError


class TestStockMoveLinePhase743(unittest.TestCase):
    def test_check_quantity_raises_when_move_done_and_negative(self):
        from addons.stock.models.stock_move_line import StockMoveLine

        rs = MagicMock()
        rs.ids = [1]
        rs.env = MagicMock()
        move_model = MagicMock()
        move_model.browse.return_value.read.return_value = [{"state": "done"}]
        rs.env.get.side_effect = lambda name: move_model if name == "stock.move" else None
        rs.read.return_value = [{"id": 1, "quantity": -1.0, "move_id": 5}]

        with self.assertRaises(ValidationError):
            StockMoveLine._check_quantity_when_move_done(rs)

    def test_check_quantity_allows_negative_when_move_draft(self):
        from addons.stock.models.stock_move_line import StockMoveLine

        rs = MagicMock()
        rs.ids = [1]
        rs.env = MagicMock()
        move_model = MagicMock()
        move_model.browse.return_value.read.return_value = [{"state": "draft"}]
        rs.env.get.side_effect = lambda name: move_model if name == "stock.move" else None
        rs.read.return_value = [{"id": 1, "quantity": -1.0, "move_id": 5}]

        StockMoveLine._check_quantity_when_move_done(rs)

    def test_check_quantity_allows_positive_when_move_done(self):
        from addons.stock.models.stock_move_line import StockMoveLine

        rs = MagicMock()
        rs.ids = [1]
        rs.env = MagicMock()
        move_model = MagicMock()
        move_model.browse.return_value.read.return_value = [{"state": "done"}]
        rs.env.get.side_effect = lambda name: move_model if name == "stock.move" else None
        rs.read.return_value = [{"id": 1, "quantity": 2.0, "move_id": 5}]

        StockMoveLine._check_quantity_when_move_done(rs)
