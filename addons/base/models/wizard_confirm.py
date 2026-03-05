"""base.wizard.confirm - Simple confirm dialog wizard (workflow pattern)."""

from typing import Any, Dict, List, Optional

from core.orm import TransientModel, fields


class WizardConfirm(TransientModel):
    """Simple confirmation wizard. Create record, show form, call action_confirm; record unlinked after."""

    _name = "base.wizard.confirm"
    _description = "Confirmation Wizard"

    name = fields.Char(string="Title", required=True)
    message = fields.Text(string="Message")

    @classmethod
    def action_confirm(cls, ids: List[int]) -> Optional[Dict[str, Any]]:
        """RPC entrypoint. Call _do_confirm on first record, then unlink all. Returns action dict or None."""
        if not ids:
            return None
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return None
        rec = cls(env, ids[:1])
        result = rec._do_confirm()
        cls.unlink(ids)
        return result

    def _do_confirm(self) -> Optional[Dict[str, Any]]:
        """Override in subclasses to perform work. Return action dict or None. Base impl returns None."""
        return None
