import { mountComponent } from "./owl_bridge.js";

const owl = window.owl;
const { Component, onMounted, onPatched, onWillUnmount, xml, useRef } = owl;

function escHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sidebarAbbrev(name) {
  const normalized = String(name || "").trim();
  if (!normalized) return "?";
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return normalized.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function sidebarIconHtml(menu) {
  if (menu && menu.web_icon_data) {
    return '<img class="o-sidebar-icon" src="' + escHtml(menu.web_icon_data) + '" alt="" />';
  }
  if (menu && menu.web_icon) {
    const parts = String(menu.web_icon).split(",");
    if (parts[0]) {
      return '<i class="o-sidebar-icon ' + escHtml(parts[0].trim()) + '" aria-hidden="true"></i>';
    }
  }
  return '<span class="o-sidebar-abbrev">' + escHtml(sidebarAbbrev(menu && menu.name)) + "</span>";
}

function getFoldState() {
  try {
    return JSON.parse(localStorage.getItem("erp_sidebar_folds") || "{}");
  } catch (_error) {
    return {};
  }
}

function saveFoldState(next) {
  try {
    localStorage.setItem("erp_sidebar_folds", JSON.stringify(next || {}));
  } catch (_error) {
    /* noop */
  }
}

function resolveRoute(menu, viewsService) {
  const action = menu && menu.action && viewsService ? viewsService.getAction(menu.action) : null;
  if (action && window.ERPFrontendRuntime && window.ERPFrontendRuntime.menuUtils) {
    return window.ERPFrontendRuntime.menuUtils.actionToRoute(action);
  }
  if (window.ERPFrontendRuntime && window.ERPFrontendRuntime.menuUtils) {
    return window.ERPFrontendRuntime.menuUtils.menuToRoute(menu);
  }
  return null;
}

function buildSidebarBranch(nodes, depth, activeRoute, viewsService) {
  let html = "";
  const folds = getFoldState();
  (nodes || []).forEach(function (node) {
    const menu = node.menu || {};
    const route = resolveRoute(menu, viewsService);
    const isActive = !!route && activeRoute === route;
    const hasChildren = !!(node.children && node.children.length);

    if (hasChildren) {
      const folded = !!folds["menu:" + String(menu.id || menu.name || "")];
      html += '<section class="o-sidebar-category' + (folded ? " o-sidebar-category--folded" : "") + '" data-menu-id="' + escHtml(menu.id || menu.name || "") + '">';
      html += '<button type="button" class="o-sidebar-category-head" aria-expanded="' + (folded ? "false" : "true") + '">';
      html += '<span class="o-sidebar-chevron" aria-hidden="true">&#9662;</span>';
      html += sidebarIconHtml(menu);
      html += '<span class="o-sidebar-category-name">' + escHtml(menu.name || "") + "</span>";
      html += "</button>";
      html += '<div class="o-sidebar-category-body">';
      html += buildSidebarBranch(node.children, depth + 1, activeRoute, viewsService);
      html += "</div></section>";
      return;
    }

    html += '<a class="o-sidebar-link' + (isActive ? " o-sidebar-link--active" : "") + (depth > 0 ? " o-sidebar-link--nested" : "") + (route ? "" : " o-sidebar-link-disabled") + '" href="' + (route ? "#" + route : "#") + '">';
    if (depth === 0) {
      html += sidebarIconHtml(menu);
    }
    html += '<span class="o-sidebar-link-text">' + escHtml(menu.name || "") + "</span>";
    html += "</a>";
  });
  return html;
}

function wireSidebar(host, onAfterWire) {
  const cleanups = [];
  const folds = getFoldState();

  host.querySelectorAll(".o-sidebar-category-head").forEach(function (button) {
    const onClick = function () {
      const section = button.closest(".o-sidebar-category");
      if (!section) return;
      section.classList.toggle("o-sidebar-category--folded");
      const folded = section.classList.contains("o-sidebar-category--folded");
      button.setAttribute("aria-expanded", folded ? "false" : "true");
      const menuId = section.getAttribute("data-menu-id");
      folds["menu:" + menuId] = folded;
      saveFoldState(folds);
    };
    button.addEventListener("click", onClick);
    cleanups.push(function () {
      button.removeEventListener("click", onClick);
    });
  });

  host.querySelectorAll("a.o-sidebar-link").forEach(function (link) {
    const onClick = function () {
      if (window.innerWidth <= 1023 && window.__erpModernShellController) {
        window.__erpModernShellController.closeMobileSidebar();
      }
    };
    link.addEventListener("click", onClick);
    cleanups.push(function () {
      link.removeEventListener("click", onClick);
    });
  });

  if (typeof onAfterWire === "function") {
    onAfterWire();
  }
  host.__modernSidebarCleanup = cleanups;
}

function cleanupHost(host) {
  if (!host || !host.__modernSidebarCleanup) return;
  host.__modernSidebarCleanup.forEach(function (cleanup) {
    if (typeof cleanup === "function") cleanup();
  });
  host.__modernSidebarCleanup = [];
}

export class Sidebar extends Component {
  static template = xml`<div t-ref="host" class="o-modern-sidebar-slot"></div>`;

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
    if (!host) return;
    const shell = this.env.services.shell.state;
    const tree = shell.sidebarTree || [];
    const route = shell.route || "home";
    cleanupHost(host);
    host.innerHTML =
      '<div class="o-sidebar-inner"><div class="o-sidebar-scroll">' +
      (shell.staleBannerHtml ? '<div class="o-sidebar-stale">' + shell.staleBannerHtml + "</div>" : "") +
      '<nav class="o-sidebar-nav" role="navigation">' +
      (tree.length ? buildSidebarBranch(tree, 0, route, this.env.services.views) : '<p class="o-sidebar-empty">No menu items.</p>') +
      "</nav></div></div>";
    wireSidebar(host);
  }
}

export function mountSidebar(env, target) {
  if (!target) return null;
  return mountComponent(Sidebar, target, { env: env });
}
