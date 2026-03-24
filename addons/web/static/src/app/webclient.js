import { mountNavBar } from "./navbar.js";
import { mountSidebar } from "./sidebar.js";
import { attachShellChrome } from "./shell_chrome.js";

export class WebClient {
  constructor(env, target) {
    this.env = env;
    this.target = target;
    this.navbarApp = null;
    this.sidebarApp = null;
  }

  mount() {
    if (!this.target) return;
    const navbar = document.getElementById("navbar");
    const sidebar = document.getElementById("app-sidebar");
    attachShellChrome(this.env);
    this.target.setAttribute("data-erp-runtime-version", this.env.bootstrap.version);
    this.target.classList.add("o-webclient-modern");
    this.env.services.router.start();
    this.env.services.shell.load().finally(() => {
      this.navbarApp = mountNavBar(this.env, navbar);
      this.sidebarApp = mountSidebar(this.env, sidebar);
      this._bootLegacyRuntime();
    });
  }

  _bootLegacyRuntime() {
    if (!this.env.bootstrap.legacyAdapterEnabled) return;
    if (!window.__erpLegacyRuntime || typeof window.__erpLegacyRuntime.start !== "function") return;
    if (window.__erpLegacyRuntime.booted) {
      this.env.state.legacyBooted = true;
      return;
    }
    window.__erpLegacyRuntime.start();
    this.env.state.legacyBooted = true;
  }
}
