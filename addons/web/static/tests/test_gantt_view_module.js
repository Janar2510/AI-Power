/**
 * Unit tests for AppCore.GanttViewModule (Phase 753).
 */
(function () {
  const H = window.TestHelpers;
  const M = window.AppCore && window.AppCore.GanttViewModule;

  function run() {
    const results = { pass: 0, fail: 0, errors: [] };

    function test(name, fn) {
      try {
        fn();
        results.pass++;
      } catch (e) {
        results.fail++;
        results.errors.push(name + ": " + e.message);
      }
    }

    if (!M || typeof M.render !== "function") {
      results.fail++;
      results.errors.push("AppCore.GanttViewModule.render not found");
      return results;
    }

    test("render outputs gantt shell with gantt-view container", function () {
      const el = H.createContainer();
      let stack = null;
      let listState = { route: "", viewType: "list" };
      try {
        const handled = M.render(el, {
          model: "project.task",
          route: "tasks",
          records: [{ id: 1, name: "T1", date_start: "2026-01-01", date_deadline: "2026-01-05" }],
          searchTerm: "",
          dateStart: "date_start",
          dateStop: "date_deadline",
          getTitle: function () {
            return "Tasks";
          },
          renderViewSwitcher: function () {
            return '<button type="button" class="btn-view" data-view="list">List</button>';
          },
          loadRecords: function () {},
          dispatchListActWindowThenFormHash: function () {},
          setViewAndReload: function () {},
          getListState: function () {
            return listState;
          },
          setListState: function (s) {
            listState = s;
          },
          setActionStack: function (s) {
            stack = s;
          },
          attachActWindowFormLinkDelegation: function () {},
        });
        H.assertTrue(handled);
        const g = el.querySelector(".gantt-view");
        H.assertTrue(!!g);
        H.assertTrue(!!el.querySelector(".o-gantt-table"));
        H.assertTrue(!!stack && stack.length === 1 && stack[0].hash === "tasks");
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.gantt_view_module = run;
})();
