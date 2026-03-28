/**
 * Unit tests for AppCore.CalendarViewModule (Phase 757).
 */
(function () {
  const H = window.TestHelpers;
  const M = window.AppCore && window.AppCore.CalendarViewModule;

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
      results.errors.push("AppCore.CalendarViewModule.render not found");
      return results;
    }

    test("render outputs o-calendar-grid month grid", function () {
      const el = H.createContainer();
      let listState = { route: "", calendarYear: 2026, calendarMonth: 3 };
      const viewsSvc = {
        getView: function () {
          return { date_start: "date_deadline", string: "name" };
        },
      };
      try {
        const handled = M.render(el, {
          model: "crm.lead",
          route: "leads",
          records: [],
          searchTerm: "",
          viewsSvc: viewsSvc,
          getTitle: function () {
            return "Leads";
          },
          renderViewSwitcher: function () {
            return "";
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
          setActionStack: function () {},
          attachActWindowFormLinkDelegation: function () {},
        });
        H.assertTrue(handled);
        const grid = el.querySelector(".o-calendar-grid");
        H.assertTrue(!!grid);
        H.assertTrue(el.querySelectorAll(".o-calendar-weekday").length >= 7);
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.calendar_view_module = run;
})();
