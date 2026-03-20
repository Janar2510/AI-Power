/**
 * Quick actions row using UIComponents.Button (dashboard-home spec).
 */
(function () {
  window.UIComponents = window.UIComponents || {};

  window.UIComponents.ShortcutsBar = {
    render(container, items) {
      if (!container) return;
      container.innerHTML = "";
      const title = document.createElement("h3");
      title.className = "o-shortcuts-title";
      title.textContent = "Quick Actions";
      container.appendChild(title);

      const bar = document.createElement("div");
      bar.className = "o-shortcuts-bar";

      const list = Array.isArray(items) ? items : [];
      list.forEach(function (item) {
        const href = item && item.href ? String(item.href) : "#";
        const label = item && item.label ? String(item.label) : "Action";
        if (window.UIComponents.Button) {
          const btn = window.UIComponents.Button({
            label: label,
            kind: item.kind || "primary",
            onClick: function (e) {
              e.preventDefault();
              window.location.hash = href.replace(/^#/, "");
            },
          });
          btn.setAttribute("data-icon", String(item.icon || ""));
          bar.appendChild(btn);
        } else {
          const a = document.createElement("a");
          a.href = "#" + href.replace(/^#/, "");
          a.className = "o-btn o-btn-primary";
          a.textContent = label;
          bar.appendChild(a);
        }
      });

      container.appendChild(bar);
    },
  };
})();
