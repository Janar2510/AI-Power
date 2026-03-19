"""Phase 236: Test model for Reference, Json, Properties, Html field types."""

from core.orm import Model, fields


class BaseFieldTest(Model):
    """Test model for Phase 236 field types - Reference, Json, Properties, Html."""

    _name = "base.field.test"
    _description = "Field Types Test (Phase 236)"

    name = fields.Char(string="Name")
    ref_field = fields.Reference(string="Reference")  # stores "model_name,id"
    json_field = fields.Json(string="JSON Data")
    props_field = fields.Properties(string="Properties")
    html_field = fields.Html(string="HTML Content")
    res_model = fields.Char(string="Res Model")  # for Many2oneReference discriminator
    m2o_ref_id = fields.Many2oneReference(model_field="res_model", string="M2O Ref")
