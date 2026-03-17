{
    "name": "Mail",
    "version": "1.0",
    "category": "Hidden",
    "description": "Mail messaging, activities, and outgoing email queue.",
    "depends": ["base"],
    "data": [
        "security/ir.model.access.csv",
        "security/ir_rule.xml",
        "views/mail_template_views.xml",
    ],
    "installable": True,
    "auto_install": True,
}
