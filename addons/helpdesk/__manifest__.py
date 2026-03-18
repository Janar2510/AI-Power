{
    "name": "Helpdesk",
    "version": "1.0",
    "category": "Services",
    "description": "Helpdesk tickets with stages (Phase 190).",
    "depends": ["base", "mail"],
    "data": [
        "security/ir.model.access.csv",
        "views/helpdesk_views.xml",
    ],
    "installable": True,
    "application": True,
}
