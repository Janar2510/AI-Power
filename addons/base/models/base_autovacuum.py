"""Phase 235: Run @api.autovacuum methods from cron."""

from core.orm import Model


class BaseAutovacuum(Model):
    """Hook for cron to run all @api.autovacuum methods. No fields; run() is the entrypoint."""

    _name = "base.autovacuum"
    _description = "Autovacuum Runner"

    @classmethod
    def run(cls) -> int:
        """Cron entrypoint: discover and run all methods marked with @api.autovacuum."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return 0
        count = 0
        for model_name, ModelClass in env.registry._models.items():
            for attr_name in dir(ModelClass):
                if attr_name.startswith("_"):
                    continue
                method = getattr(ModelClass, attr_name, None)
                if not callable(method):
                    continue
                if not getattr(method, "_autovacuum", False):
                    continue
                try:
                    recs = ModelClass.browse([])
                    getattr(recs, attr_name)()
                    count += 1
                except Exception:
                    pass
        return count
