(function () {
  window.UIComponents = window.UIComponents || {};

  window.UIComponents.Pager = {
    renderHTML: function renderHTML(options) {
      var opts = options || {};
      var total = opts.total || 0;
      var offset = opts.offset || 0;
      var limit = opts.limit || 80;
      if (!total) return "";
      var from = offset + 1;
      var to = Math.min(offset + limit, total);
      var prevDisabled = offset <= 0 ? " disabled" : "";
      var nextDisabled = offset + limit >= total ? " disabled" : "";
      return '<p class="o-pager">' +
        '<span class="o-pager-label">' + from + "-" + to + " of " + total + "</span>" +
        '<button type="button" class="o-pager-prev o-btn o-btn-secondary"' + prevDisabled + ">Prev</button>" +
        '<button type="button" class="o-pager-next o-btn o-btn-secondary"' + nextDisabled + ">Next</button>" +
        "</p>";
    },
  };
})();
