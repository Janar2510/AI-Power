"""res.config.settings - Base configuration wizard. Phase 255."""

from core.orm import Model, fields
from core.orm.models_transient import TransientModel


class ResConfigSettings(TransientModel):
    """Base configuration wizard for application settings.
    Supports config_parameter fields (stored in ir.config_parameter).
    """

    _name = "res.config.settings"
    _description = "Config Settings"

    company_id = fields.Many2one("res.company", string="Company")
    show_effect = fields.Boolean(
        string="Show Effect",
        default=True,
        config_parameter="base_setup.show_effect",
    )

    def _get_config_params(self):
        """Return list of (field_name, config_param_key) for config_parameter fields."""
        result = []
        for name in dir(self._model):
            if name.startswith("_"):
                continue
            field = getattr(self._model, name, None)
            if not isinstance(field, fields.Field):
                continue
            param = getattr(field, "config_parameter", None)
            if param:
                result.append((name, param))
        return result

    @classmethod
    def default_get(cls, fields_list=None, context=None):
        """Load values from ir.config_parameter for config_parameter fields."""
        result = dict(super().default_get(fields_list, context) or {})
        from core.orm import ModelBase

        env = getattr(ModelBase._registry, "_env", None) if ModelBase._registry else None
        if not env:
            return result
        IrConfig = env.get("ir.config.parameter")
        if not IrConfig:
            return result
        for fname, param in cls._get_config_params_static():
            if fields_list and fname not in fields_list:
                continue
            val = IrConfig.get_param(param)
            if val is not None:
                if hasattr(cls, fname):
                    f = getattr(cls, fname)
                    if isinstance(f, fields.Boolean):
                        result[fname] = val.lower() in ("true", "1", "yes")
                    else:
                        result[fname] = val
        return result

    @classmethod
    def _get_config_params_static(cls):
        """Static helper to get config param fields."""
        result = []
        for name in dir(cls):
            if name.startswith("_"):
                continue
            try:
                obj = getattr(cls, name)
                if hasattr(obj, "config_parameter") and getattr(obj, "config_parameter", None):
                    result.append((name, obj.config_parameter))
            except Exception:
                pass
        return result

    def execute(self):
        """Save config_parameter values to ir.config_parameter. self may be Recordset."""
        env = getattr(self, "env", None) or getattr(self, "_env", None)
        if not env:
            return
        IrConfig = env.get("ir.config.parameter")
        if not IrConfig:
            return
        ids = getattr(self, "_ids", None) or getattr(self, "ids", None) or []
        if not ids:
            return
        rows = self.read([fname for fname, _ in self._get_config_params_static()]) if hasattr(self, "read") else []
        if not rows:
            return
        row = rows[0]
        for fname, param in self._get_config_params_static():
            val = row.get(fname)
            if isinstance(val, bool):
                IrConfig.set_param(param, "True" if val else "False")
            elif val is not None:
                IrConfig.set_param(param, str(val))
