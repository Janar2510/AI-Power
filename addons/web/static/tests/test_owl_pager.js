/**
 * Pager navigation unit tests (Track Q1).
 * Tests offset/limit model without mounting OWL component.
 */
suite("Pager navigation model", function ({ tests }) {
  function makePagerState(total, limit) {
    let offset = 0;
    const events = [];
    return {
      get offset() { return offset; },
      get limit() { return limit; },
      get total() { return total; },
      update({ offset: newOffset }) {
        offset = newOffset;
        events.push(newOffset);
      },
      navigate(dir) {
        if (dir === "next" && offset + limit < total) this.update({ offset: offset + limit });
        else if (dir === "prev" && offset > 0) this.update({ offset: Math.max(0, offset - limit) });
      },
      events,
    };
  }

  tests.push({
    name: "initial offset is 0",
    fn() {
      const p = makePagerState(100, 80);
      assertEqual(p.offset, 0);
    },
  });

  tests.push({
    name: "navigate next increments by limit",
    fn() {
      const p = makePagerState(200, 80);
      p.navigate("next");
      assertEqual(p.offset, 80);
    },
  });

  tests.push({
    name: "navigate prev decrements by limit",
    fn() {
      const p = makePagerState(200, 80);
      p.navigate("next");
      p.navigate("prev");
      assertEqual(p.offset, 0);
    },
  });

  tests.push({
    name: "navigate next stops at total",
    fn() {
      const p = makePagerState(100, 80);
      p.navigate("next"); // → 80
      p.navigate("next"); // → 80+80=160 > 100, should NOT navigate
      assertEqual(p.offset, 80, "Should not go past total");
    },
  });

  tests.push({
    name: "navigate prev clamps at 0",
    fn() {
      const p = makePagerState(100, 80);
      p.navigate("prev");
      assertEqual(p.offset, 0, "Should not go below 0");
    },
  });

  tests.push({
    name: "direct update emits event",
    fn() {
      const p = makePagerState(200, 80);
      p.update({ offset: 160 });
      assertEqual(p.events.length, 1);
      assertEqual(p.events[0], 160);
    },
  });
});
