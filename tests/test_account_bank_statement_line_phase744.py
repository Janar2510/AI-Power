"""Phase 744: account.bank.statement.line — is_reconciled computed from move_id."""

import unittest
from unittest.mock import MagicMock


class TestAccountBankStatementLinePhase744(unittest.TestCase):
    def test_is_reconciled_false_without_move(self):
        from addons.account.models.account_bank_statement import AccountBankStatementLine

        rs = MagicMock()
        rs.ids = [1]
        rs.read.return_value = [{"id": 1, "move_id": False}]
        out = AccountBankStatementLine._compute_is_reconciled(rs)
        self.assertEqual(out, [{"id": 1, "is_reconciled": False}])

    def test_is_reconciled_true_with_move(self):
        from addons.account.models.account_bank_statement import AccountBankStatementLine

        rs = MagicMock()
        rs.ids = [2]
        rs.read.return_value = [{"id": 2, "move_id": [42, "INV/1"]}]
        out = AccountBankStatementLine._compute_is_reconciled(rs)
        self.assertEqual(out, [{"id": 2, "is_reconciled": True}])
