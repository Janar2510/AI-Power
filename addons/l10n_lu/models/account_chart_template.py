"""Chart template extension for l10n_lu (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    lu_chart_template = fields.Boolean(string="LU Chart Template", default=True)
