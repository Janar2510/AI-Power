"""Chart template extension for l10n_fr (phase 351-353)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    fr_chart_template = fields.Boolean(string="FR Chart Template", default=True)
