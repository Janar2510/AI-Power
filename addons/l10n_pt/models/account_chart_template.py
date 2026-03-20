"""Chart template extension for l10n_pt (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    pt_chart_template = fields.Boolean(string="PT Chart Template", default=True)
