{
    "name": "Payment - Account",
    "version": "1.0",
    "category": "Accounting/Accounting",
    "summary": "Enable customers to pay invoices on the portal and post payments when transactions are processed.",
    "depends": ["account", "payment"],
    "data": [
        "security/ir.model.access.csv",
    ],
    "auto_install": ["account"],
    "installable": True,
}
