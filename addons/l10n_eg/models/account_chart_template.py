"""Chart template extension for l10n_eg (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    eg_chart_template = fields.Boolean(string="EG Chart Template", default=True)
