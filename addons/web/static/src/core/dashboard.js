/**
 * Home dashboard — composable renderer (see design-system/specs/dashboard-home.md).
 */
(function () {
  window.AppCore = window.AppCore || {};

  var DEFAULT_DASHBOARD_LAYOUT = { widgets: ["kpis", "activity", "ai-insights", "shortcuts", "recent"] };
  var WIDGET_IDS = ["kpis", "activity", "ai-insights", "shortcuts", "recent"];
  var MODEL_TO_ROUTE = {
    "crm.lead": "leads",
    "res.partner": "contacts",
    "sale.order": "orders",
    "account.move": "invoices",
    "product.product": "products",
    "project.task": "tasks",
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildShell(container) {
    container.innerHTML = "";
    var root = el("div", "o-dashboard-root");

    var header = el("div", "o-dashboard-header");
    var title = el("h2", "o-dashboard-title", "Dashboard");
    header.appendChild(title);
    if (window.UIComponents && window.UIComponents.Button) {
      var customizeBtn = window.UIComponents.Button({
        label: "Customize",
        kind: "secondary",
        type: "button",
      });
      customizeBtn.id = "dashboard-customize-btn";
      customizeBtn.setAttribute("aria-expanded", "false");
      customizeBtn.setAttribute("aria-controls", "dashboard-customize-drawer");
      header.appendChild(customizeBtn);
    } else {
      var fallbackBtn = el("button", "o-btn o-btn-secondary", "Customize");
      fallbackBtn.type = "button";
      fallbackBtn.id = "dashboard-customize-btn";
      header.appendChild(fallbackBtn);
    }
    root.appendChild(header);

    var backdrop = el("div", "o-dashboard-drawer-backdrop");
    backdrop.id = "dashboard-drawer-backdrop";
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    root.appendChild(backdrop);

    var drawer = el("aside", "o-dashboard-drawer");
    drawer.id = "dashboard-customize-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-labelledby", "dashboard-drawer-title");
    drawer.hidden = true;

    var drawerTitle = el("h3", "o-dashboard-drawer-title", "Customize Dashboard");
    drawerTitle.id = "dashboard-drawer-title";
    drawer.appendChild(drawerTitle);

    var togglesEl = el("div", "o-dashboard-widget-toggles");
    togglesEl.id = "dashboard-widget-toggles";
    drawer.appendChild(togglesEl);

    var drawerActions = el("div", "o-dashboard-drawer-actions");
    if (window.UIComponents && window.UIComponents.Button) {
      var resetBtn = window.UIComponents.Button({ label: "Reset to Default", kind: "secondary", type: "button" });
      resetBtn.id = "dashboard-reset-btn";
      var closeBtn = window.UIComponents.Button({ label: "Close", kind: "secondary", type: "button" });
      closeBtn.id = "dashboard-customize-close";
      drawerActions.appendChild(resetBtn);
      drawerActions.appendChild(closeBtn);
    } else {
      drawerActions.appendChild(el("button", "o-btn o-btn-secondary", "Reset to Default"));
      drawerActions.lastChild.id = "dashboard-reset-btn";
      drawerActions.appendChild(el("button", "o-btn o-btn-secondary", "Close"));
      drawerActions.lastChild.id = "dashboard-customize-close";
    }
    drawer.appendChild(drawerActions);
    root.appendChild(drawer);

    var grid = el("div", "o-dashboard-grid");

    var kpis = el("div", "o-dashboard-kpis");
    kpis.id = "dashboard-kpis";
    kpis.setAttribute("data-widget", "kpis");
    grid.appendChild(kpis);

    var activity = el("div", "o-dashboard-widget-slot");
    activity.id = "dashboard-activity";
    activity.setAttribute("data-widget", "activity");
    grid.appendChild(activity);

    var ai = el("div", "o-dashboard-widget-slot");
    ai.id = "dashboard-ai-insights";
    ai.setAttribute("data-widget", "ai-insights");
    grid.appendChild(ai);

    var shortcuts = el("div", "o-dashboard-widget-slot");
    shortcuts.id = "dashboard-shortcuts";
    shortcuts.setAttribute("data-widget", "shortcuts");
    grid.appendChild(shortcuts);

    var recent = el("div", "o-dashboard-widget-slot");
    recent.id = "dashboard-recent";
    recent.setAttribute("data-widget", "recent");
    grid.appendChild(recent);

    root.appendChild(grid);
    container.appendChild(root);
  }

  function setDrawerOpen(open, root) {
    var drawer = root.querySelector("#dashboard-customize-drawer");
    var backdrop = root.querySelector("#dashboard-drawer-backdrop");
    var btn = root.querySelector("#dashboard-customize-btn");
    if (drawer) drawer.hidden = !open;
    if (backdrop) backdrop.hidden = !open;
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function renderKpiEmptyState(container) {
    if (!container || !window.UIComponents || !window.UIComponents.EmptyState) return;
    container.innerHTML = window.UIComponents.EmptyState.renderHTML({
      title: "No KPI metrics yet",
      subtitle: "Configure dashboard widgets in Settings, or add records so widget data can load.",
      icon: "◔",
    });
  }

  function loadKpis(rpc, root) {
    var container = root.querySelector("#dashboard-kpis");
    if (!container || !rpc || typeof rpc.callKw !== "function") return;
    container.innerHTML = "";
    rpc
      .callKw("ir.dashboard.widget", "search_read", [[]], { fields: ["id", "name", "model", "domain"], order: "sequence" })
      .then(function (widgets) {
        if (!widgets || !widgets.length) {
          renderKpiEmptyState(container);
          return;
        }
        var ids = widgets.map(function (w) {
          return w.id;
        });
        return rpc.callKw("ir.dashboard.widget", "get_data", [ids], {}).then(function (data) {
          if (!container) return;
          var appended = 0;
          (data || []).forEach(function (d, i) {
            var w = widgets[i];
            var route = MODEL_TO_ROUTE[w.model] || null;
            var hasDomain = d.domain && Array.isArray(d.domain) && d.domain.length;
            var href = route ? "#" + route + (hasDomain ? "?domain=" + encodeURIComponent(JSON.stringify(d.domain)) : "") : "#";
            if (window.UIComponents && window.UIComponents.KpiCard) {
              container.appendChild(
                window.UIComponents.KpiCard({
                  href: href,
                  label: d.name || "",
                  value: d.value,
                  trend: d.trend,
                })
              );
              appended++;
            }
          });
          if (!appended) {
            renderKpiEmptyState(container);
          }
        });
      })
      .catch(function () {
        renderKpiEmptyState(container);
      });
  }

  function loadActivities(rpc, root) {
    var container = root.querySelector("#dashboard-activity");
    if (!container || !rpc) return;
    var uidPromise =
      window.Services && window.Services.session
        ? window.Services.session.getSessionInfo()
        : Promise.resolve({ uid: 1 });
    uidPromise
      .then(function (info) {
        var u = (info && info.uid) || 1;
        return rpc.callKw("mail.activity", "search_read", [[["user_id", "=", u]]], {
          fields: ["res_model", "res_id", "summary", "date_deadline", "state"],
          limit: 10,
        });
      })
      .then(function (activities) {
        if (window.UIComponents && window.UIComponents.ActivityFeed) {
          window.UIComponents.ActivityFeed.render(container, activities || []);
        }
      })
      .catch(function () {
        container.innerHTML = "";
        var wrap = el("div", "o-activity-card o-card");
        wrap.appendChild(el("h3", "o-activity-title", "Upcoming Activities"));
        wrap.appendChild(el("p", "o-activity-empty", "Could not load."));
        container.appendChild(wrap);
      });
  }

  function loadAiInsights(root) {
    var insightsEl = root.querySelector("#dashboard-ai-insights");
    if (!insightsEl) return;
    insightsEl.innerHTML = "";
    var card = el("div", "o-ai-insights-card o-card");
    var h = el("h3", "o-ai-insights-title", "AI Insights");
    card.appendChild(h);
    var skel = el("div", "o-ai-skeleton-wrap");
    skel.appendChild(el("div", "o-ai-skeleton o-ai-skeleton-line"));
    skel.appendChild(el("div", "o-ai-skeleton o-ai-skeleton-line o-ai-skeleton-line--short"));
    card.appendChild(skel);
    insightsEl.appendChild(card);

    var aiHdrs = { "Content-Type": "application/json" };
    if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
      Object.assign(aiHdrs, window.Services.session.getAuthHeaders());
    }
    Promise.all([
      fetch("/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: aiHdrs,
        body: JSON.stringify({
          tool: "analyze_data",
          kwargs: { model: "crm.lead", measure: "expected_revenue", groupby: "stage_id", use_llm: true },
        }),
      }).then(function (r) {
        return r.json();
      }),
      fetch("/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: aiHdrs,
        body: JSON.stringify({
          tool: "analyze_kpi",
          kwargs: { model: "crm.lead", measure: "expected_revenue", groupby: "stage_id" },
        }),
      }).then(function (r) {
        return r.json();
      }),
      fetch("/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: aiHdrs,
        body: JSON.stringify({
          tool: "forecast_metric",
          kwargs: { model: "sale.order", measure: "amount_total", periods_ahead: 4 },
        }),
      }).then(function (r) {
        return r.json();
      }),
    ])
      .then(function (results) {
        var analyzeRes = results[0];
        var kpiRes = results[1];
        var forecastRes = results[2];
        insightsEl.innerHTML = "";
        var outCard = el("div", "o-ai-insights-card o-card");
        outCard.appendChild(el("h3", "o-ai-insights-title", "AI Insights"));
        var body = el("div", "o-ai-insights-body");
        var hasContent = false;
        if (!analyzeRes.error && analyzeRes.result) {
          var p = el("p", "o-ai-insight-text", String(analyzeRes.result));
          body.appendChild(p);
          hasContent = true;
        }
        if (!kpiRes.error && kpiRes.result && kpiRes.result.anomalies && kpiRes.result.anomalies.length) {
          var callout = el("div", "o-ai-insight-callout");
          callout.appendChild(
            el("strong", null, "Anomaly alerts: " + kpiRes.result.anomalies.length + " metric(s) deviate from trend.")
          );
          body.appendChild(callout);
          hasContent = true;
        }
        if (!forecastRes.error && forecastRes.result && forecastRes.result.forecast && forecastRes.result.forecast.length) {
          var fc = el("div", "o-ai-insight-forecast");
          fc.textContent =
            "Forecast (next 4 periods): " + (forecastRes.result.forecast || []).slice(0, 4).join(", ");
          body.appendChild(fc);
          hasContent = true;
        }
        if (!hasContent) {
          body.appendChild(el("p", "o-ai-insight-muted", "No insights available."));
        }
        outCard.appendChild(body);
        insightsEl.appendChild(outCard);
      })
      .catch(function () {
        insightsEl.innerHTML = "";
        var errCard = el("div", "o-ai-insights-card o-card");
        errCard.appendChild(el("h3", "o-ai-insights-title", "AI Insights"));
        errCard.appendChild(el("p", "o-ai-insight-muted", "Could not load."));
        insightsEl.appendChild(errCard);
      });
  }

  function loadShortcuts(root) {
    var shortcuts = root.querySelector("#dashboard-shortcuts");
    if (!shortcuts || !window.UIComponents || !window.UIComponents.ShortcutsBar) return;
    window.UIComponents.ShortcutsBar.render(shortcuts, [
      { label: "New Lead", href: "leads/new", icon: "lead" },
      { label: "New Contact", href: "contacts/new", icon: "contact" },
    ]);
  }

  function loadRecent(root) {
    var recentEl = root.querySelector("#dashboard-recent");
    if (!recentEl || !window.UIComponents || !window.UIComponents.RecentItems) return;
    try {
      var recent = JSON.parse(sessionStorage.getItem("erp_recent_items") || "[]");
      if (!recent.length) {
        recentEl.innerHTML = "";
        return;
      }
      window.UIComponents.RecentItems.render(
        recentEl,
        recent.slice(0, 5).map(function (r) {
          return { route: r.route, id: r.id, name: r.name, meta: r.ts || "" };
        })
      );
    } catch (e) {
      recentEl.innerHTML = "";
    }
  }

  function applyLayoutVisibility(root, widgets) {
    WIDGET_IDS.forEach(function (w) {
      var elW = root.querySelector('[data-widget="' + w + '"]');
      if (elW) {
        if (widgets.indexOf(w) >= 0) elW.classList.remove("o-dashboard-widget-hidden");
        else elW.classList.add("o-dashboard-widget-hidden");
      }
    });
  }

  function setupCustomize(rpc, root, rerender) {
    var uidPromise =
      window.Services && window.Services.session ? window.Services.session.getSessionInfo() : Promise.resolve({ uid: 1 });
    uidPromise
      .then(function (info) {
        var uid = (info && info.uid) || 1;
        return rpc
          .callKw("ir.dashboard.layout", "search_read", [[["user_id", "=", uid]]], { fields: ["id", "layout_json"], limit: 1 })
          .then(function (rows) {
            var layout = DEFAULT_DASHBOARD_LAYOUT;
            if (rows && rows[0] && rows[0].layout_json) {
              try {
                layout = JSON.parse(rows[0].layout_json);
              } catch (e) {}
            }
            var widgets = layout.widgets || DEFAULT_DASHBOARD_LAYOUT.widgets;
            applyLayoutVisibility(root, widgets);

            var togglesEl = root.querySelector("#dashboard-widget-toggles");
            if (togglesEl) {
              togglesEl.innerHTML = "";
              WIDGET_IDS.forEach(function (w) {
                var labelText =
                  w === "kpis" ? "KPIs" : w === "ai-insights" ? "AI Insights" : w.charAt(0).toUpperCase() + w.slice(1);
                var lab = el("label", "o-dashboard-toggle-label");
                var cb = document.createElement("input");
                cb.type = "checkbox";
                cb.setAttribute("data-widget", w);
                cb.checked = widgets.indexOf(w) >= 0;
                lab.appendChild(cb);
                lab.appendChild(document.createTextNode(" " + labelText));
                togglesEl.appendChild(lab);
              });
            }

            var drawer = root.querySelector("#dashboard-customize-drawer");
            var backdrop = root.querySelector("#dashboard-drawer-backdrop");
            var customizeBtn = root.querySelector("#dashboard-customize-btn");
            var closeBtn = root.querySelector("#dashboard-customize-close");
            var resetBtn = root.querySelector("#dashboard-reset-btn");

            function openDrawer() {
              setDrawerOpen(true, root);
            }
            function closeDrawer() {
              setDrawerOpen(false, root);
            }

            if (customizeBtn) customizeBtn.onclick = openDrawer;
            if (closeBtn) closeBtn.onclick = closeDrawer;
            if (backdrop) backdrop.onclick = closeDrawer;

            if (resetBtn) {
              resetBtn.onclick = function () {
                var layoutJson = JSON.stringify(DEFAULT_DASHBOARD_LAYOUT);
                rpc
                  .callKw("ir.dashboard.layout", "search_read", [[["user_id", "=", uid]]], { fields: ["id"], limit: 1 })
                  .then(function (rrows) {
                    if (rrows && rrows[0]) {
                      return rpc.callKw("ir.dashboard.layout", "write", [[rrows[0].id], { layout_json: layoutJson }], {});
                    }
                    return rpc.callKw("ir.dashboard.layout", "create", [{ user_id: uid, layout_json: layoutJson }], {});
                  })
                  .then(function () {
                    rerender();
                  })
                  .catch(function () {});
              };
            }

            if (togglesEl) {
              togglesEl.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
                cb.onchange = function () {
                  var w = cb.getAttribute("data-widget");
                  var wlist = [];
                  togglesEl.querySelectorAll('input[type="checkbox"]').forEach(function (c) {
                    if (c.checked) wlist.push(c.getAttribute("data-widget"));
                  });
                  var layoutJson = JSON.stringify({ widgets: wlist });
                  rpc
                    .callKw("ir.dashboard.layout", "search_read", [[["user_id", "=", uid]]], { fields: ["id"], limit: 1 })
                    .then(function (rrows) {
                      if (rrows && rrows[0]) {
                        return rpc.callKw("ir.dashboard.layout", "write", [[rrows[0].id], { layout_json: layoutJson }], {});
                      }
                      return rpc.callKw("ir.dashboard.layout", "create", [{ user_id: uid, layout_json: layoutJson }], {});
                    })
                    .then(function () {
                      layout.widgets = wlist;
                      var elW = root.querySelector('[data-widget="' + w + '"]');
                      if (elW) {
                        if (cb.checked) elW.classList.remove("o-dashboard-widget-hidden");
                        else elW.classList.add("o-dashboard-widget-hidden");
                      }
                    })
                    .catch(function () {});
                };
              });
            }
          });
      })
      .catch(function () {});
  }

  var Dashboard = {
    DEFAULT_LAYOUT: DEFAULT_DASHBOARD_LAYOUT,

    render(container, options) {
      var opts = options || {};
      var rpc = opts.rpc;
      if (!container || !rpc || typeof rpc.callKw !== "function") return;

      buildShell(container);
      var root = container.querySelector(".o-dashboard-root");
      if (!root) return;

      var self = this;
      function rerender() {
        self.render(container, opts);
      }

      loadKpis(rpc, root);
      loadActivities(rpc, root);
      loadAiInsights(root);
      loadShortcuts(root);
      loadRecent(root);
      setupCustomize(rpc, root, rerender);
    },

    /** @deprecated Use render(); kept for callers expecting metrics refresh API */
    refresh(container, rpc) {
      return this.render(container, { rpc: rpc });
    },
  };

  window.AppCore.Dashboard = Dashboard;
})();
