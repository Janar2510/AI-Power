"""res.users helpers for project_todo."""

from core.orm import Model


class ResUsersProjectTodo(Model):
    _inherit = "res.users"

    def _get_activity_groups(self):
        try:
            return super()._get_activity_groups()
        except AttributeError:
            return []

    def _onboard_users_into_project(self, users):
        try:
            result = super()._onboard_users_into_project(users)
        except AttributeError:
            result = users
        if result:
            result._generate_onboarding_todo()
        return result

    def _generate_onboarding_todo(self):
        Task = self.env.get("project.task") if getattr(self, "env", None) else None
        if not Task:
            return
        for user in self:
            Task.create({"name": f"Welcome {user.read(['name'])[0].get('name') or ''}!"})
