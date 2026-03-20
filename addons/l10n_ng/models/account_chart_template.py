"""Chart template extension for l10n_ng (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ng_chart_template = fields.Boolean(string="NG Chart Template", default=True)
