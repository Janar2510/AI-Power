"""Forum models (phase 335)."""

from core.orm import Model, fields


class ForumForum(Model):
    _name = "forum.forum"
    _description = "Forum"

    name = fields.Char(string="Name", default="")
    description = fields.Text(string="Description")
    website_id = fields.Many2one("website", string="Website", ondelete="set null")
    karma_ask = fields.Integer(string="Karma Ask", default=0)
    karma_answer = fields.Integer(string="Karma Answer", default=0)
    karma_edit = fields.Integer(string="Karma Edit", default=0)


class ForumPost(Model):
    _name = "forum.post"
    _description = "Forum Post"

    name = fields.Char(string="Title", default="")
    forum_id = fields.Many2one("forum.forum", string="Forum", ondelete="cascade")
    parent_id = fields.Many2one("forum.post", string="Parent", ondelete="cascade")
    content = fields.Text(string="Content")
    state = fields.Selection(
        selection=[("active", "Active"), ("closed", "Closed"), ("archived", "Archived")],
        string="State",
        default="active",
    )
    vote_count = fields.Integer(string="Vote Count", default=0)
    is_correct = fields.Boolean(string="Is Correct", default=False)
    create_uid = fields.Many2one("res.users", string="Author", ondelete="set null")


class ForumTag(Model):
    _name = "forum.tag"
    _description = "Forum Tag"

    name = fields.Char(string="Name", default="")
    forum_id = fields.Many2one("forum.forum", string="Forum", ondelete="cascade")
    posts_count = fields.Integer(string="Posts Count", default=0)


class ForumPostVote(Model):
    _name = "forum.post.vote"
    _description = "Forum Post Vote"

    post_id = fields.Many2one("forum.post", string="Post", ondelete="cascade")
    user_id = fields.Many2one("res.users", string="User", ondelete="cascade")
    vote = fields.Selection(selection=[("up", "Up"), ("down", "Down")], string="Vote", default="up")
