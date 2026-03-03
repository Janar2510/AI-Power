"""Default data loading at db init."""

import logging

_logger = logging.getLogger("erp.db")


def load_default_data(env) -> None:
    """Load default records (stages, sequences, etc.) when tables are empty."""
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

    try:
        IrSequence = env.get("ir.sequence")
        if IrSequence:
            for code, name in [("crm.lead", "Lead/Opportunity Reference")]:
                existing = IrSequence.search([("code", "=", code)])
                if not existing:
                    IrSequence.create({"code": code, "name": name, "number_next": 0})
                    _logger.info("Created default ir.sequence: %s", code)
    except Exception as e:
        _logger.warning("Could not load default sequences: %s", e)
