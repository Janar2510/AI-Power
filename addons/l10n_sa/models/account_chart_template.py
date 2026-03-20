"""Chart template extension for l10n_sa (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    sa_chart_template = fields.Boolean(string="SA Chart Template", default=True)
