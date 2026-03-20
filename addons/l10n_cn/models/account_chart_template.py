"""Chart template extension for l10n_cn (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    cn_chart_template = fields.Boolean(string="CN Chart Template", default=True)
