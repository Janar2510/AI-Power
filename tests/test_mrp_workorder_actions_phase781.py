"""Phase B3: mrp.workorder state actions."""

import unittest
from unittest.mock import MagicMock

from addons.mrp.models.mrp_workorder import MrpWorkorder


class TestMrpWorkorderActionsPhase781(unittest.TestCase):
    def test_action_start(self):
        wo = MagicMock()
        wo.read.return_value = [{"state": "pending"}]
        wo.write = MagicMock()

        class RS:
            ids = [1]

            def __iter__(self):
                return iter([wo])

        MrpWorkorder.action_start(RS())
        wo.write.assert_called_with({"state": "progress"})

    def test_action_done(self):
        wo = MagicMock()
        wo.read.return_value = [{"state": "progress"}]
        wo.write = MagicMock()

        class RS:
            ids = [1]

            def __iter__(self):
                return iter([wo])

        MrpWorkorder.action_done(RS())
        wo.write.assert_called_with({"state": "done"})
