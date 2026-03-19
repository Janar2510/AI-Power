{
    "name": "Sales",
    "version": "1.0",
    "category": "Sales",
    "description": "Sales orders and quotations.",
    "depends": ["base", "uom", "product"],
    "data": [
        "security/ir.model.access.csv",
        "views/sale_views.xml",
    ],
    "installable": True,
    "application": True,
}
