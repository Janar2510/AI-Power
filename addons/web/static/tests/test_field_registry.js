(function () {
  var H = window.TestHelpers;
  var W = window.FieldWidgets;

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

    if (!W || typeof W.render !== "function") {
      results.fail += 1;
      results.errors.push("FieldWidgets.render not found");
      return results;
    }

    var api = {
      getFieldLabel: function (_m, n) { return n; },
      getSelectionOptions: function () { return [["a", "A"], ["b", "B"]]; },
      getFieldMeta: function (_m, n) {
        if (n === "m2o_x") return { type: "many2one", comodel: "res.users" };
        if (n === "m2m_x") return { type: "many2many", comodel: "res.groups" };
        if (n === "line_ids") return { type: "one2many", comodel: "sale.order.line", inverse_name: "order_id" };
        if (n === "x_statusbar" || n === "stage_id") return { type: "many2one", comodel: "crm.stage" };
        return { type: "char" };
      },
    };
    [
      "priority",
      "state_selection",
      "handle",
      "email",
      "url",
      "phone",
      "copy_clipboard",
      "float_time",
      "radio",
      "many2many_checkboxes",
      "char",
      "text",
      "integer",
      "float",
      "boolean",
      "selection",
      "date",
      "datetime",
      "monetary",
      "html",
      "binary",
      "image",
      "many2one",
      "many2many_tags",
      "one2many",
      "statusbar",
    ].forEach(function (widget) {
      test("render " + widget, function () {
        var fname =
          widget === "many2one"
            ? "m2o_x"
            : widget === "many2many_tags"
              ? "m2m_x"
              : widget === "one2many"
                ? "line_ids"
                : widget === "statusbar"
                  ? "x_statusbar"
                  : "x_" + widget;
        var html = W.render("res.partner", { name: fname, widget: widget }, api);
        H.assertTrue(typeof html === "string" && html.length > 0, "html should be generated");
      });
    });

    test("priority uses o-priority-widget token class", function () {
      var h = W.render("res.partner", { name: "prio", widget: "priority" }, api);
      H.assertTrue(h.indexOf("o-priority-widget") >= 0 && h.indexOf("o-priority-star") >= 0);
    });

    test("state_selection uses o-state-selection-select", function () {
      var h = W.render("res.partner", { name: "st", widget: "state_selection" }, api);
      H.assertTrue(h.indexOf("o-state-selection-select") >= 0);
    });

    test("statusbar has o-statusbar shell and hidden input for wireForm", function () {
      var h = W.render("crm.lead", { name: "x_statusbar", widget: "statusbar", comodel: "crm.stage" }, api);
      H.assertTrue(h.indexOf("o-statusbar") >= 0 && h.indexOf('type="hidden"') >= 0 && h.indexOf("data-comodel") >= 0);
    });

    test("widgets used in addon view XML (phase 806 grep) all render", function () {
      var cases = [
        { widget: "statusbar", model: "crm.lead", field: { name: "x_sb", widget: "statusbar", comodel: "crm.stage" } },
        { widget: "many2many_tags", model: "res.partner", field: { name: "m2m_x", widget: "many2many_tags" } },
        { widget: "priority", model: "res.partner", field: { name: "x_priority", widget: "priority" } },
        { widget: "progressbar", model: "res.partner", field: { name: "x_progressbar", widget: "progressbar" } },
        { widget: "percentage", model: "crm.lead", field: { name: "ai_win_probability", widget: "percentage" } },
        { widget: "binary", model: "res.partner", field: { name: "x_binary", widget: "binary" } },
        { widget: "one2many", model: "res.partner", field: { name: "line_ids", widget: "one2many" } },
      ];
      cases.forEach(function (c) {
        var html = W.render(c.model, c.field, api);
        H.assertTrue(typeof html === "string" && html.length > 0, c.widget + " should render");
      });
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.field_registry = run;
})();
