{
    "name": "Sales",
    "version": "1.0",
    "category": "Sales",
    "description": "Sales orders and quotations.",
    "depends": ["base"],
    "data": [
        "security/ir.model.access.csv",
        "views/product_views.xml",
        "views/sale_views.xml",
    ],
    "installable": True,
    "application": True,
}
