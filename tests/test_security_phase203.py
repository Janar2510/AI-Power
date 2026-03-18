"""Phase 203: Security hardening - CSRF, rate limiting, security headers."""

import unittest

from werkzeug.test import EnvironBuilder
from werkzeug.wrappers import Request

from core.http.security import validate_csrf, check_rate_limit, CSRF_EXEMPT_PATHS
from core.http.session import create_session, get_session, ensure_session_csrf


class TestSecurityPhase203(unittest.TestCase):
    """Test CSRF validation, rate limiting, session CSRF."""

    def test_csrf_exempt_paths(self):
        """Login and get_session_info are exempt."""
        self.assertIn("/web/login", CSRF_EXEMPT_PATHS)
        self.assertIn("/web/session/get_session_info", CSRF_EXEMPT_PATHS)

    def test_validate_csrf_exempt_for_get(self):
        """GET requests skip CSRF."""
        builder = EnvironBuilder(path="/web/session/set_lang", method="GET")
        req = Request(builder.get_environ())
        valid, _ = validate_csrf(req, "some-token")
        self.assertTrue(valid)

    def test_validate_csrf_exempt_for_login(self):
        """Login path is exempt."""
        builder = EnvironBuilder(path="/web/login", method="POST")
        req = Request(builder.get_environ())
        valid, _ = validate_csrf(req, None)
        self.assertTrue(valid)

    def test_validate_csrf_requires_token_for_post(self):
        """POST to protected path without token fails."""
        builder = EnvironBuilder(path="/web/session/set_lang", method="POST")
        req = Request(builder.get_environ())
        valid, err = validate_csrf(req, None)
        self.assertFalse(valid)
        self.assertIn("CSRF", err or "")

    def test_validate_csrf_accepts_valid_token(self):
        """POST with valid token passes."""
        token = "abc123"
        builder = EnvironBuilder(path="/web/session/set_lang", method="POST")
        builder.headers["X-CSRF-Token"] = token
        req = Request(builder.get_environ())
        valid, _ = validate_csrf(req, token)
        self.assertTrue(valid)

    def test_session_has_csrf_on_create(self):
        """create_session stores csrf_token."""
        sid = create_session(uid=1, db="test")
        sess = get_session(sid)
        self.assertIsNotNone(sess)
        self.assertIn("csrf_token", sess)
        self.assertTrue(len(sess["csrf_token"]) > 10)

    def test_ensure_session_csrf_adds_if_missing(self):
        """ensure_session_csrf adds token for legacy sessions."""
        sid = create_session(uid=1, db="test")
        token = ensure_session_csrf(sid)
        self.assertIsNotNone(token)
        sess = get_session(sid)
        self.assertEqual(sess.get("csrf_token"), token)

    def test_rate_limit_allows_normal_requests(self):
        """Rate limit allows requests under threshold."""
        builder = EnvironBuilder(path="/web/login", method="POST")
        builder.remote_addr = "192.168.1.100"
        req = Request(builder.get_environ())
        for _ in range(3):
            allowed, _ = check_rate_limit(req)
            self.assertTrue(allowed)
