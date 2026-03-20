"""Chart template extension for l10n_it (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    it_chart_template = fields.Boolean(string="IT Chart Template", default=True)
