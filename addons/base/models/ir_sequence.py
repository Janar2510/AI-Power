"""ir.sequence - Code-based sequences for auto-numbering (e.g. lead ref)."""

from typing import Optional

from core.orm import Model, fields


class IrSequence(Model):
    _name = "ir.sequence"
    _description = "Sequence"

    code = fields.Char(required=True, string="Code")
    name = fields.Char(string="Name")
    number_next = fields.Integer(string="Next Number", default=0)

    @classmethod
    def next_by_code(cls, code: str) -> Optional[int]:
        """Return next number for sequence code; atomically increment. Sequence must exist (create via init_data)."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return None
        cr.execute(
            """
            UPDATE ir_sequence SET number_next = number_next + 1
            WHERE code = %s
            RETURNING number_next
            """,
            (code,),
        )
        row = cr.fetchone()
        if row:
            return row["number_next"] if hasattr(row, "keys") else row[0]
        return None
