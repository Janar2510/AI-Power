import { mountNavBar } from "./navbar.js";
import { mountSidebar } from "./sidebar.js";
import { attachShellChrome } from "./shell_chrome.js";
import { ActionContainer } from "./action_container.js";
import { LoadingIndicator } from "./loading_indicator.js";
import { mountComponent } from "./owl_bridge.js";
import { erpDebugBootLog } from "./debug_boot.js";

export class WebClient {
  constructor(env, target) {
    this.env = env;
    this.target = target;
    this.navbarApp = null;
    this.sidebarApp = null;
    /** Post-1.248 Phase 1: OWL app on #action-manager */
    this.actionContainerApp = null;
    /** Post-1.250.10: top-bar loading indicator OWL app */
    this.loadingIndicatorApp = null;
  }

  mount() {
    if (!this.target) return;
    const navbar = document.getElementById("navbar");
    const sidebar = document.getElementById("app-sidebar");
    const actionMgr = document.getElementById("action-manager");
    attachShellChrome(this.env);
    this.target.setAttribute("data-erp-runtime-version", this.env.bootstrap.version);
    this.target.classList.add("o-webclient-modern");
    this.env.services.router.start();
    /** Never block legacy boot forever if session/views/menu fetches hang (offline proxy, stalled TCP). */
    /** `Services.session.getSessionInfo` also uses a bounded fetch (see session.js). */
    const shellLoadDeadlineMs = 20000;
    const shellLoadedOrTimeout = Promise.race([
      this.env.services.shell
        .load()
        .then(function (r) {
          return { ok: true, result: r };
        })
        .catch(function (err) {
          erpDebugBootLog("shell_load_rejected", {
            message: err && err.message,
            stack: err && err.stack,
          });
          return { ok: false, rejected: true };
        }),
      new Promise(function (resolve) {
        setTimeout(function () {
          resolve({ ok: false, timedOut: true });
        }, shellLoadDeadlineMs);
      }),
    ]);
    shellLoadedOrTimeout.then(function (race) {
      if (race && race.timedOut) {
        erpDebugBootLog("shell_load_timeout", { deadlineMs: shellLoadDeadlineMs });
      }
    });
    shellLoadedOrTimeout.finally(() => {
      this.navbarApp = mountNavBar(this.env, navbar);
      this.sidebarApp = mountSidebar(this.env, sidebar);
      const loadingHost = document.getElementById("o-loading-indicator-host");
      if (loadingHost) {
        mountComponent(LoadingIndicator, loadingHost, { env: this.env }).then((app) => {
          this.loadingIndicatorApp = app;
        });
      }
      if (actionMgr) {
        mountComponent(ActionContainer, actionMgr, { env: this.env }).then((app) => {
          this.actionContainerApp = app;
        });
      }
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
