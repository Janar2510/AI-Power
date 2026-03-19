{
    "name": "Project Sale Expense",
    "version": "1.0",
    "category": "Services/Project",
    "summary": "Trace reinvoiced project expenses",
    "description": "Minimal sale/project/expense profitability bridge.",
    "depends": ["sale_project", "sale_expense", "project_hr_expense"],
    "data": [
        "security/ir.model.access.csv",
    ],
    "auto_install": True,
    "installable": True,
}
