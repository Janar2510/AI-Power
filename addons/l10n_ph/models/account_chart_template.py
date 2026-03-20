"""Chart template extension for l10n_ph (phase 386-389)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    ph_chart_template = fields.Boolean(string="PH Chart Template", default=True)
