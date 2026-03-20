/**
 * Activity timeline with badges and relative deadline hints (dashboard-home spec).
 */
(function () {
  window.UIComponents = window.UIComponents || {};

  function deadlineLabel(dateStr) {
    if (!dateStr) return "";
    const d = new Date(String(dateStr) + (String(dateStr).length <= 10 ? "T12:00:00" : ""));
    if (Number.isNaN(d.getTime())) return String(dateStr);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((startThat - startToday) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 7) return "In " + diffDays + " days";
    if (diffDays < -1 && diffDays >= -7) return Math.abs(diffDays) + " days ago";
    return String(dateStr).slice(0, 10);
  }

  function stateVariant(state) {
    const s = String(state || "").toLowerCase();
    if (s === "done" || s === "completed") return "success";
    if (s === "cancel" || s === "cancelled") return "muted";
    if (s === "today" || s === "overdue") return "warning";
    return "info";
  }

  window.UIComponents.ActivityFeed = {
    render(container, activities) {
      if (!container) return;
      container.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "o-activity-card o-card";

      const title = document.createElement("h3");
      title.className = "o-activity-title";
      title.textContent = "Upcoming Activities";
      wrap.appendChild(title);

      const list = document.createElement("div");
      list.className = "o-activity-timeline";

      const rows = Array.isArray(activities) ? activities : [];
      if (!rows.length) {
        const empty = document.createElement("p");
        empty.className = "o-activity-empty";
        empty.textContent = "No upcoming activities.";
        wrap.appendChild(empty);
        container.appendChild(wrap);
        return;
      }

      rows.forEach(function (a) {
        const row = document.createElement("div");
        row.className = "o-activity-row";

        const dot = document.createElement("span");
        dot.className = "o-activity-dot";
        row.appendChild(dot);

        const col = document.createElement("div");
        col.className = "o-activity-body";

        const top = document.createElement("div");
        top.className = "o-activity-top";

        const summary = document.createElement("span");
        summary.className = "o-activity-summary";
        summary.textContent = String(a.summary || "Activity");

        top.appendChild(summary);
        if (window.UIComponents.Badge) {
          top.appendChild(
            window.UIComponents.Badge({ label: String(a.state || "planned"), variant: stateVariant(a.state) })
          );
        }

        const meta = document.createElement("div");
        meta.className = "o-activity-meta";
        meta.textContent = deadlineLabel(a.date_deadline);

        col.appendChild(top);
        col.appendChild(meta);
        row.appendChild(col);
        list.appendChild(row);
      });

      wrap.appendChild(list);
      container.appendChild(wrap);
    },
  };
})();
