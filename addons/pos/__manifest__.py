{
    "name": "Point of Sale",
    "version": "1.0",
    "category": "Sales",
    "description": "Point of Sale for retail transactions.",
    "depends": ["base", "sale", "stock", "account"],
    "data": [
        "security/ir.model.access.csv",
        "views/pos_views.xml",
    ],
    "installable": True,
}
