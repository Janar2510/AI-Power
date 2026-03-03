"""Document chunk for RAG retrieval - stores indexable text per record."""

from core.orm import Model, fields


class AiDocumentChunk(Model):
    _name = "ai.document.chunk"
    _description = "AI Document Chunk"

    model = fields.Char(required=True)  # res.partner, crm.lead, etc.
    res_id = fields.Integer(required=True)
    text = fields.Text(required=True)
