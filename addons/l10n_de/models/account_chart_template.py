"""Chart template extension for l10n_de (phase 351-353)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    de_chart_template = fields.Boolean(string="DE Chart Template", default=True)
