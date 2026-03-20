"""Phases 354-365: localization/theme wave and UI/UX track checks."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase354365(unittest.TestCase):
    """Validate wave 3 backend and UI/UX track deliverables."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase354_365"
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

    def test_phase354_to_356_l10n_fields(self):
        tpl = self.registry.get("account.chart.template")
        for field in [
            "es_chart_template",
            "it_chart_template",
            "nl_chart_template",
            "be_chart_template",
            "ch_chart_template",
            "at_chart_template",
            "in_chart_template",
            "br_chart_template",
            "mx_chart_template",
            "au_chart_template",
            "ca_chart_template",
            "pl_chart_template",
            "se_chart_template",
            "no_chart_template",
            "dk_chart_template",
        ]:
            self.assertTrue(hasattr(tpl, field), field)

    def test_phase357_theme_default(self):
        theme = self.registry.get("website.theme")
        self.assertTrue(hasattr(theme, "name"))
        self.assertTrue(hasattr(theme, "primary_color"))
        self.assertTrue(hasattr(theme, "scss_variables"))

        website = self.registry.get("website")
        self.assertTrue(hasattr(website, "theme_id"))

    def test_phase358_359_theme_starters(self):
        theme = self.registry.get("website.theme")
        self.assertTrue(hasattr(theme, "starter_1_enabled"))
        self.assertTrue(hasattr(theme, "starter_2_enabled"))
        self.assertTrue(hasattr(theme, "starter_3_enabled"))
        self.assertTrue(hasattr(theme, "starter_4_enabled"))

    def test_phase360_design_system_artifacts(self):
        root = Path(__file__).resolve().parent.parent
        master = root / "design-system" / "MASTER.md"
        spec = root / "docs" / "design-system.md"
        self.assertTrue(master.exists())
        self.assertTrue(spec.exists())
        self.assertIn("UI UX Pro Max", master.read_text(encoding="utf-8"))

    def test_phase361_component_library(self):
        root = Path(__file__).resolve().parent.parent
        components = root / "addons" / "web" / "static" / "src" / "components"
        for name in ["button.js", "card.js", "badge.js", "avatar.js", "modal.js", "toast.js"]:
            self.assertTrue((components / name).exists(), name)

    def test_phase362_layout_artifacts(self):
        root = Path(__file__).resolve().parent.parent
        layout = root / "addons" / "web" / "static" / "src" / "layout"
        self.assertTrue((layout / "navbar.js").exists())
        self.assertTrue((layout / "sidebar.js").exists())
        self.assertTrue((layout / "action_layout.js").exists())

    def test_phase363_renderer_contract(self):
        root = Path(__file__).resolve().parent.parent
        views = root / "addons" / "web" / "static" / "src" / "views"
        self.assertTrue((views / "calendar_renderer.js").exists())
        self.assertTrue((views / "gantt_renderer.js").exists())

    def test_phase364_widget_library(self):
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
            self.assertTrue((widgets / name).exists(), name)

    def test_phase365_dashboard_portal_styles(self):
        root = Path(__file__).resolve().parent.parent
        webclient_css = root / "addons" / "web" / "static" / "src" / "scss" / "webclient.css"
        text = webclient_css.read_text(encoding="utf-8")
        self.assertIn("--color-surface-1", text)
        self.assertIn(".o-kpi-card", text)
        self.assertIn(".o-portal-shell", text)

    def test_agents_uiux_docs(self):
        root = Path(__file__).resolve().parent.parent
        ui_designer = root / ".cursor" / "rules" / "agents" / "ui-designer.mdc"
        frontend_builder = root / ".cursor" / "rules" / "agents" / "frontend-builder.mdc"
        quick_start = root / "docs" / "QUICK_START_AGENTS.md"
        self.assertTrue(ui_designer.exists())
        self.assertTrue(frontend_builder.exists())
        self.assertTrue(quick_start.exists())
        self.assertIn("ui-ux-pro-max-skill", quick_start.read_text(encoding="utf-8"))

    def test_server_wide_modules_phase354_359(self):
        expected = {
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
        }
        self.assertTrue(expected.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
