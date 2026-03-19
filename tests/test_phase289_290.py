"""Phase 289-290: event and website bridge modules."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase289290(unittest.TestCase):
    """Parity checks for phases 289-290."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase289_290"
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

    def test_phase289_event_product_sms_crm(self):
        EventTicket = self.registry.get("event.event.ticket")
        self.assertIsNotNone(EventTicket)

        Registration = self.registry.get("event.registration")
        self.assertIsNotNone(Registration)
        self.assertTrue(hasattr(Registration, "sms_ids"))
        self.assertTrue(hasattr(Registration, "sms_count"))
        self.assertTrue(hasattr(Registration, "lead_id"))

        Sms = self.registry.get("sms.sms")
        self.assertIsNotNone(Sms)
        self.assertTrue(hasattr(Sms, "registration_id"))

        Lead = self.registry.get("crm.lead")
        self.assertIsNotNone(Lead)
        self.assertTrue(hasattr(Lead, "event_registration_count"))

    def test_phase290_event_sale_website_crm_payment(self):
        SaleOrderLine = self.registry.get("sale.order.line")
        self.assertIsNotNone(SaleOrderLine)
        self.assertTrue(hasattr(SaleOrderLine, "event_id"))
        self.assertTrue(hasattr(SaleOrderLine, "event_ticket_id"))

        Event = self.registry.get("event.event")
        self.assertIsNotNone(Event)
        self.assertTrue(hasattr(Event, "sale_order_line_ids"))
        self.assertTrue(hasattr(Event, "sale_count"))

        Lead = self.registry.get("crm.lead")
        self.assertIsNotNone(Lead)
        self.assertTrue(hasattr(Lead, "website_id"))
        self.assertTrue(hasattr(Lead, "website_form_url"))

        PaymentProvider = self.registry.get("payment.provider")
        self.assertIsNotNone(PaymentProvider)
        self.assertTrue(hasattr(PaymentProvider, "website_id"))
        self.assertTrue(hasattr(PaymentProvider, "is_published"))

    def test_server_wide_modules_include_phase_289_290(self):
        expected_modules = {
            "event_product",
            "event_sms",
            "event_crm",
            "event_sale",
            "website_crm",
            "website_payment",
        }
        self.assertTrue(expected_modules.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
