(function () {
  window.ViewRenderers = window.ViewRenderers || {};
  window.ViewRenderers.gantt = {
    render(container, viewDef, records, options) {
      const opts = options || {};
      let scale = opts.scale || "week";
      const data = Array.isArray(records) ? records : [];

      function rowLabel(rec) {
        return String(rec.name || rec.display_name || ("#" + (rec.id || "")));
      }

      function build() {
        body.innerHTML = "";
        data.forEach(function (record) {
          const row = document.createElement("div");
          row.className = "o-gantt-row";
          const label = document.createElement("div");
          label.className = "o-gantt-row-label";
          label.textContent = rowLabel(record);
          const lane = document.createElement("div");
          lane.className = "o-gantt-row-lane";
          const bar = document.createElement("div");
          bar.className = "o-gantt-bar";
          bar.draggable = true;
          bar.textContent = String(record.stage_id || "task");
          bar.addEventListener("dragend", function () {
            if (typeof opts.onMove === "function") {
              opts.onMove(record);
            }
          });
          lane.appendChild(bar);
          row.appendChild(label);
          row.appendChild(lane);
          body.appendChild(row);
        });
      }

      const shell = document.createElement("section");
      shell.className = "o-gantt-shell";
      const header = document.createElement("header");
      header.className = "o-gantt-header";

      const title = document.createElement("strong");
      title.textContent = "Gantt (" + scale + ")";
      const select = document.createElement("select");
      ["day", "week", "month"].forEach(function (item) {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        if (item === scale) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        scale = select.value;
        title.textContent = "Gantt (" + scale + ")";
      });

      const today = document.createElement("span");
      today.className = "o-gantt-today";
      today.textContent = "Today";

      header.appendChild(title);
      header.appendChild(select);
      header.appendChild(today);

      const body = document.createElement("div");
      body.className = "o-gantt-body";
      shell.appendChild(header);
      shell.appendChild(body);

      container.innerHTML = "";
      container.appendChild(shell);
      build();
    },
  };
})();
