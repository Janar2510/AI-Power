"""Phase 254: Command class for O2M/M2M writes."""

import unittest

from core.orm.commands import Command


class TestOrmCommandsPhase254(unittest.TestCase):
    """Test Command enum and class methods."""

    def test_command_constants(self):
        """Command enum has CREATE through SET."""
        self.assertEqual(Command.CREATE, 0)
        self.assertEqual(Command.UPDATE, 1)
        self.assertEqual(Command.DELETE, 2)
        self.assertEqual(Command.UNLINK, 3)
        self.assertEqual(Command.LINK, 4)
        self.assertEqual(Command.CLEAR, 5)
        self.assertEqual(Command.SET, 6)

    def test_create(self):
        """Command.create returns (0, 0, values)."""
        vals = {"name": "Test", "amount": 10}
        t = Command.create(vals)
        self.assertEqual(t[0], 0)
        self.assertEqual(t[1], 0)
        self.assertEqual(t[2], vals)

    def test_update(self):
        """Command.update returns (1, id, values)."""
        t = Command.update(42, {"name": "Updated"})
        self.assertEqual(t[0], 1)
        self.assertEqual(t[1], 42)
        self.assertEqual(t[2], {"name": "Updated"})

    def test_delete(self):
        """Command.delete returns (2, id, 0)."""
        t = Command.delete(99)
        self.assertEqual(t[0], 2)
        self.assertEqual(t[1], 99)
        self.assertEqual(t[2], 0)

    def test_unlink(self):
        """Command.unlink returns (3, id, 0)."""
        t = Command.unlink(7)
        self.assertEqual(t[0], 3)
        self.assertEqual(t[1], 7)
        self.assertEqual(t[2], 0)

    def test_link(self):
        """Command.link returns (4, id, 0)."""
        t = Command.link(5)
        self.assertEqual(t[0], 4)
        self.assertEqual(t[1], 5)
        self.assertEqual(t[2], 0)

    def test_clear(self):
        """Command.clear returns (5, 0, 0)."""
        t = Command.clear()
        self.assertEqual(t[0], 5)
        self.assertEqual(t[1], 0)
        self.assertEqual(t[2], 0)

    def test_set(self):
        """Command.set returns (6, 0, ids)."""
        t = Command.set([1, 2, 3])
        self.assertEqual(t[0], 6)
        self.assertEqual(t[1], 0)
        self.assertEqual(t[2], [1, 2, 3])

    def test_set_empty(self):
        """Command.set with empty returns (6, 0, [])."""
        t = Command.set([])
        self.assertEqual(t[0], 6)
        self.assertEqual(t[1], 0)
        self.assertEqual(t[2], [])
