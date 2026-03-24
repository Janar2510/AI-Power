import { mountComponent } from "./owl_bridge.js";

const owl = window.owl;
const { Component, onMounted, onPatched, onWillUnmount, xml, useRef } = owl;

function cleanupHost(host) {
  if (!host || !host.__modernNavbarCleanup) return;
  host.__modernNavbarCleanup.forEach(function (cleanup) {
    if (typeof cleanup === "function") cleanup();
  });
  host.__modernNavbarCleanup = [];
}

export class NavBar extends Component {
  static template = xml`<div t-ref="host" class="o-modern-navbar-slot"></div>`;

  setup() {
    this.hostRef = useRef("host");
    this.unsubscribe = this.env.services.shell.subscribe(this.renderShell.bind(this));
    onMounted(this.renderShell.bind(this));
    onPatched(this.renderShell.bind(this));
    onWillUnmount(() => {
      cleanupHost(this.hostRef.el);
      if (typeof this.unsubscribe === "function") {
        this.unsubscribe();
      }
    });
  }

  renderShell() {
    const host = this.hostRef.el;
    const shell = this.env.services.shell.state;
    if (!host || !window.AppCore || !window.AppCore.Navbar) return;

    cleanupHost(host);
    window.AppCore.Navbar.render({
      navbar: host,
      appSidebar: document.getElementById("app-sidebar"),
      brandName: shell.brandName,
      navItems: [],
      selectedAppName: shell.currentAppName,
      staleBannerHtml: shell.staleBannerHtml,
      userCompanies: shell.userCompanies,
      userLangs: shell.userLangs,
      currentLang: shell.currentLang,
      theme: shell.theme,
    });

    if (window.__erpNavbarContract && typeof window.__erpNavbarContract.markDelegated === "function") {
      window.__erpNavbarContract.markDelegated(host);
    }

    const cleanups = [];
    const hamburger = host.querySelector(".nav-hamburger");
    if (hamburger && window.__erpModernShellController) {
      const onHamburgerClick = function () {
        window.__erpModernShellController.toggleMobileSidebar();
      };
      hamburger.addEventListener("click", onHamburgerClick);
      cleanups.push(function () {
        hamburger.removeEventListener("click", onHamburgerClick);
      });
    }

    const sidebarToggle = host.querySelector(".nav-sidebar-toggle");
    if (sidebarToggle && window.__erpModernShellController) {
      const onSidebarToggle = function () {
        const collapsed = window.__erpModernShellController.toggleSidebarCollapse();
        sidebarToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      };
      sidebarToggle.addEventListener("click", onSidebarToggle);
      cleanups.push(function () {
        sidebarToggle.removeEventListener("click", onSidebarToggle);
      });
    }

    host.__modernNavbarCleanup = cleanups;
  }
}

export function mountNavBar(env, target) {
  if (!target) return null;
  return mountComponent(NavBar, target, { env: env });
}
