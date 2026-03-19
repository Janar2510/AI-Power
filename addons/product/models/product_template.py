"""Product template (Phase 247). Base for product variants."""

import itertools
from core.orm import Model, fields


class ProductTemplate(Model):
    _name = "product.template"
    _description = "Product Template"

    name = fields.Char(required=True)
    list_price = fields.Float(string="Sales Price", default=0.0)
    standard_price = fields.Float(string="Cost", default=0.0)
    type = fields.Selection([("consu", "Consumable"), ("service", "Service"), ("product", "Storable Product")], default="consu")
    categ_id = fields.Many2one("product.category", string="Category")
    uom_id = fields.Many2one("uom.uom", string="Unit of Measure")
    description = fields.Text(string="Description")
    active = fields.Boolean(default=True)
    attribute_line_ids = fields.One2many(
        "product.template.attribute.line",
        "template_id",
        string="Attribute Lines",
    )

    @classmethod
    def create(cls, vals):
        rec = super().create(vals)
        rec._create_variant_ids()
        return rec

    def write(self, vals):
        res = super().write(vals)
        if "attribute_line_ids" in vals:
            self._create_variant_ids()
        return res

    def _create_variant_ids(self):
        """Generate product.product variants from attribute_line_ids combinations."""
        env = getattr(self, "env", None) or (
            getattr(self._model._registry, "_env", None)
            if getattr(self._model, "_registry", None)
            else None
        )
        if not env:
            return
        Product = env.get("product.product")
        LineModel = env.get("product.template.attribute.line")
        if not Product or not LineModel:
            return
        ids = self.ids if hasattr(self, "ids") and self.ids else (getattr(self, "_ids", None) or [])
        if not ids:
            ids = [self.id] if hasattr(self, "id") and self.id else []
        for tid in ids:
            lines = LineModel.search([("template_id", "=", tid)], order="id")
            if not lines or not lines.ids:
                existing = Product.search([("product_template_id", "=", tid)])
                if not existing or not existing.ids:
                    Product.create({
                        "product_template_id": tid,
                        "attribute_value_ids": [],
                    })
                else:
                    for rec in existing:
                        rec.unlink()
                    Product.create({
                        "product_template_id": tid,
                        "attribute_value_ids": [],
                    })
                continue
            value_lists = []
            for line in lines:
                row = line.read(["value_ids"])[0] if line.read(["value_ids"]) else {}
                vids = row.get("value_ids") or []
                if isinstance(vids, (list, tuple)) and vids:
                    vids = [x if isinstance(x, int) else (x[0] if isinstance(x, (list, tuple)) and x else x) for x in vids]
                if not vids:
                    value_lists = []
                    break
                value_lists.append(vids)
            if not value_lists:
                existing = Product.search([("product_template_id", "=", tid)])
                if not existing or not existing.ids:
                    Product.create({
                        "product_template_id": tid,
                        "attribute_value_ids": [],
                    })
                continue
            combinations = list(itertools.product(*value_lists))
            existing = Product.search([("product_template_id", "=", tid)])
            existing_by_attrs = {}
            for rec in existing:
                row = rec.read(["attribute_value_ids"])[0] if rec.read(["attribute_value_ids"]) else {}
                avids = row.get("attribute_value_ids") or []
                if isinstance(avids, (list, tuple)) and avids:
                    avids = [x if isinstance(x, int) else (x[0] if isinstance(x, (list, tuple)) and x else x) for x in avids]
                key = tuple(sorted(avids))
                existing_by_attrs[key] = rec.ids[0] if rec.ids else rec.id
            seen_keys = set()
            for combo in combinations:
                key = tuple(sorted(combo))
                seen_keys.add(key)
                if key not in existing_by_attrs:
                    Product.create({
                        "product_template_id": tid,
                        "attribute_value_ids": list(combo),
                    })
            for key, vid in existing_by_attrs.items():
                if key not in seen_keys:
                    Product.browse(vid).unlink()
