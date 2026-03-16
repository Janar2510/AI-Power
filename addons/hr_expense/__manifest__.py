{
    "name": "Expenses",
    "version": "1.0",
    "category": "Human Resources",
    "description": "Employee expense reports and approval workflow (Phase 161).",
    "depends": ["base", "hr", "account"],
    "data": [
        "security/ir.model.access.csv",
        "views/hr_expense_views.xml",
    ],
    "installable": True,
    "application": True,
}
