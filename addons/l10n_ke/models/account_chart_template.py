"""Chart template extension for l10n_ke (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ke_chart_template = fields.Boolean(string="KE Chart Template", default=True)
