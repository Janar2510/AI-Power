/**
 * Legacy web.assets_web: route slug regex source + action/menu → hash maps.
 * Loaded before main.js; sets window.__ERP_ROUTE_LEGACY (Phase 802 split).
 */
(function () {
  var R = (window.__ERP_ROUTE_LEGACY = window.__ERP_ROUTE_LEGACY || {});

  R.DATA_ROUTES_SLUGS =
    'contacts|pipeline|crm/activities|leads|tickets|orders|products|pricelists|tasks|articles|knowledge_categories|attachments|settings/users|settings/approval_rules|settings/approval_requests|leaves|leave_types|allocations|cron|server_actions|sequences|audit_log|marketing/mailing_lists|marketing/mailings|manufacturing|boms|workcenters|transfers|warehouses|lots|reordering_rules|purchase_orders|invoices|bank_statements|journals|accounts|taxes|payment_terms|employees|departments|jobs|projects|fleet|attendances|recruitment|time_off|expenses|repair_orders|surveys|lunch_orders|livechat_channels|project_todos|recycle_models|skills|elearning|analytic_accounts|analytic_plans|subscriptions|meetings|timesheets|applicants|contracts|account_reconcile_wizard|recruitment_stages|crm_stages|crm_tags|crm_lost_reasons|pos_orders|pos_sessions|website|ecommerce';

  R._warnSidebarMenuDisabled = function (menu, actionRef, hasResolvedAction, route) {
    if (!route && window.__ERP_DEBUG_SIDEBAR_MENU) {
      try {
        console.warn('[sidebar] menu without route', {
          id: menu && menu.id,
          name: menu && menu.name,
          action: actionRef || '',
          resolvedAction: !!hasResolvedAction,
        });
      } catch (e) {
        /* noop */
      }
    }
  };

  R.actionToRoute = function (action) {
    if (!action) return null;
    if (action.type === 'ir.actions.act_url') {
      var rawUrl = String(action.url || '').trim();
      if (!rawUrl) return null;
      var hashIdx = rawUrl.indexOf('#');
      if (hashIdx >= 0) {
        var frag = rawUrl.slice(hashIdx + 1).split('?')[0].trim();
        return frag || null;
      }
      if (/^[a-z0-9_\-/]+$/i.test(rawUrl)) return rawUrl;
      return null;
    }
    var actType = action.type || '';
    var hasModel = !!(action.res_model || action.resModel);
    if (actType !== 'ir.actions.act_window' && actType !== 'window') {
      if (!hasModel || actType === 'ir.actions.act_client' || actType === 'ir.actions.report') {
        return null;
      }
    }
    var m = String(action.res_model || action.resModel || '').replace(/\./g, '_');
    if (!m) return null;
    if (m === 'res_partner') return 'contacts';
    if (m === 'crm_lead') {
      var name = (action.name || '').toLowerCase();
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
    if (m === 'pos_order') return 'pos_orders';
    if (m === 'pos_session') return 'pos_sessions';
    return m || null;
  };

  R.menuToRoute = function (m) {
    if (!m) return null;
    var name = (m.name || '').toLowerCase();
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
    if (name === 'point of sale' || name === 'point-of-sale' || name === 'pos') return 'pos_orders';
    if (name === 'pos sessions') return 'pos_sessions';
    if (name === 'stages') return 'crm_stages';
    if (name === 'tags') return 'crm_tags';
    if (name === 'lost reasons') return 'crm_lost_reasons';
    var slug = (m.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (slug && slug.length >= 2 && /^[a-z][a-z0-9_]*$/.test(slug)) {
      var sectionOnly = { configuration: 1, reporting: 1, operations: 1, sales: 1, technical: 1 };
      if (!sectionOnly[slug]) return slug;
    }
    return null;
  };
})();
