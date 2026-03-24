export function attachShellChrome(env) {
  const root = document.documentElement;
  const shell = document.getElementById("webclient");
  if (root) {
    root.setAttribute("data-erp-shell-owner", "modern");
  }
  if (shell) {
    shell.setAttribute("data-erp-runtime", "modern");
    shell.setAttribute("data-erp-shell-owner", "modern");
  }
  document.body.setAttribute("data-erp-runtime", "modern");
  env.services.shell.applyStoredSidebarState();
  env.services.theme.apply(env.bootstrap.theme);

  function syncViewport() {
    if (window.innerWidth > 1023) {
      env.services.shell.closeMobileSidebar();
    }
  }

  window.addEventListener("resize", syncViewport);

  const controller = {
    env: env,
    phase: "phase-2-shell-cutover",
    toggleSidebarCollapse() {
      return env.services.shell.toggleSidebarCollapse();
    },
    toggleMobileSidebar() {
      return env.services.shell.toggleMobileSidebar();
    },
    closeMobileSidebar() {
      return env.services.shell.closeMobileSidebar();
    },
    applyNavContext(detail) {
      env.services.shell.applyNavContext(detail);
    },
    refresh() {
      env.services.shell.refresh();
    },
  };

  window.__erpModernShellController = controller;
  return controller;
}
