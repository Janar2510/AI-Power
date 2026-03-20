"""Chart template extension for l10n_pl (phase 354-356)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    pl_chart_template = fields.Boolean(string="PL Chart Template", default=True)
