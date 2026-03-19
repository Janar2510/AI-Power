{
    "name": "Sales Timesheet",
    "version": "1.0",
    "category": "Sales/Sales",
    "summary": "Sell based on timesheets",
    "description": "Allows to sell timesheets in sales orders. Timesheet lines on project tasks are linked to sale order lines for delivered quantity.",
    "depends": ["sale_project", "hr_timesheet"],
    "data": [
        "security/ir.model.access.csv",
    ],
    "auto_install": True,
    "installable": True,
}
