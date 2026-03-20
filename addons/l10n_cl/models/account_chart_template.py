"""Chart template extension for l10n_cl (phase 374-377)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _inherit = "account.chart.template"

    cl_chart_template = fields.Boolean(string="CL Chart Template", default=True)
