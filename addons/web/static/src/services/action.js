/**
 * Action manager - treats actions as first-class (window, client, URL)
 */
(function () {
  const action = {
    doAction(actionDef, options) {
      const type = actionDef.type || 'ir.actions.act_window';
      if (type === 'ir.actions.act_window' || type === 'window') {
        return this._doWindowAction(actionDef, options);
      }
      if (type === 'ir.actions.act_url' || type === 'url') {
        return this._doUrlAction(actionDef, options);
      }
      if (type === 'ir.actions.act_client' || type === 'client') {
        return this._doClientAction(actionDef, options);
      }
      return Promise.reject(new Error('Unknown action type: ' + type));
    },
    _doWindowAction(actionDef) {
      return { type: 'window', resModel: actionDef.res_model || actionDef.resModel, viewMode: actionDef.view_mode || actionDef.viewMode || 'list', action: actionDef };
    },
    _doUrlAction(actionDef) {
      const url = actionDef.url || actionDef.target_url || '#';
      if (url.startsWith('http') || url.startsWith('//')) {
        window.open(url, actionDef.target || '_blank');
      } else {
        window.location.hash = url.startsWith('#') ? url : '#' + url;
      }
      return Promise.resolve();
    },
    _doClientAction(actionDef) {
      return { type: 'client', tag: actionDef.tag || actionDef.name, action: actionDef };
    }
  };
  window.Services = window.Services || {};
  window.Services.action = action;
})();
