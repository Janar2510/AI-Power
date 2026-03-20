"""Chart template extension for l10n_nl (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    nl_chart_template = fields.Boolean(string="NL Chart Template", default=True)
