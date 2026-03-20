"""Chart template extension for l10n_za (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    za_chart_template = fields.Boolean(string="ZA Chart Template", default=True)
