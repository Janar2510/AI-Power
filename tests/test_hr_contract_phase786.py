"""Phase B4: hr.contract model."""

import unittest

from addons.hr.models.hr_contract import HrContract


class TestHrContractPhase786(unittest.TestCase):
    def test_model_meta(self):
        self.assertEqual(HrContract._name, "hr.contract")
        self.assertIsNotNone(getattr(HrContract, "employee_id", None))
        self.assertIsNotNone(getattr(HrContract, "wage", None))
        self.assertIsNotNone(getattr(HrContract, "state", None))
