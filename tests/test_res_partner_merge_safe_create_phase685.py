"""Phase 685: res.partner create delegates to merge-safe _create_res_partner_record."""

import re
import unittest
from pathlib import Path


class TestResPartnerMergeSafeCreatePhase685(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent
        cls.partner = (cls.root / "addons/base/models/res_partner.py").read_text(encoding="utf-8")

    def test_create_delegates_to_merge_safe_helper(self):
        self.assertIn("def _create_res_partner_record", self.partner)
        self.assertRegex(
            self.partner,
            re.compile(
                r"@classmethod\s+def create\(cls,\s*vals\):\s*return cls\._create_res_partner_record\(vals\)",
                re.DOTALL,
            ),
        )


if __name__ == "__main__":
    unittest.main()
