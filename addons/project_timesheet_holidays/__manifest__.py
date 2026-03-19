{
    "name": "Project Timesheet Holidays",
    "version": "1.0",
    "category": "Human Resources",
    "summary": "Generate timesheets from time off",
    "description": "Minimal bridge for hr_timesheet and hr_holidays.",
    "depends": ["hr_timesheet", "hr_holidays"],
    "data": [
        "security/ir.model.access.csv",
    ],
    "auto_install": True,
    "installable": True,
}
