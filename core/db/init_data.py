"""Default data loading at db init."""

import logging

_logger = logging.getLogger("erp.db")


def load_default_data(env) -> None:
    """Load default records (stages, etc.) when tables are empty."""
    try:
        Stage = env.get("crm.stage")
        if Stage and not Stage.search([]):
            for name, seq, is_won, fold in [
                ("New", 1, False, False),
                ("Qualified", 2, False, False),
                ("Proposition", 3, False, False),
                ("Won", 70, True, False),
                ("Lost", 80, False, True),
            ]:
                Stage.create({"name": name, "sequence": seq, "is_won": is_won, "fold": fold})
            _logger.info("Created default crm.stage records")
    except Exception as e:
        _logger.warning("Could not load default data: %s", e)
