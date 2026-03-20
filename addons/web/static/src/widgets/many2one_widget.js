(function () {
  window.FieldWidgets = window.FieldWidgets || {};

  function normalizeResult(item) {
    if (!Array.isArray(item) || item.length < 2) {
      return { id: null, display_name: "" };
    }
    return { id: item[0], display_name: String(item[1] || "") };
  }

  function render(container, fieldName, value, options) {
    const opts = options || {};
    const model = opts.model || "";
    const placeholder = opts.placeholder || "Search...";
    const readonly = Boolean(opts.readonly);
    const selected = opts.selected || null;

    if (readonly) {
      const text = document.createElement("span");
      text.className = "o-m2o-display";
      text.textContent = selected ? String(selected.display_name || "") : "";
      container.innerHTML = "";
      container.appendChild(text);
      return;
    }

    const input = document.createElement("input");
    input.type = "search";
    input.name = fieldName || "";
    input.placeholder = placeholder;
    input.className = "o-input o-input-many2one";
    input.value = selected ? String(selected.display_name || "") : "";

    const list = document.createElement("ul");
    list.className = "o-many2one-suggestions";

    let activeRequest = 0;
    input.addEventListener("input", async function () {
      const term = input.value.trim();
      list.innerHTML = "";
      if (!model || !term || !window.Services || !window.Services.rpc) {
        return;
      }
      activeRequest += 1;
      const requestId = activeRequest;
      try {
        const results = await window.Services.rpc.callKw(model, "name_search", [[term]], {
          limit: 8,
        });
        if (requestId !== activeRequest) {
          return;
        }
        (results || []).map(normalizeResult).forEach(function (row) {
          const item = document.createElement("li");
          item.className = "o-many2one-option";
          item.textContent = row.display_name;
          item.addEventListener("click", function () {
            input.value = row.display_name;
            input.dataset.recordId = String(row.id || "");
            list.innerHTML = "";
            container.dispatchEvent(
              new CustomEvent("change", {
                bubbles: true,
                detail: { fieldName: fieldName, value: row.id, display_name: row.display_name },
              })
            );
          });
          list.appendChild(item);
        });
      } catch (_error) {
        list.innerHTML = "";
      }
    });

    container.innerHTML = "";
    container.appendChild(input);
    container.appendChild(list);
    if (value) {
      input.dataset.recordId = String(value);
    }
  }

  window.FieldWidgets.many2one_widget = { render: render };
})();
