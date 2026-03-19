"""Configuration manager with Odoo-like flags."""

import os
from pathlib import Path
from typing import Optional

# Defaults (Odoo 19 parity)
DEFAULT_SERVER_WIDE_MODULES = [
    "base",
    "rpc",
    "web",
    "base_setup",
    "auth_signup",
    "auth_oauth",
    "iap",
    "iap_mail",
    "utm",
    "phone_validation",
    "onboarding",
    "mail",
    "mailing",
    "calendar",
    "project",
    "crm",
    "sales_team",
    "link_tracker",
    "partner_autocomplete",
    "helpdesk",
    "fetchmail",
    "hr",
    "hr_attendance",
    "hr_recruitment",
    "hr_contract",
    "hr_expense",
    "hr_payroll",
    "hr_timesheet",
    "hr_work_entry",
    "hr_holidays",
    "resource",
    "knowledge",
    "uom",
    "product",
    "sale",
    "sale_crm",
    "sale_management",
    "sale_margin",
    "sale_purchase",
    "sale_sms",
    "sale_expense",
    "project_account",
    "sale_service",
    "sale_project",
    "sale_timesheet",
    "sale_subscription",
    "sale_stock",
    "sale_loyalty",
    "sale_mrp",
    "sale_purchase_stock",
    "sale_stock_margin",
    "sale_timesheet_margin",
    "stock",
    "stock_barcode",
    "stock_account",
    "stock_landed_costs",
    "purchase",
    "purchase_stock",
    "purchase_requisition",
    "purchase_mrp",
    "analytic",
    "account",
    "account_payment",
    "account_check_printing",
    "account_debit_note",
    "payment",
    "ai_assistant",
    "auth_totp",
    "bus",
    "website",
    "website_sale",
    "mrp",
    "fleet",
    "pos",
    "quality",
    "maintenance",
    "event",
    "contacts",
    "portal",
    "lunch",
    "rating",
    "portal_rating",
    "digest",
    "sms",
    "crm_sms",
    "privacy_lookup",
    "web_tour",
    "delivery",
    "loyalty",
    "gamification",
    "gamification_sale_crm",
    "repair",
    "survey",
    "base_automation",
    "base_import",
    "data_recycle",
    "hr_skills",
    "mrp_account",
    "mrp_subcontracting",
]
REQUIRED_SERVER_WIDE_MODULES = ["base", "web"]


def _parse_addons_path(val: str) -> list[str]:
    """Parse comma-separated addons path."""
    if not val:
        return []
    return [p.strip() for p in val.split(",") if p.strip()]


def _parse_config(args: list[str]) -> dict:
    """Parse config from CLI args. Minimal implementation."""
    result = {
        "addons_path": [],
        "http_port": 8069,
        "gevent_port": 8072,
        "gevent_websocket": False,
        "http_interface": "0.0.0.0",
        "proxy_mode": False,
        "dbfilter": "",
        "test_enable": False,
        "debug_assets": False,
        "debug_profiling": False,
        "config": "",
        "cors_origin": "",
        "session_store": "memory",
        "server_wide_modules": DEFAULT_SERVER_WIDE_MODULES.copy(),
        "db_host": os.environ.get("PGHOST", "localhost"),
        "db_port": int(os.environ.get("PGPORT", "5432")),
        "db_user": os.environ.get("PGUSER", os.environ.get("USER", "postgres")),
        "db_password": os.environ.get("PGPASSWORD", ""),
        "db_name": os.environ.get("PGDATABASE", "erp"),
        "api_key": os.environ.get("API_KEY", ""),
        "backup_dir": os.environ.get("ERP_BACKUP_DIR", ""),
    }

    for arg in args:
        if arg is None or not isinstance(arg, str):
            continue
        if arg.startswith("--addons-path="):
            result["addons_path"] = _parse_addons_path(arg.split("=", 1)[1])
        elif arg.startswith("--http-port="):
            result["http_port"] = int(arg.split("=", 1)[1])
        elif arg.startswith("--gevent-port="):
            result["gevent_port"] = int(arg.split("=", 1)[1])
        elif arg == "--gevent-websocket":
            result["gevent_websocket"] = True
        elif arg == "--proxy-mode":
            result["proxy_mode"] = True
        elif arg.startswith("--db-filter="):
            result["dbfilter"] = arg.split("=", 1)[1]
        elif arg == "--test-enable":
            result["test_enable"] = True
        elif arg == "--debug=assets" or arg == "debug=assets":
            result["debug_assets"] = True
        elif arg == "--debug=profiling" or arg == "debug=profiling":
            result["debug_profiling"] = True
        elif arg.startswith("-c=") or arg.startswith("--config="):
            result["config"] = arg.split("=", 1)[1]
        elif arg.startswith("--db-host="):
            result["db_host"] = arg.split("=", 1)[1]
        elif arg.startswith("--db-port="):
            result["db_port"] = int(arg.split("=", 1)[1])
        elif arg.startswith("--db-user="):
            result["db_user"] = arg.split("=", 1)[1]
        elif arg.startswith("--db-password="):
            result["db_password"] = arg.split("=", 1)[1]
        elif arg.startswith("-d=") or arg.startswith("--database="):
            result["db_name"] = arg.split("=", 1)[1]
        elif arg.startswith("--api-key="):
            result["api_key"] = arg.split("=", 1)[1]
        elif arg.startswith("--cors-origin="):
            result["cors_origin"] = arg.split("=", 1)[1]
        elif arg.startswith("--session-store="):
            result["session_store"] = arg.split("=", 1)[1]
        elif arg.startswith("--workers="):
            result["workers"] = int(arg.split("=", 1)[1])
        elif arg.startswith("--backup-dir="):
            result["backup_dir"] = arg.split("=", 1)[1].strip()

    return result


# Global config instance (populated by CLI)
_config: Optional[dict] = None


def parse_config(args: list[str]) -> dict:
    """Parse config and store globally. Returns config dict."""
    global _config
    _config = _parse_config(args)
    return _config


def get_config() -> dict:
    """Get current config. Parses default args if not yet initialized."""
    global _config
    if _config is None:
        _config = _parse_config([])
    return _config


def get_addons_paths() -> list[Path]:
    """Get resolved addons paths. Includes default addons dir if empty."""
    cfg = get_config()
    paths = [Path(p).resolve() for p in cfg.get("addons_path", []) if p is not None]
    if not paths:
        # Default: addons/ relative to project root
        root = Path(__file__).resolve().parent.parent.parent
        default_addons = root / "addons"
        if default_addons.exists():
            paths.append(default_addons)
    return paths
