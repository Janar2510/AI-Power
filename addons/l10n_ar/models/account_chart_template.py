"""Chart template extension for l10n_ar (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ar_chart_template = fields.Boolean(string="AR Chart Template", default=True)
