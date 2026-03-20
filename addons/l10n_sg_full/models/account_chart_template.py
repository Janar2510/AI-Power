"""Chart template extension for l10n_sg_full (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    sg_full_chart_template = fields.Boolean(string="SG Full Chart Template", default=True)
