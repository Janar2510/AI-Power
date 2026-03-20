(function () {
  window.FieldWidgets = window.FieldWidgets || {};

  function render(container, fieldName, value, options) {
    const opts = options || {};
    const readonly = Boolean(opts.readonly);
    const tagMap = new Map();
    const ids = new Set(Array.isArray(value) ? value : []);
    const labels = opts.labels || {};

    function renderTags() {
      tagList.innerHTML = "";
      ids.forEach(function (id) {
        const pill = document.createElement("span");
        pill.className = "o-badge o-badge-info";
        pill.textContent = String(labels[id] || ("#" + id));
        if (!readonly) {
          const close = document.createElement("button");
          close.type = "button";
          close.className = "o-badge-close";
          close.textContent = "x";
          close.setAttribute("aria-label", "Remove tag");
          close.addEventListener("click", function () {
            ids.delete(id);
            tagMap.delete(id);
            renderTags();
            container.dispatchEvent(
              new CustomEvent("change", {
                bubbles: true,
                detail: { fieldName: fieldName, value: Array.from(ids) },
              })
            );
          });
          pill.appendChild(close);
        }
        tagList.appendChild(pill);
      });
    }

    const wrapper = document.createElement("div");
    wrapper.className = "o-many2many-widget";
    const tagList = document.createElement("div");
    tagList.className = "o-many2many-tags";
    wrapper.appendChild(tagList);

    if (!readonly) {
      const controls = document.createElement("div");
      controls.className = "o-many2many-controls";
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = opts.placeholder || "Enter ID";
      input.className = "o-input";
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "o-btn o-btn-secondary";
      addBtn.textContent = "Add";
      addBtn.addEventListener("click", function () {
        const raw = input.value.trim();
        if (!raw) {
          return;
        }
        const id = Number(raw);
        if (!Number.isNaN(id)) {
          ids.add(id);
          tagMap.set(id, true);
          renderTags();
          container.dispatchEvent(
            new CustomEvent("change", {
              bubbles: true,
              detail: { fieldName: fieldName, value: Array.from(ids) },
            })
          );
        }
        input.value = "";
      });
      controls.appendChild(input);
      controls.appendChild(addBtn);
      wrapper.appendChild(controls);
    }

    container.innerHTML = "";
    container.appendChild(wrapper);
    renderTags();
  }

  window.FieldWidgets.many2many_widget = { render: render };
})();
