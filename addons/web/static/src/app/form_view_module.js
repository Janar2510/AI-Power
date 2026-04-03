/**
 * Phase 742: extracted form shell + footer from main.js; main.js supplies field HTML and DOM wiring.
 */
(function () {
  function buildFormFooterHtml(opts) {
    var route = opts.route;
    var isNew = opts.isNew != null ? !!opts.isNew : !opts.id;
    var model = opts.model;
    var id = opts.id;
    var getReportName = opts.getReportName || function () {
      return null;
    };
    var FFA = window.AppCore && window.AppCore.FormFooterActions;
    if (FFA && typeof FFA.buildFormFooterActionsHtml === "function") {
      return FFA.buildFormFooterActionsHtml({
        route: route,
        isNew: isNew,
        model: model,
        reportName: !isNew ? getReportName(model) : null,
        recordId: id,
      });
    }
    var html = '<p><button type="submit" id="btn-save" class="o-btn o-btn-primary o-shortcut-target" data-shortcut="Alt+S">Save</button> ';
    html += '<a href="#' + route + '" id="form-cancel" style="margin-left:0.5rem">Cancel</a>';
    if (isNew && (model === "crm.lead" || model === "res.partner")) {
      html += ' <button type="button" id="btn-ai-fill" title="Extract fields from pasted text" style="margin-left:0.5rem;padding:0.5rem 1rem;background:var(--color-accent,#6366f1);color:white;border:none;border-radius:4px;cursor:pointer">AI Fill</button>';
    }
    if (!isNew) {
      html += ' <button type="button" id="btn-duplicate" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Duplicate</button>';
      var reportName = getReportName(model);
      if (reportName) {
        html += ' <a href="/report/html/' + reportName + "/" + id + '" target="_blank" rel="noopener" id="btn-print-form" class="o-btn o-btn-secondary o-shortcut-target" data-shortcut="Alt+P" style="margin-left:0.5rem;text-decoration:none">Print</a>';
        html += ' <button type="button" id="btn-preview-form" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Preview</button>';
      }
      html += ' <a href="#" id="btn-delete-form" style="margin-left:0.5rem;font-size:0.9rem;color:#c00">Delete</a>';
    }
    html += "</p>";
    return html;
  }

  function buildAiSidebarHtml(opts) {
    var isNew = opts.isNew != null ? !!opts.isNew : !opts.id;
    var model = opts.model;
    if (!isNew && (model === "crm.lead" || model === "project.task" || model === "helpdesk.ticket")) {
      var html = '<aside id="form-ai-sidebar" class="form-ai-sidebar" style="min-width:240px;max-width:280px;padding:var(--space-lg);background:var(--color-bg);border:1px solid var(--border-color);border-radius:var(--radius-md)">';
      html += '<h3 style="margin:0 0 var(--space-md);font-size:1rem">AI Suggestions</h3>';
      html += '<div id="ai-suggestions-list" style="font-size:0.9rem;color:var(--text-muted)">';
      if (typeof opts.skeletonHtml === "function") {
        html += opts.skeletonHtml(3, true);
      } else {
        html += "<span>…</span>";
      }
      html += "</div></aside>";
      return html;
    }
    return "";
  }

  function render(main, opts) {
    opts = opts || {};
    if (!main || !opts.model || !opts.route) return false;
    if (typeof opts.renderBreadcrumbs !== "function" || typeof opts.buildInnerHtml !== "function" || typeof opts.wireForm !== "function") {
      return false;
    }
    var route = opts.route;
    var id = opts.id;
    var isNew = opts.isNew != null ? !!opts.isNew : !id;
    var getTitle = opts.getTitle || function () {
      return "";
    };
    var title = getTitle(route);
    var formTitle = isNew ? "New " + title.slice(0, -1) : "Edit " + title.slice(0, -1);
    var html = opts.renderBreadcrumbs();
    html += "<h2>" + formTitle + "</h2>";
    html += '<div id="form-dirty-banner" class="form-dirty-banner" style="display:none">You have unsaved changes</div>';
    html += '<div class="form-with-sidebar" style="display:flex;gap:var(--space-xl);align-items:flex-start;flex-wrap:wrap">';
    html += '<form id="record-form" style="max-width:600px;flex:1;min-width:280px">';
    html += opts.buildInnerHtml();
    html += buildFormFooterHtml(opts);
    html += "</form>";
    html += buildAiSidebarHtml(opts);
    html += "</div>";
    main.innerHTML = html;
    opts.wireForm(main);
    return true;
  }

  // ── Form view helper functions (Phase 1.250.17) ──────────────────────────
  // Canonical implementations moved from main.js; main.js delegates via
  // window.AppCore.FormViewModule.helpers after install().

  var _formViewsSvc = null;

  function _configureFormHelpers(opts) {
    if (opts.viewsSvc) _formViewsSvc = opts.viewsSvc;
  }

  function getFormFields(model) {
    if (_formViewsSvc && model) {
      var v = _formViewsSvc.getView(model, "form");
      if (v && v.fields && v.fields.length) {
        var raw = v.fields.map(function (f) { return (typeof f === "object" ? f.name : f) || f; });
        var out = [];
        raw.forEach(function (f) {
          var cf = getMonetaryCurrencyFieldFallback(model, f);
          if (cf && out.indexOf(cf) < 0) out.push(cf);
          out.push(f);
        });
        return out;
      }
    }
    if (model === "crm.lead") return ["name", "type", "partner_id", "user_id", "stage_id", "ai_score", "ai_score_label", "currency_id", "expected_revenue", "description", "note_html", "tag_ids", "activity_ids", "message_ids"];
    if (model === "sale.order") return ["name", "partner_id", "date_order", "state", "currency_id", "amount_total", "order_line"];
    if (model === "product.product") return ["name", "list_price"];
    if (model === "res.users") return ["name", "login", "active", "group_ids"];
    if (model === "ir.attachment") return ["name", "res_model", "res_id", "datas"];
    return ["name", "is_company", "type", "email", "phone", "street", "street2", "city", "zip", "country_id", "state_id"];
  }

  function getMonetaryCurrencyFieldFallback(model, fieldName) {
    // Delegate to FV (legacy_main_form_views.js) if available
    var FV = window.__ERP_FORM_VIEWS || {};
    if (FV.getMonetaryCurrencyField) return FV.getMonetaryCurrencyField(model, fieldName);
    return null;
  }

  /**
   * Navigate from a form record back to its parent list route.
   * @param {string} route  list route (e.g. "contacts")
   */
  function navigateToList(route) {
    if (route) window.location.hash = "#" + route;
  }

  var formHelpers = {
    getFormFields: getFormFields,
    navigateToList: navigateToList,
    configure: _configureFormHelpers,
  };

  window.AppCore = window.AppCore || {};
  window.AppCore.FormViewModule = {
    render: render,
    helpers: formHelpers,
  };
})();
