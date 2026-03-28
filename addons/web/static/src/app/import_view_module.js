/**
 * Phase 777: Import client surface — CSV drop + preview via AppCore.Import.
 */
(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function render(main, opts) {
    opts = opts || {};
    if (!main) return false;
    var model = opts.model || opts.resModel || "";
    var rpc = opts.rpc;
    var Imp = window.AppCore && window.AppCore.Import;
    main.innerHTML =
      '<section class="o-import-view-module o-card-gradient" style="padding:var(--space-lg);max-width:56rem">' +
      "<h2>Import data</h2>" +
      '<p style="color:var(--text-muted)">Model: <strong>' +
      esc(model || "(from route)") +
      "</strong></p>" +
      '<div id="o-import-drop" class="o-import-dropzone" style="margin:var(--space-lg) 0;padding:var(--space-xl);border:2px dashed var(--border-color);border-radius:var(--radius-md);text-align:center;background:var(--color-surface-1);color:var(--text-muted)">Drop a CSV file here or <label style="color:var(--color-primary);cursor:pointer"><input type="file" id="o-import-file" accept=".csv,text/csv" style="display:none">choose file</label></div>' +
      '<div id="o-import-preview" style="margin-top:var(--space-lg)"></div>' +
      '<p id="o-import-status" style="margin-top:var(--space-md);color:var(--text-muted)"></p>' +
      '<button type="button" id="o-import-run" class="o-btn o-btn-primary" disabled>Import rows</button>' +
      "</section>";

    var drop = main.querySelector("#o-import-drop");
    var fileIn = main.querySelector("#o-import-file");
    var preview = main.querySelector("#o-import-preview");
    var statusEl = main.querySelector("#o-import-status");
    var runBtn = main.querySelector("#o-import-run");
    var state = { headers: [], rows: [], fieldByCol: {} };

    function parseAndPreview(text) {
      if (!Imp || typeof Imp.parseCsv !== "function" || typeof Imp.renderPreview !== "function") {
        if (statusEl) statusEl.textContent = "Import helpers unavailable.";
        return;
      }
      var rows = Imp.parseCsv(text || "");
      if (!rows.length) {
        if (statusEl) statusEl.textContent = "Empty file.";
        return;
      }
      state.headers = rows[0];
      state.rows = rows.slice(1);
      var modelFields = (opts.modelFields || []).length
        ? opts.modelFields
        : state.headers.map(function (h) {
            return String(h || "")
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "_");
          });
      var prev = Imp.renderPreview(state.headers, state.rows, modelFields);
      preview.innerHTML = (prev && prev.table ? prev.table : "") + (prev && prev.mapping ? prev.mapping : "");
      state.fieldByCol = {};
      preview.querySelectorAll(".import-map-select").forEach(function (sel) {
        var idx = parseInt(sel.getAttribute("data-csv-idx"), 10);
        sel.onchange = function () {
          state.fieldByCol[idx] = sel.value || null;
        };
      });
      if (statusEl) statusEl.textContent = state.rows.length + " row(s) ready.";
      if (runBtn) runBtn.disabled = !model || !rpc;
    }

    function handleFile(f) {
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        parseAndPreview(r.result);
      };
      r.readAsText(f);
    }

    if (fileIn) {
      fileIn.addEventListener("change", function () {
        handleFile(fileIn.files && fileIn.files[0]);
      });
    }
    if (drop) {
      drop.addEventListener("dragover", function (e) {
        e.preventDefault();
        drop.style.borderColor = "var(--color-primary)";
      });
      drop.addEventListener("dragleave", function () {
        drop.style.borderColor = "var(--border-color)";
      });
      drop.addEventListener("drop", function (e) {
        e.preventDefault();
        drop.style.borderColor = "var(--border-color)";
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        handleFile(f);
      });
    }

    if (runBtn) {
      runBtn.onclick = function () {
        if (!Imp || typeof Imp.runBatchImport !== "function" || !rpc || !model) return;
        runBtn.disabled = true;
        var map = state.fieldByCol;
        Imp.runBatchImport(rpc, model, state.headers, state.rows, map)
          .then(function (res) {
            if (statusEl) statusEl.textContent = "Created " + (res && res.created) + " record(s).";
          })
          .catch(function () {})
          .finally(function () {
            runBtn.disabled = false;
          });
      };
    }
    return true;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.ImportViewModule = { render: render };
})();
