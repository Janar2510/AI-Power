"""ir.sequence — code-based sequences with prefix/suffix/padding (Phase 4c)."""

import re
from datetime import datetime
from typing import Any, Optional, Union

from core.orm import Model, fields


class IrSequenceDateRange(Model):
    """Fiscal / date-bounded sub-sequences (Phase 4c)."""

    _name = "ir.sequence.date_range"
    _description = "Sequence date range"
    _table = "ir_sequence_date_range"

    sequence_id = fields.Many2one("ir.sequence", required=True, string="Sequence", ondelete="cascade")
    date_from = fields.Date(string="From")
    date_to = fields.Date(string="To")
    number_next = fields.Integer(string="Next Number", default=1)


class IrSequence(Model):
    _name = "ir.sequence"
    _description = "Sequence"

    code = fields.Char(required=True, string="Code")
    name = fields.Char(string="Name")
    number_next = fields.Integer(string="Next Number", default=0)
    prefix = fields.Char(string="Prefix", default="")
    suffix = fields.Char(string="Suffix", default="")
    padding = fields.Integer(string="Padding", default=0)
    implementation = fields.Selection(
        selection=[("standard", "Standard")],
        string="Implementation",
        default="standard",
    )
    use_date_range = fields.Boolean(string="Use date ranges", default=False)

    @staticmethod
    def _interpolate_template(tpl: str, dt: datetime) -> str:
        if not tpl:
            return ""
        out = tpl
        out = out.replace("%(year)s", f"{dt.year:04d}")
        out = out.replace("%(month)s", f"{dt.month:02d}")
        out = out.replace("%(day)s", f"{dt.day:02d}")
        out = re.sub(r"%\(y\)s", f"{dt.year % 100:02d}", out)
        return out

    @classmethod
    def next_by_code(cls, code: str) -> Optional[Union[int, str]]:
        """Return next number or formatted string (prefix/suffix/padding)."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return None
        # Prefer extended RETURNING; fall back if DB not upgraded (missing prefix/suffix/padding columns).
        row = None
        cr.execute("SAVEPOINT ir_seq_next_by_code")
        try:
            cr.execute(
                """
                UPDATE ir_sequence SET number_next = number_next + 1
                WHERE code = %s
                RETURNING number_next, prefix, suffix, padding
                """,
                (code,),
            )
            row = cr.fetchone()
        except Exception:
            cr.execute("ROLLBACK TO SAVEPOINT ir_seq_next_by_code")
            try:
                cr.execute(
                    """
                    UPDATE ir_sequence SET number_next = number_next + 1
                    WHERE code = %s
                    RETURNING number_next
                    """,
                    (code,),
                )
                row = cr.fetchone()
            except Exception:
                cr.execute("ROLLBACK TO SAVEPOINT ir_seq_next_by_code")
                row = None
        try:
            cr.execute("RELEASE SAVEPOINT ir_seq_next_by_code")
        except Exception:
            pass
        if not row:
            return None
        if hasattr(row, "keys"):
            num = row.get("number_next")
            if "prefix" in row:
                prefix = str((row.get("prefix") or "") or "")
                suffix = str((row.get("suffix") or "") or "")
                pad = int(row.get("padding") or 0)
            else:
                prefix, suffix, pad = "", "", 0
        else:
            num = row[0]
            if len(row) > 1:
                prefix = str((row[1] or "") or "")
                suffix = str((row[2] or "") or "")
                pad = int(row[3] or 0)
            else:
                prefix, suffix, pad = "", "", 0
        if not prefix and not suffix and pad <= 0:
            return int(num)
        now = datetime.utcnow()
        pfx = cls._interpolate_template(prefix, now)
        sfx = cls._interpolate_template(suffix, now)
        body = str(int(num))
        if pad > 0:
            body = body.zfill(pad)
        return f"{pfx}{body}{sfx}"
