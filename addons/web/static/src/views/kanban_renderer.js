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
    var foldKey = "erp_kanban_fold_" + model + "_" + groupBy;
    var folded = {};
    try { folded = JSON.parse(localStorage.getItem(foldKey) || "{}") || {}; } catch (_e) { folded = {}; }

    let html = '<div class="kanban-container" style="display:flex;gap:1rem;overflow-x:auto;padding:0.5rem">';
    stageIds.forEach(function (sid) {
      const label = sid ? (stageNames[sid] || "Stage " + sid) : "No stage";
      const recs = byStage[sid] || [];
      const isFolded = !!folded[sid];
      const colClass = "kanban-column" + (onStageChange ? " kanban-drop-target" : "");
      html += '<div class="' + colClass + '" data-stage-id="' + sid + '" style="min-width:280px;background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--space-sm);transition:background var(--duration-fast);border:1px solid var(--border-color)">';
      html += '<h4 style="margin:0 0 var(--space-sm) 0;font-size:0.9rem;display:flex;align-items:center;justify-content:space-between;gap:var(--card-gap)"><span>' + (label + " (" + recs.length + ")").replace(/</g, "&lt;") + '</span><button type="button" class="kanban-fold-toggle o-btn o-btn-secondary" data-stage-id="' + sid + '">' + (isFolded ? "Unfold" : "Fold") + "</button></h4>";
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
      if (!isFolded) {
        var visible = recs.slice(0, 20);
        visible.forEach(function (r) {
        const name = (r.name || "—").replace(/</g, "&lt;");
        const rev = r.expected_revenue != null ? r.expected_revenue : "";
        const draggable = onStageChange ? ' draggable="true"' : "";
        html += '<div class="kanban-card" data-id="' + (r.id || "") + '"' + draggable + ' style="background:var(--color-surface-1);padding:0.5rem;margin-bottom:0.5rem;border-radius:var(--radius-sm);box-shadow:0 1px 3px rgba(0,0,0,0.1);cursor:pointer;border:1px solid var(--border-color)">';
        html += '<label style="display:flex;gap:var(--space-xs);align-items:center"><input type="checkbox" class="kanban-select" data-id="' + (r.id || "") + '"><strong>' + name + "</strong></label>";
        if (options && typeof options.cardTemplate === "function") {
          html += '<div class="kanban-template">' + String(options.cardTemplate(r) || "") + "</div>";
        }
        if (rev !== "") html += "<br><span style='font-size:0.85rem;color:var(--text-muted)'>" + rev + "</span>";
        html += "</div>";
        });
        if (recs.length > 20) {
          html += '<button type="button" class="kanban-load-more o-btn o-btn-secondary" data-stage-id="' + sid + '" data-offset="20">Load more</button>';
        }
      }
      if (options && options.onCreateColumn && sid === 0) {
        html += '<button type="button" class="kanban-create-column o-btn o-btn-secondary" style="width:100%">+ Add column</button>';
      }
      html += "</div>";
    });
    html += '<div class="kanban-bulk-bar" style="display:none;position:sticky;bottom:0;left:0;right:0;background:var(--color-surface-1);border:1px solid var(--border-color);padding:var(--space-sm);border-radius:var(--radius-sm)">';
    html += '<span class="kanban-bulk-count">0 selected</span> <button type="button" class="o-btn o-btn-secondary kanban-bulk-clear">Clear</button>';
    if (options && options.onBulkAction) html += ' <button type="button" class="o-btn o-btn-primary kanban-bulk-run">Run bulk</button>';
    html += "</div>";
    html += "</div>";
    container.innerHTML = html;

    container.querySelectorAll(".kanban-fold-toggle").forEach(function (btnFold) {
      btnFold.onclick = function () {
        var sid = btnFold.getAttribute("data-stage-id");
        folded[sid] = !folded[sid];
        try { localStorage.setItem(foldKey, JSON.stringify(folded)); } catch (_e) {}
        window.ViewRenderers.kanban(container, model, records, options);
      };
    });

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

    var selected = {};
    var bulkBar = container.querySelector(".kanban-bulk-bar");
    function refreshBulkBar() {
      var ids = Object.keys(selected).filter(function (k) { return !!selected[k]; });
      if (!bulkBar) return;
      bulkBar.style.display = ids.length ? "block" : "none";
      var txt = bulkBar.querySelector(".kanban-bulk-count");
      if (txt) txt.textContent = ids.length + " selected";
    }
    container.querySelectorAll(".kanban-select").forEach(function (cb) {
      cb.onchange = function () {
        var id = cb.getAttribute("data-id");
        selected[id] = !!cb.checked;
        refreshBulkBar();
      };
    });
    if (bulkBar) {
      var clearBtn = bulkBar.querySelector(".kanban-bulk-clear");
      if (clearBtn) {
        clearBtn.onclick = function () {
          selected = {};
          container.querySelectorAll(".kanban-select").forEach(function (cb) { cb.checked = false; });
          refreshBulkBar();
        };
      }
      var runBtn = bulkBar.querySelector(".kanban-bulk-run");
      if (runBtn && options && options.onBulkAction) {
        runBtn.onclick = function () {
          var ids = Object.keys(selected).filter(function (k) { return !!selected[k]; });
          if (ids.length) options.onBulkAction(ids);
        };
      }
    }
    container.querySelectorAll(".kanban-load-more").forEach(function (btnMore) {
      btnMore.onclick = function () {
        var sid = parseInt(btnMore.getAttribute("data-stage-id"), 10) || 0;
        var offset = parseInt(btnMore.getAttribute("data-offset"), 10) || 20;
        var col = btnMore.closest(".kanban-column");
        if (!col) return;
        var subset = (byStage[sid] || []).slice(offset, offset + 20);
        subset.forEach(function (r) {
          var el = document.createElement("div");
          el.className = "kanban-card";
          el.setAttribute("data-id", r.id || "");
          if (onStageChange) el.setAttribute("draggable", "true");
          el.style.cssText = "background:var(--color-surface-1);padding:0.5rem;margin-bottom:0.5rem;border-radius:var(--radius-sm);box-shadow:0 1px 3px rgba(0,0,0,0.1);cursor:pointer;border:1px solid var(--border-color)";
          el.innerHTML = '<label style="display:flex;gap:var(--space-xs);align-items:center"><input type="checkbox" class="kanban-select" data-id="' + (r.id || "") + '"><strong>' + String(r.name || "—").replace(/</g, "&lt;") + "</strong></label>";
          col.insertBefore(el, btnMore);
        });
        var nextOffset = offset + 20;
        btnMore.setAttribute("data-offset", String(nextOffset));
        if (nextOffset >= (byStage[sid] || []).length) btnMore.remove();
      };
    });
    container.querySelectorAll(".kanban-create-column").forEach(function (btnAddCol) {
      btnAddCol.onclick = function () {
        var name = window.prompt("New column name:");
        if (!name || !name.trim()) return;
        if (options && options.onCreateColumn) options.onCreateColumn(name.trim());
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
