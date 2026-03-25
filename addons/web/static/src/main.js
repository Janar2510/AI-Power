/**
 * ERP Platform Web Client - Data-driven menus, actions, list/form views
 */
(function () {
  const frontendBootstrap = window.__erpFrontendBootstrap || {};
  const modernShellOwner = frontendBootstrap.runtime === "modern";
  const main = document.getElementById('action-manager');
  const navbar = document.getElementById('navbar');
  const appShell = document.getElementById('webclient');
  const appSidebar = document.getElementById('app-sidebar');
  if (!main) return;

  function showToast(message, type) {
    type = type || 'info';
    if (window.UIComponents && typeof window.UIComponents.Toast === "function") {
      window.UIComponents.Toast({ message: message || "", type: type });
      return;
    }
    const container = document.getElementById('toast-container');
    if (!container) return;
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<span>' + (message || '').replace(/</g, '&lt;') + '</span><button type="button" class="toast-close" aria-label="Close">&times;</button>';
    container.appendChild(el);
    const dismiss = function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      setTimeout(function () { el.remove(); }, 200);
    };
    el.querySelector('.toast-close').onclick = dismiss;
    setTimeout(dismiss, 4000);
  }

  function skeletonHtml(lines, shortLast) {
    if (HelpersCore && typeof HelpersCore.renderSkeletonHtml === "function") {
      return HelpersCore.renderSkeletonHtml(lines, shortLast);
    }
    return '<p style="color:var(--text-muted)">Loading...</p>';
  }

  const rpc = window.Services && window.Services.rpc ? window.Services.rpc : (window.Session || { callKw: () => Promise.reject(new Error('RPC not loaded')) });
  const viewsSvc = window.Services && window.Services.views ? window.Services.views : null;
  const RouterCore = window.AppCore && window.AppCore.Router ? window.AppCore.Router : null;
  const ViewManagerCore = window.AppCore && window.AppCore.ViewManager ? window.AppCore.ViewManager : null;
  const DashboardCore = window.AppCore && window.AppCore.Dashboard ? window.AppCore.Dashboard : null;
  const SettingsCore = window.AppCore && window.AppCore.Settings ? window.AppCore.Settings : null;
  const ListViewCore = window.AppCore && window.AppCore.ListView ? window.AppCore.ListView : null;
  const FormViewCore = window.AppCore && window.AppCore.FormView ? window.AppCore.FormView : null;
  const NavbarCore = window.AppCore && window.AppCore.Navbar ? window.AppCore.Navbar : null;
  const SidebarCore = window.AppCore && window.AppCore.Sidebar ? window.AppCore.Sidebar : null;
  const DiscussViewCore = window.AppCore && window.AppCore.DiscussView ? window.AppCore.DiscussView : null;
  const GraphViewCore = window.AppCore && window.AppCore.GraphView ? window.AppCore.GraphView : null;
  const PivotViewCore = window.AppCore && window.AppCore.PivotView ? window.AppCore.PivotView : null;
  const CalendarViewCore = window.AppCore && window.AppCore.CalendarView ? window.AppCore.CalendarView : null;
  const GanttViewCore = window.AppCore && window.AppCore.GanttView ? window.AppCore.GanttView : null;
  const ActivityViewCore = window.AppCore && window.AppCore.ActivityView ? window.AppCore.ActivityView : null;
  const ImportCore = window.AppCore && window.AppCore.Import ? window.AppCore.Import : null;
  const ChatterCore = window.AppCore && window.AppCore.Chatter ? window.AppCore.Chatter : null;
  const FieldUtilsCore = window.AppCore && window.AppCore.FieldUtils ? window.AppCore.FieldUtils : null;
  const HelpersCore = window.AppCore && window.AppCore.Helpers ? window.AppCore.Helpers : null;
  const SystraySvc = window.Services && window.Services.systray ? window.Services.systray : null;

  var actionStack = [];
  var formDirty = false;
  var lastHash = (window.location.hash || '#home').slice(1);
  var navContext = { userCompanies: null, userLangs: [], currentLang: 'en_US' };
  if (window.Services && window.Services.commandPalette && typeof window.Services.commandPalette.initHotkey === "function") {
    window.Services.commandPalette.initHotkey();
  }
  if (window.Services && window.Services.pwa && typeof window.Services.pwa.register === "function") {
    window.Services.pwa.register();
  }

  function pushBreadcrumb(label, hash) {
    actionStack.push({ label: label, hash: hash });
    if (window.ActionManager && typeof window.ActionManager.saveToStorage === 'function') {
      window.ActionManager.saveToStorage(actionStack);
    }
  }

  function popBreadcrumbTo(index) {
    if (index < actionStack.length) {
      actionStack = actionStack.slice(0, index + 1);
      if (window.ActionManager && typeof window.ActionManager.saveToStorage === 'function') {
        window.ActionManager.saveToStorage(actionStack);
      }
      var entry = actionStack[actionStack.length - 1];
      if (entry) {
        var h = entry.hash;
        if (window.ActionManager && actionStack.length > 1 && typeof window.ActionManager.syncHashWithStack === 'function') {
          h = window.ActionManager.syncHashWithStack(h, actionStack);
        }
        window.location.hash = h;
      }
    }
  }

  function renderBreadcrumbs() {
    var BS = window.AppCore && window.AppCore.BreadcrumbStrip;
    if (BS && typeof BS.buildBreadcrumbsHtml === 'function') {
      return BS.buildBreadcrumbsHtml(actionStack || []);
    }
    if (window.UIComponents && window.UIComponents.Breadcrumbs && typeof window.UIComponents.Breadcrumbs.renderHTML === "function") {
      return window.UIComponents.Breadcrumbs.renderHTML(actionStack || []);
    }
    if (actionStack.length <= 1) return '';
    var html = '<nav class="breadcrumbs" aria-label="Breadcrumb">';
    actionStack.forEach(function (entry, i) {
      if (i === actionStack.length - 1) {
        html += '<span class="breadcrumb-item active">' + (entry.label || '').replace(/</g, '&lt;') + '</span>';
      } else {
        html += '<a class="breadcrumb-item" href="javascript:void(0)" data-bc-idx="' + i + '">' + (entry.label || '').replace(/</g, '&lt;') + '</a>';
        html += '<span class="breadcrumb-sep">/</span>';
      }
    });
    html += '</nav>';
    return html;
  }

  function attachBreadcrumbHandlers() {
    main.querySelectorAll('[data-bc-idx]').forEach(function (el) {
      el.onclick = function () {
        popBreadcrumbTo(parseInt(el.getAttribute('data-bc-idx'), 10));
      };
    });
  }

  /**
   * Slugs used for list/new/edit routing (sidebar hash targets).
   * Keep in sync with routeApplyInternal, isFormRoute, and keyboard shortcuts below.
   */
  var DATA_ROUTES_SLUGS =
    'contacts|pipeline|crm/activities|leads|tickets|orders|products|pricelists|tasks|articles|knowledge_categories|attachments|settings/users|settings/approval_rules|settings/approval_requests|leaves|leave_types|allocations|cron|server_actions|sequences|audit_log|marketing/mailing_lists|marketing/mailings|manufacturing|boms|workcenters|transfers|warehouses|lots|reordering_rules|purchase_orders|invoices|bank_statements|journals|accounts|taxes|payment_terms|employees|departments|jobs|projects|fleet|attendances|recruitment|time_off|expenses|repair_orders|surveys|lunch_orders|livechat_channels|project_todos|recycle_models|skills|elearning|analytic_accounts|analytic_plans|subscriptions|meetings|timesheets|applicants|contracts|account_reconcile_wizard|recruitment_stages|crm_stages|crm_tags|crm_lost_reasons|website|ecommerce';

  /** Opt-in: set window.__ERP_DEBUG_SIDEBAR_MENU = true to log menus with no resolvable route. */
  function _warnSidebarMenuDisabled(menu, actionRef, hasResolvedAction, route) {
    if (!route && window.__ERP_DEBUG_SIDEBAR_MENU) {
      try {
        console.warn('[sidebar] menu without route', {
          id: menu && menu.id,
          name: menu && menu.name,
          action: actionRef || '',
          resolvedAction: !!hasResolvedAction,
        });
      } catch (e) { /* noop */ }
    }
  }

  /** Map act_window res_model to hash route (convention: res.partner -> contacts) */
  function actionToRoute(action) {
    if (!action) return null;
    if (action.type === 'ir.actions.act_url') {
      var rawUrl = String(action.url || '').trim();
      if (!rawUrl) return null;
      // Support hash-only routes ("#reports/trial-balance") and full URLs containing hash.
      var hashIdx = rawUrl.indexOf('#');
      if (hashIdx >= 0) {
        var frag = rawUrl.slice(hashIdx + 1).split('?')[0].trim();
        return frag || null;
      }
      // Fallback: allow direct route-like URLs without '#'.
      if (/^[a-z0-9_\-/]+$/i.test(rawUrl)) return rawUrl;
      return null;
    }
    if (action.type !== 'ir.actions.act_window') return null;
    const m = (action.res_model || '').replace(/\./g, '_');
    if (m === 'res_partner') return 'contacts';
    if (m === 'crm_lead') {
      const name = (action.name || '').toLowerCase();
      if (name.indexOf('pipeline') >= 0) return 'pipeline';
      if (name.indexOf('activit') >= 0) return 'crm/activities';
      return 'leads';
    }
    if (m === 'project_task') return 'tasks';
    if (m === 'knowledge_article') return 'articles';
    if (m === 'knowledge_category') return 'knowledge_categories';
    if (m === 'sale_order') return 'orders';
    if (m === 'sale_subscription') return 'subscriptions';
    if (m === 'product_product') return 'products';
    if (m === 'ir_attachment') return 'attachments';
    if (m === 'res_users') return 'settings/users';
    if (m === 'approval_rule') return 'settings/approval_rules';
    if (m === 'approval_request') return 'settings/approval_requests';
    if (m === 'hr_leave') return 'leaves';
    if (m === 'hr_leave_type') return 'leave_types';
    if (m === 'hr_leave_allocation') return 'allocations';
    if (m === 'ir_cron') return 'cron';
    if (m === 'ir_actions_server') return 'server_actions';
    if (m === 'ir_sequence') return 'sequences';
    if (m === 'mrp_production') return 'manufacturing';
    if (m === 'mrp_bom') return 'boms';
    if (m === 'mrp_workcenter') return 'workcenters';
    if (m === 'stock_picking') return 'transfers';
    if (m === 'stock_warehouse') return 'warehouses';
    if (m === 'stock_lot') return 'lots';
    if (m === 'purchase_order') return 'purchase_orders';
    if (m === 'account_move') return 'invoices';
    if (m === 'account_bank_statement') return 'bank_statements';
    if (m === 'account_reconcile_wizard') return 'account_reconcile_wizard';
    if (m === 'account_journal') return 'journals';
    if (m === 'account_account') return 'accounts';
    if (m === 'account_tax') return 'taxes';
    if (m === 'account_payment_term') return 'payment_terms';
    if (m === 'hr_employee') return 'employees';
    if (m === 'hr_department') return 'departments';
    if (m === 'hr_job') return 'jobs';
    if (m === 'hr_attendance') return 'attendances';
    if (m === 'hr_applicant') return 'applicants';
    if (m === 'hr_contract') return 'contracts';
    if (m === 'project_project') return 'projects';
    if (m === 'calendar_event') return 'meetings';
    if (m === 'helpdesk_ticket') return 'tickets';
    if (m === 'analytic_line') return 'timesheets';
    if (m === 'analytic_account') return 'analytic_accounts';
    if (m === 'analytic_plan') return 'analytic_plans';
    if (m === 'product_pricelist') return 'pricelists';
    if (m === 'stock_warehouse_orderpoint') return 'reordering_rules';
    if (m === 'hr_expense') return 'expenses';
    if (m === 'repair_order') return 'repair_orders';
    if (m === 'survey_survey') return 'surveys';
    if (m === 'lunch_order') return 'lunch_orders';
    if (m === 'im_livechat_channel') return 'livechat_channels';
    if (m === 'data_recycle_model') return 'recycle_models';
    if (m === 'hr_skill') return 'skills';
    if (m === 'slide_channel') return 'elearning';
    if (m === 'audit_log') return 'audit_log';
    if (m === 'mailing_list') return 'marketing/mailing_lists';
    if (m === 'mailing_mailing') return 'marketing/mailings';
    if (m === 'crm_stage') return 'crm_stages';
    if (m === 'crm_tag') return 'crm_tags';
    if (m === 'crm_lost_reason') return 'crm_lost_reasons';
    if (m === 'fleet_vehicle') return 'fleet';
    return m || null;
  }

  /** Map menu to hash route when no action (e.g. Settings, API Keys) */
  function menuToRoute(m) {
    if (!m) return null;
    const name = (m.name || '').toLowerCase();
    if (name === 'home') return 'home';
    if (name === 'settings') return 'settings';
    if (name === 'api keys') return 'settings/apikeys';
    if (name === 'contacts') return 'contacts';
    if (name === 'crm') return 'pipeline';
    if (name === 'leads') return 'leads';
    if (name === 'my pipeline') return 'pipeline';
    if (name === 'my activities') return 'crm/activities';
    if (name === 'discuss' || name === 'messaging') return 'discuss';
    if (name === 'orders') return 'orders';
    if (name === 'products') return 'products';
    if (name === 'tasks') return 'tasks';
    if (name === 'invoicing') return 'invoices';
    if (name === 'inventory') return 'transfers';
    if (name === 'sales') return 'orders';
    if (name === 'hr') return 'employees';
    if (name === 'employees') return 'employees';
    if (name === 'departments') return 'departments';
    if (name === 'job positions' || name === 'jobs') return 'jobs';
    if (name === 'expenses' || name === 'my expenses') return 'expenses';
    if (name === 'attendances' || name === 'attendance') return 'attendances';
    if (name === 'recruitment' || name === 'applicants') return 'recruitment';
    if (name === 'time off') return 'time_off';
    if (name === 'repairs') return 'repair_orders';
    if (name === 'surveys') return 'surveys';
    if (name === 'lunch') return 'lunch_orders';
    if (name === 'live chat') return 'livechat_channels';
    if (name === 'to-do') return 'project_todos';
    if (name === 'data recycle') return 'recycle_models';
    if (name === 'skills') return 'skills';
    if (name === 'elearning') return 'elearning';
    if (name === 'analytic plans' || name === 'analytic plan') return 'analytic_plans';
    if (name === 'subscriptions' || name === 'subscription') return 'subscriptions';
    if (name === 'meetings' || name === 'meeting') return 'meetings';
    if (name === 'applicants' || name === 'applicant') return 'applicants';
    if (name === 'recruitment stages') return 'recruitment_stages';
    if (name === 'valuation' || name === 'valuations' || name === 'stock valuation report') return 'reports/stock-valuation';
    if (name === 'website') return 'website';
    if (name === 'ecommerce') return 'ecommerce';
    if (name === 'reports') return 'reports/trial-balance';
    if (name === 'stages') return 'crm_stages';
    if (name === 'tags') return 'crm_tags';
    if (name === 'lost reasons') return 'crm_lost_reasons';
    var slug = (m.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (slug && slug.length >= 2 && /^[a-z][a-z0-9_]*$/.test(slug)) {
      var sectionOnly = { configuration: 1, reporting: 1, operations: 1, sales: 1, technical: 1 };
      if (!sectionOnly[slug]) return slug;
    }
    return null;
  }

  /** Get action for route (from menu) */
  function getActionForRoute(route) {
    if (!viewsSvc) return null;
    const menus = viewsSvc.getMenus() || [];
    const stack = [].concat(menus);
    while (stack.length) {
      const menu = stack.shift();
      if (!menu) continue;
      const action = menu.action ? viewsSvc.getAction(menu.action) : null;
      if (action && actionToRoute(action) === route) return action;
      const children = menu.children || menu.child_id || [];
      if (Array.isArray(children) && children.length) {
        for (let i = 0; i < children.length; i++) stack.push(children[i]);
      }
    }
    return null;
  }

  /** Get model name for route slug (inverse of actionToRoute) */
  function getModelForRoute(route) {
    const action = getActionForRoute(route);
    if (action) return action.res_model || action.resModel;
    if (route === 'contacts') return 'res.partner';
    if (route === 'pipeline') return 'crm.lead';
    if (route === 'crm/activities') return 'crm.lead';
    if (route === 'leads') return 'crm.lead';
    if (route === 'tasks') return 'project.task';
    if (route === 'articles') return 'knowledge.article';
    if (route === 'knowledge_categories') return 'knowledge.category';
    if (route === 'orders') return 'sale.order';
    if (route === 'subscriptions') return 'sale.subscription';
    if (route === 'products') return 'product.product';
    if (route === 'attachments') return 'ir.attachment';
    if (route === 'settings/users') return 'res.users';
    if (route === 'settings/approval_rules') return 'approval.rule';
    if (route === 'settings/approval_requests') return 'approval.request';
    if (route === 'leaves') return 'hr.leave';
    if (route === 'leave_types') return 'hr.leave.type';
    if (route === 'allocations') return 'hr.leave.allocation';
    if (route === 'cron') return 'ir.cron';
    if (route === 'server_actions') return 'ir.actions.server';
    if (route === 'sequences') return 'ir.sequence';
    if (route === 'audit_log') return 'audit.log';
    if (route === 'marketing/mailing_lists') return 'mailing.list';
    if (route === 'marketing/mailings') return 'mailing.mailing';
    if (route === 'manufacturing') return 'mrp.production';
    if (route === 'boms') return 'mrp.bom';
    if (route === 'workcenters') return 'mrp.workcenter';
    if (route === 'transfers') return 'stock.picking';
    if (route === 'warehouses') return 'stock.warehouse';
    if (route === 'lots') return 'stock.lot';
    if (route === 'purchase_orders') return 'purchase.order';
    if (route === 'invoices') return 'account.move';
    if (route === 'bank_statements') return 'account.bank.statement';
    if (route === 'account_reconcile_wizard') return 'account.reconcile.wizard';
    if (route === 'journals') return 'account.journal';
    if (route === 'accounts') return 'account.account';
    if (route === 'taxes') return 'account.tax';
    if (route === 'payment_terms') return 'account.payment.term';
    if (route === 'employees') return 'hr.employee';
    if (route === 'departments') return 'hr.department';
    if (route === 'jobs') return 'hr.job';
    if (route === 'attendances') return 'hr.attendance';
    if (route === 'applicants') return 'hr.applicant';
    if (route === 'recruitment') return 'hr.applicant';
    if (route === 'recruitment_stages') return 'hr.recruitment.stage';
    if (route === 'contracts') return 'hr.contract';
    if (route === 'time_off') return 'hr.leave';
    if (route === 'expenses') return 'hr.expense';
    if (route === 'fleet') return 'fleet.vehicle';
    if (route === 'projects') return 'project.project';
    if (route === 'timesheets') return 'analytic.line';
    if (route === 'project_todos') return 'project.task';
    if (route === 'recycle_models') return 'data.recycle.model';
    if (route === 'repair_orders') return 'repair.order';
    if (route === 'surveys') return 'survey.survey';
    if (route === 'lunch_orders') return 'lunch.order';
    if (route === 'livechat_channels') return 'im_livechat.channel';
    if (route === 'skills') return 'hr.skill';
    if (route === 'elearning') return 'slide.channel';
    if (route === 'analytic_accounts') return 'analytic.account';
    if (route === 'analytic_plans') return 'analytic.plan';
    if (route === 'pricelists') return 'product.pricelist';
    if (route === 'reordering_rules') return 'stock.warehouse.orderpoint';
    if (route === 'meetings') return 'calendar.event';
    if (route === 'tickets') return 'helpdesk.ticket';
    if (route === 'crm_stages') return 'crm.stage';
    if (route === 'crm_tags') return 'crm.tag';
    if (route === 'crm_lost_reasons') return 'crm.lost.reason';
    return null;
  }

  /** Parse action domain string to array (JSON or Python-like) */
  function parseActionDomain(s) {
    if (!s || typeof s !== 'string') return [];
    const t = s.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t.replace(/'/g, '"'));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {}
    return [];
  }

  /** Phase 211: parseFilterDomain with optional uid substitution for domains like [('user_id','=',uid)]. */
  function parseFilterDomain(s, uid) {
    if (!s || typeof s !== 'string') return [];
    let t = s.trim();
    if (!t) return [];
    if (uid != null && typeof uid === 'number') {
      t = t.replace(/\buid\b/g, String(uid));
    }
    try {
      const json = t.replace(/\(/g, '[').replace(/\)/g, ']').replace(/'/g, '"');
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {}
    return [];
  }

  function parseCSV(text) {
    const rows = [];
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const row = [];
      let cur = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const c = line[j];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if ((c === ',' && !inQuotes) || (c === '\n' && !inQuotes)) {
          row.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      row.push(cur.trim());
      if (row.some(function (c) { return c; })) rows.push(row);
    }
    return rows;
  }

  function showImportModal(model, route) {
    const cols = getListColumns(model);
    const modelFields = ['id'].concat(cols.map(function (c) { return typeof c === 'object' ? c.name : c; }));
    const overlay = document.createElement('div');
    overlay.id = 'import-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999';
    let html = '<div id="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-modal-title" style="background:white;border-radius:8px;padding:var(--space-lg);max-width:600px;width:90%;max-height:90vh;overflow:auto">';
    html += '<h3 id="import-modal-title" style="margin-top:0">Import CSV / Excel</h3>';
    html += '<p><input type="file" id="import-file" accept=".csv,.xlsx" style="padding:0.5rem"></p>';
    html += '<div id="import-preview" style="display:none;margin:1rem 0">';
    html += '<p><strong>Preview (first 5 rows)</strong></p>';
    html += '<div id="import-preview-table"></div>';
    html += '<p><strong>Column mapping</strong></p>';
    html += '<div id="import-mapping"></div>';
    html += '<p style="margin-top:1rem"><button type="button" id="import-do-btn" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Import</button>';
    html += ' <button type="button" id="import-cancel-btn" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">Cancel</button></p>';
    html += '</div>';
    html += '<div id="import-result" style="display:none"></div>';
    html += '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    const modal = document.getElementById('import-modal');
    const focusables = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    function getFocusables() { return modal ? modal.querySelectorAll(focusables) : []; }
    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      const els = getFocusables();
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function closeOnEscape(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', closeOnEscape); overlay.remove(); }
    }
    function closeModal() {
      document.removeEventListener('keydown', closeOnEscape);
      overlay.remove();
    }
    modal.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', closeOnEscape);
    setTimeout(function () { const f = document.getElementById('import-file'); if (f) f.focus(); }, 50);
    let csvHeaders = [];
    let csvRows = [];
    let importFile = null;
    const fileInput = document.getElementById('import-file');
    fileInput.onchange = function () {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      importFile = f;
      csvRows = [];
      const isXlsx = (f.name || '').toLowerCase().endsWith('.xlsx');
      if (isXlsx) {
        const fd = new FormData();
        fd.append('file', f);
      const authHdrs = (window.Services && window.Services.session && window.Services.session.getAuthHeaders) ? window.Services.session.getAuthHeaders() : {};
      fetch('/web/import/preview', { method: 'POST', credentials: 'include', headers: authHdrs, body: fd })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.error) { showToast(data.error, 'error'); return; }
            csvHeaders = data.headers || [];
            csvRows = data.rows || [];
            renderImportPreview();
          })
          .catch(function () { showToast('Preview failed', 'error'); });
      } else {
        const r = new FileReader();
        r.onload = function () {
          const parsed = parseCSV(r.result || '');
          if (!parsed.length) { showToast('No rows in CSV', 'error'); return; }
          csvHeaders = parsed[0];
          csvRows = parsed.slice(1);
          renderImportPreview();
        };
        r.readAsText(f);
      }
      importFile = f;
    };
    function renderImportPreview() {
      if (ImportCore && typeof ImportCore.renderPreview === "function") {
        var previewHtml = ImportCore.renderPreview(csvHeaders || [], csvRows || [], modelFields || []);
        if (previewHtml && previewHtml.table && previewHtml.mapping) {
          document.getElementById('import-preview-table').innerHTML = previewHtml.table;
          document.getElementById('import-mapping').innerHTML = previewHtml.mapping;
          document.getElementById('import-preview').style.display = 'block';
          return;
        }
      }
      const preview = csvRows.slice(0, 5);
      let tbl = '<table style="width:100%;border-collapse:collapse;font-size:0.9rem"><tr>';
      csvHeaders.forEach(function (h) { tbl += '<th style="padding:0.35rem;border:1px solid #ddd;text-align:left">' + String(h).replace(/</g, '&lt;') + '</th>'; });
      tbl += '</tr>';
      preview.forEach(function (row) {
        tbl += '<tr>';
        csvHeaders.forEach(function (_, i) { tbl += '<td style="padding:0.35rem;border:1px solid #eee">' + String((row && row[i]) || '').replace(/</g, '&lt;') + '</td>'; });
        tbl += '</tr>';
      });
      tbl += '</table>';
      document.getElementById('import-preview-table').innerHTML = tbl;
      let mapHtml = '<table style="width:100%"><tr><th>Column</th><th>Map to field</th></tr>';
      csvHeaders.forEach(function (h, i) {
        mapHtml += '<tr><td style="padding:0.35rem">' + String(h).replace(/</g, '&lt;') + '</td><td><select class="import-map-select" data-csv-idx="' + i + '" style="width:100%;padding:0.35rem">';
        mapHtml += '<option value="">-- Skip --</option>';
        const autoMatch = modelFields.find(function (mf) { return mf.toLowerCase() === String(h).toLowerCase().replace(/\s/g, '_'); });
        modelFields.forEach(function (mf) {
          const sel = (autoMatch === mf || (!autoMatch && mf === h)) ? ' selected' : '';
          mapHtml += '<option value="' + (mf || '').replace(/"/g, '&quot;') + '"' + sel + '>' + (mf || '').replace(/</g, '&lt;') + '</option>';
        });
        mapHtml += '</select></td></tr>';
      });
      mapHtml += '</table>';
      document.getElementById('import-mapping').innerHTML = mapHtml;
      document.getElementById('import-preview').style.display = 'block';
    }
    document.getElementById('import-do-btn').onclick = function () {
      const selects = overlay.querySelectorAll('.import-map-select');
      const csvIdxToField = {};
      selects.forEach(function (s) {
        const idx = parseInt(s.dataset.csvIdx, 10);
        const f = s.value;
        if (f) csvIdxToField[idx] = f;
      });
      const fieldSet = {};
      const fields = [];
      Object.keys(csvIdxToField).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); }).forEach(function (idx) {
        const f = csvIdxToField[idx];
        if (!fieldSet[f]) { fields.push(f); fieldSet[f] = true; }
      });
      if (!fields.length) { showToast('Map at least one column', 'error'); return; }
      const mapping = {};
      Object.keys(csvIdxToField).forEach(function (k) { mapping[k] = csvIdxToField[k]; });
      if (!importFile) { showToast('Select a file first', 'error'); return; }
      const fd = new FormData();
      fd.append('file', importFile);
      fd.append('model', model);
      fd.append('mapping', JSON.stringify(mapping));
      const authHdrsExec = (window.Services && window.Services.session && window.Services.session.getAuthHeaders) ? window.Services.session.getAuthHeaders() : {};
      fetch('/web/import/execute', { method: 'POST', credentials: 'include', headers: authHdrsExec, body: fd })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) throw new Error(data.error || 'Import failed');
            return data;
          });
        })
        .then(handleImportResult)
        .catch(function (err) { showToast(err.message || 'Import failed', 'error'); });
    };
    function handleImportResult(res) {
      document.getElementById('import-preview').style.display = 'none';
      const r = document.getElementById('import-result');
      r.style.display = 'block';
      r.innerHTML = '<p><strong>Import complete</strong></p><p>Created: ' + (res.created || 0) + ', Updated: ' + (res.updated || 0) + '</p>';
      if (res.errors && res.errors.length) {
        r.innerHTML += '<p style="color:#c00">Errors:</p><table style="width:100%;font-size:0.9rem"><tr><th>Row</th><th>Field</th><th>Message</th></tr>';
        res.errors.forEach(function (e) {
          r.innerHTML += '<tr><td>' + (e.row || '') + '</td><td>' + (e.field || '').replace(/</g, '&lt;') + '</td><td>' + (e.message || '').replace(/</g, '&lt;') + '</td></tr>';
        });
        r.innerHTML += '</table>';
      }
      r.innerHTML += '<p><button type="button" id="import-close-btn" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Close</button></p>';
      document.getElementById('import-close-btn').onclick = function () {
        closeModal();
        loadRecords(model, route, currentListState.searchTerm);
      };
      if (!res.errors || !res.errors.length) {
        showToast('Imported ' + (res.created || 0) + ' created, ' + (res.updated || 0) + ' updated', 'success');
        setTimeout(function () {
          closeModal();
          loadRecords(model, route, currentListState.searchTerm);
        }, 1500);
      }
    }
    document.getElementById('import-cancel-btn').onclick = closeModal;
  }

  function buildMenuTree(menus) {
    const byId = {};
    const roots = [];
    (menus || []).forEach(function (m) {
      byId[m.id || m.name] = { menu: m, children: [] };
    });
    (menus || []).forEach(function (m) {
      const node = byId[m.id || m.name];
      if (!node) return;
      const parentRef = m.parent || '';
      if (!parentRef || !byId[parentRef]) {
        roots.push(node);
      } else {
        byId[parentRef].children.push(node);
      }
    });
    function sortRecursive(nodes) {
      nodes.sort(function (a, b) { return (a.menu.sequence || 0) - (b.menu.sequence || 0); });
      nodes.forEach(function (n) { if (n.children.length) sortRecursive(n.children); });
    }
    sortRecursive(roots);
    return roots;
  }

  function getAppRoots(tree, menus) {
    var byId = {};
    (menus || []).forEach(function (m) { if (m && m.id) byId[m.id] = m; });
    return (tree || []).filter(function (node) {
      var m = node.menu || {};
      if (!m.id) return false;
      if (m.app_id) return m.id === m.app_id;
      return !m.parent || !byId[m.parent];
    });
  }

  function getAppIdForRoute(route, menus) {
    var out = null;
    (menus || []).some(function (m) {
      var action = m.action && viewsSvc ? viewsSvc.getAction(m.action) : null;
      var r = action ? actionToRoute(action) : menuToRoute(m);
      if (r && r === route) {
        out = m.app_id || m.id || null;
        return true;
      }
      return false;
    });
    return out;
  }

  function getDefaultRouteForAppNode(node) {
    if (!node) return null;
    var queue = [node];
    while (queue.length) {
      var cur = queue.shift();
      var m = cur && cur.menu ? cur.menu : null;
      if (m) {
        var action = m.action && viewsSvc ? viewsSvc.getAction(m.action) : null;
        var route = action ? actionToRoute(action) : menuToRoute(m);
        if (route) return route;
      }
      var children = cur && cur.children ? cur.children : [];
      for (var i = 0; i < children.length; i++) queue.push(children[i]);
    }
    return null;
  }

  function selectApp(appId) {
    if (!appId) return;
    var menus = (viewsSvc && viewsSvc.getMenus()) ? viewsSvc.getMenus() : [];
    var tree = menus.length ? buildMenuTree(menus) : [];
    var appRoots = getAppRoots(tree, menus);
    var selectedRoot = appRoots.find(function (n) {
      return String((n.menu && n.menu.id) || '') === String(appId);
    });
    if (!selectedRoot) return;
    if (typeof localStorage !== 'undefined') localStorage.setItem('erp_sidebar_app', String(appId));
    var targetRoute = getDefaultRouteForAppNode(selectedRoot) || 'home';
    var nextHash = '#' + targetRoute;
    if (window.location.hash === nextHash) {
      renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang);
      route();
      return;
    }
    window.location.hash = nextHash;
  }

  function escNavHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function sidebarAbbrev(name) {
    var n = String(name || '').trim();
    return n ? n.charAt(0).toUpperCase() : '\u2022';
  }

  function _getSidebarFolds() {
    try { return JSON.parse(localStorage.getItem('erp_sidebar_folds') || '{}'); } catch (e) { return {}; }
  }

  function _setSidebarFolds(folds) {
    try { localStorage.setItem('erp_sidebar_folds', JSON.stringify(folds)); } catch (e) { /* noop */ }
  }

  function _sidebarIconHtml(m) {
    if (m.web_icon_data) {
      return '<img class="o-sidebar-icon" src="' + escNavHtml(m.web_icon_data) + '" alt="" />';
    }
    if (m.web_icon) {
      var parts = (m.web_icon || '').split(',');
      if (parts.length === 1 && /^fa[a-z-]*\s/.test(parts[0].trim())) {
        return '<i class="o-sidebar-icon ' + escNavHtml(parts[0].trim()) + '" aria-hidden="true"></i>';
      }
      if (parts.length >= 1 && parts[0].trim().startsWith('fa')) {
        return '<i class="o-sidebar-icon ' + escNavHtml(parts[0].trim()) + '" aria-hidden="true"></i>';
      }
    }
    return '<span class="o-sidebar-abbrev">' + escNavHtml(sidebarAbbrev(m.name)) + '</span>';
  }

  function _renderSidebarChildren(children, currentHash, depth) {
    var html = '';
    children.forEach(function (ch) {
      var cm = ch.menu;
      var caction = cm.action && viewsSvc ? viewsSvc.getAction(cm.action) : null;
      var croute = caction ? actionToRoute(caction) : menuToRoute(cm);
      var chref = croute ? '#' + croute : '#';
      var hasGrandkids = ch.children && ch.children.length > 0;
      var isActive = croute && currentHash === croute;

      if (hasGrandkids) {
        var folds = _getSidebarFolds();
        var subFolded = folds[cm.id] !== undefined ? folds[cm.id] : true;
        var subFoldedCls = subFolded ? ' o-sidebar-subgroup--folded' : '';
        html += '<div class="o-sidebar-subgroup' + subFoldedCls + '" data-menu-id="' + escNavHtml(cm.id || '') + '">';
        html += '<button type="button" class="o-sidebar-subgroup-head" aria-expanded="' + (subFolded ? 'false' : 'true') + '">';
        html += '<span class="o-sidebar-chevron o-sidebar-chevron--sub" aria-hidden="true">\u25bc</span>';
        html += '<span class="o-sidebar-link-text">' + escNavHtml(cm.name) + '</span>';
        html += '</button>';
        html += '<div class="o-sidebar-subgroup-body">';
        html += _renderSidebarChildren(ch.children, currentHash, depth + 1);
        html += '</div></div>';
      } else {
        if (!croute) _warnSidebarMenuDisabled(cm, cm.action, !!caction, croute);
        var ccls = croute ? 'o-sidebar-link' : 'o-sidebar-link o-sidebar-link-disabled';
        if (isActive) ccls += ' o-sidebar-link--active';
        if (depth > 0) ccls += ' o-sidebar-link--nested';
        html += '<a href="' + escNavHtml(chref) + '" class="' + ccls + '" data-menu-id="' + escNavHtml(cm.id || '') + '">';
        html += '<span class="o-sidebar-link-text">' + escNavHtml(cm.name) + '</span></a>';
      }
    });
    return html;
  }

  function buildSidebarNavHtml(tree, staleInnerHtml) {
    var html = '<div class="o-sidebar-inner"><div class="o-sidebar-scroll">';
    if (staleInnerHtml) {
      html += '<div class="o-sidebar-stale">' + staleInnerHtml + '</div>';
    }
    html += '<nav class="o-sidebar-nav" role="navigation">';
    if (!tree || !tree.length) {
      html += '<p class="o-sidebar-empty">No menu items.</p>';
    } else {
      var currentHash = (location.hash || '#home').replace(/^#/, '');
      var folds = _getSidebarFolds();
      tree.forEach(function (node) {
        var m = node.menu;
        var action = m.action && viewsSvc ? viewsSvc.getAction(m.action) : null;
        var route = action ? actionToRoute(action) : menuToRoute(m);
        var href = route ? '#' + route : '#';
        var hasKids = node.children && node.children.length > 0;
        var iconHtml = _sidebarIconHtml(m);
        if (hasKids) {
          var folded = folds[m.id] !== undefined ? folds[m.id] : true;
          var foldedCls = folded ? ' o-sidebar-category--folded' : '';
          html += '<section class="o-sidebar-category' + foldedCls + '" data-menu-id="' + escNavHtml(m.id || '') + '" data-expanded="' + (folded ? 'false' : 'true') + '">';
          html += '<button type="button" class="o-sidebar-category-head" aria-expanded="' + (folded ? 'false' : 'true') + '">';
          html += '<span class="o-sidebar-chevron" aria-hidden="true">\u25bc</span>';
          html += iconHtml;
          html += '<span class="o-sidebar-category-name">' + escNavHtml(m.name) + '</span>';
          html += '</button>';
          html += '<div class="o-sidebar-category-body">';
          html += _renderSidebarChildren(node.children, currentHash, 0);
          html += '</div></section>';
        } else {
          if (!route) _warnSidebarMenuDisabled(m, m.action, !!action, route);
          var isActive = route && currentHash === route;
          var leafCls = route ? 'o-sidebar-link' : 'o-sidebar-link o-sidebar-link-disabled';
          if (isActive) leafCls += ' o-sidebar-link--active';
          html += '<section class="o-sidebar-category o-sidebar-category--flat">';
          html += '<a href="' + escNavHtml(href) + '" class="' + leafCls + '" data-menu-id="' + escNavHtml(m.id || '') + '">';
          html += iconHtml;
          html += '<span class="o-sidebar-link-text">' + escNavHtml(m.name) + '</span></a></section>';
        }
      });
    }
    html += '</nav></div></div>';
    return html;
  }

  function closeMobileSidebar() {
    if (!appShell) return;
    appShell.classList.remove('o-app-shell--sidebar-mobile-open');
    var bd = document.getElementById('o-sidebar-backdrop');
    if (bd) {
      bd.hidden = true;
      bd.setAttribute('aria-hidden', 'true');
    }
  }

  function _updateSidebarActiveLink() {
    if (!appSidebar) return;
    var currentHash = (location.hash || '#home').replace(/^#/, '');
    appSidebar.querySelectorAll('a.o-sidebar-link').forEach(function (a) {
      var linkHash = (a.getAttribute('href') || '').replace(/^#/, '');
      var isActive = linkHash && linkHash !== '' && linkHash === currentHash;
      a.classList.toggle('o-sidebar-link--active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
      if (isActive) {
        var category = a.closest('.o-sidebar-category');
        if (category && category.classList.contains('o-sidebar-category--folded')) {
          category.classList.remove('o-sidebar-category--folded');
          var head = category.querySelector('.o-sidebar-category-head');
          if (head) head.setAttribute('aria-expanded', 'true');
          category.setAttribute('data-expanded', 'true');
          var folds = _getSidebarFolds();
          var menuId = category.getAttribute('data-menu-id');
          if (menuId) { folds[menuId] = false; _setSidebarFolds(folds); }
        }
        var subgroup = a.closest('.o-sidebar-subgroup');
        if (subgroup && subgroup.classList.contains('o-sidebar-subgroup--folded')) {
          subgroup.classList.remove('o-sidebar-subgroup--folded');
          var subHead = subgroup.querySelector('.o-sidebar-subgroup-head');
          if (subHead) subHead.setAttribute('aria-expanded', 'true');
          var folds2 = _getSidebarFolds();
          var subId = subgroup.getAttribute('data-menu-id');
          if (subId) { folds2[subId] = false; _setSidebarFolds(folds2); }
        }
      }
    });
  }

  function wireSidebarAfterRender() {
    if (!appSidebar || !appShell) return;
    var sidebar = appSidebar;
    var shell = appShell;

    sidebar.querySelectorAll('.o-sidebar-category-head').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sec = btn.closest('.o-sidebar-category');
        if (!sec || sec.classList.contains('o-sidebar-category--flat')) return;
        sec.classList.toggle('o-sidebar-category--folded');
        var folded = sec.classList.contains('o-sidebar-category--folded');
        btn.setAttribute('aria-expanded', folded ? 'false' : 'true');
        sec.setAttribute('data-expanded', folded ? 'false' : 'true');
        var folds = _getSidebarFolds();
        var menuId = sec.getAttribute('data-menu-id');
        if (menuId) { folds[menuId] = folded; _setSidebarFolds(folds); }
      });
    });

    sidebar.querySelectorAll('.o-sidebar-subgroup-head').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var grp = btn.closest('.o-sidebar-subgroup');
        if (!grp) return;
        grp.classList.toggle('o-sidebar-subgroup--folded');
        var folded = grp.classList.contains('o-sidebar-subgroup--folded');
        btn.setAttribute('aria-expanded', folded ? 'false' : 'true');
        var folds = _getSidebarFolds();
        var menuId = grp.getAttribute('data-menu-id');
        if (menuId) { folds[menuId] = folded; _setSidebarFolds(folds); }
      });
    });

    sidebar.querySelectorAll('a.o-sidebar-link').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 1023) closeMobileSidebar();
      });
    });

    var bd = document.getElementById('o-sidebar-backdrop');
    if (bd) {
      bd.addEventListener('click', closeMobileSidebar);
    }
    var deskToggle = navbar.querySelector('.nav-sidebar-toggle');
    if (deskToggle) {
      var collapsed = typeof localStorage !== 'undefined' && localStorage.getItem('erp_sidebar_collapsed') === '1';
      if (collapsed) {
        shell.classList.add('o-app-shell--sidebar-collapsed');
        deskToggle.setAttribute('aria-expanded', 'false');
        deskToggle.innerHTML = '&#9654;';
        deskToggle.setAttribute('title', 'Expand menu');
      }
      deskToggle.addEventListener('click', function () {
        shell.classList.toggle('o-app-shell--sidebar-collapsed');
        var c = shell.classList.contains('o-app-shell--sidebar-collapsed');
        if (typeof localStorage !== 'undefined') localStorage.setItem('erp_sidebar_collapsed', c ? '1' : '0');
        deskToggle.setAttribute('aria-expanded', c ? 'false' : 'true');
        deskToggle.innerHTML = c ? '&#9654;' : '&#9664;';
        deskToggle.setAttribute('title', c ? 'Expand menu' : 'Collapse menu');
      });
    }
    var ham = navbar.querySelector('.nav-hamburger');
    if (ham) {
      ham.addEventListener('click', function () {
        if (window.innerWidth <= 1023) {
          var open = !shell.classList.contains('o-app-shell--sidebar-mobile-open');
          shell.classList.toggle('o-app-shell--sidebar-mobile-open', open);
          if (bd) {
            bd.hidden = !open;
            bd.setAttribute('aria-hidden', open ? 'false' : 'true');
          }
        }
      });
    }
    window.addEventListener('hashchange', function () {
      if (window.innerWidth <= 1023) closeMobileSidebar();
      _updateSidebarActiveLink();
    });
    if (!window._erpNavEscapeBound) {
      window._erpNavEscapeBound = true;
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (appShell && appShell.classList.contains('o-app-shell--sidebar-mobile-open')) closeMobileSidebar();
      });
    }
    _updateSidebarActiveLink();
  }

  function renderSystrayMount() {
    if (!navbar) return;
    var host = navbar.querySelector(".o-systray-registry");
    if (!host || !SystraySvc) return;
    if (!SystraySvc.getItems().length) {
      SystraySvc.add("async_jobs", {
        sequence: 10,
        render: function () {
          return '<button type="button" class="nav-link o-systray-item" id="systray-async" title="Async jobs">Jobs <span class="o-systray-count" id="systray-async-count">0</span></button>';
        },
      });
      SystraySvc.add("shortcuts", {
        sequence: 20,
        render: function () {
          return '<button type="button" class="nav-link o-systray-item" id="systray-shortcuts" title="Keyboard shortcuts">?</button>';
        },
      });
    }
    host.innerHTML = SystraySvc.renderAll({});
    var asyncBtn = host.querySelector("#systray-async");
    if (asyncBtn) {
      asyncBtn.onclick = function () { window.location.hash = "settings"; };
      fetch("/web/async/call_notify", { credentials: "include" })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var c = host.querySelector("#systray-async-count");
          if (!c) return;
          var total = Number((data && data.pending) || 0) + Number((data && data.running) || 0) + Number((data && data.failed) || 0);
          c.textContent = String(total);
          c.style.display = total ? "inline-flex" : "none";
        })
        .catch(function () {});
    }
    var kbBtn = host.querySelector("#systray-shortcuts");
    if (kbBtn) {
      kbBtn.onclick = function () {
        showShortcutHelp();
      };
    }
    if (window.__erpNavbarFacade && typeof window.__erpNavbarFacade.markSystrayRendered === 'function') {
      window.__erpNavbarFacade.markSystrayRendered(host);
    }
  }

  function showShortcutHelp() {
    if (window.UIComponents && window.UIComponents.ConfirmDialog && typeof window.UIComponents.ConfirmDialog.openModal === "function") {
      window.UIComponents.ConfirmDialog.openModal({
        title: "Keyboard shortcuts",
        content:
          '<div class="o-shortcut-sheet">' +
          '<p><kbd>Mod+K</kbd> Command palette</p>' +
          '<p><kbd>Alt+N</kbd> New record</p>' +
          '<p><kbd>Alt+S</kbd> Save form</p>' +
          '<p><kbd>Alt+E</kbd> Toggle edit mode</p>' +
          '<p><kbd>Alt+L</kbd> List view</p>' +
          '<p><kbd>Alt+K</kbd> Kanban view</p>' +
          '<p><kbd>Alt+P</kbd> Print / preview</p>' +
          "<p><kbd>Esc</kbd> Close modal</p>" +
          "</div>",
      });
      return;
    }
    window.alert("Shortcuts: Mod+K, Alt+N, Alt+S, Alt+E, Alt+L, Alt+K, Alt+P, Esc");
  }

  function renderNavbar(userCompanies, userLangs, currentLang) {
    if (modernShellOwner && window.__erpModernShellController) {
      window.__erpModernShellController.applyNavContext({
        userCompanies: userCompanies || null,
        userLangs: userLangs || [],
        currentLang: currentLang || "en_US",
      });
      return true;
    }
    if (NavbarCore && typeof NavbarCore.render === "function") {
      var coreHandled = NavbarCore.render({
        navbar: navbar,
        appShell: appShell,
        appSidebar: appSidebar,
        userCompanies: userCompanies || [],
        userLangs: userLangs || [],
        currentLang: currentLang || "en_US",
        viewsSvc: viewsSvc,
      });
      if (coreHandled) return;
    }
    if (!navbar) return;
    userLangs = userLangs || [];
    currentLang = currentLang || 'en_US';
    var menus = (viewsSvc && viewsSvc.getMenus()) ? viewsSvc.getMenus() : [];
    var tree = menus.length ? buildMenuTree(menus) : [];
    var appRoots = getAppRoots(tree, menus);
    var routeHash = (window.location.hash || '#home').replace(/^#/, '');
    var autoAppId = getAppIdForRoute(routeHash, menus);
    var storedAppId = typeof localStorage !== 'undefined' ? (localStorage.getItem('erp_sidebar_app') || '') : '';
    var selectedAppId = autoAppId || storedAppId || (appRoots[0] && appRoots[0].menu && appRoots[0].menu.id) || '';
    var selectedRoot = appRoots.find(function (n) {
      return String((n.menu && n.menu.id) || '') === String(selectedAppId);
    }) || null;
    var selectedAppName = (selectedRoot && selectedRoot.menu && selectedRoot.menu.name) ? selectedRoot.menu.name : '';
    if (selectedAppId && typeof localStorage !== 'undefined') localStorage.setItem('erp_sidebar_app', selectedAppId);
    var useSidebar = !!appSidebar;
    var staleBannerHtml = '';
    if (menus.length === 0) {
      staleBannerHtml = 'Navigation menus missing. Run: <code style="padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-sm);background:color-mix(in srgb,var(--color-text) 12%,transparent)">erp-bin db upgrade -d ' +
        escNavHtml(window.Session && window.Session.db ? String(window.Session.db) : 'erp') + '</code>';
    }
    var html = '';
    if (useSidebar) {
      html += '<button type="button" class="nav-hamburger" aria-label="Open menu">&#9776;</button>';
      html += '<button type="button" class="nav-sidebar-toggle" aria-label="Collapse sidebar" title="Collapse menu" aria-expanded="true">&#9664;</button>';
    } else {
      html += '<button type="button" class="nav-hamburger" aria-label="Toggle menu" style="display:none">&#9776;</button>';
    }
    html += '<span class="nav-toolbar-left"><a href="#home" class="logo logo-link" title="Apps">ERP Platform</a>';
    if (useSidebar) {
      html += '<button type="button" id="nav-apps-home" class="nav-link nav-apps-home" title="Apps">Apps</button>';
      if (selectedAppName) {
        html += '<span class="nav-current-app">' + escNavHtml(selectedAppName) + '</span>';
      }
    }
    if (!useSidebar) {
      html += '<nav role="navigation" class="nav-menu" aria-label="Main navigation" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">';
      if (staleBannerHtml) {
        html += '<span class="nav-menu-stale-banner" style="padding:0.25rem 0.5rem;background:var(--color-warning);color:var(--color-text);font-size:0.85rem;border-radius:var(--radius-sm)">' + staleBannerHtml + '</span>';
      }
      if (menus.length) {
        tree.forEach(function (node) {
          const m = node.menu;
          const action = m.action ? viewsSvc.getAction(m.action) : null;
          const route = action ? actionToRoute(action) : menuToRoute(m);
          const href = route ? '#' + route : '#';
          const cls = 'nav-link' + (route ? '' : ' nav-link-disabled');
          if (node.children.length) {
            html += '<span class="nav-dropdown" style="position:relative;display:inline-block">';
            html += '<a href="' + href + '" class="' + cls + '" data-menu-id="' + (m.id || '').replace(/"/g, '&quot;') + '">' + (m.name || '').replace(/</g, '&lt;') + '</a>';
            html += '<span class="nav-dropdown-content" style="display:none;position:absolute;top:100%;left:0;background:#1a1a2e;min-width:140px;padding:0.5rem 0;border-radius:4px;z-index:100">';
            node.children.forEach(function (ch) {
              const cm = ch.menu;
              const caction = cm.action ? viewsSvc.getAction(cm.action) : null;
              const croute = caction ? actionToRoute(caction) : menuToRoute(cm);
              const chref = croute ? '#' + croute : '#';
              html += '<a href="' + chref + '" class="nav-link" style="display:block;padding:0.5rem 1rem;white-space:nowrap" data-menu-id="' + (cm.id || '').replace(/"/g, '&quot;') + '">' + (cm.name || '').replace(/</g, '&lt;') + '</a>';
            });
            html += '</span></span>';
          } else {
            html += '<a href="' + href + '" class="' + cls + '" data-menu-id="' + (m.id || '').replace(/"/g, '&quot;') + '">' + (m.name || '').replace(/</g, '&lt;') + '</a>';
          }
        });
      }
      html += '</nav>';
    }
    html += '</span><span class="nav-user" style="margin-left:auto;display:flex;align-items:center;gap:0.75rem">';
    if (userCompanies && userCompanies.allowed_companies && userCompanies.allowed_companies.length > 1) {
      const cur = userCompanies.current_company;
      html += '<span class="nav-dropdown company-switcher" style="position:relative;display:inline-block">';
      html += '<button type="button" class="nav-link company-switcher-btn" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit" title="Switch company">';
      html += (cur && cur.name ? cur.name : 'Company') + ' &#9662;</button>';
      html += '<span class="nav-dropdown-content company-dropdown" style="display:none;position:absolute;top:100%;right:0;min-width:160px;padding:0.5rem 0;background:#1a1a2e;border-radius:4px;z-index:100">';
      userCompanies.allowed_companies.forEach(function (c) {
        const active = cur && c.id === cur.id ? ' nav-link-active' : '';
        html += '<button type="button" class="nav-link company-option' + active + '" style="display:block;width:100%;text-align:left;padding:0.5rem 1rem;background:none;border:none;cursor:pointer;font:inherit;color:inherit" data-company-id="' + (c.id || '') + '">' + (c.name || '').replace(/</g, '&lt;') + '</button>';
      });
      html += '</span></span>';
    } else if (userCompanies && userCompanies.current_company) {
      html += '<span class="nav-company-badge" title="Current company">' + (userCompanies.current_company.name || '').replace(/</g, '&lt;') + '</span>';
    }
    if (userLangs && userLangs.length > 1) {
      const cur = userLangs.find(function (l) { return l.code === currentLang; }) || userLangs[0];
      html += '<span class="nav-dropdown lang-switcher" style="position:relative;display:inline-block">';
      html += '<button type="button" class="nav-link lang-switcher-btn" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit" title="Language">' + (cur.name || cur.code || 'Lang').replace(/</g, '&lt;') + ' &#9662;</button>';
      html += '<span class="nav-dropdown-content lang-dropdown" style="display:none;position:absolute;top:100%;right:0;min-width:120px;padding:0.5rem 0;background:#1a1a2e;border-radius:4px;z-index:100">';
      userLangs.forEach(function (l) {
        const active = l.code === currentLang ? ' nav-link-active' : '';
        html += '<button type="button" class="nav-link lang-option' + active + '" style="display:block;width:100%;text-align:left;padding:0.5rem 1rem;background:none;border:none;cursor:pointer;font:inherit;color:inherit" data-lang="' + (l.code || '').replace(/"/g, '&quot;') + '">' + (l.name || l.code || '').replace(/</g, '&lt;') + '</button>';
      });
      html += '</span></span>';
    }
    const theme = (typeof localStorage !== 'undefined' && localStorage.getItem('erp_theme')) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    html += '<button type="button" class="nav-link theme-toggle" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit" title="Toggle dark mode" aria-label="Toggle theme">' + (theme === 'dark' ? '\u263D' : '\u263C') + '</button>';
    html += '<span class="nav-dropdown notification-bell" style="position:relative;display:inline-block">';
    html += '<button type="button" class="nav-link notification-bell-btn" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit;position:relative" title="Notifications" aria-label="Notifications">&#128276;</button>';
    html += '<span class="notification-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#c00;color:white;font-size:0.7rem;min-width:1.2em;height:1.2em;border-radius:50%;text-align:center;line-height:1.2em;padding:0 4px">0</span>';
    html += '<span class="nav-dropdown-content notification-dropdown" style="display:none;position:absolute;top:100%;right:0;min-width:280px;max-width:360px;max-height:400px;overflow-y:auto;padding:0.5rem 0;background:#1a1a2e;border-radius:4px;z-index:100;margin-top:4px">';
    html += '<div class="notification-header" style="padding:0.5rem 1rem;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center"><span>Notifications</span><button type="button" class="nav-link mark-all-read" style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:var(--text-muted)">Mark all read</button></div>';
    html += '<div id="notification-list" style="max-height:320px;overflow-y:auto"></div>';
    html += '</span></span>';
    html += '<a href="#discuss" class="nav-link" title="Discuss">Discuss</a>';
    html += '<span class="o-systray-registry"></span>';
    html += '<a href="/web/logout" class="nav-link">Logout</a>';
    html += '</span>';
    navbar.innerHTML = html;
    if (window.__erpNavbarContract && typeof window.__erpNavbarContract.markDelegated === 'function') {
      window.__erpNavbarContract.markDelegated(navbar);
    }
    renderSystrayMount();
    if (appSidebar) {
      var sidebarTree = tree;
      if (appRoots.length && selectedAppId) {
        if (selectedRoot) {
          sidebarTree = selectedRoot.children && selectedRoot.children.length
            ? selectedRoot.children
            : [selectedRoot];
        }
      }
      if (SidebarCore && typeof SidebarCore.render === "function") {
        appSidebar.innerHTML = SidebarCore.render({
          tree: sidebarTree,
          staleBannerHtml: staleBannerHtml,
          buildSidebarNavHtml: buildSidebarNavHtml,
        }) || buildSidebarNavHtml(sidebarTree, staleBannerHtml);
        if (typeof SidebarCore.wire === "function") {
          SidebarCore.wire({ wireSidebarAfterRender: wireSidebarAfterRender });
        } else {
          wireSidebarAfterRender();
        }
      } else {
        appSidebar.innerHTML = buildSidebarNavHtml(sidebarTree, staleBannerHtml);
        wireSidebarAfterRender();
      }
    }
    var appsHomeBtn = navbar.querySelector('#nav-apps-home');
    if (appsHomeBtn) {
      appsHomeBtn.addEventListener('click', function () {
        window.location.hash = '#home';
      });
    }
    var hamburger = navbar.querySelector('.nav-hamburger');
    var navMenu = navbar.querySelector('.nav-menu');
    if (hamburger && navMenu && !appSidebar) {
      function updateHamburgerVisibility() {
        hamburger.style.display = (window.innerWidth <= 768) ? 'flex' : 'none';
        if (window.innerWidth > 768) navMenu.classList.remove('nav-menu-open');
      }
      if (window.innerWidth <= 768) hamburger.style.display = 'flex';
      hamburger.onclick = function () {
        navMenu.classList.toggle('nav-menu-open');
      };
      window.addEventListener('resize', updateHamburgerVisibility);
    }
    if (appSidebar && hamburger) {
      function syncMobileHamburgerVisibility() {
        hamburger.style.display = (window.innerWidth <= 1023) ? 'inline-flex' : 'none';
      }
      syncMobileHamburgerVisibility();
      window.addEventListener('resize', syncMobileHamburgerVisibility);
    }
    navbar.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.onclick = function () {
        const root = document.documentElement;
        const cur = root.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = cur === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        if (typeof localStorage !== 'undefined') localStorage.setItem('erp_theme', next);
        btn.textContent = next === 'dark' ? '\u263D' : '\u263C';
      };
    });
    navbar.querySelectorAll('.nav-dropdown').forEach(function (dd) {
      const label = dd.querySelector('a') || dd.querySelector('button');
      const content = dd.querySelector('.nav-dropdown-content');
      if (label && content) {
        var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouch && window.innerWidth <= 768) {
          label.onclick = function (e) {
            if (dd.classList.contains('nav-dropdown-open')) {
              dd.classList.remove('nav-dropdown-open');
              content.style.display = 'none';
            } else {
              navbar.querySelectorAll('.nav-dropdown-open').forEach(function (o) {
                o.classList.remove('nav-dropdown-open');
                var c = o.querySelector('.nav-dropdown-content');
                if (c) c.style.display = 'none';
              });
              dd.classList.add('nav-dropdown-open');
              content.style.display = 'block';
            }
            e.preventDefault();
            e.stopPropagation();
          };
        } else {
          label.onmouseenter = function () { content.style.display = 'block'; };
          dd.onmouseleave = function () { content.style.display = 'none'; };
        }
      }
    });
    navbar.querySelectorAll('.company-option').forEach(function (btn) {
      btn.onclick = function () {
        const cid = parseInt(btn.getAttribute('data-company-id'), 10);
        if (!cid) return;
        fetch('/web/session/set_current_company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ company_id: cid })
        }).then(function (r) {
          if (r.ok) {
            if (window.Services && window.Services.session) window.Services.session.clearCache();
            window.location.reload();
          }
        });
      };
    });
    navbar.querySelectorAll('.lang-option').forEach(function (btn) {
      btn.onclick = function () {
        const lang = btn.getAttribute('data-lang');
        if (!lang) return;
        fetch('/web/session/set_lang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ lang: lang })
        }).then(function (r) {
          if (r.ok) {
            if (window.Services && window.Services.session) window.Services.session.clearCache();
            window.location.reload();
          }
        });
      };
    });
    var bellBtn = navbar.querySelector('.notification-bell-btn');
    var bellDropdown = navbar.querySelector('.notification-dropdown');
    var badgeEl = navbar.querySelector('.notification-badge');
    function loadNotificationCount() {
      fetch('/mail/notifications', { credentials: 'include' }).then(function (r) { return r.json(); }).then(function (list) {
        var n = (list && list.length) || 0;
        if (badgeEl) {
          badgeEl.textContent = n > 99 ? '99+' : String(n);
          badgeEl.style.display = n > 0 ? 'block' : 'none';
        }
      }).catch(function () {});
    }
    function loadNotificationList() {
      var listEl = document.getElementById('notification-list');
      if (!listEl) return;
      fetch('/mail/notifications', { credentials: 'include' }).then(function (r) { return r.json(); }).then(function (list) {
        if (!list || !list.length) {
          listEl.innerHTML = '<p style="padding:1rem;color:var(--text-muted);margin:0">No new notifications</p>';
          return;
        }
        var modelToRoute = { 'res.partner': 'contacts', 'crm.lead': 'leads', 'sale.order': 'orders', 'mail.channel': 'discuss' };
        listEl.innerHTML = list.map(function (n) {
          var route = modelToRoute[n.res_model] || (n.res_model ? (n.res_model || '').replace(/\\./g, '_') : '');
          var href = (route === 'discuss' && n.res_id) ? '#discuss/' + n.res_id : (route ? '#' + route + '/edit/' + (n.res_id || '') : '#');
          var body = (n.body || '').replace(/</g, '&lt;').substring(0, 80);
          return '<a href="' + href + '" class="notification-item" data-id="' + (n.id || '') + '" style="display:block;padding:0.5rem 1rem;border-bottom:1px solid var(--border-color);text-decoration:none;color:inherit;font-size:0.9rem" onclick="document.querySelector(\'.notification-dropdown\').style.display=\'none\'">' + body + '<br><span style="font-size:0.75rem;color:var(--text-muted)">' + (n.date || '').substring(0, 16) + '</span></a>';
        }).join('');
      }).catch(function () { listEl.innerHTML = '<p style="padding:1rem;color:var(--text-muted);margin:0">Could not load</p>'; });
    }
    if (bellBtn && bellDropdown) {
      bellBtn.onclick = function () {
        var isOpen = bellDropdown.style.display === 'block';
        bellDropdown.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) loadNotificationList();
      };
      document.addEventListener('click', function (e) {
        if (bellDropdown && bellDropdown.style.display === 'block' && !bellDropdown.contains(e.target) && !bellBtn.contains(e.target)) {
          bellDropdown.style.display = 'none';
        }
      });
    }
    if (navbar.querySelector('.mark-all-read')) {
      navbar.querySelector('.mark-all-read').onclick = function () {
        var markReadHdrs = { 'Content-Type': 'application/json' };
        if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) Object.assign(markReadHdrs, window.Services.session.getAuthHeaders());
        fetch('/mail/notifications/mark_read', { method: 'POST', credentials: 'include', headers: markReadHdrs, body: JSON.stringify({ all: true }) }).then(function () { loadNotificationCount(); loadNotificationList(); });
      };
    }
    loadNotificationCount();
  }

  function getListColumns(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'list');
      if (v && v.columns && v.columns.length) return v.columns.map(c => (typeof c === 'object' ? c.name : c) || c);
    }
    if (model === 'crm.lead') return ['name', 'type', 'stage_id', 'ai_score_label', 'date_deadline', 'expected_revenue', 'tag_ids'];
    if (model === 'sale.order') return ['name', 'partner_id', 'date_order', 'state', 'amount_total'];
    if (model === 'product.product') return ['name', 'list_price'];
    if (model === 'res.users') return ['name', 'login', 'active'];
    return ['name', 'is_company', 'email', 'phone', 'city', 'country_id', 'state_id'];
  }

  function getSearchFields(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'search');
      if (v && v.search_fields && v.search_fields.length) return v.search_fields;
    }
    return ['name'];
  }

  function getReportName(model) {
    if (viewsSvc && viewsSvc.getReportName) {
      const fromRegistry = viewsSvc.getReportName(model);
      if (fromRegistry) return fromRegistry;
    }
    const reportMap = {
      'crm.lead': 'crm.lead_summary',
      'sale.order': 'sale.order',
      'account.move': 'account.move',
      'purchase.order': 'purchase.order',
      'stock.picking': 'stock.picking'
    };
    return reportMap[model] || null;
  }

  function buildSearchDomain(model, searchTerm) {
    const fields = getSearchFields(model);
    if (!searchTerm || !fields.length) return [];
    if (fields.length === 1) return [[fields[0], 'ilike', searchTerm]];
    const terms = fields.map(function (f) { return [f, 'ilike', searchTerm]; });
    const ops = [];
    for (let i = 0; i < terms.length - 1; i++) ops.push('|');
    return ops.concat(terms);
  }

  function getSavedFiltersFromStorage(model) {
    try {
      const raw = localStorage.getItem('erp_saved_filters_' + (model || '').replace(/\./g, '_'));
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function getSavedFilters(model) {
    const sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) return Promise.resolve(getSavedFiltersFromStorage(model));
    return sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) return getSavedFiltersFromStorage(model);
      const domain = [['model_id', '=', model || ''], '|', ['user_id', '=', false], ['user_id', '=', info.uid]];
      return rpc.callKw('ir.filters', 'search_read', [domain], { fields: ['id', 'name', 'domain'], limit: 100 })
        .then(function (rows) {
          return (rows || []).map(function (r) {
            var dom = [];
            try { dom = r.domain ? JSON.parse(r.domain) : []; } catch (e) {}
            return { id: r.id, name: r.name || 'Filter', domain: dom };
          });
        })
        .catch(function () { return getSavedFiltersFromStorage(model); });
    }).catch(function () { return getSavedFiltersFromStorage(model); });
  }
  function saveSavedFilter(model, name, domain) {
    const sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) {
      const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
      const filters = getSavedFiltersFromStorage(model);
      const id = 'f' + Date.now();
      filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
      return Promise.resolve(id);
    }
    return sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) {
        const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
        const filters = getSavedFiltersFromStorage(model);
        const id = 'f' + Date.now();
        filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
        try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
        return id;
      }
      return rpc.callKw('ir.filters', 'create', [{
        name: name || 'Filter',
        model_id: model || '',
        domain: JSON.stringify(domain || []),
        user_id: info.uid
      }], {}).then(function (rec) {
        if (!rec) return null;
        if (Array.isArray(rec) && rec.length) return rec[0];
        return rec.ids ? rec.ids[0] : (rec.id != null ? rec.id : null);
      }).catch(function () {
        const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
        const filters = getSavedFiltersFromStorage(model);
        const id = 'f' + Date.now();
        filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
        try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
        return id;
      });
    });
  }
  function removeSavedFilter(model, id) {
    if (typeof id === 'string' && id.indexOf('f') === 0) {
      const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
      const filters = getSavedFiltersFromStorage(model).filter(function (f) { return f.id !== id; });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
      return Promise.resolve();
    }
    return rpc.callKw('ir.filters', 'unlink', [[parseInt(id, 10)]], {}).catch(function () {
      const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
      const filters = getSavedFiltersFromStorage(model).filter(function (f) { return f.id !== id; });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
    });
  }

  function getFormFields(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'form');
      if (v && v.fields && v.fields.length) {
        const raw = v.fields.map(f => (typeof f === 'object' ? f.name : f) || f);
        const out = [];
        raw.forEach(function (f) {
          const cf = getMonetaryCurrencyField(model, f);
          if (cf && out.indexOf(cf) < 0) out.push(cf);
          out.push(f);
        });
        return out;
      }
    }
    if (model === 'crm.lead') return ['name', 'type', 'partner_id', 'user_id', 'stage_id', 'ai_score', 'ai_score_label', 'currency_id', 'expected_revenue', 'description', 'note_html', 'tag_ids', 'activity_ids', 'message_ids'];
    if (model === 'sale.order') return ['name', 'partner_id', 'date_order', 'state', 'currency_id', 'amount_total', 'order_line'];
    if (model === 'product.product') return ['name', 'list_price'];
    if (model === 'res.users') return ['name', 'login', 'active', 'group_ids'];
    if (model === 'ir.attachment') return ['name', 'res_model', 'res_id', 'datas'];
    return ['name', 'is_company', 'type', 'email', 'phone', 'street', 'street2', 'city', 'zip', 'country_id', 'state_id'];
  }

  function getTitle(route) {
    if (route === 'contacts') return 'Contacts';
    if (route === 'pipeline') return 'Pipeline';
    if (route === 'crm/activities') return 'CRM Activities';
    if (route === 'leads') return 'Leads';
    if (route === 'orders') return 'Orders';
    if (route === 'products') return 'Products';
    if (route === 'attachments') return 'Attachments';
    if (route === 'settings/users') return 'Users';
    if (route === 'settings/approval_rules') return 'Approval Rules';
    if (route === 'settings/approval_requests') return 'Approval Requests';
    if (route === 'marketing/mailing_lists') return 'Mailing Lists';
    if (route === 'marketing/mailings') return 'Mailings';
    if (route === 'articles') return 'Articles';
    if (route === 'knowledge_categories') return 'Categories';
    if (route === 'leaves') return 'Leaves';
    if (route === 'leave_types') return 'Leave Types';
    if (route === 'allocations') return 'Allocations';
    if (route === 'cron') return 'Scheduled Actions';
    if (route === 'server_actions') return 'Server Actions';
    if (route === 'sequences') return 'Sequences';
    if (route === 'manufacturing') return 'Manufacturing Orders';
    if (route === 'boms') return 'Bills of Materials';
    if (route === 'workcenters') return 'Work Centers';
    if (route === 'transfers') return 'Transfers';
    if (route === 'warehouses') return 'Warehouses';
    if (route === 'purchase_orders') return 'Purchase Orders';
    if (route === 'invoices') return 'Invoices';
    if (route === 'bank_statements') return 'Bank Statements';
    if (route === 'journals') return 'Journals';
    if (route === 'accounts') return 'Chart of Accounts';
    if (route === 'employees') return 'Employees';
    if (route === 'departments') return 'Departments';
    if (route === 'jobs') return 'Job Positions';
    if (route === 'attendances') return 'Attendances';
    if (route === 'recruitment') return 'Recruitment';
    if (route === 'time_off') return 'Time Off';
    if (route === 'expenses') return 'Expenses';
    if (route === 'projects') return 'Projects';
    if (route === 'repair_orders') return 'Repairs';
    if (route === 'surveys') return 'Surveys';
    if (route === 'lunch_orders') return 'Lunch';
    if (route === 'livechat_channels') return 'Live Chat';
    if (route === 'project_todos') return 'To-Do';
    if (route === 'recycle_models') return 'Data Recycle';
    if (route === 'skills') return 'Skills';
    if (route === 'elearning') return 'eLearning';
    if (route === 'timesheets') return 'Timesheets';
    if (route === 'tickets') return 'Tickets';
    if (route === 'crm_stages') return 'CRM Stages';
    if (route === 'crm_tags') return 'CRM Tags';
    if (route === 'crm_lost_reasons') return 'Lost Reasons';
    return route ? (route.charAt(0).toUpperCase() + route.slice(1)) : 'Records';
  }

  String.prototype.escapeHtml = function () {
    const div = document.createElement('div');
    div.textContent = this;
    return div.innerHTML;
  };

  function renderDiscuss(channelId) {
    if (DiscussViewCore && typeof DiscussViewCore.render === "function") {
      var coreHandled = DiscussViewCore.render(main, {
        channelId: channelId,
        rpc: rpc,
        showToast: showToast,
      });
      if (coreHandled) return;
    }
    actionStack = [];
    const container = document.createElement('div');
    container.id = 'discuss-container';
    container.style.cssText = 'display:grid;grid-template-columns:220px 1fr;gap:var(--space-md);min-height:400px';
    main.innerHTML = '';
    main.appendChild(container);
    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'border-right:1px solid var(--border-color);padding:var(--space-md)';
    const msgArea = document.createElement('div');
    msgArea.style.cssText = 'display:flex;flex-direction:column;padding:var(--space-md)';
    container.appendChild(sidebar);
    container.appendChild(msgArea);
    sidebar.innerHTML = '<h3 style="margin:0 0 var(--space-sm)">Channels</h3><button type="button" id="discuss-new-channel" style="margin-bottom:var(--space-md);padding:var(--space-sm) var(--space-md);background:var(--color-primary);color:white;border:none;border-radius:4px;cursor:pointer">New Channel</button><div id="discuss-channel-list"></div>';
    msgArea.innerHTML = '<div id="discuss-messages" style="flex:1;overflow-y:auto;min-height:200px"></div><div id="discuss-compose" style="margin-top:var(--space-md);display:none"><textarea id="discuss-body" rows="2" style="width:100%;padding:var(--space-sm);border:1px solid var(--border-color);border-radius:4px;resize:vertical"></textarea><button type="button" id="discuss-post-btn" style="margin-top:var(--space-sm);padding:var(--space-sm) var(--space-md);background:var(--color-primary);color:white;border:none;border-radius:4px;cursor:pointer">Send</button></div>';
    fetch('/discuss/channel/list', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (channels) {
        const listEl = document.getElementById('discuss-channel-list');
        if (!listEl) return;
        if (!channels || !channels.length) {
          listEl.innerHTML = '<p style="color:var(--text-muted)">No channels. Create one.</p>';
          return;
        }
        listEl.innerHTML = channels.map(function (c) {
          const active = channelId && c.id === parseInt(channelId, 10) ? ' style="background:var(--color-primary-10);font-weight:600"' : '';
          return '<a href="#discuss/' + c.id + '" class="discuss-channel-link" data-id="' + c.id + '"' + active + ' style="display:block;padding:var(--space-sm);border-radius:4px;text-decoration:none;color:inherit;margin-bottom:2px">' + (c.name || '').replace(/</g, '&lt;') + '</a>';
        }).join('');
        if (channelId) {
          const compose = document.getElementById('discuss-compose');
          if (compose) compose.style.display = 'block';
          fetch('/discuss/channel/' + channelId + '/messages', { credentials: 'include' })
            .then(function (r) { return r.json(); })
            .then(function (msgs) {
              const msgEl = document.getElementById('discuss-messages');
              if (!msgEl) return;
              if (!msgs || !msgs.length) {
                msgEl.innerHTML = '<p style="color:var(--text-muted)">No messages yet.</p>';
                return;
              }
              msgEl.innerHTML = msgs.map(function (m) {
                const body = (m.body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
                const date = (m.date || '').substring(0, 19).replace('T', ' ');
                return '<div style="padding:var(--space-sm);border-bottom:1px solid var(--border-color)"><span style="font-size:0.85rem;color:var(--text-muted)">' + date + '</span><br>' + body + '</div>';
              }).join('');
            })
            .catch(function () {
              const msgEl = document.getElementById('discuss-messages');
              if (msgEl) msgEl.innerHTML = '<p style="color:var(--text-muted)">Could not load messages.</p>';
            });
        } else {
          document.getElementById('discuss-messages').innerHTML = '<p style="color:var(--text-muted)">Select a channel.</p>';
        }
      })
      .catch(function () {
        const listEl = document.getElementById('discuss-channel-list');
        if (listEl) listEl.innerHTML = '<p style="color:var(--text-muted)">Could not load channels.</p>';
      });
    document.getElementById('discuss-new-channel').onclick = function () {
      const name = prompt('Channel name:');
      if (!name || !name.trim()) return;
      var discussHdrs = { 'Content-Type': 'application/json' };
      if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) Object.assign(discussHdrs, window.Services.session.getAuthHeaders());
      fetch('/discuss/channel/create', {
        method: 'POST',
        credentials: 'include',
        headers: discussHdrs,
        body: JSON.stringify({ name: name.trim(), channel_type: 'channel' })
      }).then(function (r) { return r.json(); }).then(function (ch) {
        if (ch.error) { showToast(ch.error, 'error'); return; }
        window.location.hash = 'discuss/' + (ch.id || ch);
      }).catch(function () { showToast('Failed to create channel', 'error'); });
    };
    if (channelId) {
      document.getElementById('discuss-post-btn').onclick = function () {
        const body = document.getElementById('discuss-body').value.trim();
        if (!body) return;
        var postHdrs = { 'Content-Type': 'application/json' };
        if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) Object.assign(postHdrs, window.Services.session.getAuthHeaders());
        fetch('/discuss/channel/' + channelId + '/post', {
          method: 'POST',
          credentials: 'include',
          headers: postHdrs,
          body: JSON.stringify({ body: body })
        }).then(function (r) { return r.json(); }).then(function (msg) {
          if (msg.error) { showToast(msg.error, 'error'); return; }
          document.getElementById('discuss-body').value = '';
          var msgEl = document.getElementById('discuss-messages');
          var div = document.createElement('div');
          div.style.cssText = 'padding:var(--space-sm);border-bottom:1px solid var(--border-color)';
          div.innerHTML = '<span style="font-size:0.85rem;color:var(--text-muted)">' + (msg.date || '').substring(0, 19).replace('T', ' ') + '</span><br>' + (msg.body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
          msgEl.appendChild(div);
        }).catch(function () { showToast('Failed to post', 'error'); });
      };
    }
    if (window.Services && window.Services.bus) {
      var chs = [];
      (window.Services.session && window.Services.session.getSessionInfo ? window.Services.session.getSessionInfo() : Promise.resolve({ uid: 1 })).then(function (info) {
        chs.push('res.partner_' + ((info && info.uid) || 1));
        if (channelId) chs.push('mail.channel_' + channelId);
        window.Services.bus.setChannels(chs);
        window.Services.bus.start(chs);
      });
    }
    if (window._discussBusListener) window.removeEventListener('bus:message', window._discussBusListener);
    window._discussBusListener = function (e) {
      var d = e.detail || {};
      var msg = (d.message || {});
      if (msg.type === 'message' && msg.res_model === 'mail.channel' && msg.res_id == channelId) {
        var msgEl = document.getElementById('discuss-messages');
        if (!msgEl) return;
        var div = document.createElement('div');
        div.style.cssText = 'padding:var(--space-sm);border-bottom:1px solid var(--border-color)';
        div.innerHTML = '<span style="font-size:0.85rem;color:var(--text-muted)">' + (new Date().toISOString().substring(0, 19).replace('T', ' ')) + '</span><br>' + (msg.body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
        msgEl.appendChild(div);
      }
    };
    window.addEventListener('bus:message', window._discussBusListener);
  }

  function renderHome() {
    if (typeof window !== 'undefined') window.chatContext = {};
    actionStack = [];
    var menus = (viewsSvc && viewsSvc.getMenus()) ? viewsSvc.getMenus() : [];
    var tree = menus.length ? buildMenuTree(menus) : [];
    var appRoots = getAppRoots(tree, menus);
    var storedAppId = typeof localStorage !== 'undefined' ? (localStorage.getItem('erp_sidebar_app') || '') : '';

    main.innerHTML = '';
    var root = document.createElement('section');
    root.className = 'o-home-apps';

    var header = document.createElement('header');
    header.className = 'o-home-apps-header';
    header.innerHTML = '<h2 class="o-home-apps-title">Apps</h2><p class="o-home-apps-subtitle">Choose a module to start working.</p>';
    root.appendChild(header);

    /* Phases 623–626: app launcher (getAppRoots) first; KPI strip + dashboard below — no KPI regression */
    var grid = document.createElement('div');
    grid.className = 'o-app-grid';
    if (!appRoots.length) {
      grid.innerHTML = '<p class="o-app-grid-empty">No apps available.</p>';
    } else {
      appRoots.forEach(function (node) {
        var menu = node.menu || {};
        var appId = menu.id || '';
        var tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'o-app-tile o-card-gradient';
        if (String(appId) === String(storedAppId)) tile.className += ' o-app-tile--active';
        var icon = _sidebarIconHtml(menu);
        var defaultRoute = getDefaultRouteForAppNode(node) || 'home';
        tile.innerHTML =
          '<span class="o-app-tile-icon-wrap">' + icon + '</span>' +
          '<span class="o-app-tile-name">' + escNavHtml(menu.name || 'App') + '</span>' +
          '<span class="o-app-tile-route">' + escNavHtml(defaultRoute) + '</span>';
        tile.addEventListener('click', function () {
          selectApp(appId);
        });
        grid.appendChild(tile);
      });
    }
    root.appendChild(grid);

    var kpiStrip = document.createElement('div');
    kpiStrip.className = 'o-home-kpi-strip-outer';
    if (window.AppCore && window.AppCore.DashboardKpiStrip && typeof window.AppCore.DashboardKpiStrip.buildHtml === 'function') {
      kpiStrip.innerHTML = window.AppCore.DashboardKpiStrip.buildHtml();
    }
    root.appendChild(kpiStrip);
    if (window.AppCore && window.AppCore.DashboardKpiStrip && typeof window.AppCore.DashboardKpiStrip.wireHomeKpiStrip === 'function') {
      window.AppCore.DashboardKpiStrip.wireHomeKpiStrip(kpiStrip, rpc);
    }
    if (window.UIComponents && window.UIComponents.OnboardingPanel && typeof window.UIComponents.OnboardingPanel.renderHTML === "function") {
      var onboardingWrap = document.createElement("div");
      onboardingWrap.innerHTML = window.UIComponents.OnboardingPanel.renderHTML({
        storageKey: "home",
        steps: [
          { title: "Configure company", description: "Set company profile and defaults.", actionLabel: "Open settings", done: false },
          { title: "Import data", description: "Load customers and products.", actionLabel: "Open import", done: false },
          { title: "Create first record", description: "Start with a lead, task, or invoice.", actionLabel: "Open CRM", done: false },
        ],
      });
      root.appendChild(onboardingWrap);
      window.UIComponents.OnboardingPanel.wire(onboardingWrap, {
        onStepAction: function (idx) {
          if (idx === 0) window.location.hash = "settings";
          if (idx === 1) window.location.hash = "contacts";
          if (idx === 2) window.location.hash = "pipeline";
        },
      });
    }

    var dashboardWrap = document.createElement('section');
    dashboardWrap.className = 'o-home-dashboard-wrap';
    root.appendChild(dashboardWrap);
    main.appendChild(root);

    if (DashboardCore && typeof DashboardCore.render === 'function') {
      DashboardCore.render(dashboardWrap, { rpc: rpc });
      return;
    }
    dashboardWrap.innerHTML = '<p class="o-dashboard-fallback">Dashboard module not loaded.</p>';
  }

  function renderDashboard() {
    actionStack = [];
    if (DashboardCore && typeof DashboardCore.render === 'function') {
      DashboardCore.render(main, { rpc: rpc });
      return;
    }
    main.innerHTML = '<p class="o-dashboard-fallback">Dashboard module not loaded.</p>';
  }

  function renderSettings() {
    actionStack = [{ label: 'Settings', hash: 'settings' }];
    if (SettingsCore && typeof SettingsCore.renderIndex === 'function') {
      SettingsCore.renderIndex(main, {
        rpc: rpc,
        showToast: showToast,
        reloadIndex: function () { renderSettings(); },
      });
      return;
    }
    main.innerHTML = '<p class="o-settings-fallback">Settings module not loaded.</p>';
  }

  function renderDashboardWidgets() {
    actionStack = [{ label: 'Settings', hash: 'settings' }, { label: 'Dashboard Widgets', hash: 'settings/dashboard-widgets' }];
    if (SettingsCore && typeof SettingsCore.renderDashboardWidgets === 'function') {
      SettingsCore.renderDashboardWidgets(main, {
        rpc: rpc,
        showToast: showToast,
        breadcrumbsHtml: renderBreadcrumbs(),
        reloadDashboardWidgets: function () { renderDashboardWidgets(); },
      });
      attachBreadcrumbHandlers();
      return;
    }
    main.innerHTML = renderBreadcrumbs() + '<p class="o-settings-fallback">Settings module not loaded.</p>';
    attachBreadcrumbHandlers();
  }

  function renderApiKeysSettings() {
    actionStack = [{ label: 'Settings', hash: 'settings' }, { label: 'API Keys', hash: 'settings/apikeys' }];
    if (SettingsCore && typeof SettingsCore.renderApiKeys === 'function') {
      SettingsCore.renderApiKeys(main, {
        rpc: rpc,
        showToast: showToast,
        breadcrumbsHtml: renderBreadcrumbs(),
        reloadApiKeys: function () { renderApiKeysSettings(); },
      });
      attachBreadcrumbHandlers();
      return;
    }
    main.innerHTML = renderBreadcrumbs() + '<p class="o-settings-fallback">Settings module not loaded.</p>';
    attachBreadcrumbHandlers();
  }

  function renderTotpSettings() {
    actionStack = [{ label: 'Settings', hash: 'settings' }, { label: 'Two-Factor Authentication', hash: 'settings/totp' }];
    if (SettingsCore && typeof SettingsCore.renderTotp === 'function') {
      SettingsCore.renderTotp(main, {
        showToast: showToast,
        breadcrumbsHtml: renderBreadcrumbs(),
        reloadTotp: function () { renderTotpSettings(); },
      });
      attachBreadcrumbHandlers();
      return;
    }
    main.innerHTML = renderBreadcrumbs() + '<p class="o-settings-fallback">Settings module not loaded.</p>';
    attachBreadcrumbHandlers();
  }

  function getDisplayNames(model, colName, records) {
    if (records && records.length && records[0][colName + '_display'] !== undefined) {
      var map = {};
      records.forEach(function (r) {
        var v = r[colName];
        if (v && !map[v]) map[v] = r[colName + '_display'] || v;
      });
      return Promise.resolve(map);
    }
    const comodel = getMany2oneComodel(model, colName);
    if (!comodel) return Promise.resolve({});
    const ids = [];
    records.forEach(function (r) { const v = r[colName]; if (v) ids.push(v); });
    if (!ids.length) return Promise.resolve({});
    const uniq = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    var map = {};
    return rpc.callKw(comodel, 'read', [uniq, ['id', 'name', 'display_name']])
      .then(function (rows) {
        (rows || []).forEach(function (row) { map[row.id] = row.display_name || row.name || row.id; });
        return map;
      })
      .catch(function () { return {}; });
  }

  function getDisplayNamesForMany2many(model, colName, records) {
    const m2m = getMany2manyInfo(model, colName);
    if (!m2m || !m2m.comodel) return Promise.resolve({});
    const ids = [];
    records.forEach(function (r) {
      const v = r[colName];
      if (Array.isArray(v)) v.forEach(function (id) { ids.push(id); });
    });
    if (!ids.length) return Promise.resolve({});
    const uniq = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    const map = {};
    return rpc.callKw(m2m.comodel, 'read', [uniq, ['id', 'name']])
      .then(function (rows) {
        (rows || []).forEach(function (row) { map[row.id] = row.name || row.id; });
        return map;
      })
      .catch(function () { return {}; });
  }

  function renderViewSwitcher(route, currentView) {
    if (ListViewCore && typeof ListViewCore.renderViewSwitcher === 'function') {
      return ListViewCore.renderViewSwitcher(route, currentView, { getAvailableViewModes: getAvailableViewModes });
    }
    const modes = getAvailableViewModes(route).filter(function (m) { return m === 'list' || m === 'kanban' || m === 'graph' || m === 'calendar' || m === 'activity' || m === 'pivot' || m === 'gantt'; });
    if (modes.length < 2) return '';
    const labels = { list: 'List', kanban: 'Kanban', graph: 'Graph', pivot: 'Pivot', calendar: 'Calendar', activity: 'Activity', gantt: 'Gantt' };
    let html = '<span class="view-switcher o-list-view-switcher">';
    modes.forEach(function (m) {
      const active = m === currentView;
      html += '<button type="button" class="btn-view' + (active ? ' active' : '') + '" data-view="' + m + '">' + (labels[m] || m) + '</button>';
    });
    return html + '</span>';
  }

  function renderList(model, route, records, searchTerm, totalCount, offset, limit, savedFiltersList) {
    savedFiltersList = savedFiltersList || [];
    var prevSearchModel = currentListState.__searchModel;
    var prevListModel = prevSearchModel && prevSearchModel.model;
    if (!prevSearchModel || prevListModel !== model) {
      if (prevListModel != null && prevListModel !== model) {
        currentListState.facets = [];
        currentListState._facetsDefaultsApplied = false;
      }
      if (window.AppCore && window.AppCore.SearchModel) {
        currentListState.__searchModel = new window.AppCore.SearchModel(model, viewsSvc, currentListState);
      } else {
        currentListState.__searchModel = null;
      }
    }
    if (ListViewCore && typeof ListViewCore.render === 'function') {
      actionStack = [{ label: getTitle(route), hash: route }];
      ListViewCore.render(main, {
        rpc: rpc,
        viewsSvc: viewsSvc,
        showToast: showToast,
        model: model,
        route: route,
        records: records,
        searchTerm: searchTerm,
        totalCount: totalCount,
        offset: offset,
        limit: limit,
        searchModel: currentListState.__searchModel,
        savedFiltersList: savedFiltersList,
        currentListState: currentListState,
        helpers: {
          getAvailableViewModes: getAvailableViewModes,
          getListColumns: getListColumns,
          getTitle: getTitle,
          getReportName: getReportName,
          loadRecords: loadRecords,
          setViewAndReload: setViewAndReload,
          deleteRecord: deleteRecord,
          getMany2oneComodel: getMany2oneComodel,
          getMany2manyInfo: getMany2manyInfo,
          isMonetaryField: isMonetaryField,
          getMonetaryCurrencyField: getMonetaryCurrencyField,
          getSelectionLabel: getSelectionLabel,
          getDisplayNames: getDisplayNames,
          getDisplayNamesForMany2many: getDisplayNamesForMany2many,
          getActionForRoute: getActionForRoute,
          parseActionDomain: parseActionDomain,
          buildSearchDomain: buildSearchDomain,
          parseFilterDomain: parseFilterDomain,
          saveSavedFilter: saveSavedFilter,
          showImportModal: showImportModal,
          getHashDomainParam: getHashDomainParam,
          confirmModal: confirmModal,
          getFieldMeta: getFieldMeta,
          getSelectionOptions: getSelectionOptions,
          saveListState: window.ActionManager && window.ActionManager.saveListState ? window.ActionManager.saveListState : null,
          restoreListState: window.ActionManager && window.ActionManager.restoreListState ? window.ActionManager.restoreListState : null,
        }
      });
      return;
    }
    if (typeof window !== 'undefined') window.chatContext = { model: model, active_id: null };
    const cols = getListColumns(model);
    const title = getTitle(route);
    const addLabel = route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add';
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const currentView = (currentListState.route === route && currentListState.viewType) || 'list';
    const order = (currentListState.route === route && currentListState.order) || null;
    actionStack = [{ label: title, hash: route }];
    let html = '<h2>' + title + '</h2>';
    html += '<p class="o-list-fallback-toolbar">';
    html += renderViewSwitcher(route, currentView);
    html += '<div role="search" class="o-list-fallback-search"><input type="text" id="list-search" placeholder="Search..." aria-label="Search records" class="o-list-search-field" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
    html += '<button type="button" id="btn-ai-search" title="Natural language search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--accent">AI Search</button></div>';
    const searchView = viewsSvc && viewsSvc.getView(model, 'search');
    const searchFilters = (searchView && searchView.filters) || [];
    const searchGroupBys = (searchView && searchView.group_bys) || [];
    const activeFilters = currentListState.activeSearchFilters || [];
    const currentGroupBy = currentListState.groupBy || null;
    searchFilters.forEach(function (f) {
      const active = activeFilters.indexOf(f.name) >= 0;
      html += '<button type="button" class="btn-search-filter' + (active ? ' active' : '') + '" data-filter="' + (f.name || '').replace(/"/g, '&quot;') + '">' + (f.string || f.name || '').replace(/</g, '&lt;') + '</button>';
    });
    if (searchGroupBys.length) {
      html += '<select id="list-group-by" class="o-list-toolbar-select"><option value="">Group by</option>';
      searchGroupBys.forEach(function (g) {
        html += '<option value="' + (g.group_by || '').replace(/"/g, '&quot;') + '"' + (currentGroupBy === g.group_by ? ' selected' : '') + '>' + (g.string || g.name || '').replace(/</g, '&lt;') + '</option>';
      });
      html += '</select>';
    }
    html += '<select id="list-saved-filter" class="o-list-toolbar-select"><option value="">Saved filters</option>';
    savedFiltersList.forEach(function (f) {
      html += '<option value="' + (f.id != null ? String(f.id) : '').replace(/"/g, '&quot;') + '"' + (currentListState.savedFilterId == f.id ? ' selected' : '') + '>' + (f.name || 'Filter').replace(/</g, '&lt;') + '</option>';
    });
    html += '</select>';
    html += '<button type="button" id="btn-save-filter" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Save</button>';
    if (model === 'crm.lead') {
      html += '<select id="list-stage-filter" class="o-list-toolbar-select"><option value="">All stages</option></select>';
    }
    html += '<button type="button" id="btn-export" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Export CSV</button>';
    html += '<button type="button" id="btn-export-excel" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Export Excel</button>';
    html += '<button type="button" id="btn-import" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Import</button>';
    const reportName = getReportName(model);
    if (reportName) html += '<button type="button" id="btn-print" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Print</button>';
    html += '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + addLabel + '</button></p>';
    const hasFacets = (activeFilters.length > 0 || currentGroupBy);
    if (hasFacets) {
      html += '<p class="facet-chips o-list-facet-row">';
      activeFilters.forEach(function (fname) {
        const f = searchFilters.find(function (x) { return x.name === fname; });
        html += '<span class="facet-chip o-list-facet-chip" data-type="filter" data-name="' + (fname || '').replace(/"/g, '&quot;') + '">' + (f ? (f.string || fname) : fname).replace(/</g, '&lt;') + ' <button type="button" class="facet-remove o-list-facet-remove" aria-label="Remove">&times;</button></span>';
      });
      if (currentGroupBy) {
        const g = searchGroupBys.find(function (x) { return x.group_by === currentGroupBy; });
        html += '<span class="facet-chip o-list-facet-chip" data-type="groupby" data-name="' + (currentGroupBy || '').replace(/"/g, '&quot;') + '">Group: ' + (g ? (g.string || currentGroupBy) : currentGroupBy).replace(/</g, '&lt;') + ' <button type="button" class="facet-remove o-list-facet-remove" aria-label="Remove">&times;</button></span>';
      }
      html += '</p>';
    }
    if (!records || !records.length) {
      main.innerHTML = html + '<p>No records yet.</p>';
    } else {
      const m2oCols = cols.filter(function (c) {
        const f = typeof c === 'object' ? c.name : c;
        return getMany2oneComodel(model, f);
      });
      const m2mCols = cols.filter(function (c) {
        const f = typeof c === 'object' ? c.name : c;
        return getMany2manyInfo(model, f);
      });
      const numericCols = ['expected_revenue', 'revenue', 'amount', 'quantity'];
      function renderTable(nameMap) {
        let tbl = '<div id="bulk-action-bar" class="o-bulk-action-bar"><span id="bulk-selected-count" class="o-bulk-selected-count"></span><button type="button" id="bulk-delete" class="o-btn o-bulk-delete-btn">Delete Selected</button><button type="button" id="bulk-clear" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Clear</button></div>';
        tbl += '<table role="grid" aria-label="Records" class="o-list-fallback-table"><thead><tr role="row">';
        tbl += '<th role="columnheader" class="o-list-th o-list-th--checkbox"><input type="checkbox" id="list-select-all" aria-label="Select all" title="Select all"></th>';
        cols.forEach(c => {
          const f = typeof c === 'object' ? c.name : c;
          const label = (typeof c === 'object' ? c.name || c : c);
          const isSorted = order && (order.startsWith(f + ' ') || order.startsWith(f + ','));
          const dir = isSorted && order.indexOf('desc') >= 0 ? 'desc' : 'asc';
          const arrow = isSorted ? (dir === 'asc' ? ' \u25b2' : ' \u25bc') : '';
          tbl += '<th role="columnheader" class="sortable-col o-list-th o-list-th--sortable" data-field="' + (f || '').replace(/"/g, '&quot;') + '">' + (label || '').replace(/</g, '&lt;') + arrow + '</th>';
        });
        tbl += '<th role="columnheader" class="o-list-th o-list-th--actions"></th></tr></thead><tbody>';
        const groupByField = currentListState.groupBy;
        const groups = groupByField ? (function () {
          const g = {};
          (records || []).forEach(function (r) {
            const k = r[groupByField] != null ? r[groupByField] : '__false__';
            if (!g[k]) g[k] = [];
            g[k].push(r);
          });
          return Object.keys(g).map(function (k) { return { key: k === '__false__' ? false : k, rows: g[k] }; });
        })() : null;
        function renderRow(r, isGroupHeader, isSubtotal) {
          if (isGroupHeader) {
            const gval = r;
            const label = (nameMap && nameMap[groupByField] && gval != null) ? (nameMap[groupByField][gval] || gval) : (gval != null ? String(gval) : '(No value)');
            tbl += '<tr role="row" class="group-header o-list-group-header"><td role="gridcell" class="o-list-td o-list-group-cell" colspan="' + (cols.length + 2) + '">' + String(label).replace(/</g, '&lt;') + '</td></tr>';
            return;
          }
          if (isSubtotal) {
            tbl += '<tr role="row" class="group-subtotal o-list-subtotal-row"><td class="o-list-td o-list-td--checkbox"></td>';
            cols.forEach(c => {
              const f = typeof c === 'object' ? c.name : c;
              const sum = r[f];
              const isNum = numericCols.indexOf(f) >= 0;
              tbl += '<td role="gridcell" class="o-list-td">' + (isNum && sum != null ? Number(sum).toLocaleString() : '').replace(/</g, '&lt;') + '</td>';
            });
            tbl += '<td role="gridcell" class="o-list-td o-list-td--actions"></td></tr>';
            return;
          }
          tbl += '<tr role="row" tabindex="0" data-id="' + (r.id || '') + '" class="list-data-row">';
          tbl += '<td role="gridcell" class="o-list-td o-list-td--checkbox"><input type="checkbox" class="list-row-select" data-id="' + (r.id || '') + '" aria-label="Select row"></td>';
          cols.forEach(c => {
            const f = typeof c === 'object' ? c.name : c;
            let val = r[f];
            if (nameMap && nameMap[f] && val != null) {
              if (Array.isArray(val)) {
                val = val.map(function (id) { return nameMap[f][id] || id; }).join(', ');
              } else {
                val = nameMap[f][val] || val;
              }
            } else if (val != null) {
              if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
              else if (isMonetaryField(model, f)) {
                const n = Number(val);
                let formatted = !isNaN(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val;
                const currField = getMonetaryCurrencyField(model, f);
                if (currField && r[currField] && nameMap && nameMap[currField]) {
                  const sym = nameMap[currField][r[currField]];
                  if (sym) formatted = (sym + ' ' + formatted).trim();
                }
                val = formatted;
              } else {
                const selLabel = getSelectionLabel(model, f, val);
                if (selLabel !== val) val = selLabel;
              }
            }
            tbl += '<td role="gridcell" class="o-list-td">' + (val != null ? String(val) : '').replace(/</g, '&lt;') + '</td>';
          });
          tbl += '<td role="gridcell" class="o-list-td o-list-td--actions"><a href="#' + route + '/edit/' + (r.id || '') + '" class="o-list-action-link">Edit</a>';
          tbl += '<a href="#" class="btn-delete o-list-delete-link" data-id="' + (r.id || '') + '">Delete</a></td></tr>';
        }
        if (groups) {
          groups.forEach(function (grp) {
            renderRow(grp.key, true);
            grp.rows.forEach(function (r) { renderRow(r, false); });
            const subtotal = {};
            numericCols.forEach(function (f) {
              if (cols.some(function (c) { return (typeof c === 'object' ? c.name : c) === f; })) {
                subtotal[f] = grp.rows.reduce(function (s, r) { return s + (Number(r[f]) || 0); }, 0);
              }
            });
            if (Object.keys(subtotal).length) renderRow(subtotal, false, true);
          });
        } else {
          records.forEach(r => { renderRow(r, false); });
        }
        tbl += '</tbody></table>';
        const total = totalCount != null ? totalCount : (records ? records.length : 0);
        const off = offset != null ? offset : 0;
        const lim = limit != null ? limit : 80;
        let pager = '';
        if (total > 0 && records && records.length) {
          const from = off + 1;
          const to = Math.min(off + lim, total);
          pager = '<p class="list-pager o-list-pager">';
          pager += from + '-' + to + ' of ' + total + ' ';
          pager += '<button type="button" class="btn-pager-prev o-list-pager-btn" ' + (off <= 0 ? 'disabled' : '') + '>Prev</button>';
          pager += ' <button type="button" class="btn-pager-next o-list-pager-btn" ' + (off + lim >= total ? 'disabled' : '') + '>Next</button>';
          pager += '</p>';
        }
        main.innerHTML = html + tbl + pager;
        (function setupBulkActions() {
          const bar = document.getElementById('bulk-action-bar');
          const countEl = document.getElementById('bulk-selected-count');
          const selectAll = document.getElementById('list-select-all');
          const bulkDelete = document.getElementById('bulk-delete');
          const bulkClear = document.getElementById('bulk-clear');
          function getSelectedIds() {
            return Array.prototype.map.call(main.querySelectorAll('.list-row-select:checked'), function (cb) { return parseInt(cb.dataset.id, 10); }).filter(function (x) { return !isNaN(x); });
          }
          function updateBar() {
            const ids = getSelectedIds();
            if (bar) {
              bar.style.display = ids.length ? 'flex' : 'none';
              bar.style.flexDirection = 'row';
            }
            if (countEl) countEl.textContent = ids.length ? ids.length + ' selected' : '';
            if (selectAll) selectAll.checked = ids.length && main.querySelectorAll('.list-row-select').length === ids.length;
          }
          if (selectAll) {
            selectAll.onclick = function () {
              main.querySelectorAll('.list-row-select').forEach(function (cb) { cb.checked = selectAll.checked; });
              updateBar();
            };
          }
          main.querySelectorAll('.list-row-select').forEach(function (cb) {
            cb.onclick = updateBar;
          });
          if (bulkDelete) {
            bulkDelete.onclick = function () {
              const ids = getSelectedIds();
              if (!ids.length) return;
              confirmModal({ title: 'Delete records', message: 'Delete ' + ids.length + ' record(s)?', confirmLabel: 'Delete', cancelLabel: 'Cancel' }).then(function (ok) {
                if (!ok) return;
                rpc.callKw(model, 'unlink', [ids], {})
                .then(function () {
                  showToast('Deleted', 'success');
                  loadRecords(model, route, currentListState.searchTerm, stageFilter, undefined, currentListState.savedFilterId, offset, limit, getHashDomainParam());
                })
                .catch(function (err) { showToast(err.message || 'Delete failed', 'error'); });
              });
            };
          }
          if (bulkClear) bulkClear.onclick = function () { main.querySelectorAll('.list-row-select').forEach(function (cb) { cb.checked = false; }); if (selectAll) selectAll.checked = false; updateBar(); };
        })();
        (function setupListKeyboardNav() {
          const table = main.querySelector('table[role="grid"]');
          if (!table) return;
          table.addEventListener('keydown', function (e) {
            const row = e.target.closest && e.target.closest('tr.list-data-row');
            if (!row) return;
            const rows = Array.prototype.slice.call(table.querySelectorAll('tr.list-data-row'));
            const idx = rows.indexOf(row);
            if (idx < 0) return;
            if (e.key === 'ArrowDown' && idx < rows.length - 1) {
              e.preventDefault();
              rows[idx + 1].focus();
            } else if (e.key === 'ArrowUp' && idx > 0) {
              e.preventDefault();
              rows[idx - 1].focus();
            } else if (e.key === 'Enter') {
              const id = row.getAttribute('data-id');
              if (id) { e.preventDefault(); window.location.hash = route + '/edit/' + id; }
            }
          });
        })();
      }
      const monetaryCurrCols = cols.filter(function (c) {
        const f = typeof c === 'object' ? c.name : c;
        return isMonetaryField(model, f) && getMonetaryCurrencyField(model, f);
      }).map(function (c) { return getMonetaryCurrencyField(model, typeof c === 'object' ? c.name : c); }).filter(Boolean);
      const currCols = monetaryCurrCols.filter(function (f, i, a) { return a.indexOf(f) === i; });
      const allCols = m2oCols.length || m2mCols.length || currCols.length;
      if (allCols) {
        const promises = m2oCols.map(function (c) {
          const f = typeof c === 'object' ? c.name : c;
          return getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
        }).concat(m2mCols.map(function (c) {
          const f = typeof c === 'object' ? c.name : c;
          return getDisplayNamesForMany2many(model, f, records).then(function (m) { return { f: f, m: m }; });
        })).concat(currCols.map(function (f) {
          return getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
        }));
        Promise.all(promises).then(function (maps) {
          const nameMap = {};
          maps.forEach(function (x) { nameMap[x.f] = x.m; });
          renderTable(nameMap);
        }).catch(function () { renderTable({}); });
      } else {
        renderTable(null);
      }
    }
    const btn = document.getElementById('btn-add');
    if (btn) btn.onclick = () => { window.location.hash = route + '/new'; };
    const btnExportExcel = document.getElementById('btn-export-excel');
    if (btnExportExcel && records && records.length) {
      btnExportExcel.onclick = function () {
        const cols = getListColumns(model);
        const fields = ['id'].concat(cols.map(function (c) { return typeof c === 'object' ? c.name : c; }));
        let domain = [];
        const action = getActionForRoute(route);
        if (action && action.domain) {
          const parsed = parseActionDomain(action.domain);
          if (parsed && parsed.length) domain = parsed;
        }
        const searchDom = buildSearchDomain(model, (document.getElementById('list-search') && document.getElementById('list-search').value) || '');
        if (searchDom && searchDom.length) domain = domain.concat(searchDom);
        const stageEl = document.getElementById('list-stage-filter');
        if ((model === 'crm.lead' || model === 'helpdesk.ticket') && stageEl && stageEl.value) domain = domain.concat([['stage_id', '=', parseInt(stageEl.value, 10)]]);
        (currentListState.activeSearchFilters || []).forEach(function (fname) {
          const searchView = viewsSvc && viewsSvc.getView(model, 'search');
          const filters = (searchView && searchView.filters) || [];
          const f = filters.find(function (x) { return x.name === fname && x.domain; });
          if (f && f.domain) {
            const fd = parseFilterDomain(f.domain);
            if (fd.length) domain = domain.concat(fd);
          }
        });
        fetch('/web/export/xlsx', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model, fields: fields, domain: domain })
        }).then(function (r) {
          if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || 'Export failed'); });
          return r.blob();
        }).then(function (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = (route || 'export') + '.xlsx';
          a.click();
          URL.revokeObjectURL(url);
        }).catch(function (err) { showToast(err.message || 'Failed to export', 'error'); });
      };
    }
    const btnExport = document.getElementById('btn-export');
    if (btnExport && records && records.length) {
      btnExport.onclick = function () {
        const tbl = main.querySelector('table');
        if (!tbl) return;
        const rows = tbl.querySelectorAll('tr');
        const lines = [];
        rows.forEach(function (tr) {
          const cells = tr.querySelectorAll('td, th');
          const vals = [];
          cells.forEach(function (cell) {
            const txt = (cell.textContent || '').trim().replace(/"/g, '""');
            vals.push(txt.indexOf(',') >= 0 || txt.indexOf('"') >= 0 || txt.indexOf('\n') >= 0 ? '"' + txt + '"' : txt);
          });
          if (vals.length) lines.push(vals.join(','));
        });
        const csv = lines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (route || 'export') + '.csv';
        a.click();
        URL.revokeObjectURL(url);
      };
    }
    const btnImport = document.getElementById('btn-import');
    if (btnImport) {
      btnImport.onclick = function () { showImportModal(model, route); };
    }
    const btnPrint = document.getElementById('btn-print');
    if (btnPrint && reportName && records && records.length) {
      btnPrint.onclick = function () {
        const ids = records.map(function (r) { return r.id; }).filter(function (x) { return x; });
        if (!ids.length) return;
        const pdfUrl = '/report/pdf/' + reportName + '/' + ids.join(',');
        if (window.UIComponents && window.UIComponents.PdfViewer && typeof window.UIComponents.PdfViewer.open === 'function') {
          window.UIComponents.PdfViewer.open(pdfUrl, 'List print preview');
        } else {
          window.open('/report/html/' + reportName + '/' + ids.join(','), '_blank', 'noopener');
        }
      };
    }
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () {
        const sf = document.getElementById('list-saved-filter');
        const stageEl = document.getElementById('list-stage-filter');
        const stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), stageVal, null, sf && sf.value ? sf.value : null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    const btnAiSearch = document.getElementById('btn-ai-search');
    if (btnAiSearch && searchInput) {
      btnAiSearch.onclick = function () {
        const query = searchInput.value.trim();
        if (!query) {
          const sf = document.getElementById('list-saved-filter');
          const stageEl = document.getElementById('list-stage-filter');
          const stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
          loadRecords(model, route, '', stageVal, null, sf && sf.value ? sf.value : null, 0, null);
          return;
        }
        btnAiSearch.disabled = true;
        btnAiSearch.textContent = '...';
        fetch('/ai/nl_search', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model, query: query, limit: 80 })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.error) { showToast(data.error || 'AI search failed', 'error'); return; }
            const action = getActionForRoute(route);
            const actionDomain = action ? parseActionDomain(action.domain || '') : [];
            const nlDomain = (data.domain && data.domain.length) ? data.domain : [];
            const domainOverride = actionDomain.concat(nlDomain);
            const sf = document.getElementById('list-saved-filter');
            const stageEl = document.getElementById('list-stage-filter');
            const stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
            loadRecords(model, route, query, stageVal, null, sf && sf.value ? sf.value : null, 0, null, domainOverride.length ? domainOverride : undefined);
          })
          .catch(function (err) { showToast(err.message || 'AI search failed', 'error'); })
          .finally(function () { btnAiSearch.disabled = false; btnAiSearch.textContent = 'AI Search'; });
      };
    }
      main.querySelectorAll('.btn-delete').forEach(a => {
      a.onclick = (e) => {
        e.preventDefault();
        confirmModal({ title: 'Delete record', message: 'Delete this record?', confirmLabel: 'Delete', cancelLabel: 'Cancel' }).then(function (ok) {
          if (ok) deleteRecord(model, route, a.dataset.id);
        });
      };
    });
    main.querySelectorAll('.btn-view').forEach(btn => {
      btn.onclick = () => { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    main.querySelectorAll('.btn-search-filter').forEach(btn => {
      btn.onclick = function () {
        const fname = btn.dataset.filter;
        if (!fname) return;
        const cur = currentListState.activeSearchFilters || [];
        const idx = cur.indexOf(fname);
        const next = idx >= 0 ? cur.filter(function (_, i) { return i !== idx; }) : cur.concat(fname);
        currentListState.activeSearchFilters = next;
        const si = document.getElementById('list-search');
        loadRecords(model, route, si ? si.value.trim() : '', stageFilter, null, currentListState.savedFilterId, 0, null);
      };
    });
    const groupByEl = document.getElementById('list-group-by');
    if (groupByEl) {
      groupByEl.onchange = function () {
        currentListState.groupBy = groupByEl.value || null;
        const si = document.getElementById('list-search');
        loadRecords(model, route, si ? si.value.trim() : '', stageFilter, null, currentListState.savedFilterId, 0, null);
      };
    }
    main.querySelectorAll('.facet-chip .facet-remove').forEach(btn => {
      btn.onclick = function (e) {
        e.preventDefault();
        const chip = btn.closest('.facet-chip');
        if (!chip) return;
        const typ = chip.dataset.type;
        const name = chip.dataset.name;
        if (typ === 'filter') {
          currentListState.activeSearchFilters = (currentListState.activeSearchFilters || []).filter(function (f) { return f !== name; });
        } else if (typ === 'groupby') {
          currentListState.groupBy = null;
        }
        const si = document.getElementById('list-search');
        loadRecords(model, route, si ? si.value.trim() : '', stageFilter, null, currentListState.savedFilterId, 0, null);
      };
    });
    main.querySelectorAll('.sortable-col').forEach(th => {
      th.onclick = function () {
        const f = th.dataset.field;
        if (!f) return;
        const cur = (currentListState.route === route && currentListState.order) || '';
        const nextDir = (cur.startsWith(f + ' ') && cur.indexOf('desc') < 0) ? 'desc' : 'asc';
        loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, 0, f + ' ' + nextDir);
      };
    });
    main.querySelectorAll('.btn-pager-prev').forEach(btn => {
      btn.onclick = function () {
        if (btn.disabled) return;
        const off = (currentListState.offset || 0) - (currentListState.limit || 80);
        loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, Math.max(0, off), null);
      };
    });
    main.querySelectorAll('.btn-pager-next').forEach(btn => {
      btn.onclick = function () {
        if (btn.disabled) return;
        const off = (currentListState.offset || 0) + (currentListState.limit || 80);
        loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, off, null);
      };
    });
    if (model === 'crm.lead') {
      const filterEl = document.getElementById('list-stage-filter');
      if (filterEl) {
        rpc.callKw('crm.stage', 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
          .then(function (stages) {
            stages.forEach(function (s) {
              const opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name || '';
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function () {
              const val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              loadRecords(model, route, document.getElementById('list-search').value.trim(), val, null, null, 0, null);
            };
          });
      }
    }
    const savedFilterEl = document.getElementById('list-saved-filter');
    if (savedFilterEl) {
      savedFilterEl.onchange = function () {
        const fid = savedFilterEl.value || null;
        const si = document.getElementById('list-search');
        loadRecords(model, route, si ? si.value.trim() : '', stageFilter, null, fid, 0, null);
      };
    }
    const btnSaveFilter = document.getElementById('btn-save-filter');
    if (btnSaveFilter) {
      btnSaveFilter.onclick = function () {
        const name = prompt('Filter name:');
        if (!name || !name.trim()) return;
        const si = document.getElementById('list-search');
        const st = si ? si.value.trim() : '';
        const action = getActionForRoute(route);
        const actionDomain = action ? parseActionDomain(action.domain || '') : [];
        let domain = actionDomain.slice();
        const searchDom = buildSearchDomain(model, st);
        if (searchDom.length) domain = domain.concat(searchDom);
        if (model === 'crm.lead' && stageFilter) domain = domain.concat([['stage_id', '=', stageFilter]]);
        saveSavedFilter(model, name.trim(), domain).then(function () {
          loadRecords(model, route, st, stageFilter, null, null, 0, null);
        });
      };
    }
  }

  let currentListState = { model: null, route: null, searchTerm: '', stageFilter: null, viewType: null, savedFilterId: null, offset: 0, limit: 80, order: null, totalCount: 0, activeSearchFilters: [], groupBy: null };

  function deleteRecord(model, route, id) {
    rpc.callKw(model, 'unlink', [[parseInt(id, 10)]])
      .then(() => { showToast('Record deleted', 'success'); loadRecords(model, route, currentListState.searchTerm); })
      .catch(err => { showToast(err.message || 'Failed to delete', 'error'); });
  }

  function getViewFieldDef(model, fname) {
    if (!viewsSvc || !model || !fname) return null;
    const formV = viewsSvc.getView(model, 'form');
    if (formV && formV.fields) {
      const f = formV.fields.find(function (x) { const n = typeof x === 'object' ? x.name : x; return n === fname; });
      if (f && typeof f === 'object') return f;
    }
    const listV = viewsSvc.getView(model, 'list');
    if (listV && listV.columns) {
      const c = listV.columns.find(function (x) { const n = typeof x === 'object' ? x.name : x; return n === fname; });
      if (c && typeof c === 'object') return c;
    }
    return null;
  }

  function getFieldMeta(model, fname) {
    return viewsSvc ? viewsSvc.getFieldMeta(model, fname) : null;
  }

  function getMany2oneComodel(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.comodel) return def.comodel;
    const meta = getFieldMeta(model, fname);
    if (meta && meta.comodel) return meta.comodel;
    return null;
  }

  function getMany2oneDomain(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.domain_dep) {
      const dep = def.domain_dep;
      return { depField: dep, domain: [[dep, '=', null]] };
    }
    if (model === 'res.partner' && fname === 'state_id') return { depField: 'country_id', domain: [['country_id', '=', null]] };
    return null;
  }

  function getSelectionOptions(model, fname) {
    const meta = getFieldMeta(model, fname);
    if (meta && meta.selection && meta.selection.length) return meta.selection;
    return null;
  }

  function isBooleanField(model, fname) {
    const meta = getFieldMeta(model, fname);
    if (meta) return meta.type === 'boolean';
    return false;
  }

  function isMonetaryField(model, fname) {
    const meta = getFieldMeta(model, fname);
    return meta && meta.type === 'monetary';
  }

  function getMonetaryCurrencyField(model, fname) {
    const meta = getFieldMeta(model, fname);
    return (meta && meta.type === 'monetary' && meta.currency_field) ? meta.currency_field : null;
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function serverValueToDateInput(val) {
    if (val == null || val === false || val === '') return '';
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function serverValueToDatetimeLocal(val) {
    if (val == null || val === false || val === '') return '';
    const s = String(val);
    const d = new Date(s.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function dateInputToServer(val) {
    if (!val || !String(val).trim()) return false;
    return String(val).trim();
  }

  function datetimeLocalToServer(val) {
    if (!val || !String(val).trim()) return false;
    const d = new Date(val);
    if (isNaN(d.getTime())) return false;
    return d.toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
  }

  function confirmModal(opts) {
    if (window.UIComponents && window.UIComponents.ConfirmDialog && typeof window.UIComponents.ConfirmDialog.confirm === 'function') {
      return window.UIComponents.ConfirmDialog.confirm(opts || {});
    }
    const o = opts || {};
    return Promise.resolve(window.confirm((o.title ? o.title + '\n\n' : '') + (o.message || o.body || 'Are you sure?')));
  }

  function isBinaryField(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.widget === 'binary') return true;
    const meta = getFieldMeta(model, fname);
    if (meta && meta.type === 'binary') return true;
    return false;
  }

  function isHtmlField(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.widget === 'html') return true;
    const meta = getFieldMeta(model, fname);
    return meta && meta.type === 'html';
  }

  function isImageField(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.widget === 'image') return true;
    const meta = getFieldMeta(model, fname);
    return meta && meta.type === 'image';
  }

  function getSelectionLabel(model, fname, value) {
    const opts = getSelectionOptions(model, fname);
    if (!opts || value == null || value === '') return value;
    const pair = opts.find(function (o) { return o[0] === value || String(o[0]) === String(value); });
    return pair ? pair[1] : value;
  }

  function getOne2manyInfo(model, fname) {
    const meta = getFieldMeta(model, fname);
    if (meta && meta.type === 'one2many' && meta.comodel) return { comodel: meta.comodel, inverse: meta.inverse_name || '' };
    return null;
  }

  function getOne2manyFieldInputType(model, fname, lf) {
    if (lf === 'date_deadline') return 'date';
    if (['product_uom_qty', 'price_unit', 'price_subtotal', 'product_qty', 'unit_amount', 'quantity', 'total_amount'].indexOf(lf) >= 0) return 'number';
    return 'text';
  }

  function renderOne2manyRow(model, fname, lineFields, rowData, rowIndex) {
    var id = rowData && rowData.id;
    var dataAttrs = id ? ' data-o2m-id="' + id + '"' : ' data-o2m-new="1"';
    var cells = lineFields.map(function (lf) {
      var val = (rowData && rowData[lf]) || '';
      var inpType = getOne2manyFieldInputType(model, fname, lf);
      var step = (lf === 'price_unit' || lf === 'price_subtotal' || lf === 'unit_amount' || lf === 'total_amount') ? '0.01' : '1';
      var readonly = (lf === 'price_subtotal' || lf === 'total_amount') ? ' readonly data-o2m-computed="1"' : '';
      return '<td style="padding:0.25rem"><input type="' + inpType + '" data-o2m-field="' + lf + '" value="' + (val || '').replace(/"/g, '&quot;') + '" step="' + step + '"' + readonly + ' style="width:100%;padding:0.25rem;font-size:0.9rem"></td>';
    }).join('');
    return '<tr' + dataAttrs + '>' + cells + '<td style="padding:0.25rem"><button type="button" class="o2m-delete-row" style="padding:0.2rem 0.4rem;font-size:0.8rem;cursor:pointer;color:#c00">Delete</button></td></tr>';
  }

  function setupOne2manyAddButtons(form, model) {
    form.querySelectorAll('[id^="o2m-add-"]').forEach(function (btn) {
      var fname = btn.id.replace('o2m-add-', '');
      var o2m = getOne2manyInfo(model, fname);
      if (!o2m) return;
      var lineFields = getOne2manyLineFields(model, fname);
      var tbody = form.querySelector('#o2m-tbody-' + fname);
      if (!tbody) return;
      btn.onclick = function () {
        tbody.insertAdjacentHTML('beforeend', renderOne2manyRow(model, fname, lineFields, null, 0));
        var lastRow = tbody.lastElementChild;
        if (lastRow) {
          var delBtn = lastRow.querySelector('.o2m-delete-row');
          if (delBtn) delBtn.onclick = function () { lastRow.remove(); };
        }
      };
    });
    form.querySelectorAll('.o2m-delete-row').forEach(function (b) {
      b.onclick = function () { b.closest('tr').remove(); };
    });
  }

  function setupOne2manyComputedFields(form, model) {
    var o2mProductQty = { 'sale.order': { fname: 'order_line', qty: 'product_uom_qty', price: 'price_unit', subtotal: 'price_subtotal' }, 'hr.expense.sheet': { fname: 'expense_line_ids', qty: 'quantity', price: 'unit_amount', subtotal: 'total_amount' } };
    var cfg = o2mProductQty[model];
    if (!cfg) return;
    var tbody = form.querySelector('#o2m-tbody-' + cfg.fname);
    if (!tbody) return;
    var updateSubtotal = function (tr) {
      var qtyInp = tr.querySelector('[data-o2m-field="' + cfg.qty + '"]');
      var priceInp = tr.querySelector('[data-o2m-field="' + cfg.price + '"]');
      var subInp = tr.querySelector('[data-o2m-field="' + cfg.subtotal + '"]');
      if (!qtyInp || !priceInp || !subInp) return;
      var q = parseFloat(qtyInp.value) || 0;
      var p = parseFloat(priceInp.value) || 0;
      subInp.value = (q * p).toFixed(2);
    };
    tbody.querySelectorAll('tr').forEach(function (tr) {
      var qtyInp = tr.querySelector('[data-o2m-field="' + cfg.qty + '"]');
      var priceInp = tr.querySelector('[data-o2m-field="' + cfg.price + '"]');
      if (qtyInp) qtyInp.oninput = function () { updateSubtotal(tr); };
      if (priceInp) priceInp.oninput = function () { updateSubtotal(tr); };
    });
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && node.tagName === 'TR') {
            var qtyInp = node.querySelector('[data-o2m-field="' + cfg.qty + '"]');
            var priceInp = node.querySelector('[data-o2m-field="' + cfg.price + '"]');
            if (qtyInp) qtyInp.oninput = function () { updateSubtotal(node); };
            if (priceInp) priceInp.oninput = function () { updateSubtotal(node); };
          }
        });
      });
    });
    observer.observe(tbody, { childList: true });
  }

  function loadChatter(model, recordId, messageIds) {
    const container = document.querySelector('.chatter-messages-list');
    if (!container) return;
    const CS = window.AppCore && window.AppCore.ChatterStrip;
    const useStrip = CS && typeof CS.appendChatterRows === 'function' && typeof CS.setChatterError === 'function';
    container.innerHTML = '';
    if (!messageIds || !messageIds.length) {
      if (useStrip) {
        CS.appendChatterRows(container, [], {});
      } else {
        container.innerHTML = '<p class="o-chatter-empty">No messages yet.</p>';
      }
      return;
    }
    rpc.callKw('mail.message', 'search_read', [[['id', 'in', messageIds]]], {
      fields: ['id', 'body', 'author_id', 'date', 'attachment_ids'],
      order: 'id asc'
    }).then(function (rows) {
      const authorIds = [];
      rows.forEach(function (r) { if (r.author_id) authorIds.push(r.author_id); });
      const uniq = authorIds.filter(function (x, i, a) { return a.indexOf(x) === i; });
      const nameMap = {};
      const renderRows = function () {
        if (useStrip) {
          CS.appendChatterRows(container, rows, nameMap);
          return;
        }
        rows.forEach(function (r) {
          const authorName = r.author_id ? (nameMap[r.author_id] || 'User #' + (Array.isArray(r.author_id) ? r.author_id[0] : r.author_id)) : 'Unknown';
          const dateStr = r.date ? String(r.date).replace('T', ' ').slice(0, 16) : '';
          const body = (r.body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
          let attHtml = '';
          const aids = r.attachment_ids || [];
          if (aids.length) {
            const ids = aids.map(function (x) { return Array.isArray(x) ? x[0] : x; });
            attHtml = '<div class="o-chatter-attachments">' + ids.map(function (aid) {
              return '<a href="/web/attachment/download/' + aid + '" target="_blank" rel="noopener" class="o-chatter-attachment-link">Attachment</a>';
            }).join('') + '</div>';
          }
          container.insertAdjacentHTML('beforeend', '<div class="chatter-msg o-chatter-msg"><div class="o-chatter-msg-meta">' + authorName + ' · ' + dateStr + '</div><div class="o-chatter-msg-body">' + body + '</div>' + attHtml + '</div>');
        });
      };
      if (uniq.length) {
        return rpc.callKw('res.users', 'name_get', [uniq], {}).then(function (names) {
          (names || []).forEach(function (n) { if (n && n[0]) nameMap[n[0]] = n[1] || ''; });
          renderRows();
        });
      }
      renderRows();
    }).catch(function () {
      if (useStrip) {
        CS.setChatterError(container, 'Could not load messages.');
      } else {
        container.innerHTML = '<p class="o-chatter-error">Could not load messages.</p>';
      }
    });
  }

  function setupChatter(form, model, recordId) {
    const chatterDiv = form.querySelector('#chatter-messages');
    if (!chatterDiv || !recordId) return;
    const sendBtn = form.querySelector('#chatter-send');
    const inputEl = form.querySelector('#chatter-input');
    const sendEmailCb = form.querySelector('#chatter-send-email');
    const fileInput = form.querySelector('#chatter-file');
    let pendingAttachmentIds = [];
    if (fileInput) {
      fileInput.onchange = function () {
        const files = fileInput.files;
        if (!files || !files.length) return;
        pendingAttachmentIds = [];
        var done = 0, total = files.length;
        function checkDone() {
          var span = form.querySelector('#chatter-attachments');
          if (span) span.textContent = pendingAttachmentIds.length ? pendingAttachmentIds.length + ' file(s) attached' : '';
          if (done === total && pendingAttachmentIds.length < total) showToast('Some uploads failed', 'error');
        }
        Array.prototype.forEach.call(files, function (f) {
          var fd = new FormData();
          fd.append('file', f);
          fd.append('res_model', model);
          fd.append('res_id', recordId);
          var uploadHdrs = (window.Services && window.Services.session && window.Services.session.getAuthHeaders) ? window.Services.session.getAuthHeaders() : {};
          fetch('/web/attachment/upload', { method: 'POST', credentials: 'include', headers: uploadHdrs, body: fd })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              done++;
              if (data.id) pendingAttachmentIds.push(data.id);
              if (data.error) showToast(data.error, 'error');
              checkDone();
            })
            .catch(function () { done++; showToast('Upload failed', 'error'); checkDone(); });
        });
      };
    }
    if (sendBtn && inputEl) {
      sendBtn.onclick = function () {
        const body = (inputEl.value || '').trim();
        if (!body && !pendingAttachmentIds.length) return;
        sendBtn.disabled = true;
        const sendAsEmail = sendEmailCb && sendEmailCb.checked;
        const kwargs = { send_as_email: sendAsEmail };
        if (pendingAttachmentIds.length) kwargs.attachment_ids = pendingAttachmentIds;
        rpc.callKw(model, 'message_post', [[parseInt(recordId, 10)], body || ''], kwargs)
          .then(function () {
            sendBtn.disabled = false;
            inputEl.value = '';
            pendingAttachmentIds = [];
            if (fileInput) { fileInput.value = ''; var s = form.querySelector('#chatter-attachments'); if (s) s.textContent = ''; }
            showToast('Message posted', 'success');
            rpc.callKw(model, 'read', [[parseInt(recordId, 10)], ['message_ids']]).then(function (recs) {
              if (recs && recs[0] && recs[0].message_ids) loadChatter(model, recordId, recs[0].message_ids);
            });
          })
          .catch(function (err) {
            sendBtn.disabled = false;
            showToast(err.message || 'Failed to post', 'error');
          });
      };
    }
  }

  function getOne2manyLineFields(model, fname) {
    var o2m = getOne2manyInfo(model, fname);
    if (!o2m) return [];
    if (model === 'crm.lead' && fname === 'activity_ids') return ['summary', 'note', 'date_deadline', 'state'];
    if (model === 'sale.order' && fname === 'order_line') return ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal'];
    if (model === 'mrp.bom' && fname === 'bom_line_ids') return ['product_id', 'product_qty'];
    if (model === 'hr.expense.sheet' && fname === 'expense_line_ids') return ['name', 'product_id', 'unit_amount', 'quantity', 'total_amount'];
    var meta = viewsSvc ? viewsSvc.getFieldsMeta(o2m.comodel) : null;
    if (meta) {
      var skip = ['id', (o2m.inverse || '').replace(/_id$/, '') + '_id'];
      return Object.keys(meta).filter(function (k) { return skip.indexOf(k) < 0 && meta[k].type !== 'one2many' && meta[k].type !== 'many2many'; });
    }
    return ['name'];
  }

  function getMany2manyInfo(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.comodel) {
      const meta = getFieldMeta(model, fname);
      if (meta && meta.type === 'many2many') return { comodel: def.comodel };
      if (meta && meta.type === 'many2one') return null;
      return { comodel: def.comodel };
    }
    const meta = getFieldMeta(model, fname);
    if (meta && meta.type === 'many2many' && meta.comodel) return { comodel: meta.comodel };
    return null;
  }

  function getFieldLabel(model, fname) {
    const meta = getFieldMeta(model, fname);
    if (meta && meta.string) return meta.string;
    return fname.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function isTextField(model, fname) {
    const meta = getFieldMeta(model, fname);
    if (meta) return meta.type === 'text' || meta.type === 'html';
    return fname === 'description' || fname === 'note_html';
  }

  function parseDomain(str) {
    if (!str || typeof str !== 'string') return null;
    var s = str.trim();
    if (s === '1' || s === 'True') return true;
    if (s === '0' || s === 'False') return false;
    try {
      var norm = s.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null').replace(/'/g, '"');
      return JSON.parse(norm);
    } catch (e) { return null; }
  }

  function evaluateDomain(domain, formVals) {
    if (domain === true) return true;
    if (domain === false) return false;
    if (!Array.isArray(domain) || domain.length === 0) return false;
    var op = domain[0];
    if (op === '|' && domain.length >= 3) return evaluateDomain(domain[1], formVals) || evaluateDomain(domain[2], formVals);
    if (op === '&' && domain.length >= 3) return evaluateDomain(domain[1], formVals) && evaluateDomain(domain[2], formVals);
    if (domain.length >= 3 && typeof domain[0] === 'string') {
      var field = domain[0], op2 = domain[1], value = domain[2];
      var v = formVals[field];
      if (op2 === '=') return v == value;
      if (op2 === '!=') return v != value;
      if (op2 === '>') return v > value;
      if (op2 === '<') return v < value;
      if (op2 === '>=') return v >= value;
      if (op2 === '<=') return v <= value;
      if (op2 === 'in') return Array.isArray(value) && value.indexOf(v) >= 0;
      if (op2 === 'not in') return !Array.isArray(value) || value.indexOf(v) < 0;
    }
    return false;
  }

  function evaluateCondition(domainStr, formVals) {
    var domain = parseDomain(domainStr);
    return domain !== null ? evaluateDomain(domain, formVals) : false;
  }

  function applyAttrsToForm(form, model) {
    var formVals = getFormVals(form, model);
    form.querySelectorAll('.attr-field').forEach(function (wrapper) {
      var fname = wrapper.getAttribute('data-fname');
      var invStr = wrapper.getAttribute('data-invisible');
      var roStr = wrapper.getAttribute('data-readonly');
      var reqStr = wrapper.getAttribute('data-required-cond');
      var inv = invStr ? evaluateCondition(invStr, formVals) : false;
      var ro = roStr ? evaluateCondition(roStr, formVals) : false;
      var req = reqStr ? evaluateCondition(reqStr, formVals) : false;
      wrapper.classList.toggle('o-invisible', !!inv);
      var inputs = wrapper.querySelectorAll('input:not([type="hidden"]), select, textarea');
      var forRequired = wrapper.querySelector('[name="' + fname + '"]');
      inputs.forEach(function (el) { el.disabled = !!ro; });
      if (forRequired) forRequired.required = !!req;
    });
  }

  function renderFieldHtml(model, f) {
    const fname = typeof f === 'object' ? f.name : f;
    const label = getFieldLabel(model, fname);
    const widget = typeof f === 'object' ? f.widget : '';
    if (window.FieldWidgets && window.FieldWidgets.render && widget) {
      const fieldNode = typeof f === 'object' ? f : { name: fname, widget: widget };
      const custom = window.FieldWidgets.render(model, fieldNode, { getFieldLabel: getFieldLabel, getFieldMeta: getFieldMeta });
      if (custom) {
        if (typeof f === 'object' && (f.invisible || f.readonly || f.required_cond)) {
          const ad = (f.invisible ? ' data-invisible="' + String(f.invisible).replace(/"/g, '&quot;') + '"' : '') + (f.readonly ? ' data-readonly="' + String(f.readonly).replace(/"/g, '&quot;') + '"' : '') + (f.required_cond ? ' data-required-cond="' + String(f.required_cond).replace(/"/g, '&quot;') + '"' : '');
          return '<div class="attr-field" data-fname="' + fname + '"' + ad + '>' + custom + '</div>';
        }
        return '<div class="attr-field" data-fname="' + fname + '">' + custom + '</div>';
      }
    }
    if (widget === 'priority') {
      const selectionOpts = getSelectionOptions(model, fname) || [['0', 'Low'], ['1', 'Normal'], ['2', 'High'], ['3', 'Urgent']];
      let opts = '';
      selectionOpts.forEach(function (o) { opts += '<option value="' + (o[0] || '') + '">' + (o[1] || o[0]) + '</option>'; });
      return '<p><label>' + label + '</label><div class="priority-widget" data-fname="' + fname + '" style="margin-top:0.25rem;display:flex;gap:0.25rem;align-items:center"><span class="priority-stars" style="font-size:1.2rem;color:#f0ad4e">&#9733;&#9733;&#9733;&#9733;</span><select name="' + fname + '" style="width:auto;padding:0.25rem">' + opts + '</select></div></p>';
    }
    if (widget === 'phone' || ((fname === 'phone' || fname === 'mobile') && !widget)) {
      return '<p><label>' + label + '</label><div style="margin-top:0.25rem"><input type="text" name="' + fname + '" style="width:100%;padding:0.5rem"><a class="phone-link" href="#" style="font-size:0.9rem;margin-left:0.25rem;display:inline-block;margin-top:0.25rem" target="_blank">Call</a></div></p>';
    }
    if (widget === 'email' || (fname === 'email' && !widget)) {
      return '<p><label>' + label + '</label><div style="margin-top:0.25rem"><input type="email" name="' + fname + '" style="width:100%;padding:0.5rem"><a class="email-link" href="#" style="font-size:0.9rem;margin-left:0.25rem;display:inline-block;margin-top:0.25rem" target="_blank">Send</a></div></p>';
    }
    if (widget === 'url' || (fname === 'website' && !widget)) {
      return '<p><label>' + label + '</label><div style="margin-top:0.25rem"><input type="url" name="' + fname + '" placeholder="https://" style="width:100%;padding:0.5rem"><a class="url-link" href="#" style="font-size:0.9rem;margin-left:0.25rem;display:inline-block;margin-top:0.25rem" target="_blank">Open</a></div></p>';
    }
    if (widget === 'statusbar') {
      var sbId = 'statusbar-' + fname + '-' + Math.random().toString(36).slice(2);
      return '<p><label>' + label + '</label><div class="o-statusbar" id="' + sbId + '" data-fname="' + fname + '" data-comodel="' + (f.comodel || '') + '" data-clickable="1" style="margin-top:0.25rem;display:flex;align-items:center;gap:0;flex-wrap:wrap"></div><input type="hidden" name="' + fname + '"></p>';
    }
    const o2m = getOne2manyInfo(model, fname);
    const m2m = getMany2manyInfo(model, fname);
    if (fname === 'message_ids' && (model === 'crm.lead' || model === 'project.task' || model === 'helpdesk.ticket')) {
      if (window.AppCore && window.AppCore.ChatterStrip && typeof window.AppCore.ChatterStrip.buildChatterChromeHtml === 'function') {
        return window.AppCore.ChatterStrip.buildChatterChromeHtml({ model: model, label: label });
      }
      return '<p><label>' + label + '</label><div id="chatter-messages" class="o-chatter o-chatter-chrome o-card-gradient" data-model="' + model + '"><header class="o-chatter-chrome-head" aria-label="Discussion"><span class="o-chatter-chrome-title">Activity</span></header><div class="chatter-messages-list o-chatter-messages-scroll"></div><div class="chatter-compose o-chatter-compose"><textarea id="chatter-input" class="o-chatter-textarea" placeholder="Add a comment..." rows="3"></textarea><div class="o-chatter-compose-row"><input type="file" id="chatter-file" class="o-chatter-file" multiple><span id="chatter-attachments" class="o-chatter-attachments-hint"></span></div><label class="o-chatter-send-email-label"><input type="checkbox" id="chatter-send-email"> Send as email</label><button type="button" id="chatter-send" class="o-btn o-btn-primary o-chatter-send">Send</button></div></div></p>';
    }
    if (o2m) {
      var lineFields = getOne2manyLineFields(model, fname);
      var headers = lineFields.map(function (lf) { return '<th style="text-align:left;padding:0.35rem">' + (lf.charAt(0).toUpperCase() + lf.slice(1)) + '</th>'; }).join('');
      var rowHtml = lineFields.map(function (lf) { return '<td style="padding:0.25rem"><input type="text" data-o2m-field="' + lf + '" style="width:100%;padding:0.25rem;font-size:0.9rem" placeholder="' + lf + '"></td>'; }).join('');
      var addId = 'o2m-add-' + fname;
      return '<p><label>' + label + '</label><div id="o2m-' + fname + '" class="o2m-editable" data-comodel="' + (o2m.comodel || '') + '" data-inverse="' + (o2m.inverse || '') + '" data-fname="' + fname + '" style="margin-top:0.25rem;padding:0.5rem;background:#f8f8f8;border-radius:4px"><table style="width:100%;font-size:0.9rem"><thead><tr>' + headers + '<th style="width:1%"></th></tr></thead><tbody id="o2m-tbody-' + fname + '"></tbody></table><button type="button" id="' + addId + '" class="o2m-add-line" style="margin-top:0.25rem;padding:0.25rem 0.5rem;font-size:0.85rem;cursor:pointer">Add a line</button></div></p>';
    }
    if (m2m) {
      const tagsClass = (widget === 'many2many_tags') ? ' m2m-tags' : '';
      return '<p><label>' + label + '</label><div id="m2m-' + fname + '" class="m2m-widget' + tagsClass + '" data-comodel="' + (m2m.comodel || '') + '" data-widget="' + (widget || '') + '" style="margin-top:0.25rem;padding:0.5rem;background:#f8f8f8;border-radius:4px;min-height:2em;display:flex;flex-wrap:wrap;gap:0.25rem"></div></p>';
    }
    const meta = getFieldMeta(model, fname);
    const required = (meta && meta.required) || fname === 'name';
    const comodel = getMany2oneComodel(model, fname);
    const selectionOpts = getSelectionOptions(model, fname);
    const isBool = isBooleanField(model, fname);
    const isImg = isImageField(model, fname);
    const isBin = isBinaryField(model, fname);
    const isHtml = isHtmlField(model, fname);
    const isTextarea = isTextField(model, fname) && !isHtml;
    const isMonetary = isMonetaryField(model, fname);
    if (meta && meta.type === 'date') {
      const fro = typeof f === 'object' && f.readonly ? ' readonly' : '';
      return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="date" name="' + fname + '" ' + (required ? 'required ' : '') + fro + ' style="width:100%;max-width:16rem;padding:0.5rem;margin-top:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"></label></p>';
    }
    if (meta && meta.type === 'datetime') {
      const fro = typeof f === 'object' && f.readonly ? ' readonly' : '';
      return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="datetime-local" name="' + fname + '" ' + (required ? 'required ' : '') + fro + ' style="width:100%;max-width:22rem;padding:0.5rem;margin-top:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"></label></p>';
    }
    const inputType = isImg ? 'image' : (isBin ? 'binary' : (isHtml ? 'html' : (isBool ? 'boolean' : (isMonetary ? 'monetary' : (fname === 'email' ? 'email' : isTextarea ? 'textarea' : selectionOpts ? 'selection' : (comodel ? 'many2one' : 'text'))))));
    if (inputType === 'boolean') return '<p><label style="display:flex;align-items:center;gap:0.5rem"><input type="checkbox" name="' + fname + '"> ' + label + '</label></p>';
    if (inputType === 'html') return '<p><label>' + label + (required ? ' *' : '') + '</label><div id="html-' + fname + '" class="html-widget" data-fname="' + fname + '" contenteditable="true" style="width:100%;padding:0.5rem;margin-top:0.25rem;min-height:6em;border:1px solid var(--border-color,#ddd);border-radius:4px;background:#fff"></div><input type="hidden" name="' + fname + '" id="hidden-html-' + fname + '"></p>';
    if (inputType === 'textarea') return '<p><label>' + label + (required ? ' *' : '') + '<br><textarea name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem;min-height:4em"></textarea></label></p>';
    if (inputType === 'selection') {
      let opts = '<option value="">--</option>';
      selectionOpts.forEach(function (o) { opts += '<option value="' + (o[0] || '') + '">' + (o[1] || o[0]) + '</option>'; });
      return '<p><label>' + label + (required ? ' *' : '') + '<br><select name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem">' + opts + '</select></label></p>';
    }
    if (inputType === 'many2one') {
      const domainInfo = getMany2oneDomain(model, fname);
      const depAttr = domainInfo ? ' data-depends-on="' + domainInfo.depField + '"' : '';
      const wid = 'm2o-' + fname + '-' + Math.random().toString(36).slice(2);
      return '<p><label>' + label + (required ? ' *' : '') + '</label><div class="m2one-widget" id="' + wid + '" data-comodel="' + (comodel || '') + '" data-fname="' + fname + '" data-domain="' + (domainInfo ? encodeURIComponent(JSON.stringify(domainInfo)) : '') + '"' + depAttr + ' style="margin-top:0.25rem;position:relative"><input type="text" class="m2one-input" placeholder="Search..." autocomplete="off" style="width:100%;padding:0.5rem"><input type="hidden" name="' + fname + '" class="m2one-value"><div class="m2one-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #ddd;border-radius:4px;max-height:200px;overflow-y:auto;z-index:100;box-shadow:0 4px 8px rgba(0,0,0,0.1)"></div></div></p>';
    }
    if (inputType === 'binary') return '<p><label>' + label + '<br><input type="file" id="file-' + fname + '" data-field="' + fname + '" accept="*/*" style="width:100%;padding:0.5rem;margin-top:0.25rem"><input type="hidden" name="' + fname + '" id="hidden-' + fname + '"><span id="bin-status-' + fname + '" style="font-size:0.85rem;color:#666;margin-left:0.25rem"></span></label></p>';
    if (inputType === 'image') return '<p><label>' + label + '</label><div id="image-' + fname + '" class="image-widget" data-fname="' + fname + '" style="margin-top:0.25rem"><img id="img-preview-' + fname + '" src="" alt="" style="max-width:200px;max-height:150px;display:none;border-radius:4px;border:1px solid var(--border-color,#ddd)"><input type="file" id="file-' + fname + '" data-field="' + fname + '" accept="image/*" style="width:100%;padding:0.5rem;margin-top:0.25rem"><input type="hidden" name="' + fname + '" id="hidden-' + fname + '"><span id="bin-status-' + fname + '" style="font-size:0.85rem;color:#666;margin-left:0.25rem;display:block;margin-top:0.25rem"></span></div></p>';
    if (inputType === 'monetary') return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="number" name="' + fname + '" step="0.01" min="0" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
    return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="' + inputType + '" name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
  }

  function renderFormTreeToHtml(model, children, opts) {
    opts = opts || {};
    var recordId = opts.recordId;
    var route = opts.route || '';
    var isNew = opts.isNew;
    let html = '';
    (children || []).forEach(function (c) {
      if (c.type === 'header') {
        html += '<div class="o-form-header">' + renderFormTreeToHtml(model, c.children || [], opts) + '</div>';
      } else if (c.type === 'sheet') {
        html += '<div class="o-form-sheet">' + renderFormTreeToHtml(model, c.children || [], opts) + '</div>';
      } else if (c.type === 'button_box') {
        html += '<div class="o-button-box">' + renderFormTreeToHtml(model, c.children || [], opts) + '</div>';
      } else if (c.type === 'button') {
        var btnName = c.name || '';
        var btnType = c.button_type || c.action_type || (c.attrs && c.attrs.type) || 'object';
        var btnStr = (c.string || btnName).replace(/</g, '&lt;');
        html += '<button type="button" class="btn-action-' + btnType + (c.class ? ' ' + c.class : '') + '" data-action="' + btnName + '" data-btn-type="' + btnType + '" style="padding:0.35rem 0.75rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:var(--color-surface-1);font-size:0.9rem">' + btnStr + '</button>';
      } else if (c.type === 'field') {
        var fieldHtml = renderFieldHtml(model, c);
        var fname = c.name || '';
        if ((c.invisible || c.readonly || c.required_cond) && fieldHtml) {
          var ad = (c.invisible ? ' data-invisible="' + String(c.invisible).replace(/"/g, '&quot;') + '"' : '') + (c.readonly ? ' data-readonly="' + String(c.readonly).replace(/"/g, '&quot;') + '"' : '') + (c.required_cond ? ' data-required-cond="' + String(c.required_cond).replace(/"/g, '&quot;') + '"' : '');
          html += '<div class="attr-field" data-fname="' + fname + '"' + ad + '>' + fieldHtml + '</div>';
        } else if (fieldHtml) {
          html += '<div class="attr-field" data-fname="' + fname + '">' + fieldHtml + '</div>';
        }
      }
      else if (c.type === 'group') {
        html += '<div class="form-group">';
        if (c.string) html += '<div class="form-group-title">' + (c.string || '').replace(/</g, '&lt;') + '</div>';
        html += renderFormTreeToHtml(model, c.children || [], opts);
        html += '</div>';
      } else if (c.type === 'notebook' && c.pages && c.pages.length) {
        const nbId = 'nb-' + Math.random().toString(36).slice(2);
        html += '<div class="form-notebook" id="' + nbId + '"><div class="notebook-tabs">';
        c.pages.forEach(function (p, i) {
          html += '<button type="button" class="notebook-tab' + (i === 0 ? ' active' : '') + '" data-page="' + i + '">' + (p.string || 'Tab').replace(/</g, '&lt;') + '</button>';
        });
        html += '</div>';
        c.pages.forEach(function (p, i) {
          html += '<div class="notebook-page' + (i === 0 ? ' active' : '') + '" data-page="' + i + '">' + renderFormTreeToHtml(model, p.children || [], opts) + '</div>';
        });
        html += '</div>';
      }
    });
    return html;
  }

  function renderForm(model, route, id, _skipCore) {
    if (!_skipCore && FormViewCore && typeof FormViewCore.render === "function") {
      var coreHandled = FormViewCore.render(main, {
        model: model,
        route: route,
        id: id,
      });
      if (coreHandled) return;
    }
    formDirty = false;
    if (typeof window !== 'undefined') window.chatContext = { model: model, active_id: id ? parseInt(id, 10) : null };
    const fields = getFormFields(model);
    const formView = viewsSvc ? viewsSvc.getView(model, 'form') : null;
    const children = formView && formView.children ? formView.children : null;
    const title = getTitle(route);
    const isNew = !id;
    const formTitle = isNew ? ('New ' + title.slice(0, -1)) : ('Edit ' + title.slice(0, -1));
    if (actionStack.length === 0 || actionStack[actionStack.length - 1].hash !== route) {
      if (actionStack.length === 0) pushBreadcrumb(title, route);
      pushBreadcrumb(formTitle, isNew ? route + '/new' : route + '/edit/' + id);
    }
    let html = renderBreadcrumbs();
    html += '<h2>' + formTitle + '</h2>';
    html += '<div id="form-dirty-banner" class="form-dirty-banner" style="display:none">You have unsaved changes</div>';
    html += '<div class="form-with-sidebar" style="display:flex;gap:var(--space-xl);align-items:flex-start;flex-wrap:wrap">';
    html += '<form id="record-form" style="max-width:600px;flex:1;min-width:280px">';
    if (children && children.length) {
      html += renderFormTreeToHtml(model, children, { recordId: id, route: route, isNew: isNew });
    } else {
      fields.forEach(function (f) {
        var fname = typeof f === 'object' ? f.name : f;
        html += '<div class="attr-field" data-fname="' + (fname || '') + '">' + renderFieldHtml(model, f) + '</div>';
      });
    }
    var FFA = window.AppCore && window.AppCore.FormFooterActions;
    if (FFA && typeof FFA.buildFormFooterActionsHtml === 'function') {
      html += FFA.buildFormFooterActionsHtml({
        route: route,
        isNew: isNew,
        model: model,
        reportName: !isNew ? getReportName(model) : null,
        recordId: id,
      });
    } else {
      html += '<p><button type="submit" id="btn-save" class="o-btn o-btn-primary o-shortcut-target" data-shortcut="Alt+S">Save</button> ';
      html += '<a href="#' + route + '" id="form-cancel" style="margin-left:0.5rem">Cancel</a>';
      if (isNew && (model === 'crm.lead' || model === 'res.partner')) {
        html += ' <button type="button" id="btn-ai-fill" title="Extract fields from pasted text" style="margin-left:0.5rem;padding:0.5rem 1rem;background:var(--color-accent,#6366f1);color:white;border:none;border-radius:4px;cursor:pointer">AI Fill</button>';
      }
      if (!isNew) {
        html += ' <button type="button" id="btn-duplicate" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Duplicate</button>';
        const reportName = getReportName(model);
        if (reportName) {
          html += ' <a href="/report/html/' + reportName + '/' + id + '" target="_blank" rel="noopener" id="btn-print-form" class="o-btn o-btn-secondary o-shortcut-target" data-shortcut="Alt+P" style="margin-left:0.5rem;text-decoration:none">Print</a>';
          html += ' <button type="button" id="btn-preview-form" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Preview</button>';
        }
        html += ' <a href="#" id="btn-delete-form" style="margin-left:0.5rem;font-size:0.9rem;color:#c00">Delete</a>';
      }
      html += '</p>';
    }
    html += '</form>';
    if (!isNew && (model === 'crm.lead' || model === 'project.task' || model === 'helpdesk.ticket')) {
      html += '<aside id="form-ai-sidebar" class="form-ai-sidebar" style="min-width:240px;max-width:280px;padding:var(--space-lg);background:var(--color-bg);border:1px solid var(--border-color);border-radius:var(--radius-md)">';
      html += '<h3 style="margin:0 0 var(--space-md);font-size:1rem">AI Suggestions</h3>';
      html += '<div id="ai-suggestions-list" style="font-size:0.9rem;color:var(--text-muted)">' + skeletonHtml(3, true) + '</div>';
      html += '</aside>';
    }
    html += '</div>';
    main.innerHTML = html;
    const form = document.getElementById('record-form');
    main.querySelectorAll(".o-shortcut-target[data-shortcut]").forEach(function (el) {
      var k = el.getAttribute("data-shortcut");
      if (k) el.title = (el.title ? el.title + " " : "") + "(" + k + ")";
    });
    var previewBtn = document.getElementById("btn-preview-form");
    if (previewBtn) {
      previewBtn.onclick = function () {
        var reportName = getReportName(model);
        if (!reportName || !id) return;
        var url = "/report/pdf/" + reportName + "/" + id;
        if (window.UIComponents && window.UIComponents.PdfViewer && typeof window.UIComponents.PdfViewer.open === "function") {
          window.UIComponents.PdfViewer.open(url, "Record Preview");
        } else {
          window.open(url, "_blank", "noopener");
        }
      };
    }
    var printFormA = document.getElementById("btn-print-form");
    if (printFormA && getReportName(model) && id) {
      printFormA.addEventListener("click", function (e) {
        e.preventDefault();
        var rn = getReportName(model);
        if (!rn || !id) return;
        var pdfUrl = "/report/pdf/" + rn + "/" + id;
        if (window.UIComponents && window.UIComponents.PdfViewer && typeof window.UIComponents.PdfViewer.open === "function") {
          window.UIComponents.PdfViewer.open(pdfUrl, "Print preview");
        } else {
          window.open(printFormA.getAttribute("href") || "#", "_blank", "noopener");
        }
      });
    }
    fields.forEach(f => {
      const fn = typeof f === 'object' ? f.name : f;
      if (isHtmlField(model, fn)) {
        const htmlDiv = document.getElementById('html-' + fn);
        const hiddenIn = document.getElementById('hidden-html-' + fn);
        if (htmlDiv && hiddenIn) {
          const syncHtml = function () { hiddenIn.value = htmlDiv.innerHTML || ''; };
          htmlDiv.addEventListener('input', syncHtml);
          htmlDiv.addEventListener('blur', syncHtml);
        }
      }
      if (isBinaryField(model, fn) || isImageField(model, fn)) {
        const fileIn = document.getElementById('file-' + fn);
        const hiddenIn = document.getElementById('hidden-' + fn);
        const statusSpan = document.getElementById('bin-status-' + fn);
        const imgPreview = document.getElementById('img-preview-' + fn);
        if (fileIn && hiddenIn) {
          fileIn.onchange = function () {
            const file = fileIn.files && fileIn.files[0];
            if (!file) { hiddenIn.value = ''; if (statusSpan) statusSpan.textContent = ''; if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; } return; }
            const r = new FileReader();
            r.onload = function () {
              const dataUrl = r.result;
              const base64 = (dataUrl && dataUrl.indexOf(',') >= 0) ? dataUrl.split(',')[1] : '';
              hiddenIn.value = base64;
              if (statusSpan) statusSpan.textContent = file.name + ' (' + (file.size < 1024 ? file.size + ' B' : (file.size / 1024).toFixed(1) + ' KB') + ')';
              if (imgPreview && file.type && file.type.startsWith('image/')) {
                imgPreview.src = dataUrl;
                imgPreview.style.display = 'block';
              }
            };
            r.readAsDataURL(file);
          };
        }
        if (imgPreview) {
          imgPreview.onclick = function () {
            if (!imgPreview.src) return;
            if (window.UIComponents && window.UIComponents.AttachmentViewer && typeof window.UIComponents.AttachmentViewer.open === "function") {
              window.UIComponents.AttachmentViewer.open([
                { name: fn, url: imgPreview.src, mimetype: "image/*" },
              ], 0);
            } else {
              window.open(imgPreview.src, "_blank", "noopener");
            }
          };
          imgPreview.style.cursor = "zoom-in";
        }
      }
    });
    main.querySelectorAll('[data-btn-type]').forEach(function (btn) {
      var actionName = btn.getAttribute('data-action');
      var buttonType = btn.getAttribute('data-btn-type') || 'object';
      if (!actionName || isNew) return;
      btn.onclick = function () {
        btn.disabled = true;
        var runner = (window.ActionManager && typeof window.ActionManager.doActionButton === 'function')
          ? window.ActionManager.doActionButton({
              rpc: rpc,
              buttonType: buttonType,
              actionId: actionName,
              model: model,
              method: actionName,
              resId: parseInt(id, 10),
              context: { active_model: model, active_id: parseInt(id, 10), active_ids: [parseInt(id, 10)] },
            })
          : rpc.callKw(model, actionName, [[parseInt(id, 10)]], {});
        runner
          .then(function (result) {
            btn.disabled = false;
            if (result && typeof result === 'object' && result.type === 'ir.actions.act_window' && result.res_model) {
              if (result.target === 'new' && window.UIComponents && window.UIComponents.ConfirmDialog && typeof window.UIComponents.ConfirmDialog.openModal === 'function') {
                var wizardTrail = ['Wizard'];
                var current = result;
                var modal = window.UIComponents.ConfirmDialog.openModal({
                  title: result.name || 'Wizard',
                  breadcrumbs: wizardTrail,
                  bodyHtml: '<p style="margin:0 0 var(--space-sm)">Wizard action returned <code>' + String(result.res_model || '').replace(/</g, '&lt;') + '</code>.</p><p style="color:var(--text-muted);margin:0">Complete the wizard and close to refresh parent view.</p>',
                  onClose: function () { renderForm(model, route, id); },
                });
                // Simple multi-step chain support: if action payload carries `next_action`
                while (current && current.next_action) {
                  current = current.next_action;
                  wizardTrail.push(current.name || 'Step');
                }
                if (modal && modal.setBreadcrumbs) modal.setBreadcrumbs(wizardTrail);
                return;
              }
              var actRoute = (result.res_model || '').replace(/\./g, '_');
              var resId = result.res_id;
              if (actRoute && resId) {
                location.hash = '#' + actRoute + '/edit/' + resId;
                renderContent();
                return;
              }
            }
            showToast('Action completed', 'success');
            renderForm(model, route, id);
          })
          .catch(function (err) {
            btn.disabled = false;
            showToast(err.message || 'Action failed', 'error');
          });
      };
    });
    main.querySelectorAll('.form-notebook').forEach(function (nb) {
      const tabs = nb.querySelectorAll('.notebook-tab');
      const pages = nb.querySelectorAll('.notebook-page');
      tabs.forEach(function (tab, i) {
        tab.onclick = function () {
          tabs.forEach(function (t) { t.classList.remove('active'); });
          pages.forEach(function (p) { p.classList.remove('active'); });
          tab.classList.add('active');
          const page = nb.querySelector('.notebook-page[data-page="' + i + '"]');
          if (page) page.classList.add('active');
        };
      });
    });
    const selects = form.querySelectorAll('select[data-comodel]');
    const m2oneWidgets = form.querySelectorAll('.m2one-widget');
    const m2mDivs = form.querySelectorAll('[id^="m2m-"]');
    const m2oneSearchDebounce = {};
    const setupM2oneWidget = function (widget) {
      const comodel = widget.dataset.comodel;
      const fname = widget.dataset.fname;
      if (!comodel) return;
      const inputEl = widget.querySelector('.m2one-input');
      const valueEl = widget.querySelector('.m2one-value');
      const dropdownEl = widget.querySelector('.m2one-dropdown');
      if (!inputEl || !valueEl || !dropdownEl) return;
      const getDomain = function () {
        try {
          const d = widget.dataset.domain;
          if (!d) return [];
          const info = JSON.parse(decodeURIComponent(d));
          const depVal = getFormFieldVal(info.depField);
          return depVal ? [[info.depField, '=', depVal]] : [[info.depField, '=', 0]];
        } catch (e) { return []; }
      };
      const doSearch = function () {
        const term = (inputEl.value || '').trim();
        const domain = getDomain();
        rpc.callKw(comodel, 'name_search', [term, domain, 'ilike', 8], {})
          .then(function (results) {
            dropdownEl.innerHTML = '';
            dropdownEl.style.display = results.length ? 'block' : 'none';
            results.forEach(function (r) {
              const id = r[0], name = r[1] || String(id);
              const item = document.createElement('div');
              item.className = 'm2one-dropdown-item';
              item.style.cssText = 'padding:0.5rem;cursor:pointer';
              item.textContent = name;
              item.dataset.id = id;
              item.dataset.name = name;
              item.onmouseover = function () { item.style.background = '#f0f0f0'; };
              item.onmouseout = function () { item.style.background = ''; };
              item.onclick = function () {
                valueEl.value = id;
                inputEl.value = name;
                dropdownEl.style.display = 'none';
                inputEl.dataset.display = name;
                form.querySelectorAll('.m2one-widget[data-depends-on="' + fname + '"]').forEach(function (w) {
                  const v = w.querySelector('.m2one-value');
                  const i = w.querySelector('.m2one-input');
                  if (v) v.value = '';
                  if (i) { i.value = ''; delete i.dataset.display; }
                });
                runServerOnchange(fname);
              };
              dropdownEl.appendChild(item);
            });
          })
          .catch(function () { dropdownEl.style.display = 'none'; });
      };
      inputEl.onfocus = function () {
        if (valueEl.value && inputEl.dataset.display) return;
        if ((inputEl.value || '').trim().length >= 2) doSearch();
        else if (!valueEl.value) {
          rpc.callKw(comodel, 'name_search', ['', getDomain(), 'ilike', 8], {}).then(function (results) {
            dropdownEl.innerHTML = '';
            dropdownEl.style.display = results.length ? 'block' : 'none';
            results.forEach(function (r) {
              const item = document.createElement('div');
              item.className = 'm2one-dropdown-item';
              item.style.cssText = 'padding:0.5rem;cursor:pointer';
              item.textContent = r[1] || String(r[0]);
              item.dataset.id = r[0];
              item.dataset.name = r[1] || String(r[0]);
              item.onclick = function () {
                valueEl.value = item.dataset.id;
                inputEl.value = item.dataset.name;
                inputEl.dataset.display = item.dataset.name;
                dropdownEl.style.display = 'none';
                runServerOnchange(fname);
              };
              dropdownEl.appendChild(item);
            });
          });
        }
      };
      inputEl.oninput = function () {
        const key = fname;
        if (m2oneSearchDebounce[key]) clearTimeout(m2oneSearchDebounce[key]);
        valueEl.value = '';
        delete inputEl.dataset.display;
        m2oneSearchDebounce[key] = setTimeout(function () {
          m2oneSearchDebounce[key] = null;
          if ((inputEl.value || '').trim().length >= 2) doSearch();
          else dropdownEl.style.display = 'none';
        }, 300);
      };
      inputEl.onblur = function () {
        setTimeout(function () {
          dropdownEl.style.display = 'none';
          if (valueEl.value && !inputEl.dataset.display) {
            rpc.callKw(comodel, 'name_get', [[parseInt(valueEl.value, 10)]], {}).then(function (res) {
              if (res && res[0]) inputEl.dataset.display = res[0][1];
            });
          }
        }, 200);
      };
      var depAttr = widget.getAttribute('data-depends-on');
      if (depAttr) {
        const depWidget = form.querySelector('.m2one-widget[data-fname="' + depAttr + '"]');
        const depInput = depWidget ? depWidget.querySelector('.m2one-input') : form.querySelector('[name="' + depAttr + '"]');
        if (depInput) {
          depInput.addEventListener('input', function () {
            valueEl.value = '';
            inputEl.value = '';
            delete inputEl.dataset.display;
          });
          depInput.addEventListener('change', function () {
            valueEl.value = '';
            inputEl.value = '';
            delete inputEl.dataset.display;
          });
        }
      }
    };
    const getFormFieldVal = function (name) {
      const el = form.querySelector('[name="' + name + '"]');
      return el ? (el.value ? parseInt(el.value, 10) || el.value : null) : null;
    };
    const loadSelectOptions = function (sel, domain) {
      const comodel = sel.dataset.comodel;
      if (!comodel) return Promise.resolve();
      const d = domain || [];
      return rpc.callKw(comodel, 'search_read', [d], { fields: ['id', 'name'], limit: 200 })
        .then(function (opts) {
          sel.innerHTML = '<option value="">--</option>';
          opts.forEach(function (o) {
            sel.appendChild(document.createElement('option')).value = o.id;
            sel.lastChild.textContent = o.name || o.id;
          });
        });
    };
    m2oneWidgets.forEach(function (w) { setupM2oneWidget(w); });
    const statusbars = form.querySelectorAll('.o-statusbar');
    const setupStatusbar = function (sb, options, currentVal, isNew) {
      sb.innerHTML = '';
      var clickable = sb.getAttribute('data-clickable') !== '0';
      var fname = sb.dataset.fname;
      var hiddenInput = form.querySelector('input[name="' + fname + '"]');
      if (!hiddenInput) return;
      var currentId = currentVal != null ? currentVal : null;
      if (currentId != null) hiddenInput.value = currentId;
      var currentIdx = -1;
      if (currentId != null) {
        for (var i = 0; i < options.length; i++) {
          var oid = options[i].id != null ? options[i].id : options[i][0];
          if (String(oid) === String(currentId)) { currentIdx = i; break; }
        }
      }
      options.forEach(function (opt, idx) {
        var item = document.createElement('span');
        item.className = 'o-statusbar-item';
        var optId = opt.id != null ? opt.id : opt[0];
        var optName = opt.name != null ? opt.name : (opt[1] || opt[0]);
        item.textContent = optName;
        item.dataset.value = String(optId);
        if (String(optId) === String(currentId) || (currentId == null && idx === 0)) item.classList.add('o-statusbar-item--active');
        if (currentIdx >= 0 && idx < currentIdx) item.classList.add('o-statusbar-item--done');
        if (clickable) {
          item.style.cursor = 'pointer';
          item.onclick = function () {
            const raw = item.dataset.value;
            const val = /^\d+$/.test(raw) ? parseInt(raw, 10) : raw;
            hiddenInput.value = raw;
            if (isNew) {
              statusbars.forEach(function (s) {
                if (s.dataset.fname === fname) {
                  s.querySelectorAll('.o-statusbar-item').forEach(function (i) { i.classList.remove('o-statusbar-item--active'); });
                  item.classList.add('o-statusbar-item--active');
                }
              });
            } else {
              rpc.callKw(model, 'write', [[parseInt(id, 10)], { [fname]: val }], {})
                .then(function () {
                  showToast('Stage updated', 'success');
                  loadRecord(model, id).then(function (r) {
                    if (r && r[0]) {
                      var rec = r[0];
                      var newCurrent = rec[fname];
                      statusbars.forEach(function (s) {
                        if (s.dataset.fname === fname) {
                          var items = s.querySelectorAll('.o-statusbar-item');
                          var newIdx = -1;
                          for (var j = 0; j < items.length; j++) {
                            if (String(items[j].dataset.value) === String(newCurrent)) { newIdx = j; break; }
                          }
                          items.forEach(function (i, j) {
                            i.classList.remove('o-statusbar-item--active', 'o-statusbar-item--done');
                            if (j === newIdx) i.classList.add('o-statusbar-item--active');
                            else if (newIdx >= 0 && j < newIdx) i.classList.add('o-statusbar-item--done');
                          });
                        }
                      });
                    }
                  });
                })
                .catch(function (err) { showToast(err.message || 'Failed to update', 'error'); });
            }
          };
        }
        sb.appendChild(item);
        if (idx < options.length - 1) {
          var sep = document.createElement('span');
          sep.className = 'o-statusbar-sep';
          sep.textContent = '>';
          sep.style.margin = '0 0.25rem';
          sb.appendChild(sep);
        }
      });
    };
    const renderM2mTags = function (div, fname, opts, selectedIds, nameMap, onchange) {
      const idSet = (selectedIds || []).map(function (x) { return String(x); });
      let html = '';
      (selectedIds || []).forEach(function (id) {
        const name = nameMap[id] || ('#' + id);
        html += '<span class="m2m-tag-chip" data-id="' + id + '" style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.2rem 0.5rem;background:var(--color-primary,#1a1a2e);color:white;border-radius:999px;font-size:0.85rem">' + String(name).replace(/</g, '&lt;') + ' <span class="m2m-tag-remove" style="cursor:pointer;opacity:0.8">×</span></span>';
      });
      const unselected = opts.filter(function (o) { return idSet.indexOf(String(o.id)) < 0; });
      html += '<select class="m2m-tag-add" data-fname="' + fname + '" style="min-width:8rem;padding:0.2rem 0.5rem;font-size:0.85rem;border:1px dashed #999;border-radius:4px;background:transparent"><option value="">+ Add</option>';
      unselected.forEach(function (o) {
        html += '<option value="' + o.id + '">' + String(o.name || o.id).replace(/</g, '&lt;') + '</option>';
      });
      html += '</select>';
      div.innerHTML = html;
      div.querySelectorAll('.m2m-tag-chip').forEach(function (chip) {
        const remove = chip.querySelector('.m2m-tag-remove');
        if (remove) {
          remove.onclick = function () {
            const id = parseInt(chip.dataset.id, 10);
            let ids = [];
            try { ids = JSON.parse(div.dataset.selected || '[]'); } catch (e) {}
            ids = ids.filter(function (x) { return x !== id; });
            div.dataset.selected = JSON.stringify(ids);
            renderM2mTags(div, fname, opts, ids, nameMap, onchange);
            if (onchange) onchange(fname);
          };
        }
      });
      const addSel = div.querySelector('.m2m-tag-add');
      if (addSel) {
        addSel.onchange = function () {
          const val = addSel.value;
          if (!val) return;
          const id = parseInt(val, 10);
          let ids = [];
          try { ids = JSON.parse(div.dataset.selected || '[]'); } catch (e) {}
          if (ids.indexOf(id) >= 0) return;
          ids.push(id);
          div.dataset.selected = JSON.stringify(ids);
          const o = opts.filter(function (x) { return x.id === id; })[0];
          const nm = o ? (o.name || String(id)) : String(id);
          if (!nameMap[id]) nameMap[id] = nm;
          renderM2mTags(div, fname, opts, ids, nameMap, onchange);
          addSel.value = '';
          if (onchange) onchange(fname);
        };
      }
    };
    const loadOptions = function (formVals) {
      const promises = [];
      selects.forEach(function (sel) {
        const comodel = sel.dataset.comodel;
        const fname = sel.getAttribute('name');
        if (!comodel) return;
        const domainInfo = getMany2oneDomain(model, fname);
        let domain = [];
        if (domainInfo) {
          const depVal = formVals ? formVals[domainInfo.depField] : getFormFieldVal(domainInfo.depField);
          if (depVal) domain = [[domainInfo.depField, '=', depVal]];
          else domain = [[domainInfo.depField, '=', 0]];
        }
        promises.push(loadSelectOptions(sel, domain));
      });
      m2mDivs.forEach(function (div) {
        const comodel = div.dataset.comodel;
        const fname = (div.id || '').replace('m2m-', '');
        const isTags = div.dataset.widget === 'many2many_tags';
        const selectedIds = (formVals && formVals[fname]) ? (Array.isArray(formVals[fname]) ? formVals[fname] : [formVals[fname]]) : [];
        if (!comodel) return;
        promises.push(
          rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], limit: 200 })
            .then(function (opts) {
              const nameMap = {};
              opts.forEach(function (o) { nameMap[o.id] = o.name || String(o.id); });
              if (isTags) {
                div.dataset.opts = JSON.stringify(opts);
                div.dataset.selected = JSON.stringify(selectedIds);
                renderM2mTags(div, fname, opts, selectedIds, nameMap, runServerOnchange);
              } else {
                let inner = '';
                const idSet = selectedIds.map(function (x) { return String(x); });
                opts.forEach(function (o) {
                  const checked = idSet.indexOf(String(o.id)) >= 0 ? ' checked' : '';
                  inner += '<label style="display:inline-block;margin-right:1rem;margin-bottom:0.25rem"><input type="checkbox" name="' + fname + '_cb" value="' + o.id + '"' + checked + '> ' + (o.name || o.id).replace(/</g, '&lt;') + '</label>';
                });
                div.innerHTML = inner || 'No options';
              }
            })
        );
      });
      statusbars.forEach(function (sb) {
        var comodel = sb.dataset.comodel;
        var fname = sb.dataset.fname;
        var currentVal = formVals ? formVals[fname] : getFormFieldVal(fname);
        if (comodel) {
          promises.push(
            rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence', limit: 50 })
              .then(function (opts) {
                setupStatusbar(sb, opts, currentVal, isNew);
              })
          );
        } else {
          var selOpts = getSelectionOptions(model, fname);
          if (selOpts) {
            setupStatusbar(sb, selOpts, currentVal, isNew);
          }
        }
      });
      return Promise.all(promises);
    };
    const onchangeDebounce = {};
    const runServerOnchange = function (fieldName) {
      const key = fieldName || '';
      if (onchangeDebounce[key]) clearTimeout(onchangeDebounce[key]);
      onchangeDebounce[key] = setTimeout(function () {
        onchangeDebounce[key] = null;
        const vals = getFormVals(form, model);
        rpc.callKw(model, 'onchange', [fieldName, vals], {}).then(function (updates) {
          if (!updates || typeof updates !== 'object') return;
          Object.keys(updates).forEach(function (n) {
            const v = updates[n];
            const el = form.querySelector('[name="' + n + '"]');
            if (!el) return;
            if (el.type === 'checkbox') {
              el.checked = !!v;
            } else {
              el.value = v != null ? v : '';
            }
          });
          applyAttrsToForm(form, model);
        }).catch(function () {});
      }, 300);
    };
    const setupDependsOnHandlers = function () {
      selects.forEach(function (sel) {
        const fname = sel.getAttribute('name');
        const domainInfo = getMany2oneDomain(model, fname);
        if (!domainInfo) return;
        const depEl = form.querySelector('[name="' + domainInfo.depField + '"]');
        if (depEl) {
          depEl.onchange = function () {
            runServerOnchange(domainInfo.depField);
            const depVal = getFormFieldVal(domainInfo.depField);
            loadSelectOptions(sel, depVal ? [[domainInfo.depField, '=', depVal]] : [[domainInfo.depField, '=', 0]])
              .then(function () {
                const stateEl = form.querySelector('[name="' + fname + '"]');
                if (stateEl) stateEl.value = '';
              });
          };
        }
      });
    };
    const setupOnchangeHandlers = function () {
      form.querySelectorAll('input[name], select[name], textarea[name]').forEach(function (el) {
        if (el.type === 'file' || (el.name || '').indexOf('_cb') >= 0) return;
        const fieldName = el.getAttribute('name');
        if (!fieldName) return;
        const ev = el.tagName === 'TEXTAREA' || (el.type === 'text' || el.type === 'email') ? 'blur' : 'change';
        el.addEventListener(ev, function () { runServerOnchange(fieldName); });
      });
    };
    var o2mOnchangeDebounce = {};
    const setupO2mOnchangeHandlers = function () {
      form.querySelectorAll('[id^="o2m-"]').forEach(function (div) {
        var fname = div.dataset.fname;
        var o2m = getOne2manyInfo(model, fname);
        if (!o2m || !o2m.comodel) return;
        var lineFields = getOne2manyLineFields(model, fname);
        if (lineFields.indexOf('product_id') < 0) return;
        var tbody = div.querySelector('tbody');
        if (!tbody) return;
        var runLineOnchange = function (tr, fieldName) {
          var key = fname + '-' + fieldName;
          if (o2mOnchangeDebounce[key]) clearTimeout(o2mOnchangeDebounce[key]);
          o2mOnchangeDebounce[key] = setTimeout(function () {
            o2mOnchangeDebounce[key] = null;
            var rowVals = {};
            lineFields.forEach(function (lf) {
              var inp = tr.querySelector('[data-o2m-field="' + lf + '"]');
              if (inp) {
                var v = inp.value;
                if (lf === 'product_id' && /^\d+$/.test(String(v))) v = parseInt(v, 10);
                else if (['product_uom_qty', 'price_unit', 'price_subtotal', 'product_qty', 'unit_amount', 'quantity', 'total_amount'].indexOf(lf) >= 0 && v !== '') v = parseFloat(v) || 0;
                rowVals[lf] = v;
              }
            });
            rpc.callKw(o2m.comodel, 'onchange', [fieldName, rowVals], {}).then(function (updates) {
              if (!updates || typeof updates !== 'object') return;
              Object.keys(updates).forEach(function (n) {
                var inp = tr.querySelector('[data-o2m-field="' + n + '"]');
                if (inp) inp.value = updates[n] != null ? updates[n] : '';
              });
            }).catch(function () {});
          }, 300);
        };
        tbody.querySelectorAll('tr').forEach(function (tr) {
          var prodInp = tr.querySelector('[data-o2m-field="product_id"]');
          if (prodInp) prodInp.addEventListener('change', function () { runLineOnchange(tr, 'product_id'); });
        });
        var obs = new MutationObserver(function (mutations) {
          mutations.forEach(function (m) {
            m.addedNodes.forEach(function (node) {
              if (node.nodeType === 1 && node.tagName === 'TR') {
                var prodInp = node.querySelector('[data-o2m-field="product_id"]');
                if (prodInp) prodInp.addEventListener('change', function () { runLineOnchange(node, 'product_id'); });
              }
            });
          });
        });
        obs.observe(tbody, { childList: true });
      });
    };
    const setM2mChecked = function (fname, ids) {
      const div = form.querySelector('#m2m-' + fname);
      if (div && div.dataset.widget === 'many2many_tags') {
        let opts = [];
        try { opts = JSON.parse(div.dataset.opts || '[]'); } catch (e) {}
        const nameMap = {};
        opts.forEach(function (o) { nameMap[o.id] = o.name || String(o.id); });
        div.dataset.selected = JSON.stringify(ids || []);
        renderM2mTags(div, fname, opts, ids || [], nameMap, runServerOnchange);
        return;
      }
      const idSet = (ids || []).map(function (x) { return String(x); });
      form.querySelectorAll('input[name="' + fname + '_cb"]').forEach(function (cb) {
        cb.checked = idSet.indexOf(String(cb.value)) >= 0;
      });
    };
    if (isNew) {
      const action = getActionForRoute(route);
      const context = (action && action.context) ? (typeof action.context === 'string' ? {} : action.context) : {};
      const fieldNames = fields.map(function (f) { return typeof f === 'object' ? f.name : f; });
      const applyDefaults = function (defaults) {
        if (!defaults || typeof defaults !== 'object') return;
        Object.keys(defaults).forEach(function (n) {
          const m2m = getMany2manyInfo(model, n);
          const m2oComodel = getMany2oneComodel(model, n);
          if (m2m) {
            setM2mChecked(n, Array.isArray(defaults[n]) ? defaults[n] : (defaults[n] ? [defaults[n]] : []));
          } else if (m2oComodel) {
            const widget = form.querySelector('.m2one-widget[data-fname="' + n + '"]');
            if (widget) {
              const vEl = widget.querySelector('.m2one-value');
              const iEl = widget.querySelector('.m2one-input');
              const id = defaults[n];
              if (vEl) vEl.value = id != null ? String(id) : '';
              if (iEl) {
                if (id) {
                  rpc.callKw(m2oComodel, 'name_get', [[parseInt(id, 10)]], {}).then(function (res) {
                    if (res && res[0]) { iEl.value = res[0][1]; iEl.dataset.display = res[0][1]; }
                  });
                } else iEl.value = '';
              }
            }
          } else {
            const el = form.querySelector('[name="' + n + '"]');
            if (el) {
              if (el.type === 'checkbox') el.checked = !!defaults[n];
              else {
                const metaD = getFieldMeta(model, n);
                const dv = defaults[n];
                if (metaD && metaD.type === 'date') el.value = serverValueToDateInput(dv);
                else if (metaD && metaD.type === 'datetime') el.value = serverValueToDatetimeLocal(dv);
                else el.value = dv != null ? String(dv) : '';
              }
            }
          }
        });
      };
      rpc.callKw(model, 'default_get', [fieldNames], { context: context })
        .then(function (defaults) {
          applyDefaults(defaults);
          return loadOptions(defaults || {});
        })
        .then(function () { setupDependsOnHandlers(); setupOnchangeHandlers(); applyAttrsToForm(form, model); })
        .catch(function () { loadOptions({}).then(function () { setupDependsOnHandlers(); setupOnchangeHandlers(); applyAttrsToForm(form, model); }); });
      setupOne2manyAddButtons(form, model);
      setupOne2manyComputedFields(form, model);
      setupO2mOnchangeHandlers();
      form.onsubmit = (e) => { e.preventDefault(); createRecord(model, route, form); return false; };
    } else {
      loadRecord(model, id).then(function (r) {
        if (r && r[0]) {
          const rec = r[0];
          try {
            const key = 'erp_recent_items';
            const name = (rec.name || rec.display_name || 'Item').toString();
            let arr = [];
            try { arr = JSON.parse(sessionStorage.getItem(key) || '[]'); } catch (e) {}
            arr = arr.filter(function (x) { return !(x.route === route && x.id == id); });
            arr.unshift({ id: rec.id, name: name, route: route });
            sessionStorage.setItem(key, JSON.stringify(arr.slice(0, 20)));
          } catch (e) {}
          if (rec.name && actionStack.length > 0) {
            actionStack[actionStack.length - 1].label = rec.name;
            var bcNav = main.querySelector('.breadcrumbs');
            if (bcNav) bcNav.outerHTML = renderBreadcrumbs();
            attachBreadcrumbHandlers();
          }
          return loadOptions(rec).then(function () {
            setupDependsOnHandlers();
            setupOnchangeHandlers();
            applyAttrsToForm(form, model);
            const set = (n, v) => {
              const el = form.querySelector('[name="' + n + '"]');
              if (!el) return;
              const metaEl = getFieldMeta(model, n);
              if (metaEl && metaEl.type === 'date') { el.value = serverValueToDateInput(v); return; }
              if (metaEl && metaEl.type === 'datetime') { el.value = serverValueToDatetimeLocal(v); return; }
              el.value = v != null ? String(v) : '';
            };
            fields.forEach(f => {
            const n = typeof f === 'object' ? f.name : f;
            const o2m = getOne2manyInfo(model, n);
            const m2m = getMany2manyInfo(model, n);
            if (m2m) {
              setM2mChecked(n, rec[n]);
            } else if (n === 'message_ids' && (model === 'crm.lead' || model === 'project.task' || model === 'helpdesk.ticket')) {
              loadChatter(model, id, rec[n]);
              setupChatter(form, model, id);
            } else if (o2m) {
              const div = form.querySelector('#o2m-' + n);
              const tbody = div && div.querySelector('#o2m-tbody-' + n);
              if (tbody && rec[n] && Array.isArray(rec[n]) && rec[n].length) {
                var lineFields = getOne2manyLineFields(model, n);
                var o2mFields = ['id'].concat(lineFields);
                rpc.callKw(o2m.comodel, 'search_read', [[['id', 'in', rec[n]]]], { fields: o2mFields })
                  .then(function (rows) {
                    var lineFields = getOne2manyLineFields(model, n);
                    rows.forEach(function (row) {
                      tbody.insertAdjacentHTML('beforeend', renderOne2manyRow(model, n, lineFields, row, 0));
                    });
                    setupOne2manyAddButtons(form, model);
      setupOne2manyComputedFields(form, model);
      setupO2mOnchangeHandlers();
                  })
                  .catch(function () { if (tbody) tbody.innerHTML = '<tr><td colspan="4">—</td></tr>'; });
              } else if (div) {
                setupOne2manyAddButtons(form, model);
      setupOne2manyComputedFields(form, model);
      setupO2mOnchangeHandlers();
              }
            } else if (isBooleanField(model, n)) {
              const cb = form.querySelector('[name="' + n + '"][type="checkbox"]');
              if (cb) cb.checked = !!rec[n];
            } else if (isHtmlField(model, n)) {
              const htmlDiv = document.getElementById('html-' + n);
              const hiddenIn = document.getElementById('hidden-html-' + n);
              const val = rec[n] || '';
              if (htmlDiv) htmlDiv.innerHTML = val;
              if (hiddenIn) hiddenIn.value = val;
            } else if (isImageField(model, n)) {
              const imgPreview = document.getElementById('img-preview-' + n);
              const statusSpan = document.getElementById('bin-status-' + n);
              const hiddenIn = form.querySelector('[name="' + n + '"]');
              if (rec[n] && imgPreview) {
                imgPreview.src = 'data:image/png;base64,' + rec[n];
                imgPreview.style.display = 'block';
              }
              if (statusSpan && rec[n]) statusSpan.textContent = 'Image attached';
            } else if (isBinaryField(model, n)) {
              const statusSpan = document.getElementById('bin-status-' + n);
              if (statusSpan && rec[n]) statusSpan.textContent = 'File attached';
            } else if (getMany2oneComodel(model, n)) {
              const widget = form.querySelector('.m2one-widget[data-fname="' + n + '"]');
              if (widget) {
                const vEl = widget.querySelector('.m2one-value');
                const iEl = widget.querySelector('.m2one-input');
                const id = rec[n];
                if (vEl) vEl.value = id != null ? String(id) : '';
                if (iEl) {
                  const display = rec[n + '_display'];
                  if (display) {
                    iEl.value = display;
                    iEl.dataset.display = display;
                  } else if (id) {
                    rpc.callKw(getMany2oneComodel(model, n), 'name_get', [[parseInt(id, 10)]], {}).then(function (res) {
                      if (res && res[0]) { iEl.value = res[0][1]; iEl.dataset.display = res[0][1]; }
                    });
                  } else iEl.value = '';
                }
              }
            } else {
              set(n, rec[n]);
            }
          });
          });
        }
      }).catch(function () {});
      form.onsubmit = (e) => { e.preventDefault(); updateRecord(model, route, id, form); return false; };
      var btnDup = document.getElementById('btn-duplicate');
      var btnDel = document.getElementById('btn-delete-form');
      if (btnDup) btnDup.onclick = function () {
        rpc.callKw(model, 'copy', [[parseInt(id, 10)]], {})
          .then(function (newRec) {
            var newId = typeof newRec === 'number' ? newRec : ((newRec && newRec.ids && newRec.ids[0]) || (newRec && newRec.id));
            if (newId) {
              showToast('Record duplicated', 'success');
              window.location.hash = route + '/edit/' + newId;
            }
          })
          .catch(function (err) { showToast(err.message || 'Failed to duplicate', 'error'); });
      };
      if (btnDel) btnDel.onclick = function (e) {
        e.preventDefault();
        confirmModal({ title: 'Delete record', message: 'Delete this record?', confirmLabel: 'Delete', cancelLabel: 'Cancel' }).then(function (ok) {
          if (ok) deleteRecord(model, route, id);
        });
      };
      var suggestionsEl = document.getElementById('ai-suggestions-list');
      if (suggestionsEl) {
        fetch('/ai/chat', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'suggest_next_actions', kwargs: { model: model, record_id: parseInt(id, 10) } })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.error) { suggestionsEl.innerHTML = '<span style="color:var(--text-muted)">' + (data.error || 'Unable to load').replace(/</g, '&lt;') + '</span>'; return; }
            var suggestions = data.result || [];
            if (!Array.isArray(suggestions)) suggestions = [];
            if (!suggestions.length) { suggestionsEl.innerHTML = '<span style="color:var(--text-muted)">No suggestions</span>'; return; }
            var html = '<ul style="list-style:none;padding:0;margin:0">';
            suggestions.forEach(function (s) {
              html += '<li style="padding:0.35rem 0;border-bottom:1px solid var(--border-color)">' + (s.label || s.action || '').replace(/</g, '&lt;') + '</li>';
            });
            html += '</ul>';
            suggestionsEl.innerHTML = html;
          })
          .catch(function () { var el = document.getElementById('ai-suggestions-list'); if (el) el.innerHTML = '<span style="color:var(--text-muted)">Could not load</span>'; });
      }
    }
    const btnAiFill = document.getElementById('btn-ai-fill');
    if (btnAiFill) {
      btnAiFill.onclick = function () {
        const text = prompt('Paste text (email, signature, lead description, etc.) to extract fields:');
        if (!text || !text.trim()) return;
        btnAiFill.disabled = true;
        btnAiFill.textContent = '...';
        fetch('/ai/extract_fields', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model, text: text.trim() })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.error) { showToast(data.error || 'AI extract failed', 'error'); return; }
            const fields = data.fields || {};
            const form = document.getElementById('record-form');
            if (!form) return;
            Object.keys(fields).forEach(function (fname) {
              const val = fields[fname];
              if (val == null) return;
              const strVal = String(val);
              const el = form.querySelector('[name="' + fname + '"]');
              if (el) {
                if (el.tagName === 'TEXTAREA') el.value = strVal;
                else if (el.type === 'checkbox') el.checked = !!val;
                else el.value = strVal;
              }
              const htmlDiv = document.getElementById('html-' + fname);
              const hiddenHtml = document.getElementById('hidden-html-' + fname);
              if (htmlDiv && hiddenHtml) { htmlDiv.innerHTML = strVal; hiddenHtml.value = strVal; }
            });
            formDirty = true;
            if (typeof updateDirtyBanner === 'function') updateDirtyBanner();
            showToast('Fields filled from AI extraction', 'success');
          })
          .catch(function (err) { showToast(err.message || 'AI extract failed', 'error'); })
          .finally(function () { btnAiFill.disabled = false; btnAiFill.textContent = 'AI Fill'; });
      };
    }
    setupSignatureWidgets(form);
    attachBreadcrumbHandlers();
  }

  function getFormVals(form, model) {
    form.querySelectorAll('.html-widget').forEach(function (div) {
      const fname = div.dataset.fname;
      const hidden = document.getElementById('hidden-html-' + fname);
      if (hidden) hidden.value = div.innerHTML || '';
    });
    const fields = getFormFields(model);
    const byName = (n) => { const el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ''; };
    const vals = {};
    fields.forEach(f => {
      const n = typeof f === 'object' ? f.name : f;
      if (n === 'message_ids') return;
      const o2m = getOne2manyInfo(model, n);
      if (o2m) {
        var tbody = form.querySelector('#o2m-tbody-' + n);
        if (tbody) {
          var lineFields = getOne2manyLineFields(model, n);
          var rows = [];
          tbody.querySelectorAll('tr').forEach(function (tr) {
            var row = {};
            var id = tr.getAttribute('data-o2m-id');
            if (id) row.id = parseInt(id, 10);
            lineFields.forEach(function (lf) {
              var inp = tr.querySelector('[data-o2m-field="' + lf + '"]');
              if (!inp) return;
              var v = inp.value || (lf === 'date_deadline' ? null : '');
              if (lf === 'product_id' && /^\d+$/.test(String(v))) v = parseInt(v, 10);
              else if (['product_uom_qty', 'price_unit', 'price_subtotal', 'product_qty', 'unit_amount', 'quantity', 'total_amount'].indexOf(lf) >= 0 && v !== '') v = parseFloat(v) || 0;
              row[lf] = v;
            });
            if (lineFields.length) rows.push(row);
          });
          vals[n] = rows;
        }
        return;
      }
      const m2m = getMany2manyInfo(model, n);
      if (m2m) {
        const tagsDiv = form.querySelector('#m2m-' + n + '[data-widget="many2many_tags"]');
        if (tagsDiv && tagsDiv.dataset.selected) {
          try { vals[n] = JSON.parse(tagsDiv.dataset.selected || '[]'); } catch (e) { vals[n] = []; }
        } else {
          const ids = [];
          form.querySelectorAll('input[name="' + n + '_cb"]:checked').forEach(function (cb) { ids.push(parseInt(cb.value, 10)); });
          vals[n] = ids;
        }
        return;
      }
      if (isBooleanField(model, n)) {
        const cb = form.querySelector('[name="' + n + '"][type="checkbox"]');
        vals[n] = cb ? !!cb.checked : false;
        return;
      }
      if (isBinaryField(model, n) || isImageField(model, n)) {
        const v = byName(n);
        if (v) vals[n] = v;
        return;
      }
      if (isHtmlField(model, n)) {
        vals[n] = byName(n);
        return;
      }
      const metaFr = getFieldMeta(model, n);
      if (metaFr && metaFr.type === 'date') {
        vals[n] = dateInputToServer(byName(n));
        return;
      }
      if (metaFr && metaFr.type === 'datetime') {
        vals[n] = datetimeLocalToServer(byName(n));
        return;
      }
      let v = byName(n).trim();
      const comodel = getMany2oneComodel(model, n);
      const selectionOpts = getSelectionOptions(model, n);
      if (comodel) {
        vals[n] = v ? parseInt(v, 10) : null;
      } else if (selectionOpts) {
        vals[n] = v || (selectionOpts[0] ? selectionOpts[0][0] : null);
      } else {
        vals[n] = v;
      }
    });
    return vals;
  }

  function showFormError(form, msg) {
    const prev = form.querySelector('.error');
    if (prev) prev.remove();
    form.insertAdjacentHTML('beforeend', '<p class="error" style="color:#c00;margin-top:0.5rem">' + msg.replace(/</g, '&lt;') + '</p>');
  }

  function clearFieldErrors(form) {
    form.querySelectorAll('.field-error').forEach(function (el) { el.classList.remove('field-error'); });
    form.querySelectorAll('.field-error-msg').forEach(function (el) { el.remove(); });
  }

  function showFieldError(form, fname, msg) {
    const wrapper = form.querySelector('[data-fname="' + fname + '"]');
    if (!wrapper) return;
    wrapper.classList.add('field-error');
    const prev = wrapper.querySelector('.field-error-msg');
    if (prev) prev.remove();
    const errEl = document.createElement('span');
    errEl.className = 'field-error-msg';
    errEl.textContent = msg || 'Invalid';
    wrapper.appendChild(errEl);
  }

  function validateRequiredFields(form, model) {
    const fields = getFormFields(model);
    const formVals = getFormVals(form, model);
    const errors = [];
    fields.forEach(function (f) {
      const n = typeof f === 'object' ? f.name : f;
      if (n === 'message_ids') return;
      const meta = getFieldMeta(model, n);
      const required = (meta && meta.required) || n === 'name';
      if (!required) return;
      const v = formVals[n];
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
      if (empty) errors.push({ fname: n, msg: (meta && meta.string) ? meta.string + ' is required' : n + ' is required' });
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function setupFormDirtyTracking(form) {
    formDirty = false;
    var markDirty = function () { formDirty = true; updateDirtyBanner(); };
    form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(function (el) {
      el.addEventListener('change', markDirty);
      el.addEventListener('input', markDirty);
    });
  }

  function setupSignatureWidgets(form) {
    if (!form) return;
    form.querySelectorAll('.o-signature-canvas').forEach(function (canvas) {
      var wrap = canvas.closest('.o-signature-widget');
      if (!wrap) return;
      var hidden = wrap.querySelector('.o-signature-data');
      if (!hidden) return;
      var ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = typeof getComputedStyle !== 'undefined' ? (getComputedStyle(document.documentElement).getPropertyValue('--color-text') || '#333').trim() || '#333' : '#333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
      var drawing = false;
      function pos(e) {
        var r = canvas.getBoundingClientRect();
        var cx = e.touches ? e.touches[0].clientX : e.clientX;
        var cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - r.left, y: cy - r.top };
      }
      function start(e) {
        drawing = true;
        var p = pos(e);
        if (ctx) { ctx.beginPath(); ctx.moveTo(p.x, p.y); }
        if (e.cancelable) e.preventDefault();
      }
      function move(e) {
        if (!drawing || !ctx) return;
        var p = pos(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        hidden.value = canvas.toDataURL('image/png');
        if (e.cancelable) e.preventDefault();
      }
      function end() { drawing = false; }
      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      canvas.addEventListener('mouseup', end);
      canvas.addEventListener('mouseleave', end);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      canvas.addEventListener('touchend', end);
      var clearBtn = wrap.querySelector('.o-signature-clear');
      if (clearBtn) {
        clearBtn.onclick = function () {
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          hidden.value = '';
        };
      }
    });
  }

  function updateDirtyBanner() {
    const banner = document.getElementById('form-dirty-banner');
    if (!banner) return;
    banner.style.display = formDirty ? 'block' : 'none';
  }

  function handleSaveError(form, model, err, btn) {
    if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
    if ((err.message || '').indexOf('Session expired') >= 0) { window.location.href = '/web/login'; return; }
    showToast(err.message || 'Failed to save', 'error');
    clearFieldErrors(form);
    showFormError(form, err.message || 'Failed to save');
    var msg = (err.message || '').toLowerCase();
    var fields = getFormFields(model || []);
    (fields || []).forEach(function (f) {
      var n = typeof f === 'object' ? f.name : f;
      if (n && msg.indexOf(n.toLowerCase()) >= 0) showFieldError(form, n, err.message || 'Invalid');
    });
  }

  function createRecord(model, route, form) {
    clearFieldErrors(form);
    var validation = validateRequiredFields(form, model);
    if (!validation.valid) {
      validation.errors.forEach(function (e) {
        showFieldError(form, e.fname, e.msg);
      });
      showFormError(form, 'Please fill in all required fields.');
      return;
    }
    const vals = getFormVals(form, model);
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    rpc.callKw(model, 'create', [[vals]])
      .then(() => {
        formDirty = false;
        showToast('Record created', 'success');
        window.location.hash = route;
        loadRecords(model, route, currentListState.searchTerm);
      })
      .catch(err => handleSaveError(form, err, btn));
  }

  function updateRecord(model, route, id, form) {
    clearFieldErrors(form);
    var validation = validateRequiredFields(form, model);
    if (!validation.valid) {
      validation.errors.forEach(function (e) {
        showFieldError(form, e.fname, e.msg);
      });
      showFormError(form, 'Please fill in all required fields.');
      return;
    }
    const vals = getFormVals(form, model);
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    rpc.callKw(model, 'write', [[parseInt(id, 10)], vals])
      .then(() => {
        formDirty = false;
        showToast('Record saved', 'success');
        window.location.hash = route;
        loadRecords(model, route, currentListState.searchTerm);
      })
      .catch(err => handleSaveError(form, model, err, btn));
  }

  function loadRecord(model, id) {
    const fields = getFormFields(model);
    const fnames = fields.map(f => typeof f === 'object' ? f.name : f);
    return rpc.callKw(model, 'read', [[parseInt(id, 10)], fnames]);
  }

  function getHashViewParam() {
    const hash = (window.location.hash || '').slice(1);
    const q = hash.indexOf('?');
    if (q < 0) return null;
    const params = new URLSearchParams(hash.slice(q + 1));
    return params.get('view') || null;
  }

  function getAvailableViewModes(route) {
    if (!viewsSvc) return ['list'];
    const menus = viewsSvc.getMenus() || [];
    for (let i = 0; i < menus.length; i++) {
      const action = menus[i].action ? viewsSvc.getAction(menus[i].action) : null;
      if (action && actionToRoute(action) === route) {
        const raw = action.view_mode || action.viewMode || 'list,form';
        const modes = Array.isArray(raw) ? raw : String(raw).split(/[,\s]+/).filter(Boolean);
        return modes.length ? modes : ['list'];
      }
    }
    return ['list'];
  }

  function getPreferredViewType(route) {
    const urlView = getHashViewParam();
    if (urlView) return urlView;
    try {
      const stored = sessionStorage.getItem('view_' + route);
      if (stored) return stored;
    } catch (e) {}
    const modes = getAvailableViewModes(route);
    return modes[0] || 'list';
  }

  function setViewAndReload(route, view) {
    try {
      sessionStorage.setItem('view_' + route, view);
    } catch (e) {}
    window.location.hash = route + (view && view !== 'list' ? '?view=' + view : '');
  }

  function getHashDomainParam() {
    const hash = (window.location.hash || '').slice(1);
    const q = hash.indexOf('?');
    if (q < 0) return null;
    const params = new URLSearchParams(hash.slice(q + 1));
    const d = params.get('domain');
    if (!d) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(d));
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) { return null; }
  }

  function loadRecords(model, route, searchTerm, stageFilter, viewTypeOverride, savedFilterId, offsetOverride, orderOverride, domainOverride) {
    const viewType = viewTypeOverride != null ? viewTypeOverride : getPreferredViewType(route);
    const cols = getListColumns(model);
    const fnames = cols.map(c => typeof c === 'object' ? c.name : c);
    let fields = ['id'].concat(fnames);
    fnames.forEach(function (f) {
      const cf = getMonetaryCurrencyField(model, f);
      if (cf && fields.indexOf(cf) < 0) fields.push(cf);
    });
    const title = getTitle(route);
    if (stageFilter === undefined && currentListState.route === route) stageFilter = currentListState.stageFilter;
    if (savedFilterId === undefined && currentListState.route === route) savedFilterId = currentListState.savedFilterId;
    const offset = offsetOverride != null ? offsetOverride : (currentListState.route === route ? (currentListState.offset || 0) : 0);
    const limit = currentListState.limit || 80;
    const order = orderOverride != null ? orderOverride : (currentListState.route === route ? currentListState.order : null);
    const action = getActionForRoute(route);
    const actionDomain = (domainOverride && domainOverride.length) ? domainOverride : (action ? parseActionDomain(action.domain || '') : []);
    const domainOverrideProvided = !!(domainOverride && domainOverride.length);
    const prevCal = (viewType === 'calendar' && currentListState.route === route) ? { calendarYear: currentListState.calendarYear, calendarMonth: currentListState.calendarMonth } : {};
    const prevFilters = (currentListState.route === route) ? { activeSearchFilters: currentListState.activeSearchFilters || [], groupBy: currentListState.groupBy } : {};
    currentListState = Object.assign({ model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: viewType, savedFilterId: savedFilterId || null, offset: offset, limit: limit, order: order, totalCount: 0, activeSearchFilters: [], groupBy: null }, prevCal, prevFilters);
    main.innerHTML = '<h2>' + title + '</h2>' + skeletonHtml(6, true);
    const sessionSvc = window.Services && window.Services.session;
    const uidPromise = sessionSvc && sessionSvc.getSessionInfo ? sessionSvc.getSessionInfo().then(function (info) { return info && info.uid ? info.uid : 1; }).catch(function () { return 1; }) : Promise.resolve(1);
    uidPromise.then(function (uid) {
      return getSavedFilters(model).then(function (savedFilters) {
        let domain = actionDomain.slice();
        const savedFilter = savedFilterId ? savedFilters.find(function (f) { return f.id == savedFilterId; }) : null;
        if (savedFilter && savedFilter.domain && savedFilter.domain.length) {
          domain = domain.concat(savedFilter.domain);
        } else {
          if (!domainOverrideProvided) {
            const searchDom = buildSearchDomain(model, searchTerm && searchTerm.trim() ? searchTerm.trim() : '');
            if (searchDom.length) domain = domain.concat(searchDom);
          }
          if (model === 'crm.lead' && stageFilter) domain = domain.concat([['stage_id', '=', stageFilter]]);
        }
        const searchView = viewsSvc && viewsSvc.getView(model, 'search');
        const filters = (searchView && searchView.filters) || [];
        (currentListState.activeSearchFilters || []).forEach(function (fname) {
          const f = filters.find(function (x) { return x.name === fname && x.domain; });
          if (f && f.domain) {
            const fd = parseFilterDomain(f.domain, uid);
            if (fd.length) domain = domain.concat(fd);
          }
        });
      if (viewType === 'graph' && viewsSvc && viewsSvc.getView(model, 'graph')) {
        loadGraphData(model, route, domain, searchTerm, savedFilters);
        return Promise.resolve();
      }
      if (viewType === 'pivot' && viewsSvc && viewsSvc.getView(model, 'pivot')) {
        loadPivotData(model, route, domain, searchTerm, savedFilters);
        return Promise.resolve();
      }
      if (viewType === 'activity' && (model === 'crm.lead' || model === 'project.task')) {
        loadActivityData(model, route, domain, searchTerm, savedFilters);
        return Promise.resolve();
      }
      if (viewType === 'gantt' && (model === 'project.task' || model === 'mrp.production')) {
        loadGanttData(model, route, domain, searchTerm, savedFilters);
        return Promise.resolve();
      }
      const searchReadKw = { fields: fields, offset: offset, limit: limit };
      const effectiveOrder = order || (currentListState.groupBy ? currentListState.groupBy : null);
      if (effectiveOrder) searchReadKw.order = effectiveOrder;
      const searchReadPromise = rpc.callKw(model, 'search_read', [domain], searchReadKw);
      const searchCountPromise = rpc.callKw(model, 'search_count', [domain], {}).catch(function () { return null; });
      return Promise.all([searchCountPromise, searchReadPromise]).then(function (results) {
        const totalCount = results[0] != null ? results[0] : (results[1].length + offset);
        const records = results[1];
        currentListState.totalCount = totalCount;
        if (viewType === 'kanban' && window.ViewRenderers && window.ViewRenderers.kanban) {
          renderKanban(model, route, records, searchTerm);
        } else if (viewType === 'calendar' && model === 'crm.lead') {
          renderCalendar(model, route, records, searchTerm);
        } else {
          renderList(model, route, records, searchTerm, totalCount, offset, limit, savedFilters);
        }
      });
      });
    }).catch(err => {
      main.innerHTML = '<h2>' + title + '</h2><p class="error o-list-load-error">' + (err.message || 'Failed to load') + '</p>';
    });
  }

  function loadActivityData(model, route, domain, searchTerm, savedFiltersList) {
    const sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>Session required for activity view.</p>';
      return;
    }
    sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) {
        main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>Please log in.</p>';
        return;
      }
      const searchDom = buildSearchDomain(model, searchTerm || '');
      const fullDomain = (domain || []).concat(searchDom || []);
      const fields = model === 'crm.lead' ? ['id', 'name', 'stage_id', 'ai_score_label', 'expected_revenue'] : (model === 'helpdesk.ticket' ? ['id', 'name', 'stage_id'] : ['id', 'name', 'project_id', 'stage_id']);
      return Promise.all([
        rpc.callKw('mail.activity.type', 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' }),
        rpc.callKw(model, 'search_read', [fullDomain], { fields: fields, limit: 50 }),
        rpc.callKw('mail.activity', 'search_read', [[['res_model', '=', model]]], {
          fields: ['id', 'res_id', 'summary', 'date_deadline', 'state', 'activity_type_id'],
          limit: 500
        })
      ]).then(function (results) {
        const types = results[0] || [];
        const records = results[1] || [];
        const activities = results[2] || [];
        renderActivityMatrix(model, route, records, types, activities, searchTerm, savedFiltersList || [], info.uid);
      });
    }).catch(function () {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p class="error o-list-load-error">Failed to load activities.</p>';
    });
  }

  function loadGanttData(model, route, domain, searchTerm, savedFiltersList) {
    const searchDom = buildSearchDomain(model, searchTerm || '');
    const fullDomain = (domain || []).concat(searchDom || []);
    const dateStart = model === 'project.task' ? 'date_start' : 'date_start';
    const dateStop = model === 'project.task' ? 'date_deadline' : 'date_finished';
    const groupBy = model === 'project.task' ? 'project_id' : 'state';
    const fields = ['id', 'name', dateStart, dateStop, groupBy];
    rpc.callKw(model, 'search_read', [fullDomain], { fields: fields, limit: 200 })
      .then(function (records) {
        renderGanttView(model, route, records, searchTerm, savedFiltersList || [], dateStart, dateStop, groupBy);
      })
      .catch(function () {
        main.innerHTML = '<h2>' + getTitle(route) + '</h2><p class="error o-list-load-error">Failed to load Gantt data.</p>';
      });
  }

  function renderGanttView(model, route, records, searchTerm, savedFiltersList, dateStart, dateStop, groupBy) {
    if (GanttViewCore && typeof GanttViewCore.render === "function") {
      var coreHandled = GanttViewCore.render(main, {
        model: model,
        route: route,
        records: records || [],
        searchTerm: searchTerm || "",
      });
      if (coreHandled) return;
    }
    const title = getTitle(route);
    const currentView = 'gantt';
    const addLabel = route === 'tasks' ? 'Add task' : route === 'manufacturing' ? 'Add MO' : 'Add';
    actionStack = [{ label: title, hash: route }];
    let html = '<h2>' + title + '</h2>';
    html += '<p class="o-gantt-fallback-toolbar">';
    html += renderViewSwitcher(route, currentView);
    html += '<div role="search" class="o-gantt-fallback-search"><input type="text" id="list-search" placeholder="Search..." class="o-list-search-field" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button></div>';
    html += '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + addLabel + '</button></p>';
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const totalDays = Math.ceil((rangeEnd - rangeStart) / (24 * 60 * 60 * 1000));
    const dayWidth = 24;
    const timelineWidth = totalDays * dayWidth;
    html += '<div class="gantt-view o-gantt-scroll"><table role="grid" class="o-gantt-table"><thead><tr><th class="o-gantt-th o-gantt-th--name">Name</th><th class="o-gantt-th o-gantt-th--timeline" style="min-width:' + timelineWidth + 'px">' + rangeStart.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) + ' – ' + rangeEnd.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) + '</th></tr></thead><tbody>';
    (records || []).forEach(function (r) {
      const startVal = r[dateStart];
      const stopVal = r[dateStop];
      const startDate = startVal ? new Date(startVal) : rangeStart;
      const stopDate = stopVal ? new Date(stopVal) : (startVal ? new Date(startVal) : rangeEnd);
      const left = Math.max(0, Math.floor((startDate - rangeStart) / (24 * 60 * 60 * 1000)) * dayWidth);
      const width = Math.max(dayWidth, Math.ceil((stopDate - startDate) / (24 * 60 * 60 * 1000)) * dayWidth);
      const name = (r.name || '—').replace(/</g, '&lt;');
      html += '<tr><td class="o-gantt-td o-gantt-td--name"><a href="#' + route + '/edit/' + (r.id || '') + '">' + name + '</a></td><td class="o-gantt-td o-gantt-td--timeline" style="min-width:' + timelineWidth + 'px"><div class="o-gantt-bar" style="left:' + left + 'px;width:' + width + 'px" title="' + String(startVal || '').replace(/"/g, '&quot;') + ' – ' + String(stopVal || '').replace(/"/g, '&quot;') + '"></div></td></tr>';
    });
    html += '</tbody></table></div>';
    if (!records || !records.length) {
      html = html.replace('</div>', '<p class="o-gantt-empty">No records with dates.</p></div>');
    }
    main.innerHTML = html;
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', viewType: 'gantt' };
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    const btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { window.location.hash = route + '/new'; };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () { loadRecords(model, route, searchInput.value.trim(), null, 'gantt', null, 0, null); };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
  }

  function renderActivityMatrix(model, route, records, activityTypes, activities, searchTerm, savedFiltersList, userId) {
    if (ActivityViewCore && typeof ActivityViewCore.render === "function") {
      var coreHandled = ActivityViewCore.render(main, {
        model: model,
        route: route,
        records: records || [],
        activityTypes: activityTypes || [],
      });
      if (coreHandled) return;
    }
    const title = getTitle(route);
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const currentView = 'activity';
    const addLabel = route === 'leads' ? 'Add lead' : route === 'tasks' ? 'Add task' : 'Add';
    actionStack = [{ label: title, hash: route }];
    let html = '<h2>' + title + '</h2>';
    html += '<p class="o-activity-matrix-toolbar">';
    html += renderViewSwitcher(route, currentView);
    html += '<div role="search" class="o-activity-matrix-search"><input type="text" id="list-search" placeholder="Search..." aria-label="Search" class="o-list-search-field" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button></div>';
    html += '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + addLabel + '</button></p>';
    const byRecordType = {};
    (activities || []).forEach(function (a) {
      const key = a.res_id + '_' + (a.activity_type_id || 0);
      if (!byRecordType[key]) byRecordType[key] = [];
      byRecordType[key].push(a);
    });
    html += '<div class="activity-matrix o-activity-matrix-scroll"><table role="grid" class="o-activity-matrix-table"><thead><tr role="row"><th role="columnheader" class="o-activity-matrix-th o-activity-matrix-th--record">Record</th>';
    (activityTypes || []).forEach(function (t) {
      html += '<th role="columnheader" class="o-activity-matrix-th">' + (t.name || '').replace(/</g, '&lt;') + '</th>';
    });
    html += '</tr></thead><tbody>';
    (records || []).forEach(function (r) {
      html += '<tr role="row"><td role="gridcell" class="o-activity-matrix-td o-activity-matrix-td--record"><a href="#' + route + '/edit/' + (r.id || '') + '">' + (r.name || '—').replace(/</g, '&lt;') + '</a></td>';
      (activityTypes || []).forEach(function (t) {
        const key = (r.id || '') + '_' + (t.id || 0);
        const cellActs = byRecordType[key] || [];
        let cellHtml = '';
        cellActs.forEach(function (a) {
          const d = a.date_deadline || '';
          const summary = (a.summary || 'Activity').replace(/</g, '&lt;');
          cellHtml += '<div class="o-activity-matrix-cell-line"><a href="#' + route + '/edit/' + (r.id || '') + '">' + summary + (d ? ' <span class="o-activity-matrix-cell-meta">' + String(d).replace(/</g, '&lt;') + '</span>' : '') + '</a></div>';
        });
        cellHtml += '<button type="button" class="btn-schedule-activity o-activity-schedule-btn" data-record-id="' + (r.id || '') + '" data-type-id="' + (t.id || '') + '" data-type-name="' + (t.name || '').replace(/"/g, '&quot;') + '">+ Schedule</button>';
        html += '<td role="gridcell" class="o-activity-matrix-td">' + cellHtml + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    if (!records || !records.length) {
      html = html.replace('</div>', '<p class="o-activity-matrix-empty">No records.</p></div>');
    }
    main.innerHTML = html;
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: 'activity' };
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    const btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { window.location.hash = route + '/new'; };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () { loadRecords(model, route, searchInput.value.trim(), null, 'activity', null, 0, null); };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    main.querySelectorAll('.btn-schedule-activity').forEach(function (btn) {
      btn.onclick = function () {
        const recordId = parseInt(btn.getAttribute('data-record-id'), 10);
        const typeId = parseInt(btn.getAttribute('data-type-id'), 10);
        const typeName = btn.getAttribute('data-type-name') || 'Activity';
        const summary = prompt('Summary for ' + typeName + ':', typeName);
        if (summary == null) return;
        const dateStr = prompt('Due date (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
        if (dateStr == null) return;
        rpc.callKw('mail.activity', 'create', [{
          res_model: model,
          res_id: recordId,
          summary: summary.trim() || typeName,
          date_deadline: dateStr || new Date().toISOString().slice(0, 10),
          activity_type_id: typeId || false,
          user_id: userId
        }], {}).then(function () {
          showToast('Activity scheduled', 'success');
          loadRecords(model, route, searchTerm, null, 'activity', null, 0, null);
        }).catch(function (err) {
          showToast(err.message || 'Failed to schedule', 'error');
        });
      };
    });
  }

  function loadGraphData(model, route, domain, searchTerm, savedFiltersList) {
    const graphView = viewsSvc && viewsSvc.getView(model, 'graph');
    if (!graphView || !graphView.fields || !graphView.fields.length) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>No graph view configured.</p>';
      return;
    }
    const rowFields = (graphView.fields || []).filter(function (f) { return f.role === 'row'; });
    const measureFields = (graphView.fields || []).filter(function (f) { return f.role === 'measure'; });
    const groupby = rowFields.map(function (f) { return f.name; });
    const fields = measureFields.map(function (f) { return f.name; });
    if (!groupby.length || !fields.length) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>Graph view needs row and measure fields.</p>';
      return;
    }
    const rowField = rowFields[0];
    const comodel = rowField.comodel || null;
    let labelMap = {};
    rpc.callKw(model, 'read_group', [domain], { fields: fields, groupby: groupby })
      .then(function (rows) {
        const ids = (rows || []).map(function (r) { return r[groupby[0]]; }).filter(function (id) { return id; });
        if (comodel && ids.length) {
          return rpc.callKw(comodel, 'name_get', [ids])
            .then(function (pairs) {
              (pairs || []).forEach(function (p) { labelMap[p[0]] = p[1] || String(p[0]); });
              return rows;
            })
            .catch(function () { return rows; });
        }
        return Promise.resolve(rows);
      })
      .then(function (rows) {
        const labels = (rows || []).map(function (r) {
          const v = r[groupby[0]];
          return (comodel && labelMap && labelMap[v]) ? labelMap[v] : (v != null ? String(v) : '');
        });
        const groupLabels = {};
        (rows || []).forEach(function (r, i) {
          const v = r[groupby[0]];
          if (v != null) groupLabels[v] = labels[i];
        });
        renderGraph(model, route, graphView, rows, groupby[0], fields, groupLabels, searchTerm, savedFiltersList);
      })
      .catch(function (err) {
        main.innerHTML = '<h2>' + getTitle(route) + '</h2><p class="error o-list-load-error">' + (err.message || 'Failed to load graph') + '</p>';
      });
  }

  function renderGraph(model, route, graphView, rows, groupbyField, measureFields, labelMap, searchTerm, savedFiltersList) {
    if (GraphViewCore && typeof GraphViewCore.render === "function") {
      var coreHandled = GraphViewCore.render(main, {
        model: model,
        route: route,
        graphView: graphView || {},
        rows: rows || [],
      });
      if (coreHandled) return;
    }
    savedFiltersList = savedFiltersList || [];
    const title = getTitle(route);
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const currentView = 'graph';
    actionStack = [{ label: title, hash: route }];
    let graphType = (graphView && graphView.graph_type) || 'bar';
    const labels = (rows || []).map(function (r) {
      const v = r[groupbyField];
      return (labelMap && v != null && labelMap[v]) ? labelMap[v] : (v != null ? String(v) : '');
    });
    const datasets = measureFields.map(function (m, idx) {
      const colors = ['rgba(26,26,46,0.8)', 'rgba(70,130,180,0.8)', 'rgba(34,139,34,0.8)', 'rgba(218,165,32,0.8)'];
      return {
        label: m.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }),
        data: (rows || []).map(function (r) { return r[m] != null ? Number(r[m]) : 0; }),
        backgroundColor: colors[idx % colors.length],
        borderColor: colors[idx % colors.length].replace('0.8', '1'),
        borderWidth: 1
      };
    });
    let html = '<h2>' + title + '</h2>';
    if (window.AppCore && window.AppCore.GraphViewChrome && typeof window.AppCore.GraphViewChrome.buildToolbarHtml === 'function') {
      html += window.AppCore.GraphViewChrome.buildToolbarHtml({
        viewSwitcherHtml: renderViewSwitcher(route, currentView),
        graphType: graphType,
        searchTerm: searchTerm || '',
        model: model,
        addLabel: route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add',
      });
    } else {
      html += '<p class="o-graph-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
      html += renderViewSwitcher(route, currentView);
      html += '<span class="graph-type-switcher" style="display:inline-flex;gap:2px;margin-right:0.5rem">';
      ['bar', 'line', 'pie'].forEach(function (t) {
        const active = t === graphType;
        html += '<button type="button" class="btn-graph-type' + (active ? ' active' : '') + '" data-type="' + t + '" style="padding:0.35rem 0.6rem;border:1px solid #ddd;background:' + (active ? '#1a1a2e;color:white;border-color:#1a1a2e' : '#fff;color:#333') + ';border-radius:4px;cursor:pointer;font-size:0.9rem">' + (t.charAt(0).toUpperCase() + t.slice(1)) + '</button>';
      });
      html += '</span>';
      html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
      html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
      if (model === 'crm.lead') {
        html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
      }
      html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Add lead</button></p>';
    }
    html += '<div class="o-graph-container">';
    html += '<canvas id="graph-canvas"></canvas>';
    html += '</div>';
    main.innerHTML = html;
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: 'graph' };
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    main.querySelectorAll('.btn-graph-type').forEach(function (btn) {
      btn.onclick = function () {
        graphType = btn.dataset.type;
        renderGraph(model, route, Object.assign({}, graphView, { graph_type: graphType }), rows, groupbyField, measureFields, labelMap, searchTerm, savedFiltersList);
      };
    });
    const btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { window.location.hash = route + '/new'; };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () {
        const filterEl = document.getElementById('list-stage-filter');
        const val = model === 'crm.lead' && filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), val, 'graph', null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    if (model === 'crm.lead') {
      const filterEl = document.getElementById('list-stage-filter');
      if (filterEl) {
        rpc.callKw('crm.stage', 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
          .then(function (stages) {
            stages.forEach(function (s) {
              const opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name || '';
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function () {
              const val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              loadRecords(model, route, searchInput.value.trim(), val, 'graph', null, 0, null);
            };
          });
      }
    }
    const ctx = document.getElementById('graph-canvas');
    if (!ctx || !window.Chart) {
      main.querySelector('.o-graph-container').innerHTML = '<p>Chart.js not loaded. Refresh the page.</p>';
      return;
    }
    const chartConfig = {
      type: graphType,
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: graphType !== 'pie' ? { y: { beginAtZero: true } } : {}
      }
    };
    if (graphType === 'pie' && datasets.length > 1) {
      chartConfig.data.datasets = [{
        label: measureFields[0],
        data: datasets[0].data,
        backgroundColor: datasets[0].backgroundColor,
        borderColor: datasets[0].borderColor,
        borderWidth: 1
      }];
    }
    new window.Chart(ctx, chartConfig);
  }

  function loadPivotData(model, route, domain, searchTerm, savedFiltersList) {
    const pivotView = viewsSvc && viewsSvc.getView(model, 'pivot');
    if (!pivotView || !pivotView.fields || !pivotView.fields.length) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>No pivot view configured.</p>';
      return;
    }
    const rowFields = (pivotView.fields || []).filter(function (f) { return f.role === 'row'; });
    const colFields = (pivotView.fields || []).filter(function (f) { return f.role === 'col'; });
    const measureFields = (pivotView.fields || []).filter(function (f) { return f.role === 'measure'; });
    const rowNames = rowFields.map(function (f) { return f.name; });
    const colNames = colFields.map(function (f) { return f.name; });
    const measures = measureFields.map(function (f) { return f.name; });
    if (!rowNames.length || !colNames.length || !measures.length) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>Pivot view needs row, col, and measure fields.</p>';
      return;
    }
    const groupby = rowNames.concat(colNames);
    rpc.callKw(model, 'read_group', [domain], { fields: measures, groupby: groupby, lazy: false })
      .then(function (rows) {
        const rowComodel = rowFields[0] && rowFields[0].comodel;
        const colComodel = colFields[0] && colFields[0].comodel;
        const rowIds = [];
        const colIds = [];
        (rows || []).forEach(function (r) {
          const rv = r[rowNames[0]];
          const cv = r[colNames[0]];
          if (rv != null && rowIds.indexOf(rv) < 0) rowIds.push(rv);
          if (cv != null && colIds.indexOf(cv) < 0) colIds.push(cv);
        });
        let rowLabelMap = {};
        let colLabelMap = {};
        const promises = [];
        if (rowComodel && rowIds.length) {
          promises.push(rpc.callKw(rowComodel, 'name_get', [rowIds]).then(function (pairs) {
            (pairs || []).forEach(function (p) { rowLabelMap[p[0]] = p[1] || String(p[0]); });
          }).catch(function () {}));
        }
        if (colComodel && colIds.length) {
          promises.push(rpc.callKw(colComodel, 'name_get', [colIds]).then(function (pairs) {
            (pairs || []).forEach(function (p) { colLabelMap[p[0]] = p[1] || String(p[0]); });
          }).catch(function () {}));
        }
        return Promise.all(promises).then(function () {
          return { rows: rows || [], rowLabelMap: rowLabelMap, colLabelMap: colLabelMap };
        });
      })
      .then(function (data) {
        renderPivot(model, route, pivotView, data.rows, rowNames, colNames, measures, data.rowLabelMap, data.colLabelMap, searchTerm, savedFiltersList);
      })
      .catch(function (err) {
        main.innerHTML = '<h2>' + getTitle(route) + '</h2><p class="error o-list-load-error">' + (err.message || 'Failed to load pivot') + '</p>';
      });
  }

  function renderPivot(model, route, pivotView, rows, rowNames, colNames, measures, rowLabelMap, colLabelMap, searchTerm, savedFiltersList) {
    if (PivotViewCore && typeof PivotViewCore.render === "function") {
      var coreHandled = PivotViewCore.render(main, {
        model: model,
        route: route,
        rows: rows || [],
        rowNames: rowNames || [],
        colNames: colNames || [],
        measures: measures || [],
      });
      if (coreHandled) return;
    }
    savedFiltersList = savedFiltersList || [];
    const title = getTitle(route);
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const rowField = rowNames[0];
    const colField = colNames[0];
    const measureField = measures[0];
    rowLabelMap = rowLabelMap || {};
    colLabelMap = colLabelMap || {};
    const rowVals = [];
    const colVals = [];
    const matrix = {};
    (rows || []).forEach(function (r) {
      const rv = r[rowField];
      const cv = r[colField];
      const val = r[measureField] != null ? Number(r[measureField]) : 0;
      if (rv != null && rowVals.indexOf(rv) < 0) rowVals.push(rv);
      if (cv != null && colVals.indexOf(cv) < 0) colVals.push(cv);
      const key = String(rv) + '_' + String(cv);
      matrix[key] = val;
    });
    const rowLabels = rowVals.map(function (v) { return rowLabelMap[v] || (v != null ? String(v) : ''); });
    const colLabels = colVals.map(function (v) { return colLabelMap[v] || (v != null ? String(v) : ''); });
    const rowTotals = {};
    const colTotals = {};
    rowVals.forEach(function (rv) { rowTotals[rv] = 0; });
    colVals.forEach(function (cv) { colTotals[cv] = 0; });
    rowVals.forEach(function (rv) {
      colVals.forEach(function (cv) {
        const key = String(rv) + '_' + String(cv);
        const v = matrix[key] || 0;
        rowTotals[rv] += v;
        colTotals[cv] += v;
      });
    });
    let grandTotal = 0;
    Object.keys(matrix).forEach(function (k) { grandTotal += matrix[k]; });
    actionStack = [{ label: title, hash: route }];
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: 'pivot' };
    const pivotAddLabel = route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add';
    let html = '<h2>' + title + '</h2>';
    if (window.AppCore && window.AppCore.PivotViewChrome && typeof window.AppCore.PivotViewChrome.buildToolbarHtml === 'function') {
      html += window.AppCore.PivotViewChrome.buildToolbarHtml({
        viewSwitcherHtml: renderViewSwitcher(route, 'pivot'),
        searchTerm: searchTerm || '',
        model: model,
        addLabel: pivotAddLabel,
      });
    } else {
      html += '<p class="o-pivot-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
      html += renderViewSwitcher(route, 'pivot');
      html += '<button type="button" id="btn-pivot-flip" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Flip axes</button>';
      html += '<button type="button" id="btn-pivot-download" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Download CSV</button>';
      html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
      html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
      if (model === 'crm.lead') {
        html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
      }
      html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + pivotAddLabel + '</button></p>';
    }
    html += '<div class="o-pivot-container o-card-gradient">';
    html += '<table class="o-pivot-table"><thead><tr><th class="o-pivot-th o-pivot-th--corner"></th>';
    colLabels.forEach(function (l) {
      html += '<th class="o-pivot-th o-pivot-th--measure">' + (l || '').replace(/</g, '&lt;') + '</th>';
    });
    html += '<th class="o-pivot-th o-pivot-th--total">Total</th></tr></thead><tbody>';
    rowVals.forEach(function (rv, ri) {
      html += '<tr><td class="o-pivot-td o-pivot-td--rowhead">' + (rowLabels[ri] || '').replace(/</g, '&lt;') + '</td>';
      colVals.forEach(function (cv) {
        const key = rv + '_' + cv;
        const val = matrix[key] || 0;
        html += '<td class="o-pivot-td o-pivot-td--num">' + (typeof val === 'number' ? val.toLocaleString() : val) + '</td>';
      });
      html += '<td class="o-pivot-td o-pivot-td--num o-pivot-td--rowtotal">' + (rowTotals[rv] || 0).toLocaleString() + '</td></tr>';
    });
    html += '<tr><td class="o-pivot-td o-pivot-td--coltotal">Total</td>';
    colVals.forEach(function (cv) {
      html += '<td class="o-pivot-td o-pivot-td--num o-pivot-td--coltotal">' + (colTotals[cv] || 0).toLocaleString() + '</td>';
    });
    html += '<td class="o-pivot-td o-pivot-td--num o-pivot-td--grandtotal">' + grandTotal.toLocaleString() + '</td></tr>';
    html += '</tbody></table></div>';
    main.innerHTML = html;
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    const btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { window.location.hash = route + '/new'; };
    const btnFlip = document.getElementById('btn-pivot-flip');
    if (btnFlip) {
      btnFlip.onclick = function () {
        renderPivot(model, route, pivotView, rows, colNames, rowNames, measures, colLabelMap, rowLabelMap, searchTerm, savedFiltersList);
      };
    }
    const btnDownload = document.getElementById('btn-pivot-download');
    if (btnDownload) {
      btnDownload.onclick = function () {
        let csv = ',' + colLabels.map(function (l) { return '"' + (l || '').replace(/"/g, '""') + '"'; }).join(',') + ',"Total"\n';
        rowVals.forEach(function (rv, ri) {
          csv += '"' + (rowLabels[ri] || '').replace(/"/g, '""') + '"';
          colVals.forEach(function (cv) {
            const key = rv + '_' + cv;
            csv += ',' + (matrix[key] || 0);
          });
          csv += ',' + (rowTotals[rv] || 0) + '\n';
        });
        csv += '"Total"';
        colVals.forEach(function (cv) { csv += ',' + (colTotals[cv] || 0); });
        csv += ',' + grandTotal + '\n';
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pivot_' + (route || 'data') + '.csv';
        a.click();
        URL.revokeObjectURL(a.href);
      };
    }
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () {
        const filterEl = document.getElementById('list-stage-filter');
        const val = model === 'crm.lead' && filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), val, 'pivot', null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    if (model === 'crm.lead') {
      const filterEl = document.getElementById('list-stage-filter');
      if (filterEl) {
        rpc.callKw('crm.stage', 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
          .then(function (stages) {
            stages.forEach(function (s) {
              const opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name || '';
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function () {
              const val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              loadRecords(model, route, searchInput ? searchInput.value.trim() : '', val, 'pivot', null, 0, null);
            };
          });
      }
    }
  }

  function renderCalendar(model, route, records, searchTerm) {
    if (CalendarViewCore && typeof CalendarViewCore.render === "function") {
      var coreHandled = CalendarViewCore.render(main, {
        model: model,
        route: route,
        records: records || [],
      });
      if (coreHandled) return;
    }
    const calendarView = viewsSvc && viewsSvc.getView(model, 'calendar');
    const dateField = (calendarView && calendarView.date_start) || 'date_deadline';
    const stringField = (calendarView && calendarView.string) || 'name';
    const title = getTitle(route);
    actionStack = [{ label: title, hash: route }];
    let calYear = (currentListState.route === route && currentListState.calendarYear) || new Date().getFullYear();
    let calMonth = (currentListState.route === route && currentListState.calendarMonth) || (new Date().getMonth() + 1);
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', viewType: 'calendar', calendarYear: calYear, calendarMonth: calMonth };
    const firstDay = new Date(calYear, calMonth - 1, 1);
    const lastDay = new Date(calYear, calMonth, 0);
    const startPad = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const recordsByDate = {};
    (records || []).forEach(function (r) {
      const d = r[dateField];
      if (!d) return;
      const dateStr = typeof d === 'string' ? d.slice(0, 10) : (d && d.toISOString ? d.toISOString().slice(0, 10) : '');
      if (!dateStr) return;
      if (!recordsByDate[dateStr]) recordsByDate[dateStr] = [];
      recordsByDate[dateStr].push(r);
    });
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const calAddLabelCommon = route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add';
    const calAddLabel = (model === 'calendar.event') ? 'Add meeting' : calAddLabelCommon;
    const monthTitleStr = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
    let html = '<h2>' + title + '</h2>';
    if (window.AppCore && window.AppCore.CalendarViewChrome && typeof window.AppCore.CalendarViewChrome.buildToolbarHtml === 'function') {
      html += window.AppCore.CalendarViewChrome.buildToolbarHtml({
        viewSwitcherHtml: renderViewSwitcher(route, 'calendar'),
        monthTitle: monthTitleStr,
        searchTerm: searchTerm || '',
        addLabel: calAddLabel,
      });
    } else {
      html += '<p class="o-calendar-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
      html += renderViewSwitcher(route, 'calendar');
      html += '<button type="button" id="cal-prev" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Prev</button>';
      html += '<span id="cal-title" style="min-width:140px;font-weight:600">' + monthTitleStr + '</span>';
      html += '<button type="button" id="cal-next" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Next</button>';
      html += '<button type="button" id="cal-today" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Today</button>';
      html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
      html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
      html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + calAddLabel + '</button></p>';
    }
    html += '<div class="o-calendar o-calendar-grid">';
    dayNames.forEach(function (dn) {
      html += '<div class="o-calendar-weekday">' + dn + '</div>';
    });
    const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
    for (var i = 0; i < totalCells; i++) {
      const dayNum = i - startPad + 1;
      const isEmpty = dayNum < 1 || dayNum > daysInMonth;
      const dateStr = isEmpty ? '' : calYear + '-' + String(calMonth).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
      const dayRecs = dateStr ? (recordsByDate[dateStr] || []) : [];
      let cellContent = isEmpty ? '' : '<span class="o-calendar-daynum">' + dayNum + '</span>';
      dayRecs.forEach(function (rec) {
        const label = (rec[stringField] || 'Untitled').replace(/</g, '&lt;').slice(0, 30);
        cellContent += '<div class="o-calendar-event-wrap"><a href="#' + route + '/edit/' + (rec.id || '') + '" class="o-calendar-event-link">' + label + '</a></div>';
      });
      html += '<div class="o-calendar-cell' + (isEmpty ? ' o-calendar-cell--empty' : '') + '">' + cellContent + '</div>';
    }
    html += '</div>';
    main.innerHTML = html;
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    const btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { window.location.hash = route + '/new'; };
    const doReload = function () {
      const si = document.getElementById('list-search');
      loadRecords(model, route, si ? si.value.trim() : '', null, 'calendar', null, 0, null);
    };
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    const todayBtn = document.getElementById('cal-today');
    if (prevBtn) prevBtn.onclick = function () {
      calMonth--; if (calMonth < 1) { calMonth = 12; calYear--; }
      currentListState.calendarYear = calYear; currentListState.calendarMonth = calMonth;
      doReload();
    };
    if (nextBtn) nextBtn.onclick = function () {
      calMonth++; if (calMonth > 12) { calMonth = 1; calYear++; }
      currentListState.calendarYear = calYear; currentListState.calendarMonth = calMonth;
      doReload();
    };
    if (todayBtn) todayBtn.onclick = function () {
      const now = new Date();
      currentListState.calendarYear = now.getFullYear();
      currentListState.calendarMonth = now.getMonth() + 1;
      doReload();
    };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () { loadRecords(model, route, searchInput.value.trim(), null, 'calendar', null, 0, null); };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
  }

  function renderKanban(model, route, records, searchTerm) {
    const title = getTitle(route);
    actionStack = [{ label: title, hash: route }];
    const addLabel = route === 'leads' ? 'Add lead' : route === 'tickets' ? 'Add ticket' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add';
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const currentView = (currentListState.route === route && currentListState.viewType) || 'kanban';
    const kanbanView = viewsSvc && viewsSvc.getView(model, 'kanban');
    const vs = renderViewSwitcher(route, currentView);
    const mid =
      model === 'crm.lead' || model === 'helpdesk.ticket'
        ? '<select id="list-stage-filter" class="o-list-toolbar-select"><option value="">All stages</option></select>'
        : '';
    const KS = window.AppCore && window.AppCore.KanbanControlStrip;
    let html =
      KS && typeof KS.buildKanbanChromeHtml === 'function'
        ? KS.buildKanbanChromeHtml({
            title: title,
            viewSwitcherHtml: vs,
            searchTerm: searchTerm || '',
            addLabel: addLabel,
            middleSlotHtml: mid,
          })
        : '<h2>' +
          title +
          '</h2><p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">' +
          vs +
          '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' +
          (searchTerm || '').replace(/"/g, '&quot;') +
          '"><button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>' +
          mid +
          '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' +
          addLabel +
          '</button></p><div id="kanban-area"></div>';
    main.innerHTML = html;
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: currentView };
    main.querySelectorAll('.btn-view').forEach(btn => {
      btn.onclick = () => { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    const btn = document.getElementById('btn-add');
    if (btn) btn.onclick = () => { window.location.hash = route + '/new'; };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = () => {
        const filterEl = document.getElementById('list-stage-filter');
        const val = filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), val);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    if (model === 'crm.lead' || model === 'helpdesk.ticket') {
      const filterEl = document.getElementById('list-stage-filter');
      const stageModel = model === 'helpdesk.ticket' ? 'helpdesk.stage' : 'crm.stage';
      if (filterEl) {
        rpc.callKw(stageModel, 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
          .then(function (stages) {
            stages.forEach(function (s) {
              const opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name || '';
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function () {
              const val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              loadRecords(model, route, searchInput.value.trim(), val);
            };
          });
      }
    }
    const groupBy = (kanbanView && kanbanView.default_group_by) || 'stage_id';
    const stageIds = [];
    (records || []).forEach(function (r) {
      const val = r[groupBy];
      const id = (val && (Array.isArray(val) ? val[0] : val)) || (val === 0 ? 0 : null);
      if (id != null) stageIds.push(id);
    });
    const uniq = stageIds.filter(function (x, i, a) { return a.indexOf(x) === i; });
    const comodelMap = { 'crm.lead': 'crm.stage', 'project.task': 'project.task.type', 'helpdesk.ticket': 'helpdesk.stage' };
    const comodel = comodelMap[model] || (groupBy === 'stage_id' ? 'crm.stage' : null);
    const nameMap = {};
    function renderKanbanWithOptions(opts) {
      window.ViewRenderers.kanban(document.getElementById('kanban-area'), model, records, opts);
    }
    const baseOpts = {
      default_group_by: groupBy,
      fields: (kanbanView && kanbanView.fields) || ['name', 'expected_revenue', 'date_deadline'],
      stageNames: nameMap,
      onCardClick: function (id) { window.location.hash = route + '/edit/' + id; },
      onStageChange: function (recordId, newStageId) {
        const stageVal = newStageId || false;
        const writeVal = {};
        writeVal[groupBy] = stageVal;
        rpc.callKw(model, 'write', [[parseInt(recordId, 10)], writeVal])
          .then(function () { return loadRecords(model, route, currentListState.searchTerm); })
          .catch(function (err) { showToast(err.message || 'Failed to update', 'error'); });
      },
      onQuickCreate: function (stageId, name, done) {
        const vals = { name: name };
        vals[groupBy] = stageId || false;
        rpc.callKw(model, 'create', [[vals]], {})
          .then(function () {
            showToast('Created', 'success');
            if (typeof done === 'function') done();
            return loadRecords(model, route, currentListState.searchTerm);
          })
          .catch(function (err) { showToast(err.message || 'Failed to create', 'error'); });
      }
    };
    if (comodel && uniq.length) {
      rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
        .then(function (stages) {
          stages.forEach(function (s) { nameMap[s.id] = s.name; });
          baseOpts.stageNames = nameMap;
          renderKanbanWithOptions(baseOpts);
        })
        .catch(function () { renderKanbanWithOptions(baseOpts); });
    } else if (uniq.length || groupBy) {
      uniq.forEach(function (id) { if (id && !nameMap[id]) nameMap[id] = 'Stage ' + id; });
      baseOpts.stageNames = nameMap;
      renderKanbanWithOptions(baseOpts);
    } else {
      renderKanbanWithOptions({
        default_group_by: groupBy,
        stageNames: {},
        onCardClick: baseOpts.onCardClick,
        onQuickCreate: baseOpts.onQuickCreate,
      });
    }
  }

  function isFormRoute(hash) {
    const dataRoutes = DATA_ROUTES_SLUGS.replace(/\//g, '\\/');
    if (new RegExp('^(' + dataRoutes + ')\\/edit\\/\\d+$').test(hash) || new RegExp('^(' + dataRoutes + ')\\/new$').test(hash)) return true;
    var m = hash.match(/^([a-z0-9_/-]+)\/edit\/\d+$/i) || hash.match(/^([a-z0-9_/-]+)\/new$/i);
    return !!(m && getModelForRoute(m[1]));
  }

  function renderAccountingReport(reportType, title) {
    if (GraphViewCore && typeof GraphViewCore.renderAccountingReport === "function") {
      var graphHandled = GraphViewCore.renderAccountingReport(main, { reportType: reportType, title: title, rpc: rpc });
      if (graphHandled) return;
    }
    actionStack = [{ label: title, hash: 'reports/' + reportType }];
    const today = new Date().toISOString().slice(0, 10);
    const yearStart = today.slice(0, 4) + '-01-01';
    main.innerHTML = '<h2>' + title + '</h2><p style="margin-bottom:1rem">' +
      '<label>From <input type="date" id="report-date-from" value="' + yearStart + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
      '<label>To <input type="date" id="report-date-to" value="' + today + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
      '<button type="button" id="report-refresh" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer;margin-left:0.5rem">Refresh</button>' +
      '<button type="button" id="report-print" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;margin-left:0.25rem">Print</button>' +
      '</p><div id="report-table" style="overflow-x:auto">' + skeletonHtml(8, true) + '</div>';
    function loadReport() {
      const df = document.getElementById('report-date-from').value || yearStart;
      const dt = document.getElementById('report-date-to').value || today;
      const method = reportType === 'trial-balance' ? 'get_trial_balance' : (reportType === 'profit-loss' ? 'get_profit_loss' : 'get_balance_sheet');
      const args = reportType === 'balance-sheet' ? [dt] : [df, dt];
      rpc.callKw('account.account', method, args, {})
        .then(function (rows) {
          const el = document.getElementById('report-table');
          if (!el) return;
          if (!rows || !rows.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
          const cols = Object.keys(rows[0]);
          let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
          cols.forEach(function (c) { tbl += '<th style="padding:0.5rem;border:1px solid var(--border-color);text-align:left">' + String(c).replace(/</g, '&lt;') + '</th>'; });
          tbl += '</tr></thead><tbody>';
          rows.forEach(function (r) {
            tbl += '<tr>';
            cols.forEach(function (c) {
              const v = r[c];
              const val = (typeof v === 'number' && (c === 'debit' || c === 'credit' || c === 'balance')) ? v.toFixed(2) : (v || '');
              tbl += '<td style="padding:0.5rem;border:1px solid var(--border-color)">' + String(val).replace(/</g, '&lt;') + '</td>';
            });
            tbl += '</tr>';
          });
          tbl += '</tbody></table>';
          el.innerHTML = tbl;
        })
        .catch(function (err) {
          const el = document.getElementById('report-table');
          if (el) el.innerHTML = '<p style="color:#c00">' + (err.message || 'Failed to load').replace(/</g, '&lt;') + '</p>';
        });
    }
    document.getElementById('report-refresh').onclick = loadReport;
    document.getElementById('report-print').onclick = function () { window.print(); };
    loadReport();
  }

  function renderStockValuationReport() {
    if (GraphViewCore && typeof GraphViewCore.renderStockValuationReport === "function") {
      var stockHandled = GraphViewCore.renderStockValuationReport(main, { rpc: rpc });
      if (stockHandled) return;
    }
    actionStack = [{ label: 'Stock Valuation', hash: 'reports/stock-valuation' }];
    main.innerHTML = '<h2>Stock Valuation</h2><p style="margin-bottom:1rem">' +
      '<button type="button" id="report-refresh" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Refresh</button>' +
      '<button type="button" id="report-print" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;margin-left:0.25rem">Print</button>' +
      '</p><div id="report-table" style="overflow-x:auto">' + skeletonHtml(8, true) + '</div>';
    function loadReport() {
      rpc.callKw('product.product', 'get_stock_valuation_report', [], {})
        .then(function (rows) {
          const el = document.getElementById('report-table');
          if (!el) return;
          if (!rows || !rows.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
          const cols = ['product', 'category', 'qty_available', 'standard_price', 'total_value'];
          let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
          cols.forEach(function (c) { tbl += '<th style="padding:0.5rem;border:1px solid var(--border-color);text-align:left">' + String(c).replace(/_/g, ' ').replace(/</g, '&lt;') + '</th>'; });
          tbl += '</tr></thead><tbody>';
          rows.forEach(function (r) {
            tbl += '<tr>';
            cols.forEach(function (c) {
              const v = r[c];
              const val = (typeof v === 'number' && (c === 'standard_price' || c === 'total_value')) ? v.toFixed(2) : (v || '');
              tbl += '<td style="padding:0.5rem;border:1px solid var(--border-color)">' + String(val).replace(/</g, '&lt;') + '</td>';
            });
            tbl += '</tr>';
          });
          tbl += '</tbody></table>';
          el.innerHTML = tbl;
        })
        .catch(function (err) {
          const el = document.getElementById('report-table');
          if (el) el.innerHTML = '<p style="color:#c00">' + (err.message || 'Failed to load').replace(/</g, '&lt;') + '</p>';
        });
    }
    document.getElementById('report-refresh').onclick = loadReport;
    document.getElementById('report-print').onclick = function () { window.print(); };
    loadReport();
  }

  function renderSalesRevenueReport() {
    if (GraphViewCore && typeof GraphViewCore.renderSalesRevenueReport === "function") {
      var salesHandled = GraphViewCore.renderSalesRevenueReport(main, { rpc: rpc });
      if (salesHandled) return;
    }
    actionStack = [{ label: 'Sales Revenue', hash: 'reports/sales-revenue' }];
    const today = new Date().toISOString().slice(0, 10);
    const yearStart = today.slice(0, 4) + '-01-01';
    main.innerHTML = '<h2>Sales Revenue</h2><p style="margin-bottom:1rem">' +
      '<label>From <input type="date" id="report-date-from" value="' + yearStart + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
      '<label>To <input type="date" id="report-date-to" value="' + today + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
      '<label>Group by <select id="report-group-by" style="padding:0.35rem;margin:0 0.5rem"><option value="month">Month</option><option value="week">Week</option><option value="day">Day</option><option value="product">Product</option></select></label>' +
      '<button type="button" id="report-refresh" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer;margin-left:0.5rem">Refresh</button>' +
      '<button type="button" id="report-print" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;margin-left:0.25rem">Print</button>' +
      '</p><div id="report-table" style="overflow-x:auto">' + skeletonHtml(8, true) + '</div>';
    function loadReport() {
      const df = document.getElementById('report-date-from').value || yearStart;
      const dt = document.getElementById('report-date-to').value || today;
      const groupBy = (document.getElementById('report-group-by') && document.getElementById('report-group-by').value) || 'month';
      rpc.callKw('sale.order', 'get_sales_revenue_report', [df, dt], { group_by: groupBy })
        .then(function (rows) {
          const el = document.getElementById('report-table');
          if (!el) return;
          if (!rows || !rows.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
          const cols = Object.keys(rows[0]);
          let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
          cols.forEach(function (c) { tbl += '<th style="padding:0.5rem;border:1px solid var(--border-color);text-align:left">' + String(c).replace(/_/g, ' ').replace(/</g, '&lt;') + '</th>'; });
          tbl += '</tr></thead><tbody>';
          rows.forEach(function (r) {
            tbl += '<tr>';
            cols.forEach(function (c) {
              const v = r[c];
              const val = (typeof v === 'number' && c === 'revenue') ? v.toFixed(2) : (v || '');
              tbl += '<td style="padding:0.5rem;border:1px solid var(--border-color)">' + String(val).replace(/</g, '&lt;') + '</td>';
            });
            tbl += '</tr>';
          });
          tbl += '</tbody></table>';
          el.innerHTML = tbl;
        })
        .catch(function (err) {
          const el = document.getElementById('report-table');
          if (el) el.innerHTML = '<p style="color:#c00">' + (err.message || 'Failed to load').replace(/</g, '&lt;') + '</p>';
        });
    }
    document.getElementById('report-refresh').onclick = loadReport;
    document.getElementById('report-print').onclick = function () { window.print(); };
    loadReport();
  }

  /** Phase 632–633: website/eCommerce app roots; phase 633 strict routing for unknown slugs */
  function renderAppShellPlaceholder(route, title, subtitle) {
    actionStack = [{ label: title, hash: route }];
    var hint = subtitle || 'This surface is not fully wired to the list client yet.';
    if (window.UIComponents && window.UIComponents.EmptyState && typeof window.UIComponents.EmptyState.renderHTML === 'function') {
      main.innerHTML = window.UIComponents.EmptyState.renderHTML({
        icon: '\u25C7',
        title: title,
        subtitle: hint,
        actionLabel: 'Go to Home',
      });
      window.UIComponents.EmptyState.wire(main, {
        actionFn: function () {
          window.location.hash = '#home';
        },
      });
    } else {
      main.innerHTML =
        '<section class="o-empty-state" role="status">' +
        '<h3 class="o-empty-state-title">' +
        String(title).replace(/</g, '&lt;') +
        '</h3><p class="o-empty-state-subtitle">' +
        String(hint).replace(/</g, '&lt;') +
        '</p>' +
        '<button type="button" class="o-btn o-btn-primary" id="o-placeholder-home">Go to Home</button></section>';
      var bh = document.getElementById('o-placeholder-home');
      if (bh) {
        bh.onclick = function () {
          window.location.hash = '#home';
        };
      }
    }
  }

  function renderUnknownRoutePlaceholder(route) {
    var sub =
      'No model mapping for #' +
      String(route || '').replace(/</g, '&lt;') +
      '. Set window.__ERP_DEBUG_SIDEBAR_MENU = true and reload to log unresolved menus.';
    renderAppShellPlaceholder(route, 'Route not available', sub);
  }

  function routeApplyInternal(hash, base) {
    if (main) {
      main.classList.remove("o-view-enter");
      main.classList.add("o-view-exit");
      window.requestAnimationFrame(function () {
        main.classList.remove("o-view-exit");
        main.classList.add("o-view-enter");
      });
    }
    var decoded = window.ActionManager && typeof window.ActionManager.decodeStackFromHash === 'function' ? window.ActionManager.decodeStackFromHash(hash) : null;
    if (decoded && decoded.length) actionStack = decoded;
    const dataRoutes = DATA_ROUTES_SLUGS;
    const editMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/edit\\/(\\d+)$'));
    const newMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/new$'));
    const listMatch = base.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')$'));
    const settingsApiKeysMatch = hash.match(/^settings\/apikeys$/);
    const settingsTotpMatch = hash.match(/^settings\/totp$/);
    const settingsDashboardMatch = hash.match(/^settings\/dashboard-widgets$/);
    const settingsIndexMatch = hash.match(/^settings\/?$/);
    const discussMatch = hash.match(/^discuss$/);
    const discussChannelMatch = hash.match(/^discuss\/(\d+)$/);
    const reportsTrialMatch = hash.match(/^reports\/trial-balance$/);
    const reportsPLMatch = hash.match(/^reports\/profit-loss$/);
    const reportsBSMatch = hash.match(/^reports\/balance-sheet$/);
    const reportsStockValMatch = hash.match(/^reports\/stock-valuation$/);
    const reportsSalesRevMatch = hash.match(/^reports\/sales-revenue$/);
    const genericEditMatch = hash.match(/^([a-z0-9_/-]+)\/edit\/(\d+)$/i);
    const genericNewMatch = hash.match(/^([a-z0-9_/-]+)\/new$/i);
    const genericListMatch = base.match(/^([a-z0-9_/-]+)$/i);

    if (reportsTrialMatch) {
      renderAccountingReport('trial-balance', 'Trial Balance');
    } else if (reportsPLMatch) {
      renderAccountingReport('profit-loss', 'Profit & Loss');
    } else if (reportsBSMatch) {
      renderAccountingReport('balance-sheet', 'Balance Sheet');
    } else if (reportsStockValMatch) {
      renderStockValuationReport();
    } else if (reportsSalesRevMatch) {
      renderSalesRevenueReport();
    } else if (discussMatch || discussChannelMatch) {
      renderDiscuss(discussChannelMatch ? discussChannelMatch[1] : null);
    } else if (base === 'website') {
      renderAppShellPlaceholder(
        'website',
        'Website',
        'Website pages and editor are scaffolded in modules; use Settings and other apps until the web client route is completed.'
      );
    } else if (base === 'ecommerce') {
      renderAppShellPlaceholder(
        'ecommerce',
        'eCommerce',
        'Shop flows are partially scaffolded. Use Products, Sale Orders, or Invoicing for catalogue and orders.'
      );
    } else if (settingsApiKeysMatch) {
      renderApiKeysSettings();
    } else if (settingsTotpMatch) {
      renderTotpSettings();
    } else if (settingsDashboardMatch) {
      renderDashboardWidgets();
    } else if (settingsIndexMatch) {
      renderSettings();
    } else if (listMatch) {
      const route = listMatch[1];
      const model = getModelForRoute(route);
      if (model) loadRecords(model, route, currentListState.route === route ? currentListState.searchTerm : '', undefined, undefined, undefined, undefined, undefined, getHashDomainParam());
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (newMatch) {
      const route = newMatch[1];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route);
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (editMatch) {
      const route = editMatch[1], id = editMatch[2];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route, id);
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (genericListMatch) {
      const route = genericListMatch[1];
      const model = getModelForRoute(route);
      if (model) loadRecords(model, route, currentListState.route === route ? currentListState.searchTerm : '', undefined, undefined, undefined, undefined, undefined, getHashDomainParam());
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (genericNewMatch) {
      const route = genericNewMatch[1];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route);
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (genericEditMatch) {
      const route = genericEditMatch[1], id = genericEditMatch[2];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route, id);
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else {
      renderHome();
    }
  }

  function routeInternal() {
    const hash = (window.location.hash || '#home').slice(1);
    const base = hash.split('?')[0];
    renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang);
    if (formDirty && isFormRoute(lastHash) && hash !== lastHash) {
      confirmModal({ title: 'Unsaved changes', message: 'Leave without saving?', confirmLabel: 'Leave', cancelLabel: 'Stay' }).then(function (ok) {
        if (!ok) {
          window.location.hash = lastHash;
          return;
        }
        formDirty = false;
        lastHash = hash;
        routeApply(hash, base);
      });
      return;
    }
    lastHash = hash;
    routeApplyInternal(hash, base);
  }

  function routeApply(hash, base) {
    if (RouterCore && typeof RouterCore.routeApply === "function") {
      return RouterCore.routeApply(hash, base);
    }
    return routeApplyInternal(hash, base);
  }

  function route() {
    if (RouterCore && typeof RouterCore.route === "function") {
      return RouterCore.route();
    }
    return routeInternal();
  }

  if (RouterCore && typeof RouterCore.setHandlers === "function") {
    RouterCore.setHandlers({
      renderNavbar: function () {
        renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang);
      },
      applyRoute: routeApplyInternal,
      isFormRoute: isFormRoute,
      confirmLeave: function () {
        return confirmModal({
          title: "Unsaved changes",
          message: "Leave without saving?",
          confirmLabel: "Leave",
          cancelLabel: "Stay",
        });
      },
    });
    if (typeof RouterCore.setState === "function") {
      RouterCore.setState({ dirty: formDirty, lastHash: lastHash });
    }
  }

  window.addEventListener('hashchange', route);

  /* Alt+ shortcuts: see core/webclient_shortcut_contract.js → __ERP_WEBCLIENT_SHORTCUT_CONTRACT */
  document.addEventListener('keydown', function (e) {
    if (e.key === "Escape") {
      var closeBtn = document.querySelector(".o-report-preview-close, .o-attachment-close");
      if (closeBtn) {
        e.preventDefault();
        closeBtn.click();
        return;
      }
    }
    if (!e.altKey) return;
    const hash = (window.location.hash || '#home').slice(1);
    const base = hash.split('?')[0];
    const dataRoutes = DATA_ROUTES_SLUGS;
    const listMatch = base.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')$'));
    const formMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/(edit\\/\\d+|new)$'));
    if (e.key === 'n' && listMatch) {
      e.preventDefault();
      window.location.hash = listMatch[1] + '/new';
    } else if (e.key === 's' || e.key === 'S') {
      if (formMatch) {
        const btn = document.getElementById('btn-save');
        if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
      }
    } else if (e.key === 'e' || e.key === 'E') {
      const editBtn = document.querySelector('.btn-edit, #btn-edit');
      if (editBtn) {
        e.preventDefault();
        editBtn.click();
      }
    } else if (e.key === 'l' || e.key === 'L') {
      if (formMatch) {
        e.preventDefault();
        window.location.hash = formMatch[1];
      }
    } else if (e.key === 'k' || e.key === 'K') {
      if (listMatch) {
        e.preventDefault();
        currentListState.viewType = "kanban";
        const model = getModelForRoute(listMatch[1]);
        if (model) loadRecords(model, listMatch[1], currentListState.searchTerm || "");
      }
    } else if (e.key === 'p' || e.key === 'P') {
      const previewBtn = document.getElementById("btn-preview-pdf") || document.getElementById("btn-print-form");
      if (previewBtn) {
        e.preventDefault();
        previewBtn.click();
      }
    }
  });

  window.addEventListener('bus:message', function (e) {
    const d = e.detail || {};
    const msg = d.message || {};
    if (msg.type === 'stage_change') {
      showToast('Lead stage updated', 'info');
      if (lastHash && lastHash.indexOf('leads') >= 0) {
        const model = getModelForRoute('leads');
        if (model) loadRecords(model, 'leads', currentListState.searchTerm);
      }
    }
    if (msg.type === 'message') {
      const formModel = document.querySelector('[data-model]');
      if (formModel && msg.res_model === formModel.getAttribute('data-model')) {
        const formId = document.querySelector('[data-record-id]');
        if (formId && parseInt(formId.getAttribute('data-record-id'), 10) === msg.res_id) {
          const chatterDiv = document.querySelector('#chatter-messages');
          if (chatterDiv) {
            rpc.callKw(msg.res_model, 'read', [[msg.res_id], ['message_ids']]).then(function (recs) {
              if (recs && recs[0] && recs[0].message_ids) loadChatter(msg.res_model, String(msg.res_id), recs[0].message_ids);
            });
          }
        }
      }
    }
  });

  window.__erpForm = {
    renderFieldHtml: renderFieldHtml,
    renderFormTreeToHtml: renderFormTreeToHtml,
  };
  if (window.AppCore) {
    if (AppCore.FormView && typeof AppCore.FormView.setImpl === "function") {
      AppCore.FormView.setImpl({
        renderFieldHtml: renderFieldHtml,
        renderFormTreeToHtml: renderFormTreeToHtml,
        render: function (_container, opts) {
          renderForm(opts.model, opts.route, opts.id, true);
          return true;
        },
      });
    }
    if (!modernShellOwner && AppCore.Navbar && typeof AppCore.Navbar.setImpl === "function") {
      AppCore.Navbar.setImpl(function (opts) {
        // Keep runtime behavior in main.js while exposing extraction boundary.
        return false;
      });
    }
    if (AppCore.Sidebar && typeof AppCore.Sidebar.setImpl === "function") {
      AppCore.Sidebar.setImpl({
        render: function (opts) {
          return opts && opts.buildSidebarNavHtml
            ? opts.buildSidebarNavHtml(opts.tree || [], opts.staleBannerHtml || "")
            : "";
        },
        wire: function (opts) {
          if (opts && typeof opts.wireSidebarAfterRender === "function") {
            opts.wireSidebarAfterRender();
            return true;
          }
          return false;
        },
      });
    }
    if (AppCore.GraphView && typeof AppCore.GraphView.setImpl === "function") AppCore.GraphView.setImpl(renderGraph);
    if (AppCore.PivotView && typeof AppCore.PivotView.setImpl === "function") AppCore.PivotView.setImpl(renderPivot);
    if (AppCore.CalendarView && typeof AppCore.CalendarView.setImpl === "function") AppCore.CalendarView.setImpl(renderCalendar);
    if (AppCore.GanttView && typeof AppCore.GanttView.setImpl === "function") AppCore.GanttView.setImpl(renderGanttView);
    if (AppCore.ActivityView && typeof AppCore.ActivityView.setImpl === "function") AppCore.ActivityView.setImpl(renderActivityMatrix);
    if (AppCore.DiscussView && typeof AppCore.DiscussView.setImpl === "function") {
      AppCore.DiscussView.setImpl(function () {
        return false;
      });
    }
    if (AppCore.ListView && typeof AppCore.ListView.setImpl === "function") {
      AppCore.ListView.setImpl(function () {
        return false;
      });
    }
  }

  function bootLegacyWebClient() {
    if (window.__erpLegacyRuntime && window.__erpLegacyRuntime.booted) {
      return;
    }
    if (window.__erpLegacyRuntime) {
      window.__erpLegacyRuntime.booted = true;
    }
    // Apply theme immediately to avoid flash (localStorage or prefers-color-scheme)
    const savedTheme = typeof localStorage !== 'undefined' && localStorage.getItem('erp_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    const sessionP = (window.Services && window.Services.session) ? window.Services.session.getSessionInfo() : Promise.resolve(null);
    const viewsP = viewsSvc ? viewsSvc.load() : Promise.resolve();
    const timeoutMs = 15000;
    const timeoutP = new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('Load timeout')); }, timeoutMs);
    });
    Promise.race([Promise.all([sessionP, viewsP]), timeoutP]).then(function (results) {
      const sessionData = results[0];
      const userCompanies = sessionData && sessionData.user_companies ? sessionData.user_companies : null;
      const userLangs = sessionData && sessionData.user_langs ? sessionData.user_langs : [];
      const currentLang = sessionData && sessionData.lang ? sessionData.lang : 'en_US';
      navContext.userCompanies = userCompanies;
      navContext.userLangs = userLangs;
      navContext.currentLang = currentLang;
      if (modernShellOwner) {
        window.dispatchEvent(new CustomEvent("erp:navigation-context", {
          detail: {
            userCompanies: userCompanies,
            userLangs: userLangs,
            currentLang: currentLang,
          },
        }));
      }
      if (window.Services && window.Services.i18n) {
        window.Services.i18n.loadFromServer(currentLang).then(function () {
          renderNavbar(userCompanies, userLangs, currentLang);
          route();
        }).catch(function () {
          renderNavbar(userCompanies, userLangs, currentLang);
          route();
        });
      } else {
        renderNavbar(userCompanies, userLangs, currentLang);
        route();
      }
      if (window.Services && window.Services.bus && sessionData && sessionData.uid) {
        window.Services.bus.start(['res.partner_' + sessionData.uid]);
      }
    }).catch(function (err) {
      main.innerHTML = '<h2>Unable to load</h2><p style="color:var(--text-muted);margin:1rem 0">' +
        (err && err.message ? String(err.message).replace(/</g, '&lt;') : 'Network or server error') + '</p>' +
        '<p><a href="/web/login" style="color:var(--color-primary)">Go to login</a> &middot; <a href="javascript:location.reload()" style="color:var(--color-primary)">Retry</a></p>';
    });
  }

  window.__erpLegacyRuntime = window.__erpLegacyRuntime || {};
  window.__erpLegacyRuntime.start = bootLegacyWebClient;
  window.__erpLegacyRuntime.booted = false;
  window.__erpLegacyRuntime.renderSystrayMount = renderSystrayMount;
  if (frontendBootstrap.runtime !== 'modern') {
    bootLegacyWebClient();
  }
})();
