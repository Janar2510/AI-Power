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
      html += '<div class="' + colClass + '" data-stage-id="' + sid + '" style="min-width:280px;background:#f8f9fa;border-radius:8px;padding:0.5rem;transition:background 0.15s">';
      html += '<h4 style="margin:0 0 0.5rem;font-size:0.9rem">' + (label + " (" + recs.length + ")").replace(/</g, "&lt;") + "</h4>";
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
