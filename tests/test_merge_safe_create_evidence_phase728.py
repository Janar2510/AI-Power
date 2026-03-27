"""Phase 728: hr.expense.sheet / hr.payslip merge-safe create (checklist hygiene)."""

import re
import unittest
from pathlib import Path


class TestMergeSafeCreateEvidencePhase728(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent

    def test_hr_expense_sheet_create(self):
        src = (self.root / "addons/hr_expense/models/hr_expense_sheet.py").read_text(encoding="utf-8")
        self.assertIn("def _create_hr_expense_sheet_record", src)
        self.assertRegex(
            src,
            re.compile(
                r"@classmethod\s+def create\(cls,\s*vals\):\s*return cls\._create_hr_expense_sheet_record\(vals\)",
                re.DOTALL,
            ),
        )

    def test_hr_payslip_create(self):
        src = (self.root / "addons/hr_payroll/models/hr_payslip.py").read_text(encoding="utf-8")
        self.assertIn("def _create_hr_payslip_record", src)
        self.assertRegex(
            src,
            re.compile(
                r"@classmethod\s+def create\(cls,\s*vals\):\s*return cls\._create_hr_payslip_record\(vals\)",
                re.DOTALL,
            ),
        )


if __name__ == "__main__":
    unittest.main()
