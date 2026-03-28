/**
 * Unit tests for AppCore.FormViewModule (Phase 742).
 */
(function () {
  const H = window.TestHelpers;
  const M = window.AppCore && window.AppCore.FormViewModule;

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
      results.errors.push("AppCore.FormViewModule.render not found");
      return results;
    }

    test("render outputs form shell with record-form and Save", function () {
      const el = H.createContainer();
      try {
        const handled = M.render(el, {
          model: "res.partner",
          route: "contacts",
          id: "1",
          isNew: false,
          renderBreadcrumbs: function () {
            return '<nav class="breadcrumbs"></nav>';
          },
          getTitle: function () {
            return "Contacts";
          },
          getReportName: function () {
            return null;
          },
          skeletonHtml: function () {
            return "<span>sk</span>";
          },
          buildInnerHtml: function () {
            return '<div class="attr-field" data-fname="name"><p><label>Name<br><input type="text" name="name"></label></p></div>';
          },
          wireForm: function () {},
        });
        H.assertTrue(handled);
        const form = el.querySelector("#record-form");
        H.assertTrue(!!form);
        H.assertTrue(el.textContent.indexOf("Edit Contact") >= 0);
        H.assertTrue(!!form.querySelector("#btn-save"));
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.form_view_module = run;
})();
