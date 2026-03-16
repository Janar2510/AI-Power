"""Document chunk for RAG retrieval - stores indexable text per record (Phase 136: vector embeddings)."""

from core.orm import Model, fields


class AiDocumentChunk(Model):
    _name = "ai.document.chunk"
    _description = "AI Document Chunk"

    model = fields.Char(required=True)  # res.partner, crm.lead, etc.
    res_id = fields.Integer(required=True)
    text = fields.Text(required=True)
    embedding = fields.Vector(dimensions=1536)  # OpenAI text-embedding-3-small; null when not embedded
