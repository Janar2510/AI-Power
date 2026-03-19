{
    "name": "Products & Pricelists",
    "version": "1.0",
    "category": "Sales/Sales",
    "description": "Base module for managing products, categories, attributes, pricelists, and supplier info.",
    "depends": ["base", "uom"],
    "data": [
        "security/ir.model.access.csv",
        "views/product_views.xml",
        "views/product_pricelist_views.xml",
    ],
    "installable": True,
    "application": False,
}
