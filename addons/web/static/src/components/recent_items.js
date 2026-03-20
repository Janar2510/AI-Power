/**
 * Recent records list with avatar + link + meta (dashboard-home spec).
 */
(function () {
  window.UIComponents = window.UIComponents || {};

  window.UIComponents.RecentItems = {
    render(container, items) {
      if (!container) return;
      container.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "o-recent-card o-card";

      const title = document.createElement("h3");
      title.className = "o-recent-title";
      title.textContent = "Recent Items";
      wrap.appendChild(title);

      const ul = document.createElement("ul");
      ul.className = "o-recent-list";

      const list = Array.isArray(items) ? items : [];
      list.forEach(function (r) {
        const li = document.createElement("li");
        li.className = "o-recent-row";

        const route = (r.route || "").replace(/^#/, "");
        const id = r.id || "";
        const href = route && id ? "#" + route + "/edit/" + id : "#";

        if (window.UIComponents.Avatar) {
          li.appendChild(window.UIComponents.Avatar({ name: r.name || "Item" }));
        }

        const link = document.createElement("a");
        link.href = href;
        link.className = "o-recent-link";
        link.textContent = String(r.name || "Item");

        const meta = document.createElement("span");
        meta.className = "o-recent-meta";
        meta.textContent = r.meta ? String(r.meta) : "";

        li.appendChild(link);
        if (r.meta) li.appendChild(meta);
        ul.appendChild(li);
      });

      wrap.appendChild(ul);
      container.appendChild(wrap);
    },
  };
})();
