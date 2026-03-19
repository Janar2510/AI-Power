{
    "name": "Sales Expense",
    "version": "1.0",
    "category": "Sales/Sales",
    "summary": "Reinvoice employee expense",
    "description": "Allows reinvoicing employee expenses by linking expenses to sales orders.",
    "depends": ["sale_management", "hr_expense"],
    "data": [
        "security/ir.model.access.csv",
    ],
    "auto_install": True,
    "installable": True,
}
