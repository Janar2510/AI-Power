{
    "name": "Payroll",
    "version": "1.0",
    "category": "Human Resources",
    "description": "Employee payslips and salary rules (Phase 186).",
    "depends": ["base", "hr", "hr_attendance"],
    "data": [
        "security/ir.model.access.csv",
        "views/hr_payroll_views.xml",
    ],
    "installable": True,
    "application": True,
}
