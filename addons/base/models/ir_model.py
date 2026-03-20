"""ir.model - Model metadata (Phase 419: registry sync)."""

from typing import Any, List

from core.orm import Model, fields
from core.orm import fields as fmod
from core.orm import fields as fmod


class IrModel(Model):
    _name = "ir.model"
    _description = "Models"

    name = fields.Char(string="Model Description")
    model = fields.Char(string="Model")
    info = fields.Text(string="Information")
    state = fields.Selection(
        selection=[("base", "Base"), ("manual", "Manual")],
        string="Type",
        default="base",
    )
    field_id = fields.One2many("ir.model.fields", "model_id", string="Fields")

    @classmethod
    def sync_registry(cls, env: Any) -> None:
        """Create missing ir.model / ir.model.fields rows from ORM registry."""
        registry = getattr(env, "registry", None)
        if not registry:
            return
        Field = env.get("ir.model.fields")
        for mname in sorted(registry._models.keys()):
            ModelCls = registry._models[mname]
            if getattr(ModelCls, "_abstract", False):
                continue
            desc = (getattr(ModelCls, "_description", None) or mname).replace("%", "%%")
            existing = cls.search([("model", "=", mname)], limit=1)
            if existing.ids:
                mid = existing.ids[0]
                cls.browse(mid).write({"name": desc, "info": mname})
            else:
                rec = cls.create({"name": desc, "model": mname, "state": "base", "info": mname})
                mid = rec.id
            if not Field or not mid:
                continue
            field_names: List[str] = [
                n
                for n in dir(ModelCls)
                if not n.startswith("_")
                and isinstance(getattr(ModelCls, n, None), (fmod.Field,))
            ]
            for fname in field_names:
                fobj = getattr(ModelCls, fname, None)
                if not isinstance(fobj, fmod.Field):
                    continue
                ttype = type(fobj).__name__.lower().replace("field", "")
                rel = getattr(fobj, "comodel", "") or ""
                label = getattr(fobj, "string", None) or fname
                fe_rs = Field.search([("model_id", "=", mid), ("name", "=", fname)], limit=1)
                vals = {
                    "model_id": mid,
                    "name": fname,
                    "field_description": label,
                    "ttype": ttype,
                    "relation": rel,
                }
                if fe_rs.ids:
                    Field.browse(fe_rs.ids[0]).write(vals)
                else:
                    Field.create(vals)
