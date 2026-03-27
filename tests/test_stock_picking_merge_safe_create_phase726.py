"""Phase 726: stock.picking create delegates to merge-safe _create_stock_picking_record."""

import re
import unittest
from pathlib import Path


class TestStockPickingMergeSafeCreatePhase726(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent
        cls.src = (cls.root / "addons/stock/models/stock_picking.py").read_text(encoding="utf-8")

    def test_create_delegates_to_merge_safe_helper(self):
        self.assertIn("def _create_stock_picking_record", self.src)
        self.assertRegex(
            self.src,
            re.compile(
                r"@classmethod\s+def create\(cls,\s*vals\):\s*return cls\._create_stock_picking_record\(vals\)",
                re.DOTALL,
            ),
        )


if __name__ == "__main__":
    unittest.main()
