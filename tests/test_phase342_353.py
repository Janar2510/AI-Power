"""Phases 342-353: plan-aligned model/field and server-wide module checks."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase342353(unittest.TestCase):
    """Field existence checks per phase plan (342-353)."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase342_353"
        cls.registry = Registry(cls.db)
        from core.orm.models import ModelBase

        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()
        try:
            with get_cursor(cls.db) as cr:
                init_schema(cr, cls.registry)
                cr.commit()
        except Exception:
            pass

    def test_phase342(self):
        Provider = self.registry.get("payment.provider")
        self.assertTrue(hasattr(Provider, "stripe_secret_key"))
        self.assertTrue(hasattr(Provider, "paypal_email_account"))
        self.assertTrue(hasattr(Provider, "adyen_merchant_account"))
        self.assertTrue(hasattr(Provider, "authorize_login"))

        Tx = self.registry.get("payment.transaction")
        self.assertTrue(hasattr(Tx, "stripe_payment_intent"))
        self.assertTrue(hasattr(Tx, "paypal_txn_id"))
        self.assertTrue(hasattr(Tx, "adyen_psp_reference"))
        self.assertTrue(hasattr(Tx, "authorize_tx_id"))

    def test_phase343(self):
        Provider = self.registry.get("payment.provider")
        self.assertTrue(hasattr(Provider, "mollie_api_key"))
        self.assertTrue(hasattr(Provider, "razorpay_key_id"))
        self.assertTrue(hasattr(Provider, "custom_instructions"))
        self.assertTrue(hasattr(Provider, "demo_always_succeed"))

        Tx = self.registry.get("payment.transaction")
        self.assertTrue(hasattr(Tx, "mollie_payment_id"))
        self.assertTrue(hasattr(Tx, "razorpay_payment_id"))

    def test_phase344(self):
        Config = self.registry.get("pos.config")
        self.assertTrue(hasattr(Config, "adyen_terminal_identifier"))
        self.assertTrue(hasattr(Config, "stripe_terminal_location"))

        Method = self.registry.get("pos.payment.method")
        self.assertTrue(hasattr(Method, "adyen_merchant_account"))

        PosOrder = self.registry.get("pos.order")
        self.assertTrue(hasattr(PosOrder, "restaurant_adyen_enabled"))

    def test_phase345(self):
        Cred = self.registry.get("google.calendar.credentials")
        self.assertTrue(hasattr(Cred, "token"))
        Event = self.registry.get("calendar.event")
        self.assertTrue(hasattr(Event, "google_id"))
        Users = self.registry.get("res.users")
        self.assertTrue(hasattr(Users, "google_calendar_token"))
        self.assertTrue(hasattr(Users, "google_calendar_sync"))

        Drive = self.registry.get("google.drive.config")
        self.assertTrue(hasattr(Drive, "google_drive_template_url"))
        Att = self.registry.get("ir.attachment")
        self.assertTrue(hasattr(Att, "google_drive_url"))

    def test_phase346(self):
        Cred = self.registry.get("microsoft.calendar.credentials")
        self.assertTrue(hasattr(Cred, "token"))
        Event = self.registry.get("calendar.event")
        self.assertTrue(hasattr(Event, "microsoft_id"))
        Users = self.registry.get("res.users")
        self.assertTrue(hasattr(Users, "microsoft_calendar_token"))
        self.assertTrue(hasattr(Users, "microsoft_calendar_sync"))
        self.assertTrue(hasattr(Users, "outlook_token"))

        Server = self.registry.get("fetchmail.server")
        self.assertTrue(hasattr(Server, "outlook_client_id"))
        self.assertTrue(hasattr(Server, "outlook_client_secret"))

    def test_phase347(self):
        Mix = self.registry.get("spreadsheet.mixin")
        self.assertTrue(hasattr(Mix, "spreadsheet_data"))

        Rev = self.registry.get("spreadsheet.revision")
        self.assertTrue(hasattr(Rev, "commands"))
        Sess = self.registry.get("spreadsheet.collaborative.session")
        self.assertTrue(hasattr(Sess, "last_seen"))

        Dash = self.registry.get("spreadsheet.dashboard")
        self.assertTrue(hasattr(Dash, "spreadsheet_data"))
        Group = self.registry.get("spreadsheet.dashboard.group")
        self.assertTrue(hasattr(Group, "sequence"))

        Mix = self.registry.get("spreadsheet.mixin")
        self.assertTrue(hasattr(Mix, "account_data_sources"))

    def test_phase348(self):
        Dash = self.registry.get("spreadsheet.dashboard")
        self.assertTrue(hasattr(Dash, "account_dashboard_enabled"))
        self.assertTrue(hasattr(Dash, "crm_dashboard_enabled"))

        Mix = self.registry.get("spreadsheet.mixin")
        self.assertTrue(hasattr(Mix, "crm_data_sources"))

    def test_phase349(self):
        Provider = self.registry.get("cloud.storage.provider")
        self.assertTrue(hasattr(Provider, "provider_type"))

        Att = self.registry.get("ir.attachment")
        self.assertTrue(hasattr(Att, "cloud_storage_url"))
        self.assertTrue(hasattr(Att, "cloud_provider_id"))

        Device = self.registry.get("iot.device")
        self.assertTrue(hasattr(Device, "identifier"))
        Box = self.registry.get("iot.box")
        self.assertTrue(hasattr(Box, "device_ids"))

    def test_phase350(self):
        Tpl = self.registry.get("account.chart.template")
        self.assertTrue(hasattr(Tpl, "code"))
        self.assertTrue(hasattr(Tpl, "country_id"))

    def test_phase351(self):
        Tpl = self.registry.get("account.chart.template")
        self.assertTrue(hasattr(Tpl, "us_chart_template"))
        self.assertTrue(hasattr(Tpl, "uk_chart_template"))

    def test_phase352(self):
        Tpl = self.registry.get("account.chart.template")
        self.assertTrue(hasattr(Tpl, "de_chart_template"))

    def test_phase353(self):
        Tpl = self.registry.get("account.chart.template")
        self.assertTrue(hasattr(Tpl, "fr_chart_template"))

    def test_server_wide_modules_phase342_353(self):
        expected = {
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
        }
        self.assertTrue(expected.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
