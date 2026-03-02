"""Pytest configuration for e2e tests."""

import os

import pytest

# Provide page fixture when pytest-playwright not installed
try:
    from playwright.sync_api import sync_playwright

    @pytest.fixture(scope="session")
    def _playwright_browser():
        pw = sync_playwright().start()
        browser = pw.chromium.launch(headless=True)
        yield browser
        browser.close()
        pw.stop()

    @pytest.fixture
    def page(_playwright_browser):
        return _playwright_browser.new_page()
except ImportError:
    pass


def pytest_addoption(parser):
    parser.addoption(
        "--e2e-base-url",
        default=os.environ.get("E2E_BASE_URL", "http://localhost:8069"),
        help="Base URL for e2e tests",
    )
    parser.addoption(
        "--e2e-login",
        default=os.environ.get("E2E_LOGIN", "admin"),
        help="Login for e2e tests",
    )
    parser.addoption(
        "--e2e-password",
        default=os.environ.get("E2E_PASSWORD", "admin"),
        help="Password for e2e tests",
    )
    parser.addoption(
        "--e2e-db",
        default=os.environ.get("E2E_DB", "erp"),
        help="Database name for e2e tests",
    )


@pytest.fixture(scope="session")
def e2e_base_url(request):
    return request.config.getoption("--e2e-base-url", default="http://localhost:8069")


@pytest.fixture(scope="session")
def e2e_login(request):
    return request.config.getoption("--e2e-login", default="admin")


@pytest.fixture(scope="session")
def e2e_password(request):
    return request.config.getoption("--e2e-password", default="admin")


@pytest.fixture(scope="session")
def e2e_db(request):
    return request.config.getoption("--e2e-db", default="erp")
