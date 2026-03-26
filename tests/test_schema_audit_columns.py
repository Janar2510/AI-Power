"""Schema regression: explicit audit fields must not duplicate auto access-log columns."""

import unittest

from core.db.schema import add_missing_columns, create_table
from core.orm import fields
from core.orm.models import ModelBase


class _FakeCursor:
    def __init__(self):
        self.statements = []
        self._fetchone_result = None

    def execute(self, statement, params=None):
        self.statements.append((statement, params))
        if "information_schema.tables" in statement:
            self._fetchone_result = None

    def fetchone(self):
        return self._fetchone_result


class _AuditFieldModel(ModelBase):
    _name = "x.audit.field.model"
    _table = "x_audit_field_model"

    name = fields.Char()
    create_date = fields.Datetime()
    write_date = fields.Datetime()


class TestSchemaAuditColumns(unittest.TestCase):
    def test_create_table_does_not_duplicate_explicit_audit_fields(self):
        cursor = _FakeCursor()

        create_table(cursor, _AuditFieldModel)

        create_stmt = next(
            statement for statement, _params in cursor.statements
            if statement.startswith('CREATE TABLE "x_audit_field_model"')
        )
        self.assertEqual(create_stmt.count('"create_date"'), 1)
        self.assertEqual(create_stmt.count('"write_date"'), 1)


class _AddColCursor:
    def __init__(self):
        self.executed: list[tuple[str, object]] = []

    def execute(self, statement: str, params=None):
        self.executed.append((statement, params))

    def fetchone(self):
        stmt = self.executed[-1][0] if self.executed else ""
        if "information_schema.tables" in stmt:
            return (1,)
        if "information_schema.columns" in stmt:
            return None
        return None


class TestAddMissingColumnsAuditPhase653(unittest.TestCase):
    """Phase 653: add_missing_columns must not emit a second create_date from the audit shim."""

    def test_add_missing_columns_single_create_date_when_explicit_field(self):
        class ExplicitAuditModel(ModelBase):
            _name = "x.explicit.audit"
            _table = "x_explicit_audit653"
            name = fields.Char()
            create_date = fields.Datetime()

        class _Reg:
            _models = {"x.explicit.audit": ExplicitAuditModel}

        cur = _AddColCursor()
        add_missing_columns(cur, _Reg(), use_native_vector=False)
        create_date_adds = [
            s for s, _ in cur.executed if "ADD COLUMN" in s and '"create_date"' in s
        ]
        self.assertEqual(
            len(create_date_adds),
            1,
            "expected exactly one ADD for explicit create_date, not audit + field: "
            + str(create_date_adds),
        )


if __name__ == "__main__":
    unittest.main()
