(function () {
  window.FieldWidgets = window.FieldWidgets || {};

  function sanitize(html) {
    return String(html || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  }

  function createToolbar(editable) {
    const toolbar = document.createElement("div");
    toolbar.className = "o-html-toolbar";
    const actions = [
      { label: "B", command: "bold" },
      { label: "I", command: "italic" },
      { label: "Link", command: "createLink" },
    ];
    actions.forEach(function (action) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "o-btn o-btn-secondary";
      btn.textContent = action.label;
      btn.addEventListener("click", function () {
        let arg = null;
        if (action.command === "createLink") {
          arg = window.prompt("URL");
          if (!arg) {
            return;
          }
        }
        editable.focus();
        document.execCommand(action.command, false, arg);
      });
      toolbar.appendChild(btn);
    });
    return toolbar;
  }

  function render(container, fieldName, value, options) {
    const opts = options || {};
    const readonly = Boolean(opts.readonly);
    const safe = sanitize(value);

    container.innerHTML = "";
    if (readonly) {
      const display = document.createElement("div");
      display.className = "o-html-readonly";
      display.innerHTML = safe;
      container.appendChild(display);
      return;
    }

    const editable = document.createElement("div");
    editable.className = "o-html-editor";
    editable.contentEditable = "true";
    editable.innerHTML = safe;
    editable.setAttribute("data-field-name", fieldName || "");
    editable.addEventListener("input", function () {
      container.dispatchEvent(
        new CustomEvent("change", {
          bubbles: true,
          detail: { fieldName: fieldName, value: sanitize(editable.innerHTML) },
        })
      );
    });

    container.appendChild(createToolbar(editable));
    container.appendChild(editable);
  }

  window.FieldWidgets.html_widget = { render: render };
})();
