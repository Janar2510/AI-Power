"""Event quiz models (phase 323)."""

from core.orm import Model, fields


class EventQuiz(Model):
    _name = "event.quiz"
    _description = "Event Quiz"

    track_id = fields.Many2one("event.track", string="Track", ondelete="cascade")
    title = fields.Char(string="Title", default="")


class EventQuizQuestion(Model):
    _name = "event.quiz.question"
    _description = "Event Quiz Question"

    quiz_id = fields.Many2one("event.quiz", string="Quiz", ondelete="cascade")
    title = fields.Char(string="Title", default="")
    answer_ids = fields.One2many("event.quiz.answer", "question_id", string="Answers")


class EventQuizAnswer(Model):
    _name = "event.quiz.answer"
    _description = "Event Quiz Answer"

    question_id = fields.Many2one("event.quiz.question", string="Question", ondelete="cascade")
    text = fields.Char(string="Text", default="")
    is_correct = fields.Boolean(string="Correct", default=False)
