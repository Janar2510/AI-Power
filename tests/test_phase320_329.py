"""Phases 320-329: plan-aligned model/field and server-wide module checks."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase320329(unittest.TestCase):
    """Field existence checks per phase plan (320-329)."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase320_329"
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

    def test_phase320(self):
        EdiDoc = self.registry.get("account.edi.document")
        self.assertTrue(hasattr(EdiDoc, "move_id"))
        self.assertTrue(hasattr(EdiDoc, "edi_format_id"))

        EdiProxy = self.registry.get("account.edi.proxy_client")
        self.assertTrue(hasattr(EdiProxy, "proxy_type"))

        EdiFmt = self.registry.get("account.edi.format")
        self.assertTrue(hasattr(EdiFmt, "code"))
        self.assertTrue(hasattr(EdiFmt, "is_ubl_cii"))

        Partner = self.registry.get("res.partner")
        self.assertTrue(hasattr(Partner, "gln"))

    def test_phase321(self):
        Peppol = self.registry.get("account.peppol.registration")
        self.assertTrue(hasattr(Peppol, "participant_id"))

        Move = self.registry.get("account.move")
        self.assertTrue(hasattr(Move, "peppol_message_uuid"))
        self.assertTrue(hasattr(Move, "emv_qr_code_data"))

        Bank = self.registry.get("res.partner.bank")
        self.assertTrue(hasattr(Bank, "sepa_qr_code_data"))

    def test_phase322(self):
        Tax = self.registry.get("account.tax")
        self.assertTrue(hasattr(Tax, "python_compute"))
        self.assertTrue(hasattr(Tax, "python_applicable"))

        Wiz = self.registry.get("account.tax.tags.wizard")
        self.assertTrue(hasattr(Wiz, "tag_ids"))
        self.assertTrue(hasattr(Wiz, "target_tag_ids"))

        SO = self.registry.get("sale.order")
        self.assertTrue(hasattr(SO, "edi_ubl_generated"))

        PO = self.registry.get("purchase.order")
        self.assertTrue(hasattr(PO, "edi_ubl_received"))

    def test_phase323(self):
        Track = self.registry.get("event.track")
        self.assertTrue(hasattr(Track, "event_id"))
        self.assertTrue(hasattr(Track, "is_live"))
        self.assertTrue(hasattr(Track, "youtube_video_url"))

        Quiz = self.registry.get("event.quiz")
        self.assertTrue(hasattr(Quiz, "track_id"))
        Q = self.registry.get("event.quiz.question")
        self.assertTrue(hasattr(Q, "quiz_id"))
        A = self.registry.get("event.quiz.answer")
        self.assertTrue(hasattr(A, "question_id"))

        Live = self.registry.get("event.track.live.quiz")
        self.assertTrue(hasattr(Live, "track_id"))

    def test_phase324(self):
        Event = self.registry.get("event.event")
        self.assertTrue(hasattr(Event, "exhibitor_ids"))

        Exhibitor = self.registry.get("event.exhibitor")
        self.assertTrue(hasattr(Exhibitor, "event_id"))
        self.assertTrue(hasattr(Exhibitor, "partner_id"))

        Booth = self.registry.get("event.booth")
        self.assertTrue(hasattr(Booth, "exhibitor_id"))
        self.assertTrue(hasattr(Booth, "booth_sale_exhibitor_enabled"))

    def test_phase325(self):
        SO = self.registry.get("sale.order")
        self.assertTrue(hasattr(SO, "website_loyalty_reward_ids"))

        PT = self.registry.get("product.template")
        self.assertTrue(hasattr(PT, "website_bom_available"))

        Settings = self.registry.get("res.config.settings")
        self.assertTrue(hasattr(Settings, "website_sale_autocomplete_enabled"))

        Wishlist = self.registry.get("product.wishlist")
        self.assertTrue(hasattr(Wishlist, "qty_available"))

    def test_phase326(self):
        Carrier = self.registry.get("delivery.carrier")
        self.assertTrue(hasattr(Carrier, "is_collect"))

        Wishlist = self.registry.get("product.wishlist")
        self.assertTrue(hasattr(Wishlist, "collect_available"))

        Lead = self.registry.get("crm.lead")
        self.assertTrue(hasattr(Lead, "website_sms_enabled"))

        Settings = self.registry.get("res.config.settings")
        self.assertTrue(hasattr(Settings, "cf_turnstile_site_key"))
        self.assertTrue(hasattr(Settings, "cf_turnstile_secret_key"))

    def test_phase327(self):
        Lead = self.registry.get("crm.lead")
        self.assertTrue(hasattr(Lead, "reveal_ip"))
        self.assertTrue(hasattr(Lead, "reveal_rule_id"))
        self.assertTrue(hasattr(Lead, "partner_assigned_id"))

        Group = self.registry.get("mail.group")
        self.assertTrue(hasattr(Group, "website_published"))

        Mining = self.registry.get("crm.iap.lead.mining.request")
        self.assertTrue(hasattr(Mining, "is_automated"))

    def test_phase328(self):
        MR = self.registry.get("delivery.carrier.mondialrelay")
        self.assertTrue(hasattr(MR, "api_key"))

        SO = self.registry.get("sale.order")
        self.assertTrue(hasattr(SO, "mondialrelay_point_id"))

        Gelato = self.registry.get("sale.gelato.config")
        self.assertTrue(hasattr(Gelato, "store_id"))

        SOL = self.registry.get("sale.order.line")
        self.assertTrue(hasattr(SOL, "gelato_fulfilled"))
        self.assertTrue(hasattr(SOL, "website_sale_gelato_enabled"))

    def test_phase329(self):
        App = self.registry.get("hr.applicant")
        self.assertTrue(hasattr(App, "survey_id"))
        Job = self.registry.get("hr.job")
        self.assertTrue(hasattr(Job, "interview_survey_id"))

        Task = self.registry.get("project.task")
        self.assertTrue(hasattr(Task, "mail_plugin_linked"))

        Att = self.registry.get("ir.attachment")
        self.assertTrue(hasattr(Att, "index_content"))

        Cert = self.registry.get("certificate.certificate")
        self.assertTrue(hasattr(Cert, "is_valid"))

    def test_server_wide_modules_phase320_329(self):
        expected = {
            "account_edi",
            "account_edi_proxy_client",
            "account_edi_ubl_cii",
            "account_add_gln",
            "account_peppol",
            "account_peppol_advanced_fields",
            "account_qr_code_emv",
            "account_qr_code_sepa",
            "account_tax_python",
            "account_update_tax_tags",
            "sale_edi_ubl",
            "purchase_edi_ubl_bis3",
            "website_event_track",
            "website_event_track_quiz",
            "website_event_track_live",
            "website_event_track_live_quiz",
            "website_event_exhibitor",
            "website_event_booth_exhibitor",
            "website_event_booth_sale_exhibitor",
            "website_sale_loyalty",
            "website_sale_mrp",
            "website_sale_autocomplete",
            "website_sale_stock_wishlist",
            "website_sale_collect",
            "website_sale_collect_wishlist",
            "website_crm_sms",
            "website_cf_turnstile",
            "website_crm_iap_reveal",
            "website_crm_partner_assign",
            "website_mail_group",
            "crm_iap_mine",
            "delivery_mondialrelay",
            "website_sale_mondialrelay",
            "sale_gelato",
            "sale_gelato_stock",
            "website_sale_gelato",
            "hr_recruitment_survey",
            "project_mail_plugin",
            "attachment_indexation",
            "certificate",
        }
        self.assertTrue(expected.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
