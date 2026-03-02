"""Tests for ORM."""

import unittest

from core.orm import Model, fields, Registry, Environment


class TestModel(Model):
    _name = "test.orm.model"
    _description = "Test ORM Model"
    name = fields.Char()
    value = fields.Integer()


class TestORM(unittest.TestCase):
    def setUp(self):
        self.reg = Registry("testdb")
        self.env = Environment(self.reg, uid=1)
        self.reg.register_model("test.orm.model", TestModel)
        TestModel._registry = self.reg

    def test_search_returns_recordset(self):
        rs = TestModel.search([])
        self.assertEqual(len(rs), 0)

    def test_create_returns_record(self):
        rec = TestModel.create({"name": "test", "value": 42})
        self.assertIsNotNone(rec.id)
        self.assertEqual(rec.id, 1)

    def test_browse_single(self):
        rec = TestModel.browse(1)
        self.assertEqual(rec.ids, [1])

    def test_browse_multi(self):
        rs = TestModel.browse([1, 2, 3])
        self.assertEqual(len(rs), 3)
        self.assertEqual(rs.ids, [1, 2, 3])
