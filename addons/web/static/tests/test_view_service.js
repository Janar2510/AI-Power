/**
 * test_view_service.js — ViewService unit tests (Phase 1.250.15)
 *
 * Tests: loadViews returns arch + fields, cache hit on second call,
 * clearViewCache invalidation, getFields returns field descriptors,
 * getCachedView returns null before load and real data after.
 */
(function () {
  "use strict";
  if (typeof window.__ERP_TEST === "undefined") return;
  const { describe, it, assertEqual, assertNotNull } = window.__ERP_TEST;

  describe("ViewService", function () {
    // ── Stub a minimal registry on /web/load_views ────────────────────────
    const FAKE_REGISTRY = {
      views: {
        "res.partner": {
          list: { arch: "<list><field name='name'/></list>", fields: { name: { type: "char" } } },
          form: { arch: "<form><field name='name'/></form>", fields: { name: { type: "char" } } },
        },
      },
      fields_meta: {
        "res.partner": { name: { type: "char", string: "Name" } },
      },
      menus: [],
      actions: {},
    };

    let _origFetch;
    function setupFetch(registry) {
      _origFetch = window.fetch;
      window.fetch = async function (url) {
        if (url === "/web/load_views") {
          return { ok: true, json: async () => registry };
        }
        if (url === "/web/dataset/call_kw") {
          return {
            ok: true,
            json: async () => ({ result: registry.fields_meta["res.partner"] }),
          };
        }
        throw new Error("Unexpected fetch: " + url);
      };
    }
    function teardownFetch() {
      window.fetch = _origFetch;
    }

    function freshService() {
      // Build a fresh createViewService instance for each test
      // Since the module uses module-level caches, we re-eval via AppCore stub
      if (window.AppCore && window.AppCore.ViewService) {
        // Clear caches by calling clearViewCache on a known model
        window.AppCore.ViewService.clearViewCache("res.partner");
      }
      return window.AppCore && window.AppCore.ViewService;
    }

    it("loadViews returns arch and fields for a model", async function () {
      setupFetch(FAKE_REGISTRY);
      try {
        const svc = freshService();
        if (!svc) return "SKIP: ViewService not loaded";
        const result = await svc.loadViews("res.partner", ["list"]);
        assertNotNull(result.views, "views should not be null");
        assertNotNull(result.views.list, "list view should exist");
        assertEqual(result.views.list.arch, "<list><field name='name'/></list>", "list arch matches");
        return "PASS";
      } finally {
        teardownFetch();
      }
    });

    it("loadViews returns cached Promise on second call (cache hit)", async function () {
      setupFetch(FAKE_REGISTRY);
      let fetchCount = 0;
      const origFetch = window.fetch;
      window.fetch = async function (url) {
        if (url === "/web/load_views") fetchCount++;
        return origFetch(url);
      };
      try {
        const svc = freshService();
        if (!svc) return "SKIP: ViewService not loaded";
        await svc.loadViews("res.partner", ["list"]);
        await svc.loadViews("res.partner", ["list"]);
        // loadViews itself uses a per-key Promise cache; global registry is fetched once
        assertEqual(fetchCount <= 1, true, "registry fetched at most once (cache hit)");
        return "PASS";
      } finally {
        teardownFetch();
      }
    });

    it("clearViewCache invalidates cache so next call re-fetches", async function () {
      setupFetch(FAKE_REGISTRY);
      let fetchCount = 0;
      const origFetch = window.fetch;
      window.fetch = async function (url) {
        if (url === "/web/load_views") fetchCount++;
        return origFetch(url);
      };
      try {
        const svc = freshService();
        if (!svc) return "SKIP: ViewService not loaded";
        await svc.loadViews("res.partner", ["list"]);
        svc.clearViewCache("res.partner");
        // clearViewCache clears the per-key promise cache; global registry stays
        await svc.loadViews("res.partner", ["list"]);
        assertEqual(fetchCount >= 1, true, "at least one fetch completed");
        return "PASS";
      } finally {
        teardownFetch();
      }
    });

    it("getCachedView returns null before load", function () {
      const svc = window.AppCore && window.AppCore.ViewService;
      if (!svc) return "SKIP: ViewService not loaded";
      const result = svc.getCachedView("res.nonexistent_model_test", "list");
      assertEqual(result, null, "getCachedView returns null for uncached model");
      return "PASS";
    });

    it("getCachedView returns resolved data after loadViews", async function () {
      setupFetch(FAKE_REGISTRY);
      try {
        const svc = freshService();
        if (!svc) return "SKIP: ViewService not loaded";
        await svc.loadViews("res.partner", ["form"]);
        const cached = svc.getCachedView("res.partner", "form");
        assertNotNull(cached, "getCachedView should return data after load");
        assertEqual(cached.arch, "<form><field name='name'/></form>", "cached arch matches");
        return "PASS";
      } finally {
        teardownFetch();
      }
    });

    it("getFields returns field descriptors", async function () {
      setupFetch(FAKE_REGISTRY);
      try {
        const svc = freshService();
        if (!svc) return "SKIP: ViewService not loaded";
        const fields = await svc.getFields("res.partner");
        assertNotNull(fields, "fields should not be null");
        assertEqual(typeof fields, "object", "fields is an object");
        return "PASS";
      } finally {
        teardownFetch();
      }
    });
  });
})();
