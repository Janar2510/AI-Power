"""Blog models (phase 334)."""

from core.orm import Model, fields


class BlogBlog(Model):
    _name = "blog.blog"
    _description = "Blog"

    name = fields.Char(string="Name", default="")
    subtitle = fields.Char(string="Subtitle", default="")
    website_id = fields.Many2one("website", string="Website", ondelete="set null")
    active = fields.Boolean(string="Active", default=True)


class BlogTagCategory(Model):
    _name = "blog.tag.category"
    _description = "Blog Tag Category"

    name = fields.Char(string="Name", default="")


class BlogTag(Model):
    _name = "blog.tag"
    _description = "Blog Tag"

    name = fields.Char(string="Name", default="")
    category_id = fields.Many2one("blog.tag.category", string="Category", ondelete="set null")


class BlogPost(Model):
    _name = "blog.post"
    _description = "Blog Post"

    name = fields.Char(string="Title", default="")
    blog_id = fields.Many2one("blog.blog", string="Blog", ondelete="cascade")
    author_id = fields.Many2one("res.partner", string="Author", ondelete="set null")
    content = fields.Text(string="Content")
    website_published = fields.Boolean(string="Website Published", default=False)
    published_date = fields.Datetime(string="Published Date")
    tag_ids = fields.Many2many(
        "blog.tag",
        "blog_post_tag_rel",
        "post_id",
        "tag_id",
        string="Tags",
    )
    visits = fields.Integer(string="Visits", default=0)
