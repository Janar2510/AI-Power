"""Phases 330-341: plan-aligned model/field and server-wide module checks."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase330341(unittest.TestCase):
    """Field existence checks per phase plan (330-341)."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase330_341"
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

    def test_phase330(self):
        Mailing = self.registry.get("mailing.mailing")
        self.assertTrue(hasattr(Mailing, "subject"))
        self.assertTrue(hasattr(Mailing, "state"))
        Contact = self.registry.get("mailing.contact")
        self.assertTrue(hasattr(Contact, "email"))
        Trace = self.registry.get("mailing.trace")
        self.assertTrue(hasattr(Trace, "mailing_id"))

        Lead = self.registry.get("crm.lead")
        self.assertTrue(hasattr(Lead, "mass_mailing_id"))
        self.assertTrue(hasattr(Lead, "mailing_trace_ids"))

        Event = self.registry.get("event.event")
        self.assertTrue(hasattr(Event, "mass_mailing_ids"))

        SO = self.registry.get("sale.order")
        self.assertTrue(hasattr(SO, "mass_mailing_source_id"))

    def test_phase331(self):
        Mailing = self.registry.get("mailing.mailing")
        self.assertTrue(hasattr(Mailing, "sms_body"))
        self.assertTrue(hasattr(Mailing, "sms_has_insufficient_credit"))
        self.assertTrue(hasattr(Mailing, "theme_id"))

        Theme = self.registry.get("mailing.theme")
        self.assertTrue(hasattr(Theme, "template_html"))

    def test_phase332(self):
        Channel = self.registry.get("im_livechat.channel")
        self.assertTrue(hasattr(Channel, "name"))
        self.assertTrue(hasattr(Channel, "user_ids"))
        Rule = self.registry.get("im_livechat.channel.rule")
        self.assertTrue(hasattr(Rule, "channel_id"))
        self.assertTrue(hasattr(Rule, "regex_url"))

        MailChannel = self.registry.get("mail.channel")
        self.assertTrue(hasattr(MailChannel, "livechat_channel_id"))
        self.assertTrue(hasattr(MailChannel, "livechat_operator_id"))

        Lead = self.registry.get("crm.lead")
        self.assertTrue(hasattr(Lead, "livechat_channel_id"))

    def test_phase333(self):
        Employee = self.registry.get("hr.employee")
        self.assertTrue(hasattr(Employee, "livechat_channel_id"))

        Website = self.registry.get("website")
        self.assertTrue(hasattr(Website, "livechat_channel_id"))
        self.assertTrue(hasattr(Website, "livechat_enabled"))

    def test_phase334(self):
        Blog = self.registry.get("blog.blog")
        self.assertTrue(hasattr(Blog, "subtitle"))
        Post = self.registry.get("blog.post")
        self.assertTrue(hasattr(Post, "blog_id"))
        self.assertTrue(hasattr(Post, "website_published"))
        Tag = self.registry.get("blog.tag")
        self.assertTrue(hasattr(Tag, "category_id"))
        Category = self.registry.get("blog.tag.category")
        self.assertTrue(hasattr(Category, "name"))

    def test_phase335(self):
        Forum = self.registry.get("forum.forum")
        self.assertTrue(hasattr(Forum, "karma_ask"))
        Post = self.registry.get("forum.post")
        self.assertTrue(hasattr(Post, "forum_id"))
        self.assertTrue(hasattr(Post, "vote_count"))
        Tag = self.registry.get("forum.tag")
        self.assertTrue(hasattr(Tag, "posts_count"))
        Vote = self.registry.get("forum.post.vote")
        self.assertTrue(hasattr(Vote, "post_id"))

    def test_phase336(self):
        Channel = self.registry.get("slide.channel")
        self.assertTrue(hasattr(Channel, "enroll"))
        Slide = self.registry.get("slide.slide")
        self.assertTrue(hasattr(Slide, "slide_type"))
        Partner = self.registry.get("slide.channel.partner")
        self.assertTrue(hasattr(Partner, "completion"))

        Employee = self.registry.get("hr.employee")
        self.assertTrue(hasattr(Employee, "slide_channel_ids"))

    def test_phase337(self):
        Config = self.registry.get("pos.config")
        self.assertTrue(hasattr(Config, "discount_product_id"))
        self.assertTrue(hasattr(Config, "discount_pc"))

        Line = self.registry.get("pos.order.line")
        self.assertTrue(hasattr(Line, "reward_id"))
        self.assertTrue(hasattr(Line, "sale_loyalty_applied"))

        Order = self.registry.get("pos.order")
        self.assertTrue(hasattr(Order, "sale_order_id"))

    def test_phase338(self):
        Order = self.registry.get("pos.order")
        self.assertTrue(hasattr(Order, "sale_margin_amount"))

        Session = self.registry.get("pos.session")
        self.assertTrue(hasattr(Session, "employee_id"))

        Floor = self.registry.get("restaurant.floor")
        self.assertTrue(hasattr(Floor, "pos_config_id"))
        Table = self.registry.get("restaurant.table")
        self.assertTrue(hasattr(Table, "floor_id"))

        Session = self.registry.get("pos.session")
        self.assertTrue(hasattr(Session, "restaurant_employee_assigned"))

    def test_phase339(self):
        Order = self.registry.get("pos.order")
        self.assertTrue(hasattr(Order, "restaurant_loyalty_applied"))
        self.assertTrue(hasattr(Order, "event_id"))

        PT = self.registry.get("product.template")
        self.assertTrue(hasattr(PT, "pos_mrp_available"))

        Line = self.registry.get("pos.order.line")
        self.assertTrue(hasattr(Line, "event_ticket_id"))

    def test_phase340(self):
        Order = self.registry.get("pos.order")
        self.assertTrue(hasattr(Order, "sms_receipt_sent"))
        self.assertTrue(hasattr(Order, "online_payment_transaction_id"))

        Config = self.registry.get("pos.config")
        self.assertTrue(hasattr(Config, "self_order_enabled"))
        self.assertTrue(hasattr(Config, "self_order_url"))

    def test_phase341(self):
        Line = self.registry.get("pos.order.line")
        self.assertTrue(hasattr(Line, "tax_python_computed"))

    def test_server_wide_modules_phase330_341(self):
        expected = {
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
        }
        self.assertTrue(expected.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
