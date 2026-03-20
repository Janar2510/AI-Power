"""Chart template extension for l10n_si (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    si_chart_template = fields.Boolean(string="SI Chart Template", default=True)
