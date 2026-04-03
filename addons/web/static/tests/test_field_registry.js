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
      "boolean_toggle",
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

    test("boolean_toggle uses o-boolean-toggle shell", function () {
      var h = W.render("res.partner", { name: "active", widget: "boolean_toggle" }, api);
      H.assertTrue(h.indexOf("o-boolean-toggle") >= 0 && h.indexOf('role="switch"') >= 0);
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

    test("remaining_days widget renders badge and date input", function () {
      var h = W.render("project.task", { name: "date_deadline", widget: "remaining_days" }, api);
      H.assertTrue(h.indexOf("o-remaining-days") >= 0, "remaining_days badge class present");
      H.assertTrue(h.indexOf('type="date"') >= 0, "remaining_days includes date input");
      H.assertTrue(h.indexOf('data-fname="date_deadline"') >= 0, "remaining_days sets data-fname");
    });

    test("remaining_days overdue shows correct class", function () {
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var iso = yesterday.toISOString().slice(0, 10);
      var h = W.render("project.task", { name: "date_deadline", widget: "remaining_days", value: iso }, api);
      H.assertTrue(h.indexOf("o-remaining-days--overdue") >= 0, "overdue class applied for past date");
    });

    test("remaining_days future ok shows correct class", function () {
      var future = new Date();
      future.setDate(future.getDate() + 10);
      var iso = future.toISOString().slice(0, 10);
      var h = W.render("project.task", { name: "date_deadline", widget: "remaining_days", value: iso }, api);
      H.assertTrue(h.indexOf("o-remaining-days--ok") >= 0, "ok class applied for future date >7d");
    });

    test("production-wired widgets render correct input types (1.250.10)", function () {
      var h;
      h = W.render("res.partner", { name: "email", widget: "email" }, api);
      H.assertTrue(h.indexOf('type="email"') >= 0, "email widget should use type=email");
      h = W.render("res.partner", { name: "phone", widget: "phone" }, api);
      H.assertTrue(h.indexOf('type="tel"') >= 0, "phone widget should use type=tel");
      h = W.render("sale.order", { name: "amount_total", widget: "monetary" }, api);
      H.assertTrue(h.indexOf('type="number"') >= 0 && h.indexOf('step="0.01"') >= 0, "monetary widget should use number step=0.01");
      h = W.render("sale.order", { name: "date_order", widget: "date" }, api);
      H.assertTrue(h.indexOf('type="date"') >= 0, "date widget should use type=date");
      h = W.render("project.task", { name: "date_deadline", widget: "date" }, api);
      H.assertTrue(h.indexOf('type="date"') >= 0, "date widget on task deadline should use type=date");
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.field_registry = run;
})();
