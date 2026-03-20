(function () {
  window.AppCore = window.AppCore || {};
  const UI = window.UIComponents || {};
  const SettingsField = UI.SettingsField;
  const SettingsTable = UI.SettingsTable;
  const SettingsSection = UI.SettingsSection;
  const Button = UI.Button;

  function toast(opts, message, type) {
    if (opts && typeof opts.showToast === "function") {
      opts.showToast(message, type);
    }
  }

  function navLink(href, text) {
    const a = document.createElement("a");
    a.href = href;
    a.className = "o-btn o-btn-secondary o-settings-nav-link";
    a.textContent = text;
    return a;
  }

  function mountSubpage(container, breadcrumbsHtml) {
    container.textContent = "";
    if (breadcrumbsHtml) {
      const bcWrap = document.createElement("div");
      bcWrap.className = "o-settings-breadcrumbs";
      bcWrap.innerHTML = breadcrumbsHtml;
      while (bcWrap.firstChild) {
        container.appendChild(bcWrap.firstChild);
      }
    }
    const page = document.createElement("div");
    page.className = "o-settings-subpage";
    container.appendChild(page);
    return page;
  }

  function renderIndex(container, options) {
    const opts = options || {};
    const rpc = opts.rpc;
    if (!rpc || typeof rpc.callKw !== "function") {
      container.innerHTML = "";
      const p = document.createElement("p");
      p.className = "o-settings-fallback";
      p.textContent = "RPC not available.";
      container.appendChild(p);
      return;
    }

    container.textContent = "";
    const shell = document.createElement("div");
    shell.className = "o-settings-shell";

    const h2 = document.createElement("h2");
    h2.textContent = "Settings";
    shell.appendChild(h2);

    const intro = document.createElement("p");
    intro.className = "o-settings-intro";
    intro.textContent = "Manage your account and preferences.";
    shell.appendChild(intro);

    const stack = document.createElement("div");
    stack.className = "o-settings-stack";

    const general = SettingsSection({
      title: "General",
      ariaLabel: "General settings",
      gradient: true,
    });
    const companyHost = document.createElement("div");
    companyHost.id = "settings-company";
    general.body.appendChild(companyHost);
    stack.appendChild(general.el);

    stack.appendChild(navLink("#settings/users", "Users"));

    const paramsSec = SettingsSection({
      title: "System Parameters",
      ariaLabel: "System parameters",
      gradient: true,
    });
    const paramsHost = document.createElement("div");
    paramsHost.id = "settings-params";
    paramsSec.body.appendChild(paramsHost);
    stack.appendChild(paramsSec.el);

    const aiSec = SettingsSection({
      title: "AI Configuration",
      ariaLabel: "AI configuration",
      gradient: true,
    });
    const aiHost = document.createElement("div");
    aiHost.id = "settings-ai";
    aiSec.body.appendChild(aiHost);
    stack.appendChild(aiSec.el);

    const mailSec = SettingsSection({
      title: "Outgoing Mail Servers",
      ariaLabel: "Outgoing mail servers",
      gradient: true,
    });
    const mailHost = document.createElement("div");
    mailHost.id = "settings-mail-servers";
    mailSec.body.appendChild(mailHost);
    stack.appendChild(mailSec.el);

    stack.appendChild(navLink("#settings/dashboard-widgets", "Dashboard Widgets"));
    stack.appendChild(navLink("#settings/apikeys", "API Keys"));
    stack.appendChild(navLink("#settings/approval_rules", "Approval Rules"));
    stack.appendChild(navLink("#settings/approval_requests", "Approval Requests"));
    stack.appendChild(navLink("#settings/totp", "Two-Factor Authentication"));

    shell.appendChild(stack);
    container.appendChild(shell);

    rpc
      .callKw("res.company", "search_read", [[]], { fields: ["id", "name"], limit: 1 })
      .then(function (rows) {
        const company = rows && rows[0];
        const el = document.getElementById("settings-company");
        if (!el) return;
        el.textContent = "";
        if (!company) {
          const p = document.createElement("p");
          p.className = "o-settings-muted";
          p.textContent = "No company record.";
          el.appendChild(p);
          return;
        }
        const nameField = SettingsField.textInput({
          id: "settings-company-name",
          label: "Company name",
          value: company.name || "",
        });
        el.appendChild(nameField.row);
        const saveBtn = Button({
          label: "Save",
          kind: "primary",
          onClick: function () {
            saveBtn.disabled = true;
            rpc
              .callKw("res.company", "write", [[company.id], { name: nameField.input.value.trim() }], {})
              .then(function () {
                saveBtn.disabled = false;
                toast(opts, "Company saved", "success");
              })
              .catch(function (err) {
                saveBtn.disabled = false;
                toast(opts, (err && err.message) || "Failed to save", "error");
              });
          },
        });
        saveBtn.classList.add("o-settings-actions-top");
        el.appendChild(saveBtn);
      })
      .catch(function () {
        const el = document.getElementById("settings-company");
        if (!el) return;
        el.textContent = "";
        const p = document.createElement("p");
        p.className = "o-settings-muted";
        p.textContent = "Could not load company.";
        el.appendChild(p);
      });

    rpc
      .callKw("ir.config_parameter", "search_read", [[]], { fields: ["id", "key", "value"], limit: 50 })
      .then(function (params) {
        const el = document.getElementById("settings-params");
        if (!el) return;
        el.textContent = "";
        if (!params || !params.length) {
          const p = document.createElement("p");
          p.className = "o-settings-muted";
          p.textContent = "No parameters.";
          el.appendChild(p);
          return;
        }
        const wrap = document.createElement("div");
        wrap.className = "o-settings-table-wrap";
        const tbl = SettingsTable.create(wrap, ["Key", "Value"]);
        el.appendChild(wrap);
        params.forEach(function (p) {
          const tr = document.createElement("tr");
          tr.setAttribute("data-id", String(p.id || ""));
          const tdKey = document.createElement("td");
          tdKey.textContent = p.key || "";
          const tdVal = document.createElement("td");
          const inp = document.createElement("input");
          inp.type = "text";
          inp.className = "o-settings-input param-value";
          inp.setAttribute("data-key", p.key || "");
          inp.value = p.value || "";
          inp.addEventListener("blur", function () {
            const key = inp.getAttribute("data-key");
            if (!key) return;
            rpc
              .callKw("ir.config_parameter", "set_param", [key, inp.value], {})
              .then(function () {
                toast(opts, "Parameter saved", "success");
              })
              .catch(function (err) {
                toast(opts, (err && err.message) || "Failed to save", "error");
              });
          });
          tdVal.appendChild(inp);
          tr.appendChild(tdKey);
          tr.appendChild(tdVal);
          tbl.tbody.appendChild(tr);
        });
      })
      .catch(function () {
        const el = document.getElementById("settings-params");
        if (!el) return;
        el.textContent = "";
        const p = document.createElement("p");
        p.className = "o-settings-muted";
        p.textContent = "Could not load parameters.";
        el.appendChild(p);
      });

    rpc
      .callKw("ir.config_parameter", "search_read", [[["key", "in", ["ai.openai_api_key", "ai.llm_enabled", "ai.llm_model"]]]], { fields: ["key", "value"] })
      .then(function (params) {
        const el = document.getElementById("settings-ai");
        if (!el) return;
        el.textContent = "";
        const byKey = {};
        (params || []).forEach(function (p) {
          byKey[p.key] = (p.value || "").trim();
        });
        const apiKey = byKey["ai.openai_api_key"] || "";
        const llmEnabled = (byKey["ai.llm_enabled"] || "0") === "1";
        const llmModel = byKey["ai.llm_model"] || "gpt-4o-mini";

        const pw = SettingsField.passwordWithToggle({
          id: "ai-api-key",
          label: "OpenAI API Key",
          value: apiKey,
          placeholder: "sk-...",
        });
        el.appendChild(pw.row);

        const toggle = SettingsField.toggleCheckbox({
          id: "ai-llm-enabled",
          label: "Enable LLM (conversational AI)",
          checked: llmEnabled,
        });
        el.appendChild(toggle.row);

        const sel = SettingsField.select({
          id: "ai-llm-model",
          label: "Model",
          value: llmModel,
          options: [
            { value: "gpt-4o-mini", label: "gpt-4o-mini" },
            { value: "gpt-4o", label: "gpt-4o" },
            { value: "gpt-4-turbo", label: "gpt-4-turbo" },
          ],
        });
        el.appendChild(sel.row);

        const saveAi = Button({
          label: "Save",
          kind: "primary",
          onClick: function () {
            saveAi.disabled = true;
            Promise.all([
              rpc.callKw("ir.config_parameter", "set_param", ["ai.openai_api_key", pw.input.value], {}),
              rpc.callKw("ir.config_parameter", "set_param", ["ai.llm_enabled", toggle.input.checked ? "1" : "0"], {}),
              rpc.callKw("ir.config_parameter", "set_param", ["ai.llm_model", sel.select.value], {}),
            ])
              .then(function () {
                saveAi.disabled = false;
                toast(opts, "AI configuration saved", "success");
              })
              .catch(function (err) {
                saveAi.disabled = false;
                toast(opts, (err && err.message) || "Failed to save", "error");
              });
          },
        });
        el.appendChild(saveAi);
      })
      .catch(function () {
        const el = document.getElementById("settings-ai");
        if (!el) return;
        el.textContent = "";
        const p = document.createElement("p");
        p.className = "o-settings-muted";
        p.textContent = "Could not load AI configuration.";
        el.appendChild(p);
      });

    rpc
      .callKw("ir.mail_server", "search_read", [[]], { fields: ["id", "name", "smtp_host", "smtp_port", "smtp_user", "smtp_encryption"], order: "sequence" })
      .then(function (servers) {
        const el = document.getElementById("settings-mail-servers");
        if (!el) return;
        el.textContent = "";
        const list = document.createElement("div");
        list.className = "o-settings-mail-list";
        (servers || []).forEach(function (s) {
          const row = document.createElement("div");
          row.className = "o-settings-mail-row mail-server-row";
          row.setAttribute("data-id", String(s.id || ""));
          const grid = document.createElement("div");
          grid.className = "o-settings-mail-grid";

          const hostF = SettingsField.textInput({
            label: "Host",
            value: s.smtp_host || "",
            className: "mail-host",
          });
          const portF = SettingsField.numberInput({
            label: "Port",
            value: s.smtp_port || 25,
            className: "mail-port",
          });
          const userF = SettingsField.textInput({
            label: "User",
            value: s.smtp_user || "",
            className: "mail-user",
          });
          const encSel = document.createElement("select");
          encSel.className = "o-settings-input o-settings-select mail-enc";
          ["none", "starttls", "ssl"].forEach(function (v) {
            const op = document.createElement("option");
            op.value = v;
            op.textContent = v === "none" ? "None" : v === "starttls" ? "TLS (STARTTLS)" : "SSL/TLS";
            if ((s.smtp_encryption || "none") === v) op.selected = true;
            encSel.appendChild(op);
          });
          const encWrap = SettingsField.fieldRow("Encryption", encSel);

          grid.appendChild(hostF.row);
          grid.appendChild(portF.row);
          grid.appendChild(userF.row);
          grid.appendChild(encWrap);
          row.appendChild(grid);

          const actions = document.createElement("div");
          actions.className = "o-settings-mail-actions";
          const saveMail = Button({
            label: "Save",
            kind: "primary",
            onClick: function () {
              const host = row.querySelector(".mail-host").value.trim();
              const port = parseInt(row.querySelector(".mail-port").value, 10) || 25;
              const user = row.querySelector(".mail-user").value.trim();
              const enc = row.querySelector(".mail-enc").value;
              rpc
                .callKw(
                  "ir.mail_server",
                  "write",
                  [[s.id], { smtp_host: host, smtp_port: port, smtp_user: user || false, smtp_encryption: enc }],
                  {}
                )
                .then(function () {
                  toast(opts, "Mail server saved", "success");
                })
                .catch(function (err) {
                  toast(opts, (err && err.message) || "Failed", "error");
                });
            },
          });
          saveMail.classList.add("btn-mail-save");
          const testMail = Button({
            label: "Test Connection",
            kind: "secondary",
            onClick: function () {
              testMail.disabled = true;
              rpc
                .callKw("ir.mail_server", "test_smtp_connection", [[s.id]], {})
                .then(function (res) {
                  testMail.disabled = false;
                  toast(opts, res.message, res.success ? "success" : "error");
                })
                .catch(function (err) {
                  testMail.disabled = false;
                  toast(opts, (err && err.message) || "Test failed", "error");
                });
            },
          });
          testMail.classList.add("btn-mail-test");
          actions.appendChild(saveMail);
          actions.appendChild(testMail);
          row.appendChild(actions);
          list.appendChild(row);
        });
        el.appendChild(list);

        const addBtn = Button({
          label: "+ Add Mail Server",
          kind: "secondary",
          onClick: function () {
            rpc
              .callKw("ir.mail_server", "create", [{ name: "New SMTP Server", smtp_host: "smtp.example.com", smtp_port: 587 }], {})
              .then(function () {
                if (typeof opts.reloadIndex === "function") {
                  opts.reloadIndex();
                }
              })
              .catch(function (err) {
                toast(opts, (err && err.message) || "Failed to create", "error");
              });
          },
        });
        addBtn.id = "btn-add-mail-server";
        addBtn.classList.add("o-settings-add-dashed");
        el.appendChild(addBtn);
      })
      .catch(function () {
        const el = document.getElementById("settings-mail-servers");
        if (!el) return;
        el.textContent = "";
        const p = document.createElement("p");
        p.className = "o-settings-muted";
        p.textContent = "Could not load mail servers.";
        el.appendChild(p);
      });
  }

  function renderDashboardWidgets(container, options) {
    const opts = options || {};
    const rpc = opts.rpc;
    const page = mountSubpage(container, opts.breadcrumbsHtml || "");
    page.classList.add("o-settings-subpage--wide");

    const h2 = document.createElement("h2");
    h2.textContent = "Dashboard Widgets";
    page.appendChild(h2);
    const loading = document.createElement("p");
    loading.className = "o-settings-loading";
    loading.textContent = "Loading...";
    page.appendChild(loading);

    if (!rpc || typeof rpc.callKw !== "function") {
      page.textContent = "";
      page.appendChild(h2);
      const err = document.createElement("p");
      err.className = "o-settings-error";
      err.textContent = "RPC not available.";
      page.appendChild(err);
      return;
    }

    const reload = opts.reloadDashboardWidgets || function () {};

    rpc
      .callKw("ir.dashboard.widget", "search_read", [[]], { fields: ["id", "name", "model", "domain", "measure_field", "aggregate", "sequence"], order: "sequence" })
      .then(function (widgets) {
        page.textContent = "";
        page.appendChild(h2);
        const desc = document.createElement("p");
        desc.className = "o-settings-desc";
        desc.textContent = "Configure KPI cards shown on the home dashboard.";
        page.appendChild(desc);

        const wrap = document.createElement("div");
        wrap.className = "o-settings-table-wrap o-settings-table-wrap--wide";
        const tbl = SettingsTable.create(wrap, ["Name", "Model", "Domain", "Sequence", "Actions"]);
        page.appendChild(wrap);

        (widgets || []).forEach(function (w) {
          const tr = document.createElement("tr");
          tr.setAttribute("data-id", String(w.id || ""));

          function cellWithInput(className, input) {
            const td = document.createElement("td");
            td.appendChild(input);
            tr.appendChild(td);
          }

          const nameInp = document.createElement("input");
          nameInp.type = "text";
          nameInp.className = "o-settings-input widget-name";
          nameInp.value = w.name || "";
          cellWithInput("", nameInp);

          const modelInp = document.createElement("input");
          modelInp.type = "text";
          modelInp.className = "o-settings-input widget-model";
          modelInp.value = w.model || "";
          modelInp.placeholder = "crm.lead";
          cellWithInput("", modelInp);

          const domInp = document.createElement("input");
          domInp.type = "text";
          domInp.className = "o-settings-input widget-domain";
          domInp.value = w.domain || "";
          domInp.placeholder = "[]";
          cellWithInput("", domInp);

          const seqInp = document.createElement("input");
          seqInp.type = "number";
          seqInp.className = "o-settings-input widget-sequence";
          seqInp.value = String(w.sequence != null ? w.sequence : 10);
          cellWithInput("", seqInp);

          const tdAct = document.createElement("td");
          const id = parseInt(String(w.id), 10);
          const saveW = Button({
            label: "Save",
            kind: "primary",
            onClick: function () {
              const row = saveW.closest("tr");
              if (!row) return;
              const name = row.querySelector(".widget-name").value.trim();
              const model = row.querySelector(".widget-model").value.trim();
              const domain = row.querySelector(".widget-domain").value.trim();
              const seq = parseInt(row.querySelector(".widget-sequence").value, 10) || 10;
              saveW.disabled = true;
              rpc
                .callKw("ir.dashboard.widget", "write", [[id], { name: name || "Widget", model: model || "crm.lead", domain: domain || "[]", sequence: seq }], {})
                .then(function () {
                  saveW.disabled = false;
                  toast(opts, "Widget saved", "success");
                })
                .catch(function (err) {
                  saveW.disabled = false;
                  toast(opts, (err && err.message) || "Failed", "error");
                });
            },
          });
          saveW.classList.add("o-settings-btn-inline");
          const delW = Button({
            label: "Delete",
            kind: "secondary",
            onClick: function () {
              if (!confirm("Delete this widget?")) return;
              rpc
                .callKw("ir.dashboard.widget", "unlink", [[id]], {})
                .then(function () {
                  reload();
                  toast(opts, "Widget deleted", "success");
                })
                .catch(function (err) {
                  toast(opts, (err && err.message) || "Failed", "error");
                });
            },
          });
          delW.classList.add("o-settings-btn-inline", "o-btn-danger-outline");
          tdAct.appendChild(saveW);
          tdAct.appendChild(delW);
          tr.appendChild(tdAct);

          tbl.tbody.appendChild(tr);
        });

        const addBtn = Button({
          label: "+ Add Widget",
          kind: "secondary",
          onClick: function () {
            rpc
              .callKw("ir.dashboard.widget", "create", [{ name: "New Widget", model: "crm.lead", domain: "[]", sequence: 99 }], {})
              .then(function () {
                reload();
                toast(opts, "Widget created", "success");
              })
              .catch(function (err) {
                toast(opts, (err && err.message) || "Failed to create", "error");
              });
          },
        });
        addBtn.id = "btn-add-widget";
        addBtn.classList.add("o-settings-add-dashed", "o-settings-add-widget");
        page.appendChild(addBtn);
      })
      .catch(function (err) {
        const msg = err && err.message ? String(err.message) : "Unknown error";
        const dbHint = "erp";
        page.textContent = "";
        page.appendChild(h2);
        const errP = document.createElement("p");
        errP.className = "o-settings-error";
        errP.textContent = "Could not load widgets: " + msg;
        page.appendChild(errP);
        const hint = document.createElement("p");
        hint.className = "o-settings-hint";
        hint.innerHTML =
          'If the table does not exist, run: <code>./erp-bin db init -d ' +
          dbHint +
          "</code>";
        page.appendChild(hint);
        const retry = Button({
          label: "Retry",
          kind: "primary",
          onClick: function () {
            reload();
          },
        });
        retry.classList.add("o-settings-retry");
        page.appendChild(retry);
      });
  }

  function renderApiKeys(container, options) {
    const opts = options || {};
    const rpc = opts.rpc;
    const page = mountSubpage(container, opts.breadcrumbsHtml || "");
    const h2 = document.createElement("h2");
    h2.textContent = "API Keys";
    page.appendChild(h2);
    const loading = document.createElement("p");
    loading.className = "o-settings-loading";
    loading.textContent = "Loading...";
    page.appendChild(loading);

    const sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) {
      page.textContent = "";
      page.appendChild(h2);
      const err = document.createElement("p");
      err.className = "o-settings-error";
      err.textContent = "Session not available.";
      page.appendChild(err);
      return;
    }

    const reload = opts.reloadApiKeys || function () {};

    sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) {
        page.textContent = "";
        page.appendChild(h2);
        const err = document.createElement("p");
        err.className = "o-settings-error";
        err.textContent = "Not logged in.";
        page.appendChild(err);
        return;
      }
      rpc
        .callKw("res.users.apikeys", "search_read", [[["user_id", "=", info.uid]]], { fields: ["id", "name"] })
        .then(function (keys) {
          page.textContent = "";
          page.appendChild(h2);
          const help = document.createElement("p");
          help.className = "o-settings-desc";
          help.innerHTML =
            "Use API keys to authenticate with the JSON-2 API. Use <code>Authorization: Bearer &lt;key&gt;</code>.";
          page.appendChild(help);

          const rowBar = document.createElement("div");
          rowBar.className = "o-settings-inline-actions";
          const nameInput = document.createElement("input");
          nameInput.type = "text";
          nameInput.id = "apikey-name";
          nameInput.className = "o-settings-input";
          nameInput.placeholder = "Key name (e.g. My App)";
          const genBtn = Button({
            label: "Generate",
            kind: "primary",
            onClick: function () {
              const name = (nameInput.value || "API Key").trim();
              genBtn.disabled = true;
              rpc
                .callKw("res.users.apikeys", "generate", [info.uid, name])
                .then(function (rawKey) {
                  genBtn.disabled = false;
                  if (typeof navigator.clipboard !== "undefined" && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(rawKey).then(
                      function () {
                        toast(opts, "API key generated and copied to clipboard.", "success");
                      },
                      function () {
                        toast(opts, "API key generated. Copy it now - it will not be shown again.", "warning");
                      }
                    );
                  } else {
                    toast(opts, "API key generated. Copy it now - it will not be shown again.", "warning");
                  }
                  reload();
                })
                .catch(function (err) {
                  genBtn.disabled = false;
                  toast(opts, (err && err.message) || "Failed to generate key", "error");
                });
            },
          });
          genBtn.id = "btn-generate";
          rowBar.appendChild(nameInput);
          rowBar.appendChild(genBtn);
          page.appendChild(rowBar);

          if (!keys || !keys.length) {
            const empty = document.createElement("p");
            empty.textContent = "No API keys yet. Generate one above.";
            page.appendChild(empty);
            return;
          }
          const wrap = document.createElement("div");
          wrap.className = "o-settings-table-wrap";
          const tbl = SettingsTable.create(wrap, ["Name", "Actions"]);
          page.appendChild(wrap);
          keys.forEach(function (k) {
            const tr = document.createElement("tr");
            tr.setAttribute("data-id", String(k.id || ""));
            const tdName = document.createElement("td");
            tdName.textContent = k.name || "API Key";
            const tdAct = document.createElement("td");
            const revoke = document.createElement("a");
            revoke.href = "#";
            revoke.className = "o-settings-link-danger btn-revoke";
            revoke.setAttribute("data-id", String(k.id || ""));
            revoke.textContent = "Revoke";
            revoke.addEventListener("click", function (e) {
              e.preventDefault();
              const id = parseInt(revoke.getAttribute("data-id"), 10);
              if (!confirm("Revoke this API key? It will stop working immediately.")) return;
              rpc
                .callKw("res.users.apikeys", "revoke", [[id]])
                .then(function () {
                  reload();
                })
                .catch(function (err) {
                  toast(opts, (err && err.message) || "Failed to revoke", "error");
                });
            });
            tdAct.appendChild(revoke);
            tr.appendChild(tdName);
            tr.appendChild(tdAct);
            tbl.tbody.appendChild(tr);
          });
        })
        .catch(function (err) {
          page.textContent = "";
          page.appendChild(h2);
          const errP = document.createElement("p");
          errP.className = "o-settings-error";
          errP.textContent = (err && err.message) || "Failed to load keys";
          page.appendChild(errP);
        });
    });
  }

  function renderTotp(container, options) {
    const opts = options || {};
    const page = mountSubpage(container, opts.breadcrumbsHtml || "");
    const h2 = document.createElement("h2");
    h2.textContent = "Two-Factor Authentication";
    page.appendChild(h2);
    const loading = document.createElement("p");
    loading.className = "o-settings-loading";
    loading.textContent = "Loading...";
    page.appendChild(loading);

    const reload = opts.reloadTotp || function () {};

    fetch("/web/totp/status", { credentials: "include" })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        const enabled = data && data.enabled;
        page.textContent = "";
        page.appendChild(h2);
        const intro = document.createElement("p");
        intro.className = "o-settings-desc";
        intro.textContent = "Add an extra layer of security with TOTP (authenticator app).";
        page.appendChild(intro);

        const sectionInner = document.createElement("div");
        sectionInner.className = "o-settings-totp-box";
        if (enabled) {
          const ok = document.createElement("p");
          ok.className = "o-settings-success-msg";
          ok.textContent = "2FA is enabled.";
          sectionInner.appendChild(ok);
          const btnDisable = Button({
            label: "Disable 2FA",
            kind: "primary",
            onClick: function () {
              if (!confirm("Disable two-factor authentication? Your account will be less secure.")) return;
              var totpDisableHdrs = { "Content-Type": "application/json" };
              if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
                Object.assign(totpDisableHdrs, window.Services.session.getAuthHeaders());
              }
              fetch("/web/totp/disable", { method: "POST", credentials: "include", headers: totpDisableHdrs, body: "{}" })
                .then(function (r) {
                  return r.json();
                })
                .then(function (d) {
                  if (d.error) {
                    toast(opts, d.error, "error");
                    return;
                  }
                  toast(opts, "2FA disabled", "success");
                  reload();
                })
                .catch(function (err) {
                  toast(opts, (err && err.message) || "Failed", "error");
                });
            },
          });
          btnDisable.classList.add("o-btn-danger-solid");
          sectionInner.appendChild(btnDisable);
        } else {
          const off = document.createElement("p");
          off.className = "o-settings-muted";
          off.textContent = "2FA is not enabled.";
          sectionInner.appendChild(off);
          const btnBegin = Button({
            label: "Enable 2FA",
            kind: "primary",
            onClick: function () {
              btnBegin.disabled = true;
              var totpHdrs = { "Content-Type": "application/json" };
              if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
                Object.assign(totpHdrs, window.Services.session.getAuthHeaders());
              }
              fetch("/web/totp/begin_setup", { method: "POST", credentials: "include", headers: totpHdrs, body: "{}" })
                .then(function (r) {
                  return r.json();
                })
                .then(function (d) {
                  btnBegin.disabled = false;
                  if (d.error) {
                    toast(opts, d.error, "error");
                    return;
                  }
                  const area = document.getElementById("totp-setup-area");
                  if (area) area.style.display = "block";
                  const secEl = document.getElementById("totp-secret");
                  if (secEl) secEl.textContent = d.secret || "";
                  const qrDiv = document.getElementById("totp-qr");
                  if (qrDiv && d.provision_uri && typeof QRCode !== "undefined") {
                    qrDiv.textContent = "";
                    new QRCode(qrDiv, { text: d.provision_uri, width: 180, height: 180 });
                  } else if (qrDiv && d.provision_uri) {
                    const a = document.createElement("a");
                    a.href = d.provision_uri;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.textContent = "Open in authenticator";
                    qrDiv.textContent = "";
                    qrDiv.appendChild(a);
                  }
                })
                .catch(function (err) {
                  btnBegin.disabled = false;
                  toast(opts, (err && err.message) || "Failed", "error");
                });
            },
          });
          sectionInner.appendChild(btnBegin);

          const setupArea = document.createElement("div");
          setupArea.id = "totp-setup-area";
          setupArea.className = "o-settings-totp-setup";
          setupArea.style.display = "none";
          const scanP = document.createElement("p");
          scanP.textContent = "Scan the QR code with your authenticator app.";
          setupArea.appendChild(scanP);
          const qrDiv = document.createElement("div");
          qrDiv.id = "totp-qr";
          setupArea.appendChild(qrDiv);
          const manualP = document.createElement("p");
          manualP.className = "o-settings-totp-manual";
          manualP.appendChild(document.createTextNode("Or enter this secret manually: "));
          const codeSecret = document.createElement("code");
          codeSecret.id = "totp-secret";
          manualP.appendChild(codeSecret);
          setupArea.appendChild(manualP);

          const codeField = SettingsField.textInput({
            id: "totp-code",
            label: "Enter the 6-digit code to confirm:",
            placeholder: "000000",
            maxLength: 6,
            pattern: "[0-9]{6}",
          });
          codeField.input.classList.add("o-settings-input-totp");
          setupArea.appendChild(codeField.row);

          const btnConfirm = Button({
            label: "Confirm",
            kind: "primary",
            onClick: function () {
              const code = (document.getElementById("totp-code").value || "").trim();
              if (!code || code.length !== 6) {
                toast(opts, "Enter 6-digit code", "error");
                return;
              }
              btnConfirm.disabled = true;
              var totpConfirmHdrs = { "Content-Type": "application/json" };
              if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
                Object.assign(totpConfirmHdrs, window.Services.session.getAuthHeaders());
              }
              fetch("/web/totp/confirm_setup", {
                method: "POST",
                credentials: "include",
                headers: totpConfirmHdrs,
                body: JSON.stringify({ code: code }),
              })
                .then(function (r) {
                  return r.json();
                })
                .then(function (d) {
                  btnConfirm.disabled = false;
                  if (d.error) {
                    toast(opts, d.error, "error");
                    return;
                  }
                  toast(opts, "2FA enabled", "success");
                  reload();
                })
                .catch(function (err) {
                  btnConfirm.disabled = false;
                  toast(opts, (err && err.message) || "Failed", "error");
                });
            },
          });
          setupArea.appendChild(btnConfirm);
          sectionInner.appendChild(setupArea);
        }
        page.appendChild(sectionInner);
      })
      .catch(function () {
        page.textContent = "";
        page.appendChild(h2);
        const err = document.createElement("p");
        err.className = "o-settings-error";
        err.textContent = "Failed to load status.";
        page.appendChild(err);
      });
  }

  const Settings = {
    renderIndex: renderIndex,
    renderDashboardWidgets: renderDashboardWidgets,
    renderApiKeys: renderApiKeys,
    renderTotp: renderTotp,
    /** @deprecated Legacy stub API; prefer renderIndex + RPC from UI. */
    render(container, options) {
      renderIndex(container, options);
    },
    save(rpc, values) {
      if (!rpc || typeof rpc.callKw !== "function") {
        return Promise.resolve(true);
      }
      return rpc.callKw("res.users", "save_ui_settings", [values || {}], {});
    },
  };

  window.AppCore.Settings = Settings;
})();
