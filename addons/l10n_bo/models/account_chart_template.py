"""Chart template extension for l10n_bo (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    bo_chart_template = fields.Boolean(string="BO Chart Template", default=True)
