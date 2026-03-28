"""Phase 751: hr.expense.sheet.action_sheet_move_create → account.move (mock, no DB)."""

import unittest
from unittest.mock import MagicMock

from addons.hr_expense.models.account_move import AccountMove as HrExpenseAccountMove
from addons.hr_expense.models.hr_expense_sheet import HrExpenseSheet


class TestHrExpensePostingPhase751(unittest.TestCase):
    def test_account_move_bridge_field(self):
        self.assertIsNotNone(getattr(HrExpenseAccountMove, "hr_expense_sheet_id", None))

    def test_action_sheet_move_create_method_exists(self):
        self.assertTrue(callable(getattr(HrExpenseSheet, "action_sheet_move_create", None)))
        self.assertTrue(callable(getattr(HrExpenseSheet, "_create_account_move_for_sheet", None)))

    def test_action_sheet_move_create_builds_debit_credit_move(self):
        move_instance = MagicMock()
        move_instance.id = 9001

        def move_create(vals):
            self.assertEqual(vals.get("move_type"), "entry")
            self.assertEqual(vals.get("hr_expense_sheet_id"), 55)
            return move_instance

        created_lines = []

        def line_create(vals):
            created_lines.append(dict(vals))
            m = MagicMock()
            m.id = len(created_lines)
            return m

        Move = MagicMock()
        Move.create.side_effect = move_create
        Journal = MagicMock()

        def journal_search(domain, limit=None):
            m = MagicMock()
            if domain and domain[0][2] == "purchase":
                m.ids = []
            else:
                m.ids = [3]
            return m

        Journal.search.side_effect = journal_search
        MoveLine = MagicMock()
        MoveLine.create.side_effect = line_create
        Account = MagicMock()

        def acc_search(domain, limit=None):
            m = MagicMock()
            if "6" in str(domain):
                m.ids = [601]
            elif "2" in str(domain) or "4" in str(domain):
                m.ids = [201]
            else:
                m.ids = []
            return m

        Account.search.side_effect = acc_search

        expense_lines = MagicMock()
        expense_lines.ids = [1]
        expense_lines.read.return_value = [
            {
                "name": "Hotel",
                "unit_amount": 100.0,
                "quantity": 1.0,
                "date": "2026-01-01",
                "analytic_account_id": False,
                "employee_id": 1,
            }
        ]

        sheet_rec = MagicMock()
        sheet_rec.ids = [55]
        sheet_rec.state = "approve"
        sheet_rec.name = "EXP/00001"
        sheet_rec.expense_line_ids = expense_lines
        sheet_rec.read.return_value = [{"account_move_id": False, "journal_id": False}]
        sheet_rec.write = MagicMock()

        env = MagicMock()

        def env_get(name):
            return {
                "account.move": Move,
                "account.journal": Journal,
                "account.move.line": MoveLine,
                "account.account": Account,
                "analytic.line": None,
            }.get(name)

        env.get.side_effect = env_get

        class SheetRS:
            def __init__(self, rec):
                self._rec = rec
                self.ids = [55]

            def __iter__(self):
                return iter([self._rec])

        sheet_rec.env = env
        rs = SheetRS(sheet_rec)
        HrExpenseSheet._create_account_move_for_sheet(rs, post_move=True)

        move_instance.action_post.assert_called_once()
        sheet_rec.write.assert_called_once()
        self.assertEqual(sheet_rec.write.call_args[0][0].get("account_move_id"), 9001)
        debits = [x for x in created_lines if x.get("debit")]
        credits = [x for x in created_lines if x.get("credit")]
        self.assertEqual(len(debits), 1)
        self.assertEqual(debits[0]["debit"], 100.0)
        self.assertEqual(len(credits), 1)
        self.assertEqual(credits[0]["credit"], 100.0)
