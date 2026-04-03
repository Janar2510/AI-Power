/**
 * test_action_service_full.js — Action service full coverage (Phase 1.250.15)
 *
 * Covers all 5 action types via doAction + stack push/pop verification.
 */
(function () {
  "use strict";
  if (typeof window.__ERP_TEST === "undefined") return;
  const { describe, it, assertEqual, assertNotNull } = window.__ERP_TEST;

  describe("Action Service — full coverage", function () {
    function getSvc() {
      return window.Services && window.Services.action;
    }

    function withCleanStack(fn) {
      const svc = getSvc();
      if (!svc) return "SKIP: action service not loaded";
      const before = svc.getStack().length;
      svc.clearStack();
      try {
        return fn(svc);
      } finally {
        svc.clearStack();
        // restore previous entries count (best effort)
      }
    }

    it("doAction: ir.actions.act_window pushes to stack", function () {
      return withCleanStack(function (svc) {
        svc.doAction({ type: "ir.actions.act_window", res_model: "res.partner", view_mode: "list" });
        const stack = svc.getStack();
        assertEqual(stack.length >= 1, true, "stack has at least one entry");
        assertEqual(stack[stack.length - 1].type, "ir.actions.act_window", "type is act_window");
        return "PASS";
      });
    });

    it("doAction: ir.actions.act_url pushes to stack", function () {
      return withCleanStack(function (svc) {
        svc.doAction({ type: "ir.actions.act_url", url: "https://example.com", target: "_blank" });
        const stack = svc.getStack();
        assertEqual(stack.length >= 1, true, "stack has entry");
        assertEqual(stack[stack.length - 1].type, "ir.actions.act_url", "type is act_url");
        return "PASS";
      });
    });

    it("doAction: ir.actions.client pushes to stack", function () {
      return withCleanStack(function (svc) {
        svc.doAction({ type: "ir.actions.client", tag: "home" });
        const stack = svc.getStack();
        assertEqual(stack.length >= 1, true, "stack has entry");
        assertEqual(stack[stack.length - 1].type, "ir.actions.client", "type is client");
        return "PASS";
      });
    });

    it("doAction: ir.actions.report pushes to stack", function () {
      return withCleanStack(function (svc) {
        svc.doAction({ type: "ir.actions.report", report_name: "test.report", report_type: "qweb-pdf" });
        const stack = svc.getStack();
        assertEqual(stack.length >= 1, true, "stack has entry");
        assertEqual(stack[stack.length - 1].type, "ir.actions.report", "type is report");
        return "PASS";
      });
    });

    it("doAction: ir.actions.server pushes to stack", function () {
      return withCleanStack(function (svc) {
        svc.doAction({ type: "ir.actions.server", id: 42 });
        const stack = svc.getStack();
        assertEqual(stack.length >= 1, true, "stack has entry");
        assertEqual(stack[stack.length - 1].type, "ir.actions.server", "type is server");
        return "PASS";
      });
    });

    it("pushStackEntry / popStackEntry maintain LIFO order", function () {
      return withCleanStack(function (svc) {
        svc.pushStackEntry({ type: "ir.actions.act_window", payload: { id: 1 } });
        svc.pushStackEntry({ type: "ir.actions.client", payload: { id: 2 } });
        const popped = svc.popStackEntry();
        assertNotNull(popped, "popStackEntry returns an entry");
        assertEqual(popped.type, "ir.actions.client", "last pushed is first popped");
        assertEqual(svc.getStack().length, 1, "stack length is 1 after pop");
        return "PASS";
      });
    });

    it("clearStack empties the stack", function () {
      return withCleanStack(function (svc) {
        svc.pushStackEntry({ type: "ir.actions.act_window", payload: {} });
        svc.pushStackEntry({ type: "ir.actions.client", payload: {} });
        svc.clearStack();
        assertEqual(svc.getStack().length, 0, "stack is empty after clearStack");
        return "PASS";
      });
    });

    it("registerClientAction + getClientAction round-trip", function () {
      const svc = getSvc();
      if (!svc) return "SKIP: action service not loaded";
      const tag = "__test_action_" + Date.now();
      let called = false;
      svc.registerClientAction(tag, function () { called = true; });
      const fn = svc.getClientAction(tag);
      assertNotNull(fn, "registered action retrievable");
      fn();
      assertEqual(called, true, "registered function was called");
      return "PASS";
    });
  });
})();
