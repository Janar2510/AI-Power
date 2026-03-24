"""ir.sequence — code-based sequences with prefix/suffix/padding (Phase 4c)."""

import re
from datetime import datetime
from typing import Any, Optional, Tuple, Union

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
    company_id = fields.Many2one(
        "res.company",
        string="Company",
        help="Phase 564: when set, next_by_code(code, company_id=…) uses this row; NULL = global fallback.",
    )
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

    @staticmethod
    def _normalize_reference_date_str(reference_date: Any) -> str:
        if reference_date is None:
            return datetime.utcnow().strftime("%Y-%m-%d")
        s = str(reference_date).strip()
        if len(s) >= 10 and s[4] == "-" and s[7] == "-":
            return s[:10]
        return datetime.utcnow().strftime("%Y-%m-%d")

    @staticmethod
    def _reference_date_to_datetime(reference_date: Any) -> datetime:
        ds = IrSequence._normalize_reference_date_str(reference_date)
        y, m, d = int(ds[:4]), int(ds[5:7]), int(ds[8:10])
        return datetime(y, m, d)

    @staticmethod
    def _pick_date_range_row_id(cr: Any, seq_id: int, date_str: str) -> Optional[int]:
        try:
            cr.execute(
                """
                SELECT id FROM ir_sequence_date_range
                WHERE sequence_id = %s
                  AND (date_from IS NULL OR date_from <= %s)
                  AND (date_to IS NULL OR date_to >= %s)
                ORDER BY date_from, id
                LIMIT 1
                """,
                (seq_id, date_str, date_str),
            )
            r = cr.fetchone()
            return int(r[0]) if r else None
        except Exception:
            return None

    @staticmethod
    def _resolve_sequence_row_id(cr: Any, code: str, company_id: Optional[int]) -> Optional[int]:
        if company_id is not None:
            cr.execute(
                "SELECT id FROM ir_sequence WHERE code = %s AND company_id = %s LIMIT 1",
                (code, company_id),
            )
            r = cr.fetchone()
            if r:
                return int(r[0])
        cr.execute(
            "SELECT id FROM ir_sequence WHERE code = %s AND company_id IS NULL LIMIT 1",
            (code,),
        )
        r = cr.fetchone()
        return int(r[0]) if r else None

    @classmethod
    def _next_by_code_fetch_row(
        cls,
        cr: Any,
        code: str,
        company_id: Optional[int],
        reference_date: Any,
    ) -> Optional[Tuple[int, str, str, int]]:
        """Atomically increment and return ``(number_next, prefix, suffix, padding)``."""
        seq_id = cls._resolve_sequence_row_id(cr, code, company_id)
        if not seq_id:
            return None
        use_dr = False
        prefix, suffix, pad = "", "", 0
        try:
            cr.execute(
                "SELECT use_date_range, prefix, suffix, padding FROM ir_sequence WHERE id = %s",
                (seq_id,),
            )
            meta = cr.fetchone()
            if meta:
                if hasattr(meta, "keys"):
                    use_dr = bool(meta.get("use_date_range"))
                    prefix = str((meta.get("prefix") or "") or "")
                    suffix = str((meta.get("suffix") or "") or "")
                    pad = int(meta.get("padding") or 0)
                else:
                    use_dr = bool(meta[0])
                    prefix = str((meta[1] or "") or "")
                    suffix = str((meta[2] or "") or "")
                    pad = int(meta[3] or 0)
        except Exception:
            use_dr = False

        date_str = cls._normalize_reference_date_str(reference_date)
        row = None
        if use_dr:
            dr_id = cls._pick_date_range_row_id(cr, seq_id, date_str)
            if dr_id:
                try:
                    cr.execute(
                        """
                        UPDATE ir_sequence_date_range SET number_next = number_next + 1
                        WHERE id = %s
                        RETURNING number_next
                        """,
                        (dr_id,),
                    )
                    row = cr.fetchone()
                except Exception:
                    row = None
        if not row:
            try:
                cr.execute(
                    """
                    UPDATE ir_sequence SET number_next = number_next + 1
                    WHERE id = %s
                    RETURNING number_next, prefix, suffix, padding
                    """,
                    (seq_id,),
                )
                row = cr.fetchone()
            except Exception:
                cr.execute(
                    """
                    UPDATE ir_sequence SET number_next = number_next + 1
                    WHERE id = %s
                    RETURNING number_next
                    """,
                    (seq_id,),
                )
                row = cr.fetchone()
        if not row:
            return None
        if hasattr(row, "keys"):
            num = int(row.get("number_next") or 0)
            if row.get("prefix") is not None or "suffix" in row:
                prefix = str((row.get("prefix") or "") or "")
                suffix = str((row.get("suffix") or "") or "")
                pad = int(row.get("padding") or 0)
        else:
            num = int(row[0])
            if len(row) > 1:
                prefix = str((row[1] or "") or "")
                suffix = str((row[2] or "") or "")
                pad = int(row[3] or 0)
        return (num, prefix, suffix, pad)

    @classmethod
    def next_by_code(
        cls,
        code: str,
        company_id: Optional[int] = None,
        reference_date: Any = None,
    ) -> Optional[Union[int, str]]:
        """Return next number or formatted string (prefix/suffix/padding).

        Phase 564: optional ``company_id`` selects a company-specific sequence row when present,
        else falls back to a row with ``company_id`` NULL.

        Phase 569: when the sequence has ``use_date_range`` and a matching ``ir.sequence.date_range``
        row exists for ``reference_date`` (move date; default today), increment that sub-row's
        ``number_next`` instead of the parent row. Prefix/suffix/padding still come from the parent.
        """
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return None
        packed = None
        cr.execute("SAVEPOINT ir_seq_next_by_code")
        try:
            packed = cls._next_by_code_fetch_row(cr, code, company_id, reference_date)
        except Exception:
            cr.execute("ROLLBACK TO SAVEPOINT ir_seq_next_by_code")
            try:
                packed = cls._next_by_code_fetch_row(cr, code, company_id, reference_date)
            except Exception:
                cr.execute("ROLLBACK TO SAVEPOINT ir_seq_next_by_code")
                packed = None
        try:
            cr.execute("RELEASE SAVEPOINT ir_seq_next_by_code")
        except Exception:
            pass
        if not packed:
            return None
        num, prefix, suffix, pad = packed
        if not prefix and not suffix and pad <= 0:
            return int(num)
        interp_dt = cls._reference_date_to_datetime(reference_date)
        pfx = cls._interpolate_template(prefix, interp_dt)
        sfx = cls._interpolate_template(suffix, interp_dt)
        body = str(int(num))
        if pad > 0:
            body = body.zfill(pad)
        return f"{pfx}{body}{sfx}"
