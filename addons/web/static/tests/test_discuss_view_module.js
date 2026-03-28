/**
 * Unit tests for AppCore.DiscussViewModule (Phase 760).
 */
(function () {
  const H = window.TestHelpers;
  const M = window.AppCore && window.AppCore.DiscussViewModule;

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
      results.errors.push("AppCore.DiscussViewModule.render not found");
      return results;
    }

    test("render builds discuss layout when rpc resolves", function () {
      const el = H.createContainer();
      const rpc = {
        callKw: function (model, method) {
          if (model === "mail.channel" && method === "search_read") {
            return Promise.resolve([{ id: 1, name: "General" }]);
          }
          if (model === "mail.message" && method === "search_read") {
            return Promise.resolve([]);
          }
          return Promise.resolve([]);
        },
      };
      try {
        const handled = M.render(el, {
          rpc: rpc,
          showToast: function () {},
          channelId: null,
        });
        H.assertTrue(handled);
        H.assertTrue(!!el.querySelector(".o-discuss-app"));
        H.assertTrue(!!el.querySelector("#o-discuss-channel-list"));
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.discuss_view_module = run;
})();
