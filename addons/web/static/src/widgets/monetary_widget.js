(function () {
  window.FieldWidgets = window.FieldWidgets || {};

  function formatAmount(amount, currencyCode) {
    const value = Number(amount || 0);
    const code = currencyCode || "EUR";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function render(container, fieldName, value, options) {
    const opts = options || {};
    const readonly = Boolean(opts.readonly);
    const currencyCode = opts.currencyCode || (opts.record && opts.record.currency_code) || "EUR";
    const amount = Number(value || 0);

    container.innerHTML = "";
    if (readonly) {
      const span = document.createElement("span");
      span.className = "o-monetary-display";
      span.textContent = formatAmount(amount, currencyCode);
      container.appendChild(span);
      return;
    }

    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.01";
    input.className = "o-input o-input-monetary";
    input.name = fieldName || "";
    input.value = String(amount);

    const preview = document.createElement("small");
    preview.className = "o-monetary-preview";
    preview.textContent = formatAmount(amount, currencyCode);

    input.addEventListener("input", function () {
      const numeric = Number(input.value || 0);
      preview.textContent = formatAmount(numeric, currencyCode);
      container.dispatchEvent(
        new CustomEvent("change", {
          bubbles: true,
          detail: { fieldName: fieldName, value: numeric },
        })
      );
    });

    container.appendChild(input);
    container.appendChild(preview);
  }

  window.FieldWidgets.monetary_widget = { render: render };
})();
