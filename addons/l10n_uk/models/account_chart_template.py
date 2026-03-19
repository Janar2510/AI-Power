"""Chart template extension for l10n_uk (phase 351-353)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    uk_chart_template = fields.Boolean(string="UK Chart Template", default=True)
