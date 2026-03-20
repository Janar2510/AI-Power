(function () {
  window.UILayout = window.UILayout || {};

  window.UILayout.actionLayout = {
    render(container, options) {
      const opts = options || {};
      const shell = document.createElement("section");
      shell.className = "o-action-layout";

      const controlPanel = document.createElement("header");
      controlPanel.className = "o-action-layout-control-panel";
      if (opts.controlPanel instanceof Node) {
        controlPanel.appendChild(opts.controlPanel);
      }

      const content = document.createElement("div");
      content.className = "o-action-layout-content";
      if (opts.content instanceof Node) {
        content.appendChild(opts.content);
      }

      shell.appendChild(controlPanel);
      shell.appendChild(content);
      container.innerHTML = "";
      container.appendChild(shell);
    },
  };
})();
