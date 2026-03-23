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
    "base_address_extended",
    "base_geolocalize",
    "auth_signup",
    "auth_oauth",
    "iap",
    "iap_mail",
    "utm",
    "social_media",
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
    "product_margin",
    "product_expiry",
    "sale",
    "sale_crm",
    "sale_management",
    "sale_margin",
    "sale_purchase",
    "sale_sms",
    "sale_expense",
    "project_account",
    "project_todo",
    "project_stock",
    "project_sms",
    "project_purchase",
    "project_hr_expense",
    "project_sale_expense",
    "project_timesheet_holidays",
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
    "sale_expense_margin",
    "sale_loyalty_delivery",
    "stock",
    "stock_barcode",
    "stock_account",
    "stock_landed_costs",
    "stock_sms",
    "stock_delivery",
    "purchase",
    "purchase_stock",
    "purchase_requisition",
    "purchase_requisition_stock",
    "purchase_requisition_sale",
    "purchase_mrp",
    "analytic",
    "account",
    "account_payment",
    "account_check_printing",
    "account_debit_note",
    "account_fleet",
    "payment",
    "ai_assistant",
    "auth_totp",
    "auth_password_policy",
    "bus",
    "website",
    "website_sale",
    "website_crm",
    "website_payment",
    "mrp",
    "fleet",
    "pos",
    "quality",
    "maintenance",
    "event",
    "event_product",
    "event_sms",
    "event_crm",
    "event_sale",
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
    "hr_gamification",
    "hr_fleet",
    "hr_maintenance",
    "hr_calendar",
    "hr_homeworking",
    "hr_recruitment_skills",
    "mrp_account",
    "mrp_subcontracting",
    "mrp_landed_costs",
    "mrp_product_expiry",
    "mrp_repair",
    "mrp_subcontracting_account",
    "mrp_subcontracting_landed_costs",
    "mrp_subcontracting_purchase",
    "mrp_subcontracting_repair",
    "project_mrp",
    "project_hr_skills",
    "project_stock_account",
    "project_purchase_stock",
    "project_stock_landed_costs",
    "project_mrp_account",
    "project_mrp_sale",
    "sale_project_stock_account",
    "hr_work_entry_holidays",
    "hr_holidays_attendance",
    "hr_holidays_homeworking",
    "hr_homeworking_calendar",
    "hr_timesheet_attendance",
    "hr_presence",
    "hr_hourly_cost",
    "hr_recruitment_sms",
    "sale_purchase_project",
    "sale_project_stock",
    "sale_mrp_margin",
    "sale_stock_product_expiry",
    "calendar_sms",
    "resource_mail",
    "survey_crm",
    "event_crm_sale",
    "mail_bot",
    "auth_password_policy_portal",
    "auth_password_policy_signup",
    "auth_totp_mail",
    "auth_totp_portal",
    "stock_maintenance",
    "stock_picking_batch",
    "purchase_repair",
    "stock_dropshipping",
    "web_hierarchy",
    "website_mail",
    "website_sms",
    "website_links",
    "website_project",
    "website_timesheet",
    "hr_skills_event",
    "hr_skills_survey",
    "mail_bot_hr",
    "hr_org_chart",
    "barcodes",
    "barcodes_gs1_nomenclature",
    "base_iban",
    "base_vat",
    "board",
    "http_routing",
    "html_editor",
    "html_builder",
    "product_matrix",
    "product_email_template",
    "sale_product_matrix",
    "purchase_product_matrix",
    "sale_pdf_quote_builder",
    "delivery_stock_picking_batch",
    "stock_fleet",
    "mrp_subcontracting_dropshipping",
    "auth_ldap",
    "auth_passkey",
    "auth_passkey_portal",
    "auth_timeout",
    "mail_group",
    "mail_plugin",
    "snailmail",
    "snailmail_account",
    "event_booth",
    "event_booth_sale",
    "website_event",
    "website_event_sale",
    "website_event_crm",
    "website_event_booth",
    "website_event_booth_sale",
    "project_mrp_stock_landed_costs",
    "website_sale_stock",
    "website_sale_wishlist",
    "website_sale_comparison",
    "website_sale_comparison_wishlist",
    "website_customer",
    "website_partner",
    "website_profile",
    "website_hr_recruitment",
    "iap_crm",
    "crm_iap_enrich",
    "crm_mail_plugin",
    "marketing_card",
    "sms_twilio",
    "web_unsplash",
    "base_sparse_field",
    "base_import_module",
    "base_install_request",
    "partnership",
    "website_sale_collect",
    "purchase_edi_ubl_bis3",
    "website_sale_autocomplete",
    "website_sale_gelato",
    "website_event_booth_sale_exhibitor",
    "website_event_track",
    "certificate",
    "account_tax_python",
    "project_mail_plugin",
    "website_sale_mrp",
    "account_qr_code_sepa",
    "sale_gelato_stock",
    "attachment_indexation",
    "sale_edi_ubl",
    "website_sale_mondialrelay",
    "website_crm_partner_assign",
    "account_edi_proxy_client",
    "website_event_track_live",
    "website_event_track_quiz",
    "crm_iap_mine",
    "website_event_exhibitor",
    "website_mail_group",
    "website_crm_iap_reveal",
    "account_peppol",
    "website_sale_loyalty",
    "website_sale_collect_wishlist",
    "website_cf_turnstile",
    "website_crm_sms",
    "account_peppol_advanced_fields",
    "account_edi_ubl_cii",
    "delivery_mondialrelay",
    "account_edi",
    "sale_gelato",
    "account_qr_code_emv",
    "account_add_gln",
    "website_event_track_live_quiz",
    "account_update_tax_tags",
    "hr_recruitment_survey",
    "website_sale_stock_wishlist",
    "website_event_booth_exhibitor",
    "mass_mailing",
    "mass_mailing_crm",
    "mass_mailing_event",
    "mass_mailing_sale",
    "mass_mailing_sms",
    "mass_mailing_themes",
    "im_livechat",
    "crm_livechat",
    "hr_livechat",
    "website_livechat",
    "website_blog",
    "website_forum",
    "website_slides",
    "hr_skills_slides",
    "pos_discount",
    "pos_loyalty",
    "pos_sale",
    "pos_sale_loyalty",
    "pos_sale_margin",
    "pos_hr",
    "pos_restaurant",
    "pos_hr_restaurant",
    "pos_restaurant_loyalty",
    "pos_mrp",
    "pos_event",
    "pos_event_sale",
    "pos_sms",
    "pos_self_order",
    "pos_online_payment",
    "pos_account_tax_python",
    "payment_stripe",
    "payment_paypal",
    "payment_adyen",
    "payment_authorize",
    "payment_mollie",
    "payment_razorpay",
    "payment_custom",
    "payment_demo",
    "pos_adyen",
    "pos_stripe",
    "pos_restaurant_adyen",
    "google_calendar",
    "google_drive",
    "microsoft_calendar",
    "microsoft_outlook",
    "spreadsheet",
    "spreadsheet_dashboard",
    "spreadsheet_account",
    "spreadsheet_dashboard_account",
    "spreadsheet_crm",
    "spreadsheet_dashboard_crm",
    "cloud_storage",
    "iot",
    "l10n_generic_coa",
    "l10n_us",
    "l10n_uk",
    "l10n_de",
    "l10n_fr",
    "l10n_es",
    "l10n_it",
    "l10n_nl",
    "l10n_be",
    "l10n_ch",
    "l10n_at",
    "l10n_in",
    "l10n_br",
    "l10n_mx",
    "l10n_au",
    "l10n_ca",
    "l10n_pl",
    "l10n_se",
    "l10n_no",
    "l10n_dk",
    "theme_default",
    "theme_starter_1",
    "theme_starter_2",
    "theme_starter_3",
    "theme_starter_4",
    "l10n_ar",
    "l10n_cl",
    "l10n_co",
    "l10n_pe",
    "l10n_ec",
    "l10n_ae",
    "l10n_sa",
    "l10n_eg",
    "l10n_za",
    "l10n_ke",
    "l10n_cn",
    "l10n_kr",
    "l10n_tw",
    "l10n_sg_full",
    "l10n_th",
    "l10n_cz",
    "l10n_hu",
    "l10n_ro",
    "l10n_bg",
    "l10n_pt",
    "l10n_bo",
    "l10n_cr",
    "l10n_uy",
    "l10n_ve",
    "l10n_ph",
    "l10n_id",
    "l10n_vn",
    "l10n_pk",
    "l10n_ng",
    "l10n_ma",
    "l10n_il",
    "l10n_hr",
    "l10n_rs",
    "l10n_si",
    "l10n_lu",
    "l10n_lt",
    "l10n_lv",
    "l10n_ua",
    "l10n_fi",
    "l10n_gr",
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
        "load_demo": os.environ.get("ERP_LOAD_DEMO", "").lower() in ("1", "true", "yes"),
        "json_access_log": os.environ.get("ERP_JSON_ACCESS_LOG", "").lower() in ("1", "true", "yes"),
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
        elif arg == "--demo":
            result["load_demo"] = True
        elif arg == "--json-access-log":
            result["json_access_log"] = True
        elif arg == "--no-json-access-log":
            result["json_access_log"] = False

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
