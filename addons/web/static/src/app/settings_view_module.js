/**
 * Phase 776: Searchable settings shell (res.config-style UX; full execute RPC wired when host passes rpc).
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
    var title = esc(opts.title || "Settings");
    var sections = opts.sections || [
      { id: "general", label: "General", items: ["Company name", "Timezone", "Language"] },
      { id: "users", label: "Users & companies", items: ["Default access rights", "Email templates"] },
      { id: "technical", label: "Technical", items: ["Developer mode", "Log level"] },
    ];
    var html =
      '<section class="o-settings-view-module o-card-gradient" style="padding:var(--space-lg);max-width:56rem">' +
      "<h2>" +
      title +
      "</h2>" +
      '<p style="color:var(--text-muted);margin-bottom:var(--space-md)">Filter settings below; saving calls the host when <code>rpc</code> + <code>execute</code> are provided.</p>' +
      '<label class="o-settings-search-label" style="display:block;margin-bottom:var(--space-lg)">Search<br>' +
      '<input type="search" id="o-settings-search" class="o-settings-search-input" placeholder="Search settings…" autocomplete="off" style="width:100%;max-width:24rem;padding:var(--space-sm) var(--space-md);border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--color-surface-1);color:var(--color-text)"></label>' +
      '<div id="o-settings-sections">';
    sections.forEach(function (sec) {
      html +=
        '<div class="o-settings-block" data-settings-block="' +
        esc(sec.id) +
        '" style="margin-bottom:var(--space-xl)">' +
        '<h3 class="o-settings-block-title" style="margin:0 0 var(--space-md);font-size:1.05rem">' +
        esc(sec.label) +
        "</h3>" +
        '<ul class="o-settings-item-list" style="list-style:none;padding:0;margin:0;display:grid;gap:var(--space-sm)">';
      (sec.items || []).forEach(function (it) {
        html +=
          '<li class="o-settings-item" data-settings-label="' +
          esc(it) +
          '" style="padding:var(--space-sm) var(--space-md);border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--color-surface-1)">' +
          esc(it) +
          "</li>";
      });
      html += "</ul></div>";
    });
    html +=
      '</div><p style="margin-top:var(--space-xl)"><button type="button" id="o-settings-save" class="o-btn o-btn-primary">Save</button></p></section>';
    main.innerHTML = html;

    var input = main.querySelector("#o-settings-search");
    var blocks = main.querySelectorAll(".o-settings-block");
    function applyFilter(q) {
      var needle = String(q || "").toLowerCase().trim();
      blocks.forEach(function (blk) {
        var items = blk.querySelectorAll(".o-settings-item");
        var any = false;
        items.forEach(function (li) {
          var lab = (li.getAttribute("data-settings-label") || "").toLowerCase();
          var show = !needle || lab.indexOf(needle) >= 0;
          li.style.display = show ? "" : "none";
          if (show) any = true;
        });
        blk.style.display = any || !needle ? "" : "none";
      });
    }
    if (input) {
      input.addEventListener("input", function () {
        applyFilter(input.value);
      });
    }

    var saveBtn = main.querySelector("#o-settings-save");
    if (saveBtn && opts.rpc && typeof opts.rpc.callKw === "function" && typeof opts.executeMethod === "string") {
      saveBtn.onclick = function () {
        saveBtn.disabled = true;
        opts.rpc
          .callKw(opts.executeModel || "res.config.settings", opts.executeMethod || "execute", opts.executeArgs || [[]], opts.executeKwargs || {})
          .then(function () {
            if (opts.onSaved) opts.onSaved();
          })
          .catch(function () {})
          .finally(function () {
            saveBtn.disabled = false;
          });
      };
    } else if (saveBtn) {
      saveBtn.onclick = function () {
        if (opts.onSaved) opts.onSaved();
      };
    }
    return true;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.SettingsViewModule = { render: render };
})();
