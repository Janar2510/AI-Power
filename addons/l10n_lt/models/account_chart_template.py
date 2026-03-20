"""Chart template extension for l10n_lt (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    lt_chart_template = fields.Boolean(string="LT Chart Template", default=True)
