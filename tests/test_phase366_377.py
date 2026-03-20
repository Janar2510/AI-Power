"""Phases 366-377: frontend implementation and l10n wave 4 checks."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase366377(unittest.TestCase):
    """Validate frontend upgrades and localization wave 4 deliverables."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase366_377"
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

    def test_frontend_widgets_are_implemented(self):
        root = Path(__file__).resolve().parent.parent
        widgets = root / "addons" / "web" / "static" / "src" / "widgets"
        for name in [
            "many2one_widget.js",
            "many2many_widget.js",
            "date_widget.js",
            "monetary_widget.js",
            "binary_widget.js",
            "html_widget.js",
        ]:
            text = (widgets / name).read_text(encoding="utf-8")
            self.assertIn("render(", text, name)
            self.assertNotIn("= true;", text, name)

    def test_frontend_components_are_not_string_stubs(self):
        root = Path(__file__).resolve().parent.parent
        components = root / "addons" / "web" / "static" / "src" / "components"
        for name in ["button.js", "card.js", "badge.js", "avatar.js", "modal.js", "toast.js"]:
            text = (components / name).read_text(encoding="utf-8")
            self.assertIn("createElement", text, name)
            self.assertNotIn("return '<", text, name)

    def test_frontend_layout_is_implemented(self):
        root = Path(__file__).resolve().parent.parent
        layout = root / "addons" / "web" / "static" / "src" / "layout"
        for name in ["navbar.js", "sidebar.js", "action_layout.js"]:
            text = (layout / name).read_text(encoding="utf-8")
            self.assertIn("render(", text, name)
            self.assertNotIn("= true;", text, name)

    def test_calendar_and_gantt_have_modes(self):
        root = Path(__file__).resolve().parent.parent
        views = root / "addons" / "web" / "static" / "src" / "views"
        calendar = (views / "calendar_renderer.js").read_text(encoding="utf-8")
        gantt = (views / "gantt_renderer.js").read_text(encoding="utf-8")
        self.assertIn("month", calendar)
        self.assertIn("week", calendar)
        self.assertIn("day", calendar)
        self.assertIn("scale", gantt)
        self.assertIn("week", gantt)
        self.assertIn("month", gantt)

    def test_phase374_to_377_l10n_fields(self):
        tpl = self.registry.get("account.chart.template")
        for field in [
            "ar_chart_template",
            "cl_chart_template",
            "co_chart_template",
            "pe_chart_template",
            "ec_chart_template",
            "ae_chart_template",
            "sa_chart_template",
            "eg_chart_template",
            "za_chart_template",
            "ke_chart_template",
            "cn_chart_template",
            "kr_chart_template",
            "tw_chart_template",
            "sg_full_chart_template",
            "th_chart_template",
            "cz_chart_template",
            "hu_chart_template",
            "ro_chart_template",
            "bg_chart_template",
            "pt_chart_template",
        ]:
            self.assertTrue(hasattr(tpl, field), field)

    def test_server_wide_modules_phase374_377(self):
        expected = {
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
        }
        self.assertTrue(expected.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
