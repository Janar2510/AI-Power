(function () {
  var H = window.TestHelpers;
  var K = window.ViewRenderers && window.ViewRenderers.kanban;

  function run() {
    var results = { pass: 0, fail: 0, errors: [] };
    function test(name, fn) {
      try {
        fn();
        results.pass += 1;
      } catch (e) {
        results.fail += 1;
        results.errors.push(name + ": " + e.message);
      }
    }

    if (!K) {
      results.fail += 1;
      results.errors.push("ViewRenderers.kanban not found");
      return results;
    }

    test("renders columns and cards", function () {
      var el = H.createContainer();
      try {
        K(el, "crm.lead", [{ id: 1, name: "A", stage_id: [10, "New"] }, { id: 2, name: "B", stage_id: [10, "New"] }], {
          stageNames: { 10: "New" },
        });
        H.assertTrue(el.querySelectorAll(".kanban-column").length >= 1);
        H.assertTrue(el.querySelectorAll(".kanban-card").length >= 2);
      } finally {
        H.removeContainer(el);
      }
    });

    test("supports fold toggle button", function () {
      var el = H.createContainer();
      try {
        K(el, "crm.lead", [{ id: 1, name: "A", stage_id: [10, "New"] }], { stageNames: { 10: "New" } });
        H.assertTrue(!!el.querySelector(".kanban-fold-toggle"));
      } finally {
        H.removeContainer(el);
      }
    });

    test("load more uses KanbanCardChrome markup when AppCore is registered (phase 620)", function () {
      window.AppCore = window.AppCore || {};
      var prev = window.AppCore.KanbanCardChrome;
      window.AppCore.KanbanCardChrome = {
        buildKanbanCardHtml: function (r) {
          var id = r && r.id != null ? String(r.id) : "";
          return (
            '<div class="kanban-card o-kanban-card o-card-gradient" data-id="' +
            id +
            '"><div class="o-kanban-card-head"><label class="o-kanban-card-select-row">' +
            '<input type="checkbox" class="kanban-select" data-id="' +
            id +
            '"><strong class="o-kanban-card-title">t</strong></label></div></div>'
          );
        },
      };
      var el = H.createContainer();
      try {
        var recs = [];
        var i;
        for (i = 1; i <= 25; i += 1) {
          recs.push({ id: i, name: "L" + i, stage_id: [10, "New"] });
        }
        K(el, "crm.lead", recs, { stageNames: { 10: "New" } });
        H.assertEqual(el.querySelectorAll(".kanban-card").length, 20, "first page");
        H.assertEqual(el.querySelectorAll(".o-kanban-card").length, 20, "chrome class on first page");
        var btn = el.querySelector(".kanban-load-more");
        H.assertTrue(!!btn, "load more button");
        btn.click();
        H.assertEqual(el.querySelectorAll(".kanban-card").length, 25, "after load more");
        H.assertEqual(el.querySelectorAll(".o-kanban-card").length, 25, "chrome class on appended rows");
      } finally {
        window.AppCore.KanbanCardChrome = prev;
        H.removeContainer(el);
      }
    });

    test("checkbox on load-more row updates bulk bar via delegation (phase 620)", function () {
      window.AppCore = window.AppCore || {};
      var prev = window.AppCore.KanbanCardChrome;
      window.AppCore.KanbanCardChrome = {
        buildKanbanCardHtml: function (r) {
          var id = r && r.id != null ? String(r.id) : "";
          return (
            '<div class="kanban-card o-kanban-card" data-id="' +
            id +
            '"><div class="o-kanban-card-head"><label><input type="checkbox" class="kanban-select" data-id="' +
            id +
            '"></label></div></div>'
          );
        },
      };
      var el = H.createContainer();
      try {
        var recs = [];
        var j;
        for (j = 1; j <= 25; j += 1) {
          recs.push({ id: j, name: "R" + j, stage_id: [10, "New"] });
        }
        K(el, "crm.lead", recs, { stageNames: { 10: "New" }, onBulkAction: function () {} });
        el.querySelector(".kanban-load-more").click();
        var cards = el.querySelectorAll(".kanban-card");
        var lastCb = cards[cards.length - 1].querySelector(".kanban-select");
        H.assertTrue(!!lastCb, "checkbox on last card");
        lastCb.checked = true;
        lastCb.dispatchEvent(new Event("change", { bubbles: true }));
        var bar = el.querySelector(".kanban-bulk-bar");
        H.assertTrue(bar && bar.style.display === "block", "bulk bar visible after delegated change");
      } finally {
        window.AppCore.KanbanCardChrome = prev;
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.kanban_renderer = run;
})();
