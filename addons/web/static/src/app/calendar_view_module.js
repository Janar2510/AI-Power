/**
 * Phase 757: Calendar month grid extracted from main.js.
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
    var viewsSvc = opts.viewsSvc;
    var attachActWindowFormLinkDelegation = opts.attachActWindowFormLinkDelegation;
    if (
      typeof getTitle !== "function" ||
      typeof renderViewSwitcher !== "function" ||
      typeof loadRecords !== "function" ||
      typeof dispatchListActWindowThenFormHash !== "function" ||
      typeof setViewAndReload !== "function" ||
      typeof setListState !== "function" ||
      typeof setActionStack !== "function" ||
      typeof attachActWindowFormLinkDelegation !== "function"
    ) {
      return false;
    }
    var model = opts.model;
    var route = opts.route;
    var records = opts.records || [];
    var searchTerm = opts.searchTerm || "";

    var calendarView = viewsSvc && viewsSvc.getView(model, "calendar");
    var dateField = (calendarView && calendarView.date_start) || "date_deadline";
    var stringField = (calendarView && calendarView.string) || "name";
    var title = getTitle(route);
    setActionStack([{ label: title, hash: route }]);
    var st0 = getListState();
    var calYear = (st0.route === route && st0.calendarYear) || new Date().getFullYear();
    var calMonth = (st0.route === route && st0.calendarMonth) || new Date().getMonth() + 1;
    setListState({
      model: model,
      route: route,
      searchTerm: searchTerm || "",
      viewType: "calendar",
      calendarYear: calYear,
      calendarMonth: calMonth,
    });
    var firstDay = new Date(calYear, calMonth - 1, 1);
    var lastDay = new Date(calYear, calMonth, 0);
    var startPad = firstDay.getDay();
    var daysInMonth = lastDay.getDate();
    var recordsByDate = {};
    (records || []).forEach(function (r) {
      var d = r[dateField];
      if (!d) return;
      var dateStr = typeof d === "string" ? d.slice(0, 10) : d && d.toISOString ? d.toISOString().slice(0, 10) : "";
      if (!dateStr) return;
      if (!recordsByDate[dateStr]) recordsByDate[dateStr] = [];
      recordsByDate[dateStr].push(r);
    });
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var calAddLabelCommon =
      route === "contacts"
        ? "Add contact"
        : route === "leads"
          ? "Add lead"
          : route === "orders"
            ? "Add order"
            : route === "products"
              ? "Add product"
              : route === "settings/users"
                ? "Add user"
                : "Add";
    var calAddLabel = model === "calendar.event" ? "Add meeting" : calAddLabelCommon;
    var monthTitleStr = firstDay.toLocaleString("default", { month: "long", year: "numeric" });
    var html = "<h2>" + title + "</h2>";
    if (window.AppCore && window.AppCore.CalendarViewChrome && typeof window.AppCore.CalendarViewChrome.buildToolbarHtml === "function") {
      html += window.AppCore.CalendarViewChrome.buildToolbarHtml({
        viewSwitcherHtml: renderViewSwitcher(route, "calendar"),
        monthTitle: monthTitleStr,
        searchTerm: searchTerm || "",
        addLabel: calAddLabel,
      });
    } else {
      html += '<p class="o-calendar-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
      html += renderViewSwitcher(route, "calendar");
      html +=
        '<button type="button" id="cal-prev" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Prev</button>';
      html +=
        '<span id="cal-title" style="min-width:140px;font-weight:600">' + monthTitleStr + "</span>";
      html +=
        '<button type="button" id="cal-next" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Next</button>';
      html +=
        '<button type="button" id="cal-today" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Today</button>';
      html +=
        '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);min-width:200px" value="' +
        (searchTerm || "").replace(/"/g, "&quot;") +
        '">';
      html +=
        '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
      html +=
        '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' +
        calAddLabel +
        "</button></p>";
    }
    html += '<div class="o-calendar o-calendar-grid">';
    dayNames.forEach(function (dn) {
      html += '<div class="o-calendar-weekday">' + dn + "</div>";
    });
    var totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
    for (var i = 0; i < totalCells; i++) {
      var dayNum = i - startPad + 1;
      var isEmpty = dayNum < 1 || dayNum > daysInMonth;
      var dateStr = isEmpty ? "" : calYear + "-" + String(calMonth).padStart(2, "0") + "-" + String(dayNum).padStart(2, "0");
      var dayRecs = dateStr ? recordsByDate[dateStr] || [] : [];
      var cellContent = isEmpty ? "" : '<span class="o-calendar-daynum">' + dayNum + "</span>";
      dayRecs.forEach(function (rec) {
        var label = (rec[stringField] || "Untitled").replace(/</g, "&lt;").slice(0, 30);
        cellContent +=
          '<div class="o-calendar-event-wrap"><a href="#' +
          route +
          "/edit/" +
          (rec.id || "") +
          '" class="o-calendar-event-link o-erp-actwindow-form-link" data-edit-id="' +
          (rec.id || "") +
          '">' +
          label +
          "</a></div>";
      });
      html +=
        '<div class="o-calendar-cell' + (isEmpty ? " o-calendar-cell--empty" : "") + '">' + cellContent + "</div>";
    }
    html += "</div>";
    main.innerHTML = html;
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
    var doReload = function () {
      var si = document.getElementById("list-search");
      loadRecords(model, route, si ? si.value.trim() : "", null, "calendar", null, 0, null);
    };
    var prevBtn = document.getElementById("cal-prev");
    var nextBtn = document.getElementById("cal-next");
    var todayBtn = document.getElementById("cal-today");
    if (prevBtn)
      prevBtn.onclick = function () {
        var live = getListState();
        var cy = live.calendarYear;
        var cm = live.calendarMonth;
        cm--;
        if (cm < 1) {
          cm = 12;
          cy--;
        }
        live.calendarYear = cy;
        live.calendarMonth = cm;
        doReload();
      };
    if (nextBtn)
      nextBtn.onclick = function () {
        var live = getListState();
        var cy = live.calendarYear;
        var cm = live.calendarMonth;
        cm++;
        if (cm > 12) {
          cm = 1;
          cy++;
        }
        live.calendarYear = cy;
        live.calendarMonth = cm;
        doReload();
      };
    if (todayBtn)
      todayBtn.onclick = function () {
        var now = new Date();
        var live = getListState();
        live.calendarYear = now.getFullYear();
        live.calendarMonth = now.getMonth() + 1;
        doReload();
      };
    var btnSearch = document.getElementById("btn-search");
    var searchInput = document.getElementById("list-search");
    if (btnSearch && searchInput) {
      var doSearch = function () {
        loadRecords(model, route, searchInput.value.trim(), null, "calendar", null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doSearch();
        }
      };
    }
    attachActWindowFormLinkDelegation(".o-calendar-grid", route, "calendarEventEditLink");
    return true;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.CalendarViewModule = { render: render };
})();
