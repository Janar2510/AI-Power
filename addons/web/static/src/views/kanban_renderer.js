/**
 * Kanban view renderer - groups records by field (e.g. stage_id)
 * Supports HTML5 drag-and-drop to change stage.
 */
(function () {
  window.ViewRenderers = window.ViewRenderers || {};
  window.ViewRenderers.kanban = function (container, model, records, options) {
    const groupBy = (options && options.default_group_by) || "stage_id";
    const fields = (options && options.fields) || ["name", "expected_revenue"];
    const stageNames = options && options.stageNames ? options.stageNames : {};
    const onStageChange = options && options.onStageChange;

    const byStage = {};
    (records || []).forEach(function (r) {
      let key = r[groupBy];
      if (Array.isArray(key) && key.length) key = key[0];
      key = key || 0;
      if (!byStage[key]) byStage[key] = [];
      byStage[key].push(r);
    });

    const stageIds = Object.keys(byStage).map(Number).sort(function (a, b) {
      return (stageNames[a] || "").localeCompare(stageNames[b] || "") || a - b;
    });
    if (stageIds.indexOf(0) < 0) stageIds.unshift(0);

    let html = '<div class="kanban-container" style="display:flex;gap:1rem;overflow-x:auto;padding:0.5rem">';
    stageIds.forEach(function (sid) {
      const label = sid ? (stageNames[sid] || "Stage " + sid) : "No stage";
      const recs = byStage[sid] || [];
      const colClass = "kanban-column" + (onStageChange ? " kanban-drop-target" : "");
      html += '<div class="' + colClass + '" data-stage-id="' + sid + '" style="min-width:280px;background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--space-sm);transition:background var(--duration-fast);border:1px solid var(--border-color)">';
      html += '<h4 style="margin:0 0 var(--space-sm) 0;font-size:0.9rem">' + (label + " (" + recs.length + ")").replace(/</g, "&lt;") + "</h4>";
      if (options && options.onQuickCreate) {
        html +=
          '<div class="kanban-quick-create" style="margin-bottom:var(--space-sm)">' +
          '<button type="button" class="kanban-qc-toggle o-btn o-btn-secondary" data-stage-id="' +
          sid +
          '" style="width:100%;margin-bottom:var(--space-xs)">+ Quick create</button>' +
          '<div class="kanban-qc-form" style="display:none;gap:var(--space-xs);flex-direction:column">' +
          '<input type="text" class="kanban-qc-name" placeholder="Name" style="width:100%;padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)">' +
          '<div style="display:flex;gap:var(--card-gap)"><button type="button" class="kanban-qc-save o-btn o-btn-primary">Create</button>' +
          '<button type="button" class="kanban-qc-cancel o-btn o-btn-secondary">Discard</button></div></div></div>';
      }
      recs.forEach(function (r) {
        const name = (r.name || "—").replace(/</g, "&lt;");
        const rev = r.expected_revenue != null ? r.expected_revenue : "";
        const draggable = onStageChange ? ' draggable="true"' : "";
        html += '<div class="kanban-card" data-id="' + (r.id || "") + '"' + draggable + ' style="background:white;padding:0.5rem;margin-bottom:0.5rem;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);cursor:pointer">';
        html += "<strong>" + name + "</strong>";
        if (rev !== "") html += "<br><span style='font-size:0.85rem;color:#666'>" + rev + "</span>";
        html += "</div>";
      });
      html += "</div>";
    });
    html += "</div>";
    container.innerHTML = html;

    container.querySelectorAll(".kanban-card").forEach(function (el) {
      el.onclick = function (e) {
        if (e.target.closest && e.target.closest(".kanban-card") === el) {
          const id = el.dataset.id;
          if (id && options && options.onCardClick) options.onCardClick(id);
        }
      };
    });

    if (options && options.onQuickCreate) {
      container.querySelectorAll(".kanban-qc-toggle").forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          const col = btn.closest(".kanban-column");
          const form = col && col.querySelector(".kanban-qc-form");
          if (!form) return;
          const open = form.style.display === "flex";
          container.querySelectorAll(".kanban-qc-form").forEach(function (f) {
            f.style.display = "none";
          });
          form.style.display = open ? "none" : "flex";
          if (!open) {
            const inp = form.querySelector(".kanban-qc-name");
            if (inp) inp.focus();
          }
        };
      });
      container.querySelectorAll(".kanban-qc-cancel").forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          const form = btn.closest(".kanban-qc-form");
          if (form) {
            form.style.display = "none";
            const inp = form.querySelector(".kanban-qc-name");
            if (inp) inp.value = "";
          }
        };
      });
      container.querySelectorAll(".kanban-qc-save").forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          const col = btn.closest(".kanban-column");
          const form = col && col.querySelector(".kanban-qc-form");
          const sid = col ? parseInt(col.getAttribute("data-stage-id"), 10) || 0 : 0;
          const inp = form && form.querySelector(".kanban-qc-name");
          const name = inp && inp.value ? inp.value.trim() : "";
          if (!name) return;
          options.onQuickCreate(sid, name, function () {
            if (form) {
              form.style.display = "none";
              if (inp) inp.value = "";
            }
          });
        };
      });
    }

    if (onStageChange) {
      let draggedId = null;
      container.querySelectorAll(".kanban-card").forEach(function (el) {
        el.addEventListener("dragstart", function (e) {
          draggedId = el.dataset.id;
          e.dataTransfer.setData("text/plain", el.dataset.id);
          e.dataTransfer.effectAllowed = "move";
          el.classList.add("kanban-dragging");
        });
        el.addEventListener("dragend", function () {
          el.classList.remove("kanban-dragging");
          container.querySelectorAll(".kanban-column").forEach(function (c) { c.classList.remove("kanban-drag-over"); });
        });
      });
      container.querySelectorAll(".kanban-column").forEach(function (col) {
        col.addEventListener("dragover", function (e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          col.classList.add("kanban-drag-over");
        });
        col.addEventListener("dragleave", function (e) {
          if (!col.contains(e.relatedTarget)) col.classList.remove("kanban-drag-over");
        });
        col.addEventListener("drop", function (e) {
          e.preventDefault();
          col.classList.remove("kanban-drag-over");
          const id = e.dataTransfer.getData("text/plain");
          const targetStageId = parseInt(col.dataset.stageId, 10) || 0;
          if (id && onStageChange) onStageChange(id, targetStageId);
        });
      });
    }
  };
})();
