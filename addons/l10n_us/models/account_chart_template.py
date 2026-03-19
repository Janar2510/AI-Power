"""Chart template extension for l10n_us (phase 351-353)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    us_chart_template = fields.Boolean(string="US Chart Template", default=True)
