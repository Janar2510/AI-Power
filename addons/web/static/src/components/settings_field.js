(function () {
  window.UIComponents = window.UIComponents || {};

  /**
   * @param {string} labelText
   * @param {HTMLElement} control
   * @param {{ forId?: string }} [extra]
   * @returns {HTMLDivElement}
   */
  function fieldRow(labelText, control, extra) {
    const ex = extra || {};
    const row = document.createElement("div");
    row.className = "o-settings-field";
    if (labelText) {
      const lab = document.createElement("label");
      lab.className = "o-settings-field-label";
      lab.htmlFor = ex.forId || control.id || "";
      lab.textContent = labelText;
      row.appendChild(lab);
    }
    const wrap = document.createElement("div");
    wrap.className = "o-settings-field-control";
    wrap.appendChild(control);
    row.appendChild(wrap);
    return row;
  }

  window.UIComponents.SettingsField = {
    fieldRow: fieldRow,

    /**
     * @param {{ id?: string, label?: string, value?: string, placeholder?: string, type?: string, className?: string }} opts
     */
    textInput(opts) {
      const o = opts || {};
      const input = document.createElement("input");
      input.type = o.type || "text";
      if (o.id) input.id = o.id;
      input.className = "o-settings-input" + (o.className ? " " + o.className : "");
      input.value = o.value != null ? String(o.value) : "";
      if (o.placeholder) input.placeholder = o.placeholder;
      if (o.maxLength != null) input.maxLength = o.maxLength;
      if (o.pattern) input.pattern = o.pattern;
      if (o.readOnly) input.readOnly = true;
      const row = fieldRow(o.label || "", input, { forId: o.id });
      return { row: row, input: input };
    },

    /**
     * @param {{ id?: string, label?: string, value?: string, placeholder?: string }} opts
     */
    passwordWithToggle(opts) {
      const o = opts || {};
      const wrap = document.createElement("div");
      wrap.className = "o-settings-password";
      const input = document.createElement("input");
      input.type = "password";
      if (o.id) input.id = o.id;
      input.className = "o-settings-input";
      input.value = o.value != null ? String(o.value) : "";
      if (o.placeholder) input.placeholder = o.placeholder;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "o-settings-password-toggle o-btn o-btn-secondary";
      btn.textContent = "Show";
      btn.setAttribute("aria-label", "Show password");
      let visible = false;
      btn.addEventListener("click", function () {
        visible = !visible;
        input.type = visible ? "text" : "password";
        btn.textContent = visible ? "Hide" : "Show";
        btn.setAttribute("aria-label", visible ? "Hide password" : "Show password");
      });
      wrap.appendChild(input);
      wrap.appendChild(btn);
      const row = fieldRow(o.label || "", wrap, { forId: o.id });
      return { row: row, input: input, toggleBtn: btn };
    },

    /**
     * @param {{ id?: string, label?: string, value?: string, options: Array<{ value: string, label: string }> }} opts
     */
    select(opts) {
      const o = opts || {};
      const sel = document.createElement("select");
      if (o.id) sel.id = o.id;
      sel.className = "o-settings-input o-settings-select";
      (o.options || []).forEach(function (opt) {
        const op = document.createElement("option");
        op.value = opt.value;
        op.textContent = opt.label;
        if (o.value === opt.value) op.selected = true;
        sel.appendChild(op);
      });
      const row = fieldRow(o.label || "", sel, { forId: o.id });
      return { row: row, select: sel };
    },

    /**
     * @param {{ id?: string, label: string, checked?: boolean }} opts
     */
    toggleCheckbox(opts) {
      const o = opts || {};
      const outer = document.createElement("div");
      outer.className = "o-settings-field o-settings-field--toggle";
      const lab = document.createElement("label");
      lab.className = "o-settings-toggle";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      if (o.id) {
        cb.id = o.id;
        lab.htmlFor = o.id;
      }
      if (o.checked) cb.checked = true;
      const span = document.createElement("span");
      span.className = "o-settings-toggle-label";
      span.textContent = o.label || "";
      lab.appendChild(cb);
      lab.appendChild(span);
      outer.appendChild(lab);
      return { row: outer, input: cb };
    },

    /**
     * @param {{ id?: string, label?: string, value?: string | number, placeholder?: string, min?: string }} opts
     */
    numberInput(opts) {
      const o = opts || {};
      const input = document.createElement("input");
      input.type = "number";
      if (o.id) input.id = o.id;
      input.className = "o-settings-input";
      input.value = o.value != null ? String(o.value) : "";
      if (o.placeholder) input.placeholder = o.placeholder;
      if (o.min != null) input.min = String(o.min);
      const row = fieldRow(o.label || "", input, { forId: o.id });
      return { row: row, input: input };
    },
  };
})();
