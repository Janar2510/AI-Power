{
    "name": "Timesheets",
    "version": "1.0",
    "category": "Human Resources",
    "description": "Timesheet entries on analytic lines (Phase 192).",
    "depends": ["base", "account", "hr", "project"],
    "data": [
        "security/ir.model.access.csv",
        "views/hr_timesheet_views.xml",
    ],
    "installable": True,
    "application": True,
}
