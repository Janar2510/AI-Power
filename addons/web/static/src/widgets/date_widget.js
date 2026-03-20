(function () {
  window.FieldWidgets = window.FieldWidgets || {};

  function toInputDate(value) {
    if (!value) {
      return "";
    }
    const raw = String(value);
    return raw.length >= 10 ? raw.slice(0, 10) : raw;
  }

  function render(container, fieldName, value, options) {
    const opts = options || {};
    const readonly = Boolean(opts.readonly);
    const normalized = toInputDate(value);

    container.innerHTML = "";
    if (readonly) {
      const span = document.createElement("span");
      span.className = "o-date-display";
      span.textContent = normalized || "";
      container.appendChild(span);
      return;
    }

    const input = document.createElement("input");
    input.type = "date";
    input.name = fieldName || "";
    input.value = normalized;
    input.className = "o-input o-input-date";
    input.addEventListener("change", function () {
      container.dispatchEvent(
        new CustomEvent("change", {
          bubbles: true,
          detail: { fieldName: fieldName, value: input.value || null },
        })
      );
    });
    container.appendChild(input);
  }

  window.FieldWidgets.date_widget = { render: render };
})();
