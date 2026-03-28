/**
 * AI Chat Panel - Tool execution or LLM via /ai/chat (Phase 88)
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
  const inputArea = document.querySelector('.chat-input-area');

  if (!panel || !toggleBtn || !sendBtn) return;

  let llmEnabled = false;
  let conversationId = null;
  const agentModeCheck = document.getElementById('chat-agent-mode');
  const agentRow = document.getElementById('chat-agent-row');

  function fetchAiConfig() {
    fetch('/ai/config', { credentials: 'include' })
      .then(function (r) {
        if (r.ok) return r.json();
        return { llm_enabled: '0' };
      })
      .then(function (cfg) {
        llmEnabled = (cfg && cfg.llm_enabled) === '1';
        if (inputArea) {
          const toolRow = inputArea.querySelector('.chat-tool-row');
          if (toolRow) toolRow.style.display = llmEnabled ? 'none' : '';
          if (queryInput) queryInput.placeholder = llmEnabled ? 'Ask anything... (e.g. Show me leads with high revenue)' : (toolSelect && toolSelect.value === 'search_records' ? 'Search term (optional)' : '');
        }
        if (agentRow) agentRow.style.display = llmEnabled ? 'block' : 'none';
        updatePlaceholder();
      })
      .catch(function () { llmEnabled = false; });
  }

  function updatePlaceholder() {
    if (!queryInput) return;
    if (llmEnabled) {
      queryInput.placeholder = 'Ask anything... (e.g. Show me leads with high revenue)';
      return;
    }
    const t = toolSelect ? toolSelect.value : 'search_records';
    if (t === 'summarise_recordset') queryInput.placeholder = 'Record IDs (comma-separated)';
    else if (t === 'draft_message') queryInput.placeholder = 'Record IDs (comma-separated)';
    else if (t === 'create_activity') queryInput.placeholder = 'lead_id,name,note (e.g. 1,Call back,Remind tomorrow)';
    else if (t === 'propose_workflow_step') queryInput.placeholder = 'Lead IDs (comma-separated)';
    else queryInput.placeholder = 'Search term (optional)';
  }

  if (toolSelect) toolSelect.addEventListener('change', updatePlaceholder);
  fetchAiConfig();

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

  function appendAgentResult(taskId, goal, status, result, steps) {
    const div = document.createElement('div');
    div.className = 'chat-msg assistant agent-result';
    let html = '<div class="agent-status">' + (status || '').replace(/</g, '&lt;') + '</div>';
    if (result) html += '<div class="agent-result-text">' + (result || '').replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</div>';
    if (steps && steps.length) {
      html += '<details class="agent-steps" style="margin-top:0.5rem"><summary>Steps (' + steps.length + ')</summary><ul style="margin:0.25rem 0;padding-left:1.25rem;font-size:0.9em">';
      steps.forEach(function (s) {
        const tool = (s.tool || '').replace(/</g, '&lt;');
        const res = (s.result || '').replace(/</g, '&lt;').substring(0, 200);
        html += '<li><strong>' + tool + '</strong>: ' + res + (res.length >= 200 ? '...' : '') + '</li>';
      });
      html += '</ul></details>';
    }
    div.innerHTML = html;
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

  function appendLoading() {
    const div = document.createElement('div');
    div.className = 'chat-msg assistant chat-loading';
    div.textContent = 'Thinking...';
    div.dataset.loading = '1';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function removeLoading(loadingEl) {
    if (loadingEl && loadingEl.parentNode) loadingEl.remove();
  }

  function send() {
    const prompt = (queryInput && queryInput.value || '').trim();
    const tool = (toolSelect && toolSelect.value || 'search_records').trim();
    const model = (modelSelect && modelSelect.value || 'res.partner');
    const kwargs = buildKwargs(tool, model, prompt);
    const agentMode = llmEnabled && agentModeCheck && agentModeCheck.checked;

    const userDisplay = prompt || (llmEnabled ? 'Ask' : tool + ' on ' + model);
    if (!userDisplay && !llmEnabled) return;
    if (llmEnabled && !prompt) return;

    appendMessage('user', agentMode ? '[Agent] ' + userDisplay : userDisplay);
    sendBtn.disabled = true;
    const loadingEl = appendLoading();

    var aiChatHdrs = { 'Content-Type': 'application/json' };
    if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) Object.assign(aiChatHdrs, window.Services.session.getAuthHeaders());

    if (agentMode) {
      fetch('/ai/agent/run', {
        method: 'POST',
        headers: aiChatHdrs,
        credentials: 'include',
        body: JSON.stringify({ goal: prompt, max_iter: 10 }),
      })
        .then(function (r) {
          if (r.status === 401) {
            removeLoading(loadingEl);
            appendMessage('assistant', 'Session expired. Please log in again.', true);
            return;
          }
          return r.json();
        })
        .then(function (data) {
          if (!data) return;
          if (data.error) {
            sendBtn.disabled = false;
            removeLoading(loadingEl);
            appendMessage('assistant', data.error, true);
            return;
          }
          var tid = data.task_id;
          if (data.status === 'done' || data.status === 'failed') {
            sendBtn.disabled = false;
            removeLoading(loadingEl);
            appendAgentResult(tid, data.goal, data.status, data.result, data.steps || []);
            return;
          }
          var poll = function () {
            fetch('/ai/agent/status?task_id=' + tid, { credentials: 'include' })
              .then(function (rr) { return rr.json(); })
              .then(function (st) {
                if (st.error) {
                  sendBtn.disabled = false;
                  removeLoading(loadingEl);
                  appendMessage('assistant', st.error, true);
                  return;
                }
                if (st.status === 'done' || st.status === 'failed') {
                  sendBtn.disabled = false;
                  removeLoading(loadingEl);
                  appendAgentResult(st.task_id, st.goal, st.status, st.result, st.steps || []);
                  return;
                }
                setTimeout(poll, 800);
              })
              .catch(function (err) {
                sendBtn.disabled = false;
                removeLoading(loadingEl);
                appendMessage('assistant', err.message || 'Poll failed', true);
              });
          };
          setTimeout(poll, 800);
        })
        .catch(function (err) {
          sendBtn.disabled = false;
          removeLoading(loadingEl);
          appendMessage('assistant', err.message || 'Request failed', true);
        });
      return;
    }

    const ctx = (typeof window !== 'undefined' && window.chatContext) || {};
    const body = llmEnabled
      ? { prompt: prompt, retrieve: true, conversation_id: conversationId, model_context: ctx.model || '', active_id: ctx.active_id != null ? ctx.active_id : null }
      : { prompt: prompt || tool, tool: tool, kwargs: kwargs };

    fetch('/ai/chat', {
      method: 'POST',
      headers: aiChatHdrs,
      credentials: 'include',
      body: JSON.stringify(body),
    })
      .then(function (r) {
        if (r.status === 401) {
          removeLoading(loadingEl);
          appendMessage('assistant', 'Session expired. Please log in again.', true);
          return;
        }
        return r.json();
      })
      .then(function (data) {
        sendBtn.disabled = false;
        removeLoading(loadingEl);
        if (!data) return;
        if (data.error) {
          appendMessage('assistant', data.error, true);
          return;
        }
        if (llmEnabled && data.conversation_id != null) {
          conversationId = data.conversation_id;
        }
        const result = data.result;
        const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        appendMessage('assistant', text);
      })
      .catch(function (err) {
        sendBtn.disabled = false;
        removeLoading(loadingEl);
        appendMessage('assistant', err.message || 'Request failed', true);
      });
  }

  toggleBtn.addEventListener('click', function () {
    if (panel.classList.contains('chat-panel-hidden')) showPanel();
    else hidePanel();
  });

  if (closeBtn) closeBtn.addEventListener('click', hidePanel);

  const newConvBtn = document.getElementById('chat-new-conv');
  if (newConvBtn) {
    newConvBtn.addEventListener('click', function () {
      conversationId = null;
      if (messagesEl) messagesEl.innerHTML = '';
      appendMessage('assistant', 'New conversation started.');
    });
  }

  sendBtn.addEventListener('click', send);

  updatePlaceholder();

  queryInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); send(); }
  });
})();
