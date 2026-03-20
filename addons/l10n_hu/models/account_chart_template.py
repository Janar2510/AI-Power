"""Chart template extension for l10n_hu (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    hu_chart_template = fields.Boolean(string="HU Chart Template", default=True)
