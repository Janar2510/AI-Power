"""Phase 287-288: HR bridge modules."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import parse_config


class TestPhase287288(unittest.TestCase):
    """Parity checks for phases 287-288."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase287_288"
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

    def test_phase287_hr_gamification_fleet_maintenance(self):
        Employee = self.registry.get("hr.employee")
        self.assertIsNotNone(Employee)
        self.assertTrue(hasattr(Employee, "badge_ids"))
        self.assertTrue(hasattr(Employee, "vehicle_ids"))
        self.assertTrue(hasattr(Employee, "equipment_ids"))

        BadgeUser = self.registry.get("gamification.badge.user")
        self.assertIsNotNone(BadgeUser)

        FleetVehicle = self.registry.get("fleet.vehicle")
        self.assertIsNotNone(FleetVehicle)
        self.assertTrue(hasattr(FleetVehicle, "employee_id"))

        Equipment = self.registry.get("maintenance.equipment")
        self.assertIsNotNone(Equipment)
        self.assertTrue(hasattr(Equipment, "employee_id"))

    def test_phase288_hr_calendar_homeworking_recruitment_skills(self):
        CalendarEvent = self.registry.get("calendar.event")
        self.assertIsNotNone(CalendarEvent)
        self.assertTrue(hasattr(CalendarEvent, "employee_id"))

        Employee = self.registry.get("hr.employee")
        self.assertIsNotNone(Employee)
        self.assertTrue(hasattr(Employee, "meeting_count"))
        self.assertTrue(hasattr(Employee, "work_location_id"))

        Location = self.registry.get("hr.employee.location")
        self.assertIsNotNone(Location)

        Applicant = self.registry.get("hr.applicant")
        self.assertIsNotNone(Applicant)
        self.assertTrue(hasattr(Applicant, "skill_ids"))
