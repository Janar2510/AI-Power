"""Phase 144: Profiling + performance monitoring."""

import unittest

from core.tools.config import parse_config
from core.profiling import (
    init_request_profiling,
    record_query,
    get_profiling_stats,
    get_request_duration_ms,
)


class TestProfilingPhase144(unittest.TestCase):
    """Phase 144: profiling contextvars and stats."""

    def test_init_and_record_query(self):
        """init_request_profiling and record_query update stats."""
        init_request_profiling()
        record_query(0.001)
        record_query(0.002)
        stats = get_profiling_stats()
        self.assertEqual(stats["query_count"], 2)
        self.assertGreaterEqual(stats["query_time_ms"], 2.0)
        self.assertIsNotNone(stats["request_ms"])

    def test_get_request_duration_ms(self):
        """get_request_duration_ms returns ms since init."""
        init_request_profiling()
        dur = get_request_duration_ms()
        self.assertIsNotNone(dur)
        self.assertGreaterEqual(dur, 0)
