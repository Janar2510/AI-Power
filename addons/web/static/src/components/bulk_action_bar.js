(function () {
  window.UIComponents = window.UIComponents || {};

  window.UIComponents.BulkActionBar = {
    renderHTML: function renderHTML() {
      return '<div id="bulk-action-bar" class="o-bulk-action-bar" style="display:none">' +
        '<span id="bulk-selected-count" class="o-bulk-action-count"></span>' +
        '<button type="button" id="bulk-delete" class="o-btn o-btn-danger-solid">Delete Selected</button>' +
        '<button type="button" id="bulk-clear" class="o-btn o-btn-secondary">Clear</button>' +
        "</div>";
    },
  };
})();
