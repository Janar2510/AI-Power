"""Phase B4: hr.attendance action_check_out."""

import unittest
from unittest.mock import MagicMock

from addons.hr_attendance.models.hr_attendance import HrAttendance


class TestHrAttendanceCheckoutPhase786(unittest.TestCase):
    def test_action_check_out_sets_time(self):
        rec = MagicMock()
        rec.read.return_value = [{"check_out": None}]
        rec.write = MagicMock()

        class RS:
            ids = [1]

            def __iter__(self):
                return iter([rec])

        HrAttendance.action_check_out(RS())
        rec.write.assert_called()
        call_kw = rec.write.call_args[0][0]
        self.assertIn("check_out", call_kw)
