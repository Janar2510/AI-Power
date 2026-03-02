# E2E integration tests (pytest-playwright). Run with:
#   python scripts/with_server.py --server "./erp-bin server" --port 8069 -- \
#     pytest tests/e2e/ -v
# Or with server already running: pytest tests/e2e/ -v

import unittest


def load_tests(loader, standard_tests, pattern):
    """Exclude e2e from unittest discovery; e2e tests use pytest."""
    return unittest.TestSuite()
