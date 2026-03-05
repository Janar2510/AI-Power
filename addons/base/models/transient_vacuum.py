"""Cron-callable model to run transient vacuum."""

from core.orm import Model
from core.orm.models_transient import vacuum_transient_models


class TransientVacuum(Model):
    """Hook for cron to vacuum transient model tables. No fields; run() is the entrypoint."""

    _name = "base.transient.vacuum"
    _description = "Transient Model Vacuum"

    @classmethod
    def run(cls) -> int:
        """Cron entrypoint: vacuum all transient models. Returns count of models vacuumed."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return 0
        return vacuum_transient_models(env)
