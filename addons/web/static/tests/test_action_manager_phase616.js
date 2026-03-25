/**
 * Phase 616: ActionManager.doActionButton — object vs action paths (checklist 437).
 */
(function () {
  window.Tests = window.Tests || {};
  window.Tests.action_manager_do_action_button = function () {
    if (!window.ActionManager || typeof window.ActionManager.doActionButton !== "function") {
      return Promise.resolve({
        pass: 0,
        fail: 1,
        errors: ["ActionManager.doActionButton missing"],
      });
    }
    var objectCalls = [];
    var mockRpc = {
      callKw: function (model, method, args, kw) {
        objectCalls.push({ model: model, method: method, args: args, kw: kw || {} });
        return Promise.resolve(true);
      },
    };
    var fetchCalls = [];
    var origFetch = window.fetch;
    window.fetch = function (url, init) {
      fetchCalls.push({ url: String(url), body: init && init.body });
      return Promise.resolve({
        ok: true,
        json: function () {
          return Promise.resolve({ ok: true, type: "ir.actions.act_window", res_model: "res.partner", res_id: 1 });
        },
      });
    };
    var pass = 0;
    var fail = 0;
    var errors = [];
    return window.ActionManager.doActionButton({
      rpc: mockRpc,
      buttonType: "object",
      model: "res.partner",
      method: "action_archive",
      resId: 7,
      kwargs: {},
    })
      .then(function () {
        if (objectCalls.length !== 1 || objectCalls[0].method !== "action_archive" || objectCalls[0].model !== "res.partner") {
          fail += 1;
          errors.push("object path: expected callKw res.partner action_archive");
        } else {
          pass += 1;
        }
        return window.ActionManager.doActionButton({
          rpc: mockRpc,
          buttonType: "action",
          actionId: 42,
          model: "sale.order",
          resId: 99,
          context: { active_id: 99 },
        });
      })
      .then(function () {
        if (fetchCalls.length < 1 || fetchCalls[0].url.indexOf("/web/action/run_server_action") < 0) {
          fail += 1;
          errors.push("action path: expected POST run_server_action");
        } else {
          pass += 1;
        }
        try {
          var raw = fetchCalls[0].body;
          var body = typeof raw === "string" ? JSON.parse(raw || "{}") : {};
          if (body.action_id !== 42) {
            fail += 1;
            errors.push("action path: action_id mismatch");
          } else {
            pass += 1;
          }
        } catch (e) {
          fail += 1;
          errors.push("action path: invalid JSON body");
        }
      })
      .catch(function (e) {
        fail += 1;
        errors.push(String(e && e.message ? e.message : e));
      })
      .then(function () {
        window.fetch = origFetch;
        return { pass: pass, fail: fail, errors: errors };
      });
  };
})();
