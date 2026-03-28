/**
 * Phase 758: Activity matrix extracted from main.js (crm.lead / project.task).
 */
(function () {
  function render(main, opts) {
    opts = opts || {};
    if (!main || !opts.model || !opts.route) return false;
    var getTitle = opts.getTitle;
    var renderViewSwitcher = opts.renderViewSwitcher;
    var loadRecords = opts.loadRecords;
    var dispatchListActWindowThenFormHash = opts.dispatchListActWindowThenFormHash;
    var setViewAndReload = opts.setViewAndReload;
    var setListState = opts.setListState;
    var setActionStack = opts.setActionStack;
    var getListState = opts.getListState || function () {
      return {};
    };
    var rpc = opts.rpc;
    var showToast = opts.showToast || function () {};
    var attachActWindowFormLinkDelegation = opts.attachActWindowFormLinkDelegation;
    var userId = opts.userId;
    if (
      typeof getTitle !== "function" ||
      typeof renderViewSwitcher !== "function" ||
      typeof loadRecords !== "function" ||
      typeof dispatchListActWindowThenFormHash !== "function" ||
      typeof setViewAndReload !== "function" ||
      typeof setListState !== "function" ||
      typeof setActionStack !== "function" ||
      !rpc ||
      typeof attachActWindowFormLinkDelegation !== "function" ||
      userId == null
    ) {
      return false;
    }
    var model = opts.model;
    var route = opts.route;
    var records = opts.records || [];
    var activityTypes = opts.activityTypes || [];
    var activities = opts.activities || [];
    var searchTerm = opts.searchTerm || "";

    var title = getTitle(route);
    var st = getListState();
    var stageFilter = st.route === route ? st.stageFilter : null;
    var currentView = "activity";
    var addLabel =
      route === "leads"
        ? "Add lead"
        : route === "tasks"
          ? "Add task"
          : "Add";
    setActionStack([{ label: title, hash: route }]);
    var html = "<h2>" + title + "</h2>";
    html += '<p class="o-activity-matrix-toolbar">';
    html += renderViewSwitcher(route, currentView);
    html +=
      '<div role="search" class="o-activity-matrix-search"><input type="text" id="list-search" placeholder="Search..." aria-label="Search" class="o-list-search-field" value="' +
      (searchTerm || "").replace(/"/g, "&quot;") +
      '">';
    html +=
      '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button></div>';
    html +=
      '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' +
      addLabel +
      "</button></p>";
    var byRecordType = {};
    (activities || []).forEach(function (a) {
      var key = a.res_id + "_" + (a.activity_type_id || 0);
      if (!byRecordType[key]) byRecordType[key] = [];
      byRecordType[key].push(a);
    });
    html += '<div class="activity-matrix o-activity-matrix-scroll"><table role="grid" class="o-activity-matrix-table"><thead><tr role="row"><th role="columnheader" class="o-activity-matrix-th o-activity-matrix-th--record">Record</th>';
    (activityTypes || []).forEach(function (t) {
      html +=
        '<th role="columnheader" class="o-activity-matrix-th">' +
        (t.name || "").replace(/</g, "&lt;") +
        "</th>";
    });
    html += "</tr></thead><tbody>";
    (records || []).forEach(function (r) {
      html +=
        '<tr role="row"><td role="gridcell" class="o-activity-matrix-td o-activity-matrix-td--record"><a href="#' +
        route +
        "/edit/" +
        (r.id || "") +
        '" class="o-erp-actwindow-form-link" data-edit-id="' +
        (r.id || "") +
        '">' +
        (r.name || "—").replace(/</g, "&lt;") +
        "</a></td>";
      (activityTypes || []).forEach(function (t) {
        var key = (r.id || "") + "_" + (t.id || 0);
        var cellActs = byRecordType[key] || [];
        var cellHtml = "";
        cellActs.forEach(function (a) {
          var d = a.date_deadline || "";
          var summary = (a.summary || "Activity").replace(/</g, "&lt;");
          cellHtml +=
            '<div class="o-activity-matrix-cell-line"><a href="#' +
            route +
            "/edit/" +
            (r.id || "") +
            '" class="o-erp-actwindow-form-link" data-edit-id="' +
            (r.id || "") +
            '">' +
            summary +
            (d ? ' <span class="o-activity-matrix-cell-meta">' + String(d).replace(/</g, "&lt;") + "</span>" : "") +
            "</a></div>";
        });
        cellHtml +=
          '<button type="button" class="btn-schedule-activity o-activity-schedule-btn" data-record-id="' +
          (r.id || "") +
          '" data-type-id="' +
          (t.id || "") +
          '" data-type-name="' +
          (t.name || "").replace(/"/g, "&quot;") +
          '">+ Schedule</button>';
        html += '<td role="gridcell" class="o-activity-matrix-td">' + cellHtml + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    if (!records || !records.length) {
      html = html.replace("</div>", '<p class="o-activity-matrix-empty">No records.</p></div>');
    }
    main.innerHTML = html;
    setListState({
      model: model,
      route: route,
      searchTerm: searchTerm || "",
      stageFilter: stageFilter,
      viewType: "activity",
    });
    main.querySelectorAll(".btn-view").forEach(function (btn) {
      btn.onclick = function () {
        var v = btn.dataset.view;
        if (v) setViewAndReload(route, v);
      };
    });
    var btnAdd = document.getElementById("btn-add");
    if (btnAdd)
      btnAdd.onclick = function () {
        dispatchListActWindowThenFormHash(route, "new", "viewChromeToolbarNew");
      };
    var btnSearch = document.getElementById("btn-search");
    var searchInput = document.getElementById("list-search");
    if (btnSearch && searchInput) {
      var doSearch = function () {
        loadRecords(model, route, searchInput.value.trim(), null, "activity", null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doSearch();
        }
      };
    }
    attachActWindowFormLinkDelegation(".o-activity-matrix-scroll", route, "activityMatrixEditLink");
    main.querySelectorAll(".btn-schedule-activity").forEach(function (btn) {
      btn.onclick = function () {
        var recordId = parseInt(btn.getAttribute("data-record-id"), 10);
        var typeId = parseInt(btn.getAttribute("data-type-id"), 10);
        var typeName = btn.getAttribute("data-type-name") || "Activity";
        var summary = window.prompt("Summary for " + typeName + ":", typeName);
        if (summary == null) return;
        var dateStr = window.prompt("Due date (YYYY-MM-DD):", new Date().toISOString().slice(0, 10));
        if (dateStr == null) return;
        rpc
          .callKw(
            "mail.activity",
            "create",
            [
              [
                {
                  res_model: model,
                  res_id: recordId,
                  summary: summary.trim() || typeName,
                  date_deadline: dateStr || new Date().toISOString().slice(0, 10),
                  activity_type_id: typeId || false,
                  user_id: userId,
                },
              ],
            ],
            {}
          )
          .then(function () {
            showToast("Activity scheduled", "success");
            loadRecords(model, route, searchTerm, null, "activity", null, 0, null);
          })
          .catch(function (err) {
            showToast((err && err.message) || "Failed to schedule", "error");
          });
      };
    });
    return true;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.ActivityViewModule = { render: render };
})();
