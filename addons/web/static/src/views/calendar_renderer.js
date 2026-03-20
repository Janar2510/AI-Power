(function () {
  window.ViewRenderers = window.ViewRenderers || {};
  window.ViewRenderers.calendar = {
    render(container, viewDef, records, options) {
      const opts = options || {};
      const modes = ["month", "week", "day"];
      let mode = modes.includes(opts.mode) ? opts.mode : "month";
      let cursor = new Date(opts.date || Date.now());
      const data = Array.isArray(records) ? records : [];

      function titleForCurrent() {
        if (mode === "day") {
          return cursor.toISOString().slice(0, 10);
        }
        return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      }

      function refresh() {
        body.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = "o-calendar-grid";
        data.forEach(function (event) {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "o-calendar-event";
          card.textContent = String(event.name || event.display_name || "Event");
          card.addEventListener("click", function () {
            if (typeof opts.onOpenRecord === "function") {
              opts.onOpenRecord(event);
            }
          });
          grid.appendChild(card);
        });
        body.appendChild(grid);
        title.textContent = titleForCurrent();
      }

      const shell = document.createElement("section");
      shell.className = "o-calendar-shell";
      const header = document.createElement("header");
      header.className = "o-calendar-header";

      const title = document.createElement("strong");
      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "o-btn o-btn-secondary";
      prev.textContent = "Prev";
      prev.addEventListener("click", function () {
        cursor.setDate(cursor.getDate() - 1);
        refresh();
      });

      const next = document.createElement("button");
      next.type = "button";
      next.className = "o-btn o-btn-secondary";
      next.textContent = "Next";
      next.addEventListener("click", function () {
        cursor.setDate(cursor.getDate() + 1);
        refresh();
      });

      const modeSelect = document.createElement("select");
      modeSelect.className = "o-input";
      modes.forEach(function (item) {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        if (item === mode) {
          option.selected = true;
        }
        modeSelect.appendChild(option);
      });
      modeSelect.addEventListener("change", function () {
        mode = modeSelect.value;
        refresh();
      });

      const createBtn = document.createElement("button");
      createBtn.type = "button";
      createBtn.className = "o-btn o-btn-primary";
      createBtn.textContent = "Create";
      createBtn.addEventListener("click", function () {
        if (typeof opts.onCreateRecord === "function") {
          opts.onCreateRecord({ date: cursor.toISOString().slice(0, 10), mode: mode });
        }
      });

      header.appendChild(prev);
      header.appendChild(next);
      header.appendChild(title);
      header.appendChild(modeSelect);
      header.appendChild(createBtn);

      const body = document.createElement("div");
      body.className = "o-calendar-body";
      shell.appendChild(header);
      shell.appendChild(body);

      container.innerHTML = "";
      container.appendChild(shell);
      refresh();
    },
  };
})();
