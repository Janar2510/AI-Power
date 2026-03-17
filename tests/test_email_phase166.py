"""Phase 166: Email Outbox (SMTP)."""

import unittest

from core.tools.config import parse_config
from core.sql_db import db_exists
from core.http.rpc import _call_kw


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestEmailPhase166(unittest.TestCase):
    """Phase 166: mail.mail send via SMTP, process_email_queue cron."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_process_email_queue_returns_counts(self):
        """mail.mail.process_email_queue returns {sent, failed} counts."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "mail.mail", "process_email_queue", [], {})
        self.assertIsInstance(result, dict)
        self.assertIn("sent", result)
        self.assertIn("failed", result)
        self.assertIsInstance(result["sent"], int)
        self.assertIsInstance(result["failed"], int)

    def test_ir_mail_server_exists(self):
        """ir.mail_server model exists and has smtp fields."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        fields = _call_kw(1, self.db, "ir.mail_server", "fields_get", [], {})
        self.assertIn("smtp_host", fields)
        self.assertIn("smtp_port", fields)
        self.assertIn("smtp_user", fields)
        self.assertIn("smtp_encryption", fields)
