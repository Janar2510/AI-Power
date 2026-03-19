{
    "name": "Sales - Project",
    "version": "1.0",
    "category": "Sales/Sales",
    "summary": "Task generation from sales orders",
    "description": "Auto-create project/tasks from confirmed SO lines with service products.",
    "depends": ["sale_management", "sale_service", "project_account"],
    "data": [],
    "auto_install": ["sale_management", "project_account"],
    "installable": True,
}
