"""Phase 727: merge-safe create helpers — evidence for checklist rows (string contracts)."""

import re
import unittest
from pathlib import Path


class TestMergeSafeCreateEvidencePhase727(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent

    def test_payment_transaction_create(self):
        src = (self.root / "addons/payment/models/payment_transaction.py").read_text(encoding="utf-8")
        self.assertIn("def _create_payment_transaction_record", src)
        self.assertRegex(
            src,
            re.compile(
                r"@classmethod\s+def create\(cls,\s*vals\):\s*tx = cls\._create_payment_transaction_record\(vals\)",
                re.DOTALL,
            ),
        )

    def test_product_template_create(self):
        src = (self.root / "addons/product/models/product_template.py").read_text(encoding="utf-8")
        self.assertIn("def _create_product_template_record", src)
        self.assertIn("rec = cls._create_product_template_record(vals)", src)
        self.assertIn("rec._create_variant_ids()", src)

    def test_mrp_production_create(self):
        src = (self.root / "addons/mrp/models/mrp_production.py").read_text(encoding="utf-8")
        self.assertIn("def _create_mrp_production_record", src)
        self.assertRegex(
            src,
            re.compile(
                r"@classmethod\s+def create\(cls,\s*vals\):\s*return cls\._create_mrp_production_record\(vals\)",
                re.DOTALL,
            ),
        )

    def test_mail_activity_create(self):
        src = (self.root / "addons/mail/models/mail_activity.py").read_text(encoding="utf-8")
        self.assertIn("def _create_mail_activity_record", src)
        self.assertIn("return cls._create_mail_activity_record(vals)", src)


if __name__ == "__main__":
    unittest.main()
