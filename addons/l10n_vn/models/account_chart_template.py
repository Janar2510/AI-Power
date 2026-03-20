"""Chart template extension for l10n_vn (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    vn_chart_template = fields.Boolean(string="VN Chart Template", default=True)
