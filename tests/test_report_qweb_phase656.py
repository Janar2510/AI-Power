"""Phase 656: QWeb-ish report template conversion handles nested directives."""

import unittest

from core.http.report import _qwebish_to_jinja


class TestReportQwebPhase656(unittest.TestCase):
    def test_nested_foreach_converts(self):
        raw = (
            '<t t-foreach="records" t-as="r">'
            '<t t-foreach="r.lines" t-as="l">'
            '<t t-esc="l.name"/>'
            "</t>"
            "</t>"
        )
        out = _qwebish_to_jinja(raw)
        self.assertIn("{% for l in r.lines %}", out)
        self.assertIn("{% for r in records %}", out)
        self.assertNotIn("<t ", out)

    def test_max_passes_bounded(self):
        self.assertEqual(_qwebish_to_jinja("", max_passes=2), "")


if __name__ == "__main__":
    unittest.main()
