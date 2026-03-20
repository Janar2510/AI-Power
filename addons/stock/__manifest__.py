{
    "name": "Inventory",
    "version": "1.0",
    "category": "Inventory",
    "description": "Stock, warehouses, and transfers (Phase 116).",
    "depends": ["base", "sale"],
    "data": [
        "security/ir.model.access.csv",
        "views/stock_views.xml",
    ],
    "demo": ["demo/demo_stock.xml"],
    "installable": True,
    "application": True,
}
