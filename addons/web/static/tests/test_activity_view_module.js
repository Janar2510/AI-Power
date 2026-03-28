/**
 * Unit tests for AppCore.ActivityViewModule (Phase 758).
 */
(function () {
  const H = window.TestHelpers;
  const M = window.AppCore && window.AppCore.ActivityViewModule;

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
      results.errors.push("AppCore.ActivityViewModule.render not found");
      return results;
    }

    test("render outputs activity matrix table", function () {
      const el = H.createContainer();
      let listState = { route: "leads", stageFilter: null };
      let actionStack = [];
      try {
        const handled = M.render(el, {
          model: "crm.lead",
          route: "leads",
          records: [{ id: 1, name: "Lead A" }],
          activityTypes: [{ id: 1, name: "Call" }],
          activities: [],
          searchTerm: "",
          userId: 1,
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
          setActionStack: function (s) {
            actionStack = s;
          },
          rpc: { callKw: function () { return Promise.resolve(); } },
          showToast: function () {},
          attachActWindowFormLinkDelegation: function () {},
        });
        H.assertTrue(handled);
        H.assertTrue(!!el.querySelector(".o-activity-matrix-table"));
        H.assertTrue(el.textContent.indexOf("Lead A") >= 0);
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.activity_view_module = run;
})();
