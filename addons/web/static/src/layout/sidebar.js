(function () {
  window.UILayout = window.UILayout || {};

  window.UILayout.sidebar = {
    render(container, items, options) {
      const opts = options || {};
      const entries = Array.isArray(items) ? items : [];
      const nav = document.createElement("nav");
      nav.className = "o-layout-sidebar";

      entries.forEach(function (item) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "o-layout-sidebar-item";
        button.textContent = String(item.label || item.name || "");
        if (item.key && item.key === opts.activeKey) {
          button.dataset.active = "true";
        }
        if (typeof opts.onSelect === "function") {
          button.addEventListener("click", function () {
            opts.onSelect(item);
          });
        }
        nav.appendChild(button);
      });

      container.innerHTML = "";
      container.appendChild(nav);
    },
  };
})();
