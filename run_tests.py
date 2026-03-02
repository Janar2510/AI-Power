#!/usr/bin/env python3
"""Run tests."""

import sys
from pathlib import Path

# Add project root to path
root = Path(__file__).resolve().parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

import unittest

if __name__ == "__main__":
    loader = unittest.TestLoader()
    start_dir = str(root / "tests")
    suite = loader.discover(start_dir, pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
