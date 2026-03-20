{
    "name": "Analytic Accounting",
    "version": "1.0",
    "category": "Accounting",
    "description": "Analytic accounts, plans, and cost distribution (Phase 248, Odoo 19 parity).",
    "depends": ["base", "mail", "uom", "account"],
    "data": [
        "security/ir.model.access.csv",
        "views/analytic_views.xml",
    ],
    "installable": True,
    "application": False,
}
