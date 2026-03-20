{
    "name": "CRM",
    "version": "1.0",
    "category": "Sales",
    "description": "Leads and opportunities.",
    "depends": ["base", "mail"],
    "data": [
        "security/ir.model.access.csv",
        "views/crm_views.xml",
    ],
    "demo": ["demo/demo_crm.xml"],
    "installable": True,
    "application": True,
}
