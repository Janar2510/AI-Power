(function () {
  window.AppCore = window.AppCore || {};

  const Chatter = {
    load(rpc, model, id) {
      if (!rpc || typeof rpc.callKw !== "function" || !model || !id) {
        return Promise.resolve([]);
      }
      return rpc.callKw("mail.message", "search_read", [[["model", "=", model], ["res_id", "=", id]]], {
        fields: ["id", "body", "author_id", "date"],
        limit: 30,
      });
    },
    render(container, messages) {
      const rows = Array.isArray(messages) ? messages : [];
      container.innerHTML = "";
      const shell = document.createElement("section");
      shell.className = "o-chatter-shell";
      rows.forEach(function (msg) {
        const article = document.createElement("article");
        article.className = "o-chatter-message";
        article.innerHTML =
          '<p class="o-chatter-meta">' + String(msg.date || "") + "</p>" +
          '<div class="o-chatter-body">' + String(msg.body || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "") + "</div>";
        shell.appendChild(article);
      });
      container.appendChild(shell);
    },
  };

  window.AppCore.Chatter = Chatter;
})();
