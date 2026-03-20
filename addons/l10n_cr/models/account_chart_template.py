"""Chart template extension for l10n_cr (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    cr_chart_template = fields.Boolean(string="CR Chart Template", default=True)
