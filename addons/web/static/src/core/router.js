(function () {
  window.AppCore = window.AppCore || {};

  function safeHash(hash) {
    const h = String(hash || "").replace(/^#/, "").trim();
    return h || "home";
  }

  const Router = {
    breadcrumbs: [],
    pushBreadcrumb(label, hash) {
      this.breadcrumbs.push({ label: label || "", hash: safeHash(hash) });
    },
    popBreadcrumbTo(index) {
      if (index < 0 || index >= this.breadcrumbs.length) {
        return null;
      }
      this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
      return this.breadcrumbs[this.breadcrumbs.length - 1] || null;
    },
    renderBreadcrumbs() {
      if (this.breadcrumbs.length <= 1) {
        return "";
      }
      let html = '<nav class="breadcrumbs" aria-label="Breadcrumb">';
      this.breadcrumbs.forEach(function (entry, idx, all) {
        if (idx === all.length - 1) {
          html += '<span class="breadcrumb-item active">' + String(entry.label || "").replace(/</g, "&lt;") + "</span>";
        } else {
          html += '<a class="breadcrumb-item" href="javascript:void(0)" data-bc-idx="' + idx + '">' + String(entry.label || "").replace(/</g, "&lt;") + "</a>";
          html += '<span class="breadcrumb-sep">/</span>';
        }
      });
      html += "</nav>";
      return html;
    },
    getAction(route, menuList, actionResolver) {
      const r = safeHash(route);
      const menus = Array.isArray(menuList) ? menuList : [];
      for (let i = 0; i < menus.length; i += 1) {
        const menu = menus[i];
        const action = menu && menu.action ? actionResolver(menu.action) : null;
        if (action && action._route_slug === r) {
          return action;
        }
      }
      return null;
    },
    navigate(hash) {
      const route = safeHash(hash);
      window.location.hash = "#" + route;
      return route;
    },
  };

  window.AppCore.Router = Router;
})();
