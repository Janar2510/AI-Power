"""Phases 296–307: plan-aligned model/field and server-wide module checks."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase296307(unittest.TestCase):
    """Field existence checks per phase plan (296–307)."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase296_307"
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

    def test_phase296(self):
        MO = self.registry.get("mrp.production")
        self.assertTrue(hasattr(MO, "landed_cost_ids"))
        self.assertTrue(hasattr(MO, "lot_producing_id"))
        self.assertTrue(hasattr(MO, "_sync_lot_producing_expiry"))

        Lot = self.registry.get("stock.lot")
        self.assertTrue(hasattr(Lot, "product_expiry_reminded"))

        Repair = self.registry.get("repair.order")
        self.assertTrue(hasattr(Repair, "bom_id"))

        Bom = self.registry.get("mrp.bom")
        self.assertTrue(hasattr(Bom, "repair_count"))

        Cost = self.registry.get("stock.landed.cost")
        self.assertTrue(hasattr(Cost, "mrp_production_ids"))

    def test_phase297(self):
        MO = self.registry.get("mrp.production")
        self.assertTrue(hasattr(MO, "subcontracting_account_move_count"))

        POL = self.registry.get("purchase.order.line")
        self.assertTrue(hasattr(POL, "is_subcontract_line"))

        Repair = self.registry.get("repair.order")
        self.assertTrue(hasattr(Repair, "subcontract_move_id"))

        Cost = self.registry.get("stock.landed.cost")
        self.assertTrue(hasattr(Cost, "subcontracting_production_ids"))

    def test_phase298(self):
        Proj = self.registry.get("project.project")
        self.assertTrue(hasattr(Proj, "production_count"))
        MO = self.registry.get("mrp.production")
        self.assertTrue(hasattr(MO, "project_id"))

        Task = self.registry.get("project.task")
        self.assertTrue(hasattr(Task, "skill_ids"))

        self.assertTrue(hasattr(Proj, "stock_valuation_count"))
        self.assertTrue(hasattr(Proj, "purchase_picking_count"))

    def test_phase299(self):
        Proj = self.registry.get("project.project")
        self.assertTrue(hasattr(Proj, "landed_cost_count"))
        self.assertTrue(hasattr(Proj, "production_cost"))

        SOL = self.registry.get("sale.order.line")
        self.assertTrue(hasattr(SOL, "project_production_ids"))

        SO = self.registry.get("sale.order")
        self.assertTrue(hasattr(SO, "project_stock_valuation_count"))

    def test_phase300(self):
        Leave = self.registry.get("hr.leave")
        self.assertTrue(hasattr(Leave, "work_entry_type_id"))
        self.assertTrue(hasattr(Leave, "attendance_ids"))
        self.assertTrue(hasattr(Leave, "work_location_id"))

        WET = self.registry.get("hr.work.entry.type")
        self.assertTrue(hasattr(WET, "leave_type_ids"))

        LT = self.registry.get("hr.leave.type")
        self.assertTrue(hasattr(LT, "work_entry_type_id"))

        Att = self.registry.get("hr.attendance")
        self.assertTrue(hasattr(Att, "leave_id"))

        Emp = self.registry.get("hr.employee")
        self.assertTrue(hasattr(Emp, "attendance_leave_count"))

        Ev = self.registry.get("calendar.event")
        self.assertTrue(hasattr(Ev, "work_location_id"))

    def test_phase301(self):
        Emp = self.registry.get("hr.employee")
        self.assertTrue(hasattr(Emp, "total_overtime"))
        self.assertTrue(hasattr(Emp, "hr_presence_state"))
        self.assertTrue(hasattr(Emp, "hourly_cost"))

        Line = self.registry.get("analytic.line")
        self.assertTrue(hasattr(Line, "timesheet_cost"))

        App = self.registry.get("hr.applicant")
        self.assertTrue(hasattr(App, "sms_ids"))
        self.assertTrue(hasattr(App, "sms_count"))

        Sms = self.registry.get("sms.sms")
        self.assertTrue(hasattr(Sms, "applicant_id"))

    def test_phase302(self):
        SO = self.registry.get("sale.order")
        self.assertTrue(hasattr(SO, "sale_purchase_project_auto_count"))
        self.assertTrue(hasattr(SO, "sale_project_stock_move_count"))

        SOL = self.registry.get("sale.order.line")
        self.assertTrue(hasattr(SOL, "sale_mrp_margin_component_cost"))
        self.assertTrue(hasattr(SOL, "sale_stock_expiry_risk"))

    def test_phase303(self):
        Ev = self.registry.get("calendar.event")
        self.assertTrue(hasattr(Ev, "sms_reminder_ids"))
        Sms = self.registry.get("sms.sms")
        self.assertTrue(hasattr(Sms, "calendar_event_id"))

        Res = self.registry.get("resource.resource")
        self.assertTrue(hasattr(Res, "resource_mail_alias_id"))

        Sur = self.registry.get("survey.survey")
        self.assertTrue(hasattr(Sur, "crm_tag_ids"))

        Evt = self.registry.get("event.event")
        self.assertTrue(hasattr(Evt, "event_crm_sale_opportunity_id"))

        Users = self.registry.get("res.users")
        self.assertTrue(hasattr(Users, "mail_bot_partner_ref"))

    def test_phase304(self):
        Users = self.registry.get("res.users")
        self.assertTrue(hasattr(Users, "portal_password_policy_level"))
        self.assertTrue(hasattr(Users, "totp_mail_enabled"))
        self.assertTrue(hasattr(Users, "totp_portal_enabled"))

        Partner = self.registry.get("res.partner")
        self.assertTrue(hasattr(Partner, "signup_password_strength"))

    def test_phase305(self):
        Pick = self.registry.get("stock.picking")
        self.assertTrue(hasattr(Pick, "maintenance_request_id"))
        self.assertTrue(hasattr(Pick, "batch_id"))
        self.assertTrue(hasattr(Pick, "is_dropship"))

        Batch = self.registry.get("stock.picking.batch")
        self.assertIsNotNone(Batch)
        self.assertTrue(hasattr(Batch, "picking_ids"))

        PO = self.registry.get("purchase.order")
        self.assertTrue(hasattr(PO, "repair_order_ids"))

        Repair = self.registry.get("repair.order")
        self.assertTrue(hasattr(Repair, "purchase_order_id"))

    def test_phase306(self):
        View = self.registry.get("ir.ui.view")
        self.assertTrue(hasattr(View, "web_hierarchy_parent_field"))

        Comp = self.registry.get("res.company")
        self.assertTrue(hasattr(Comp, "website_mail_contact_email"))
        self.assertTrue(hasattr(Comp, "website_sms_enabled"))
        self.assertTrue(hasattr(Comp, "website_links_track_outgoing"))

    def test_phase307(self):
        Proj = self.registry.get("project.project")
        self.assertTrue(hasattr(Proj, "website_project_slug"))

        Task = self.registry.get("project.task")
        self.assertTrue(hasattr(Task, "website_timesheet_visible"))

        Reg = self.registry.get("event.registration")
        self.assertTrue(hasattr(Reg, "skill_ids"))

        Sur = self.registry.get("survey.survey")
        self.assertTrue(hasattr(Sur, "skill_ids"))

        Emp = self.registry.get("hr.employee")
        self.assertTrue(hasattr(Emp, "mail_bot_hr_channel"))
        self.assertTrue(hasattr(Emp, "hr_org_chart_child_count"))

    def test_server_wide_modules_phase296_307(self):
        expected = {
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
        }
        self.assertTrue(expected.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
