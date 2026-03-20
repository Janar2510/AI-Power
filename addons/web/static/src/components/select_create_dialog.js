/**
 * Select / Create dialog — name_search list + quick create (Phase 412).
 */
(function () {
  function esc(s) {
    return String(s || "").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function open(opts) {
    opts = opts || {};
    var comodel = opts.comodel || "";
    var title = opts.title || "Search";
    var rpc = window.Services && window.Services.rpc;
    if (!rpc || !comodel) {
      var v = window.prompt(opts.prompt || "Enter name", "");
      return Promise.resolve(v ? { id: null, name: v } : null);
    }
    return new Promise(function (resolve) {
      var overlay = document.createElement("div");
      overlay.className = "o-select-create-overlay";
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10000;display:flex;align-items:center;justify-content:center;padding:var(--space-lg)";
      var panel = document.createElement("div");
      panel.className = "o-select-create-panel o-card";
      panel.style.cssText =
        "background:var(--color-surface-1);border-radius:var(--radius-md);max-width:32rem;width:100%;padding:var(--space-lg);box-shadow:0 8px 32px rgba(0,0,0,0.2);border:1px solid var(--border-color)";
      panel.innerHTML =
        '<h3 style="margin:0 0 var(--space-md)">' +
        esc(title) +
        '</h3><input type="search" class="o-select-create-search" placeholder="Search..." style="width:100%;padding:var(--space-sm);margin-bottom:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)">' +
        '<div class="o-select-create-list" style="max-height:14rem;overflow-y:auto;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-bottom:var(--space-sm)"></div>' +
        '<div style="display:flex;gap:var(--card-gap);flex-wrap:wrap;justify-content:flex-end">' +
        '<button type="button" class="o-select-create-new o-btn o-btn-secondary">Create "<span class="o-sc-name"></span>"</button>' +
        '<button type="button" class="o-select-create-cancel o-btn o-btn-secondary">Cancel</button></div>';
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      var inp = panel.querySelector(".o-select-create-search");
      var listEl = panel.querySelector(".o-select-create-list");
      var nameSpan = panel.querySelector(".o-sc-name");

      function finish(val) {
        document.body.removeChild(overlay);
        resolve(val);
      }

      function doSearch(term) {
        var domain = opts.domain || [];
        rpc
          .callKw(comodel, "name_search", [term || "", domain, "ilike", opts.limit || 40], {})
          .then(function (rows) {
            listEl.innerHTML = "";
            (rows || []).forEach(function (r) {
              var id = r[0];
              var name = r[1] || String(id);
              var row = document.createElement("div");
              row.className = "o-select-create-row";
              row.style.cssText = "padding:var(--space-sm);cursor:pointer;border-bottom:1px solid var(--border-color)";
              row.textContent = name;
              row.onmousedown = function (e) {
                e.preventDefault();
                finish({ id: id, name: name });
              };
              listEl.appendChild(row);
            });
          })
          .catch(function () {
            listEl.innerHTML = '<p style="padding:var(--space-sm);color:var(--text-muted)">Search failed</p>';
          });
      }

      panel.querySelector(".o-select-create-cancel").onclick = function () {
        finish(null);
      };
      panel.querySelector(".o-select-create-new").onclick = function () {
        var nm = (inp.value || "").trim();
        if (!nm) return;
        if (opts.skipCreate) {
          finish({ id: null, name: nm });
          return;
        }
        rpc
          .callKw(comodel, "name_create", [nm], {})
          .then(function (res) {
            if (res && res[0]) finish({ id: res[0], name: res[1] || nm });
            else finish({ id: null, name: nm });
          })
          .catch(function () {
            finish({ id: null, name: nm });
          });
      };

      var tmo;
      inp.oninput = function () {
        var t = (inp.value || "").trim();
        nameSpan.textContent = t || "…";
        if (tmo) clearTimeout(tmo);
        tmo = setTimeout(function () {
          doSearch(t);
        }, 250);
      };
      overlay.onclick = function (e) {
        if (e.target === overlay) finish(null);
      };
      inp.focus();
      doSearch("");
    });
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.SelectCreateDialog = { open: open };
})();
