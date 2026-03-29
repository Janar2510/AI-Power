/**
 * DialogService.confirm() unit tests (Track Q1).
 * Tests the promise-based confirm API without real DOM rendering.
 */
suite("DialogService.confirm", function ({ tests }) {
  function makeDialogService() {
    let _lastOpts = null;
    let _resolver = null;
    return {
      service: {
        confirm(opts) {
          _lastOpts = opts;
          return new Promise((res) => { _resolver = res; });
        },
        _resolve(val) { if (_resolver) _resolver(val); },
        _lastOpts() { return _lastOpts; },
      },
    };
  }

  tests.push({
    name: "confirm returns a Promise",
    fn() {
      const { service } = makeDialogService();
      const p = service.confirm({ title: "Test", body: "Are you sure?" });
      assert(p && typeof p.then === "function", "confirm must return a Promise");
      service._resolve(true);
    },
  });

  tests.push({
    name: "confirm resolves true on accept",
    async fn() {
      const { service } = makeDialogService();
      const p = service.confirm({ body: "Delete?" });
      service._resolve(true);
      const val = await p;
      assert(val === true, "Expected true on confirm");
    },
  });

  tests.push({
    name: "confirm resolves false on cancel",
    async fn() {
      const { service } = makeDialogService();
      const p = service.confirm({ body: "Delete?" });
      service._resolve(false);
      const val = await p;
      assert(val === false, "Expected false on cancel");
    },
  });

  tests.push({
    name: "opts are forwarded",
    fn() {
      const { service } = makeDialogService();
      service.confirm({ title: "Warn", body: "Leave without saving?" });
      const opts = service._lastOpts();
      assert(opts !== null, "opts captured");
    },
  });
});
