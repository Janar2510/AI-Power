(function () {
  window.AppCore = window.AppCore || {};

  const Settings = {
    render(container, options) {
      const opts = options || {};
      container.innerHTML = "";
      const shell = document.createElement("section");
      shell.className = "o-settings-shell";

      const title = document.createElement("h2");
      title.textContent = "Settings";
      shell.appendChild(title);

      const theme = document.createElement("label");
      theme.className = "o-settings-row";
      theme.innerHTML = 'Theme <select class="o-input"><option value="light">Light</option><option value="dark">Dark</option></select>';
      shell.appendChild(theme);

      const save = document.createElement("button");
      save.type = "button";
      save.className = "o-btn o-btn-primary";
      save.textContent = "Save";
      save.addEventListener("click", function () {
        if (typeof opts.onSave === "function") {
          opts.onSave({ ok: true });
        }
      });
      shell.appendChild(save);

      container.appendChild(shell);
    },
    save(rpc, values) {
      if (!rpc || typeof rpc.callKw !== "function") {
        return Promise.resolve(true);
      }
      return rpc.callKw("res.users", "save_ui_settings", [values || {}], {});
    },
  };

  window.AppCore.Settings = Settings;
})();
