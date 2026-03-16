"""Knowledge article - RAG-indexed content."""

from core.orm import Model, fields


class KnowledgeArticle(Model):
    _name = "knowledge.article"
    _description = "Knowledge Article"

    name = fields.Char(required=True)
    body_html = fields.Html(string="Content")
    category_id = fields.Many2one("knowledge.category", string="Category")
    author_id = fields.Many2one("res.users", string="Author")
    is_published = fields.Boolean(default=False, string="Published")
