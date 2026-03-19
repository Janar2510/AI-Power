"""Phases 308-319: plan-aligned model/field and server-wide module checks."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase308319(unittest.TestCase):
    """Field existence checks per phase plan (308-319)."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase308_319"
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

    def test_phase308(self):
        N = self.registry.get("barcode.nomenclature")
        self.assertTrue(hasattr(N, "rule_ids"))
        self.assertTrue(hasattr(N, "is_gs1_nomenclature"))

        R = self.registry.get("barcode.rule")
        self.assertTrue(hasattr(R, "pattern"))

        Bank = self.registry.get("res.partner.bank")
        self.assertTrue(hasattr(Bank, "sanitized_acc_number"))
        self.assertTrue(hasattr(Bank, "validate_iban"))

        Partner = self.registry.get("res.partner")
        self.assertTrue(hasattr(Partner, "check_vat"))

    def test_phase309(self):
        Board = self.registry.get("board.board")
        self.assertTrue(hasattr(Board, "view_id"))

        Http = self.registry.get("ir.http")
        self.assertTrue(hasattr(Http, "_slug"))
        self.assertTrue(hasattr(Http, "_unslug"))

        View = self.registry.get("ir.ui.view")
        self.assertTrue(hasattr(View, "html_editor_enabled"))
        self.assertTrue(hasattr(View, "html_builder_enabled"))

    def test_phase310(self):
        PT = self.registry.get("product.template")
        self.assertTrue(hasattr(PT, "email_template_id"))
        self.assertTrue(hasattr(PT, "_get_matrix"))

        SOL = self.registry.get("sale.order.line")
        self.assertTrue(hasattr(SOL, "sale_product_matrix_json"))

        POL = self.registry.get("purchase.order.line")
        self.assertTrue(hasattr(POL, "purchase_product_matrix_json"))

    def test_phase311(self):
        SO = self.registry.get("sale.order")
        self.assertTrue(hasattr(SO, "pdf_quote_layout"))

        Batch = self.registry.get("stock.picking.batch")
        self.assertTrue(hasattr(Batch, "carrier_id"))

        Pick = self.registry.get("stock.picking")
        self.assertTrue(hasattr(Pick, "vehicle_id"))

        MO = self.registry.get("mrp.production")
        self.assertTrue(hasattr(MO, "subcontract_dropship_enabled"))

    def test_phase312(self):
        Ldap = self.registry.get("res.company.ldap")
        self.assertTrue(hasattr(Ldap, "ldap_server"))

        Users = self.registry.get("res.users")
        self.assertTrue(hasattr(Users, "passkey_credential_ids"))
        self.assertTrue(hasattr(Users, "session_timeout"))

        Cred = self.registry.get("auth.passkey.credential")
        self.assertTrue(hasattr(Cred, "credential_id"))

    def test_phase313(self):
        Group = self.registry.get("mail.group")
        self.assertTrue(hasattr(Group, "alias_id"))

        GroupMember = self.registry.get("mail.group.member")
        self.assertTrue(hasattr(GroupMember, "group_id"))

        Partner = self.registry.get("res.partner")
        self.assertTrue(hasattr(Partner, "mail_plugin_partner_ref"))

        Move = self.registry.get("account.move")
        self.assertTrue(hasattr(Move, "snailmail_letter_ids"))

    def test_phase314(self):
        Booth = self.registry.get("event.booth")
        self.assertTrue(hasattr(Booth, "booth_category_id"))

        BoothCategory = self.registry.get("event.booth.category")
        self.assertTrue(hasattr(BoothCategory, "price"))

        SOL = self.registry.get("sale.order.line")
        self.assertTrue(hasattr(SOL, "event_booth_id"))

        Event = self.registry.get("event.event")
        self.assertTrue(hasattr(Event, "website_event_url"))

    def test_phase315(self):
        Reg = self.registry.get("event.registration")
        self.assertTrue(hasattr(Reg, "website_event_crm_lead_id"))

        Booth = self.registry.get("event.booth")
        self.assertTrue(hasattr(Booth, "website_event_booth_page_url"))
        self.assertTrue(hasattr(Booth, "website_event_booth_sale_order_line_id"))

        Proj = self.registry.get("project.project")
        self.assertTrue(hasattr(Proj, "mrp_landed_cost_count"))

    def test_phase316(self):
        PT = self.registry.get("product.template")
        self.assertTrue(hasattr(PT, "website_stock_display"))
        self.assertTrue(hasattr(PT, "comparison_attribute_ids"))
        self.assertTrue(hasattr(PT, "comparison_wishlist_sync_enabled"))

        Wishlist = self.registry.get("product.wishlist")
        self.assertTrue(hasattr(Wishlist, "product_id"))

    def test_phase317(self):
        Partner = self.registry.get("res.partner")
        self.assertTrue(hasattr(Partner, "website_customer_published"))
        self.assertTrue(hasattr(Partner, "website_partner_published"))

        Users = self.registry.get("res.users")
        self.assertTrue(hasattr(Users, "website_profile_bio"))

        Job = self.registry.get("hr.job")
        self.assertTrue(hasattr(Job, "website_published"))

    def test_phase318(self):
        Mining = self.registry.get("crm.iap.lead.mining.request")
        self.assertTrue(hasattr(Mining, "lead_id"))

        Lead = self.registry.get("crm.lead")
        self.assertTrue(hasattr(Lead, "iap_enrich_done"))
        self.assertTrue(hasattr(Lead, "mail_plugin_source"))

        Card = self.registry.get("marketing.card")
        self.assertTrue(hasattr(Card, "share_url"))

    def test_phase319(self):
        Sms = self.registry.get("sms.sms")
        self.assertTrue(hasattr(Sms, "twilio_sid"))

        Att = self.registry.get("ir.attachment")
        self.assertTrue(hasattr(Att, "unsplash_image_url"))

        Req = self.registry.get("base.module.install.request")
        self.assertTrue(hasattr(Req, "module_name"))

        Partner = self.registry.get("res.partner")
        self.assertTrue(hasattr(Partner, "grade_id"))
        Grade = self.registry.get("res.partner.grade")
        self.assertTrue(hasattr(Grade, "sequence"))

    def test_server_wide_modules_phase308_319(self):
        expected = {
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
        }
        self.assertTrue(expected.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
