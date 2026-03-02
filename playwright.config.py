# Playwright configuration for ERP Platform e2e tests.

import os
from pathlib import Path

# Project root
root = Path(__file__).resolve().parent

# Base URL - can override with E2E_BASE_URL env var
base_url = os.environ.get("E2E_BASE_URL", "http://localhost:8069")

# Timeouts
timeout = 30000  # 30s per action
expect_timeout = 10000  # 10s for assertions

# Run headless by default
headed = os.environ.get("E2E_HEADED", "").lower() in ("1", "true", "yes")
