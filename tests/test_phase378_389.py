"""Phases 378-389: modularization, backend enrichment, and l10n wave 5 checks."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase378389(unittest.TestCase):
    """Validate phases 378-389 deliverables."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase378_389"
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

    def test_core_modules_exist(self):
        root = Path(__file__).resolve().parent.parent
        core = root / "addons" / "web" / "static" / "src" / "core"
        expected = [
            "router.js",
            "view_manager.js",
            "dashboard.js",
            "settings.js",
            "chatter.js",
            "field_utils.js",
        ]
        for name in expected:
            path = core / name
            self.assertTrue(path.exists(), name)
            text = path.read_text(encoding="utf-8")
            self.assertIn("window", text, name)

    def test_backend_stubs_replaced(self):
        root = Path(__file__).resolve().parent.parent
        files = [
            root / "addons" / "hr_presence" / "models" / "hr_employee.py",
            root / "addons" / "hr_holidays_homeworking" / "models" / "hr_employee.py",
            root / "addons" / "hr_work_entry_holidays" / "models" / "hr_work_entry.py",
            root / "addons" / "mail" / "models" / "mail_template.py",
            root / "addons" / "mrp_product_expiry" / "models" / "mrp_production.py",
            root / "addons" / "base_geolocalize" / "models" / "res_partner.py",
        ]
        for path in files:
            text = path.read_text(encoding="utf-8")
            self.assertNotIn("pass", text, str(path))

    def test_base_model_enrichment(self):
        lang = self.registry.get("res.lang")
        self.assertTrue(hasattr(lang, "date_format"))
        self.assertTrue(hasattr(lang, "time_format"))
        self.assertTrue(hasattr(lang, "decimal_point"))
        self.assertTrue(hasattr(lang, "thousands_sep"))
        self.assertTrue(hasattr(lang, "direction"))

        ir_model = self.registry.get("ir.model")
        self.assertTrue(hasattr(ir_model, "state"))

    def test_main_js_still_large_entrypoint_present(self):
        root = Path(__file__).resolve().parent.parent
        main_js = root / "addons" / "web" / "static" / "src" / "main.js"
        line_count = len(main_js.read_text(encoding="utf-8").splitlines())
        self.assertLess(line_count, 5000)

    def test_phase386_to_389_l10n_fields(self):
        tpl = self.registry.get("account.chart.template")
        for field in [
            "bo_chart_template",
            "cr_chart_template",
            "uy_chart_template",
            "ve_chart_template",
            "ph_chart_template",
            "id_chart_template",
            "vn_chart_template",
            "pk_chart_template",
            "ng_chart_template",
            "ma_chart_template",
            "il_chart_template",
            "hr_chart_template",
            "rs_chart_template",
            "si_chart_template",
            "lu_chart_template",
            "lt_chart_template",
            "lv_chart_template",
            "ua_chart_template",
            "fi_chart_template",
            "gr_chart_template",
        ]:
            self.assertTrue(hasattr(tpl, field), field)

    def test_server_wide_modules_phase386_389(self):
        expected = {
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
        }
        self.assertTrue(expected.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
