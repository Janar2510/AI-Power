{
    "name": "Manufacturing",
    "version": "1.0",
    "category": "Manufacturing",
    "description": "Bill of materials, production orders, work centers (Phase 153).",
    "depends": ["base", "stock", "sale", "product"],
    "data": [
        "security/ir.model.access.csv",
        "views/mrp_views.xml",
    ],
    "installable": True,
    "application": True,
}
