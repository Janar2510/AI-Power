"""Phase 750: sale module extends product.template with sale_ok, invoice_policy, etc."""

import unittest

from addons.sale.models.product_template import ProductTemplate as SaleProductTemplate


class TestSaleProductIntegrationPhase750(unittest.TestCase):
    def test_inherit_and_fields_exist(self):
        self.assertEqual(SaleProductTemplate._inherit, "product.template")
        self.assertIsNotNone(getattr(SaleProductTemplate, "sale_ok", None))
        self.assertIsNotNone(getattr(SaleProductTemplate, "invoice_policy", None))
        self.assertIsNotNone(getattr(SaleProductTemplate, "service_type", None))
        self.assertIsNotNone(getattr(SaleProductTemplate, "expense_policy", None))

    def test_sale_ok_defaults_true_on_field(self):
        f = getattr(SaleProductTemplate, "sale_ok", None)
        self.assertIsNotNone(f)
        self.assertEqual(getattr(f, "default", None), True)
