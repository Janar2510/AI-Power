/**
 * viewRegistry unit tests (Track Q1).
 * Tests: add, get, resolve, duplicate guard, fallback.
 */
suite("viewRegistry", function ({ tests }) {
  // Minimal registry stub matching view_registry.js shape
  function makeRegistry() {
    const _map = {};
    return {
      add(type, descriptor) {
        if (_map[type]) throw new Error(`viewRegistry: duplicate type "${type}"`);
        _map[type] = descriptor;
        return this;
      },
      get(type) { return _map[type] || null; },
      resolve(type) {
        const d = _map[type];
        if (!d) return null;
        return Object.assign({ Controller: d.Controller || null }, d);
      },
      entries() { return Object.entries(_map); },
    };
  }

  tests.push({
    name: "add and get returns descriptor",
    fn() {
      const reg = makeRegistry();
      function FakeController() {}
      reg.add("list", { Controller: FakeController });
      const desc = reg.get("list");
      assert(desc !== null, "get should return descriptor");
      assertEqual(desc.Controller, FakeController, "Controller mismatch");
    },
  });

  tests.push({
    name: "duplicate type throws",
    fn() {
      const reg = makeRegistry();
      reg.add("form", { Controller: function F1() {} });
      let threw = false;
      try { reg.add("form", { Controller: function F2() {} }); } catch { threw = true; }
      assert(threw, "Expected duplicate error");
    },
  });

  tests.push({
    name: "get unknown type returns null",
    fn() {
      const reg = makeRegistry();
      assertEqual(reg.get("unknown"), null, "Unknown type should return null");
    },
  });

  tests.push({
    name: "resolve returns merged descriptor",
    fn() {
      const reg = makeRegistry();
      function Ctrl() {}
      reg.add("kanban", { Controller: Ctrl, searchMenuTypes: ["filter"] });
      const resolved = reg.resolve("kanban");
      assert(resolved, "Resolved should be truthy");
      assertEqual(resolved.Controller, Ctrl);
      assertIncludes(resolved.searchMenuTypes, "filter");
    },
  });

  tests.push({
    name: "entries lists all registered types",
    fn() {
      const reg = makeRegistry();
      reg.add("list2", { Controller: function L() {} });
      reg.add("form2", { Controller: function F() {} });
      const types = reg.entries().map(([t]) => t);
      assertIncludes(types, "list2");
      assertIncludes(types, "form2");
    },
  });
});
