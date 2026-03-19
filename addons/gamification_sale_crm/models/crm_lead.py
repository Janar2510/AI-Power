"""Reward won opportunities with a badge."""

from core.orm import Model


class CrmLeadGamification(Model):
    _inherit = "crm.lead"

    def _gamification_signal(self):
        """Grant the first available badge to the current salesperson."""
        Badge = self.env.get("gamification.badge")
        BadgeUser = self.env.get("gamification.badge.user")
        if not Badge or not BadgeUser:
            return False
        badges = Badge.search([], limit=1)
        if not badges:
            return False
        for lead in self:
            row = lead.read(["user_id"])[0]
            user_id = row.get("user_id")
            if isinstance(user_id, (list, tuple)) and user_id:
                user_id = user_id[0]
            if not user_id:
                continue
            BadgeUser.create(
                {
                    "badge_id": badges.ids[0],
                    "user_id": user_id,
                    "comment": "Opportunity marked won",
                }
            )
        return True

    def action_mark_won(self):
        result = super().action_mark_won()
        self._gamification_signal()
        return result
