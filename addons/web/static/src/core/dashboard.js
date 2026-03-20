(function () {
  window.AppCore = window.AppCore || {};

  const Dashboard = {
    render(container, metrics) {
      const items = Array.isArray(metrics) ? metrics : [];
      container.innerHTML = "";
      const shell = document.createElement("section");
      shell.className = "o-dashboard-shell";
      items.forEach(function (item) {
        const card = document.createElement("article");
        card.className = "o-kpi-card";
        card.innerHTML =
          '<h3 class="o-kpi-title">' + String(item.label || "") + "</h3>" +
          '<p class="o-kpi-value">' + String(item.value != null ? item.value : "-") + "</p>";
        shell.appendChild(card);
      });
      container.appendChild(shell);
    },
    refresh(container, rpc) {
      if (!rpc || typeof rpc.callKw !== "function") {
        return Promise.resolve();
      }
      return rpc.callKw("ir.dashboard", "get_metrics", [[]], {}).then((metrics) => {
        this.render(container, metrics || []);
      });
    },
  };

  window.AppCore.Dashboard = Dashboard;
})();
