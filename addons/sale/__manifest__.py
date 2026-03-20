{
    "name": "Sales",
    "version": "1.0",
    "category": "Sales",
    "description": "Sales orders and quotations.",
    "depends": ["base", "uom", "product", "sales_team"],
    "data": [
        "security/ir.model.access.csv",
        "views/sale_views.xml",
    ],
    "demo": ["demo/demo_sale.xml"],
    "installable": True,
    "application": True,
}
