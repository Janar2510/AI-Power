(function () {
  window.UIComponents = window.UIComponents || {};

  /**
   * Reusable settings card: header + body slot using UIComponents.Card.
   * @param {{ title: string, ariaLabel?: string, gradient?: boolean, body?: Node }} options
   * @returns {{ el: HTMLElement, body: HTMLDivElement }}
   */
  window.UIComponents.SettingsSection = function SettingsSection(options) {
    const opts = options || {};
    const body = document.createElement("div");
    body.className = "o-settings-section-inner";
    if (opts.body instanceof Node) {
      body.appendChild(opts.body);
    }
    const gradient = opts.gradient !== false;
    const card = window.UIComponents.Card({
      gradient: gradient,
      title: opts.title,
      content: body,
    });
    card.classList.add("o-settings-card");
    if (opts.ariaLabel) {
      card.setAttribute("aria-label", opts.ariaLabel);
    }
    return { el: card, body: body };
  };
})();
