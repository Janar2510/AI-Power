"""Chart template extension for l10n_uy (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    uy_chart_template = fields.Boolean(string="UY Chart Template", default=True)
