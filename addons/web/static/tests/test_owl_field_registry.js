/**
 * fieldRegistry unit tests (Track Q1).
 */
suite("fieldRegistry", function ({ tests }) {
  function makeFieldRegistry() {
    const _map = {};
    return {
      add(name, widget) { _map[name] = widget; return this; },
      get(name) { return _map[name] || null; },
      getAll() { return Object.assign({}, _map); },
    };
  }

  tests.push({
    name: "add and get core field",
    fn() {
      const reg = makeFieldRegistry();
      function CharWidget() {}
      reg.add("char", CharWidget);
      assertEqual(reg.get("char"), CharWidget);
    },
  });

  tests.push({
    name: "unknown field returns null",
    fn() {
      const reg = makeFieldRegistry();
      assertEqual(reg.get("nonexistent"), null);
    },
  });

  tests.push({
    name: "getAll returns all registered widgets",
    fn() {
      const reg = makeFieldRegistry();
      reg.add("integer", function Int() {});
      reg.add("float", function Flt() {});
      const all = reg.getAll();
      assert("integer" in all, "integer missing");
      assert("float" in all, "float missing");
    },
  });

  tests.push({
    name: "overwrite field widget",
    fn() {
      const reg = makeFieldRegistry();
      function W1() {}
      function W2() {}
      reg.add("char", W1);
      // Allow overwrite (no-throw)
      reg.add("char", W2);
      // Last write wins
      assertEqual(reg.get("char"), W2);
    },
  });
});
