"""Phase 120: Multi-worker mode - --workers=N config parsing and prefork."""

import unittest

from core.tools.config import parse_config, get_config


class TestMultiWorkerPhase120(unittest.TestCase):
    """Test --workers config and prefork behaviour."""

    def test_workers_default_zero(self):
        """Default workers=0 (single process)."""
        parse_config([])
        cfg = get_config()
        self.assertEqual(cfg.get("workers", 0), 0)

    def test_workers_parsed_from_args(self):
        """--workers=N parses to workers key."""
        parse_config(["--workers=2"])
        cfg = get_config()
        self.assertEqual(cfg.get("workers"), 2)

        parse_config(["--workers=4"])
        cfg = get_config()
        self.assertEqual(cfg.get("workers"), 4)
