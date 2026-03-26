"""Phase 675: purchase.order create delegates to merge-safe _create_purchase_order_record."""

import re
import unittest
from pathlib import Path


class TestPurchaseMergeSafeCreatePhase675(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent
        cls.po = (cls.root / "addons/purchase/models/purchase_order.py").read_text(encoding="utf-8")

    def test_create_delegates_to_merge_safe_helper(self):
        self.assertIn("def _create_purchase_order_record", self.po)
        self.assertRegex(
            self.po,
            re.compile(
                r"@classmethod\s+def create\(cls,\s*vals\):\s*return cls\._create_purchase_order_record\(vals\)",
                re.DOTALL,
            ),
        )


if __name__ == "__main__":
    unittest.main()
