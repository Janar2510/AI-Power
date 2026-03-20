(function () {
  window.UIComponents = window.UIComponents || {};

  /**
   * @param {HTMLElement | null} parent
   * @param {string[]} columnLabels
   * @param {{ className?: string }} [options]
   * @returns {{ table: HTMLTableElement, tbody: HTMLTableSectionElement }}
   */
  window.UIComponents.SettingsTable = {
    create: function create(parent, columnLabels, options) {
      const opts = options || {};
      const table = document.createElement("table");
      table.className = opts.className || "o-settings-table";
      const thead = document.createElement("thead");
      const tr = document.createElement("tr");
      (columnLabels || []).forEach(function (label) {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = label;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      table.appendChild(tbody);
      if (parent) parent.appendChild(table);
      return { table: table, tbody: tbody };
    },
  };
})();
