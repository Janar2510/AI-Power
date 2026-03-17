"""Tests for Phase 178: Mail Templates."""

import unittest

from core.db import init_schema
from core.db.init_data import load_default_data
from core.modules import load_module_graph
from core.orm import Environment, Registry
from core.orm.models import ModelBase
from core.sql_db import get_cursor, db_exists
from core.tools.config import parse_config


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestMailTemplatePhase178(unittest.TestCase):
    """Test mail.template model and send_mail."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def setUp(self):
        if not self._has_db:
            return
        self.registry = Registry(self.db)
        ModelBase._registry = self.registry
        load_module_graph()
        self.cr = get_cursor(self.db)
        init_schema(self.cr, self.registry)
        load_default_data(Environment(self.registry, cr=self.cr, uid=1))
        self.cr.connection.commit()
        self.env = Environment(self.registry, cr=self.cr, uid=1)
        self.registry.set_env(self.env)

    def tearDown(self):
        if hasattr(self, "cr") and self.cr:
            self.cr.close()

    def test_mail_template_model_exists(self):
        """mail.template model exists and has expected fields."""
        if not self._has_db:
            self.skipTest("DB not found")
        Template = self.env.get("mail.template")
        self.assertIsNotNone(Template)
        fields = Template.fields_get([])
        self.assertIn("name", fields)
        self.assertIn("model_id", fields)
        self.assertIn("subject", fields)
        self.assertIn("body_html", fields)
        self.assertIn("email_from", fields)
        self.assertIn("email_to", fields)

    def test_mail_template_render(self):
        """_render_template renders Jinja2 correctly."""
        if not self._has_db:
            self.skipTest("DB not found")
        Template = self.env.get("mail.template")
        t = Template.create({
            "name": "Test",
            "model_id": "crm.lead",
            "subject": "Re: {{ object.name }}",
            "body_html": "<p>Hello {{ object.name }}</p>",
        })
        rec_dict = {"name": "Lead ABC", "id": 1}
        subj = t._render_template(t.subject or "", rec_dict)
        body = t._render_template(t.body_html or "", rec_dict)
        self.assertEqual(subj, "Re: Lead ABC")
        self.assertIn("Hello Lead ABC", body)

    def test_mail_template_send_mail_creates_mail(self):
        """send_mail creates mail.mail for record with email."""
        if not self._has_db:
            self.skipTest("DB not found")
        Lead = self.env.get("crm.lead")
        Template = self.env.get("mail.template")
        lead = Lead.create({
            "name": "Test Lead",
            "email_from": "lead@test.com",
            "type": "lead",
        })
        t = Template.create({
            "name": "Lead Notification",
            "model_id": "crm.lead",
            "subject": "Re: {{ object.name }}",
            "body_html": "<p>Hi</p>",
            "email_to": "email_from",
            "auto_delete": False,
        })
        mail = t.send_mail(lead.id, auto_send=False)
        self.assertIsNotNone(mail)
        if mail:
            self.assertEqual(mail.email_to, "lead@test.com")
            self.assertEqual(mail.subject, "Re: Test Lead")
