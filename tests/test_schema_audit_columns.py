"""Schema regression: explicit audit fields must not duplicate auto access-log columns."""

import unittest

from core.db.schema import create_table
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

