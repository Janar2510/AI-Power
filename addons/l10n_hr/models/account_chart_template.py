"""Chart template extension for l10n_hr (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    hr_chart_template = fields.Boolean(string="HR Chart Template", default=True)
