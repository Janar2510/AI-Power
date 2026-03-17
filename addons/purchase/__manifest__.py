{
    "name": "Purchase",
    "version": "1.0",
    "category": "Inventory/Purchase",
    "description": "Purchase orders and incoming transfers (Phase 117).",
    "depends": ["base", "stock", "account"],
    "data": [
        "security/ir.model.access.csv",
        "views/purchase_views.xml",
    ],
    "installable": True,
    "application": True,
}
