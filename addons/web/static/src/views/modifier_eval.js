/**
 * Python-like modifier evaluator - small expr evaluator for view modifiers
 * Odoo parity: modifiers written in Python, evaluated in browser
 * MVP: minimal safe subset (attrs, invisible, readonly)
 */
(function () {
  const MODIFIER_SAFE = /^[\w\s\.\,\=\>\<\&\|\!\'\"\[\]\(\)\-\+\*\/\%\?\:]+$/;

  function evalModifier(expr, context) {
    if (!expr || typeof expr !== 'string') return true;
    expr = expr.trim();
    if (!expr) return true;
    if (!MODIFIER_SAFE.test(expr)) return false;
    try {
      const fn = new Function('ctx', 'with(ctx){return !!(' + expr + ');}');
      return !!fn(context || {});
    } catch (e) {
      return false;
    }
  }

  window.ModifierEval = {
    eval: evalModifier,
    evalAttr(expr, context) {
      if (!expr || typeof expr !== 'string') return {};
      expr = expr.trim();
      if (!expr || !MODIFIER_SAFE.test(expr)) return {};
      try {
        const fn = new Function('ctx', 'with(ctx){return ' + expr + ';}');
        const v = fn(context || {});
        return typeof v === 'object' && v !== null ? v : {};
      } catch (e) {
        return {};
      }
    }
  };
})();
