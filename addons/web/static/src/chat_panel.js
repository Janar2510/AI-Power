/**
 * AI Chat Panel - Single-turn tool execution via /ai/chat
 */
(function () {
  const panel = document.getElementById('chat-panel');
  const toggleBtn = document.getElementById('chat-toggle');
  const closeBtn = document.getElementById('chat-panel-close');
  const messagesEl = document.getElementById('chat-messages');
  const toolSelect = document.getElementById('chat-tool');
  const modelSelect = document.getElementById('chat-model');
  const queryInput = document.getElementById('chat-query');
  const sendBtn = document.getElementById('chat-send');

  if (!panel || !toggleBtn || !sendBtn) return;

  function updatePlaceholder() {
    const t = toolSelect.value || 'search_records';
    if (t === 'summarise_recordset') queryInput.placeholder = 'Record IDs (comma-separated)';
    else if (t === 'draft_message') queryInput.placeholder = 'Record IDs (comma-separated)';
    else if (t === 'create_activity') queryInput.placeholder = 'lead_id,name,note (e.g. 1,Call back,Remind tomorrow)';
    else if (t === 'propose_workflow_step') queryInput.placeholder = 'Lead IDs (comma-separated)';
    else queryInput.placeholder = 'Search term (optional)';
  }

  if (toolSelect) toolSelect.addEventListener('change', updatePlaceholder);

  function showPanel() {
    panel.classList.remove('chat-panel-hidden');
  }

  function hidePanel() {
    panel.classList.add('chat-panel-hidden');
  }

  function appendMessage(role, text, isError) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role + (isError ? ' error' : '');
    div.textContent = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function buildKwargs(toolName, model, query) {
    const modelVal = (model || modelSelect.value || 'res.partner').trim();
    const q = (query || queryInput.value || '').trim();
    const parseIds = function (s) {
      return (s || '').split(/[,\s]+/).map(function (x) { return parseInt(x, 10); }).filter(function (n) { return !isNaN(n); });
    };

    if (toolName === 'search_records') {
      const domain = q ? [['name', 'ilike', q]] : [];
      return { model: modelVal, domain: domain, limit: 10 };
    }
    if (toolName === 'summarise_recordset') {
      return { model: modelVal, ids: parseIds(q) };
    }
    if (toolName === 'draft_message') {
      return { model: modelVal, ids: parseIds(q) };
    }
    if (toolName === 'create_activity') {
      const parts = q.split(',').map(function (s) { return s.trim(); });
      return { lead_id: parseInt(parts[0], 10) || 0, name: parts[1] || 'Activity', note: parts[2] || null };
    }
    if (toolName === 'propose_workflow_step') {
      return { model: 'crm.lead', ids: parseIds(q) };
    }
    return { model: modelVal };
  }

  function send() {
    const tool = (toolSelect.value || 'search_records').trim();
    const model = modelSelect.value || 'res.partner';
    const prompt = queryInput.value.trim() || ('Search ' + model);
    const kwargs = buildKwargs(tool, model, prompt);

    appendMessage('user', prompt || tool + ' on ' + model);
    sendBtn.disabled = true;

    fetch('/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ prompt: prompt || tool, tool: tool, kwargs: kwargs }),
    })
      .then(function (r) {
        if (r.status === 401) {
          appendMessage('assistant', 'Session expired. Please log in again.', true);
          return;
        }
        return r.json();
      })
      .then(function (data) {
        sendBtn.disabled = false;
        if (!data) return;
        if (data.error) {
          appendMessage('assistant', data.error, true);
          return;
        }
        const result = data.result;
        const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        appendMessage('assistant', text);
      })
      .catch(function (err) {
        sendBtn.disabled = false;
        appendMessage('assistant', err.message || 'Request failed', true);
      });
  }

  toggleBtn.addEventListener('click', function () {
    if (panel.classList.contains('chat-panel-hidden')) showPanel();
    else hidePanel();
  });

  if (closeBtn) closeBtn.addEventListener('click', hidePanel);

  sendBtn.addEventListener('click', send);

  updatePlaceholder();

  queryInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); send(); }
  });
})();
