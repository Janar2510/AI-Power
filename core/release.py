# ERP Platform release info

version_info = (1, 0, 0, "final", 0, "")
series = ".".join(str(x) for x in version_info[:2])
version = series

product_name = "ERP Platform"
description = "AI-Powered Modular ERP Platform"
MIN_PY_VERSION = (3, 9)  # 3.10+ recommended for Odoo 19 parity
MIN_PG_VERSION = 13
