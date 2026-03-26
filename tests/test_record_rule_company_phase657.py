"""Phase 657: company-scoped models get allowed_company_ids domain in record rules."""

import unittest
from unittest.mock import MagicMock

from core.orm.security import _append_allowed_company_domain_for_model


class TestRecordRuleCompanyPhase657(unittest.TestCase):
    def test_appends_company_in_when_model_has_company_id(self):
        out: list = []
        model = MagicMock()
        model.fields_get.return_value = {"company_id": {"type": "many2one"}, "name": {}}
        env = MagicMock()
        env.get.return_value = model
        _append_allowed_company_domain_for_model("res.partner", env, [1, 2], out)
        self.assertEqual(out, [[["company_id", "in", [1, 2]]]])

    def test_skips_when_no_allowed_companies(self):
        out: list = []
        env = MagicMock()
        _append_allowed_company_domain_for_model("res.partner", env, [], out)
        self.assertEqual(out, [])


if __name__ == "__main__":
    unittest.main()
