(function () {
  var _items = [];

  function add(name, spec) {
    var key = String(name || "").trim();
    if (!key || !spec || typeof spec.render !== "function") return;
    var filtered = _items.filter(function (it) { return it.name !== key; });
    filtered.push({
      name: key,
      sequence: Number(spec.sequence || 100),
      render: spec.render,
    });
    _items = filtered.sort(function (a, b) { return a.sequence - b.sequence; });
  }

  function getItems() {
    return _items.slice();
  }

  function renderAll(ctx) {
    return getItems().map(function (item) {
      return item.render(ctx || {});
    }).join("");
  }

  window.Services = window.Services || {};
  window.Services.systray = {
    add: add,
    getItems: getItems,
    renderAll: renderAll,
  };
})();
