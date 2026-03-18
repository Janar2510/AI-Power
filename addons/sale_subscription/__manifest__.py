{
    "name": "Sale Subscription",
    "version": "1.0",
    "category": "Sales",
    "description": "Recurring billing and subscription lifecycle.",
    "depends": ["sale", "account", "payment"],
    "data": [
        "security/ir.model.access.csv",
        "views/sale_subscription_views.xml",
    ],
    "installable": True,
}
