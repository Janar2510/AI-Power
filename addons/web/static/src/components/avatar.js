(function () {
  window.UIComponents = window.UIComponents || {};

  function initialsFromName(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return "U";
    }
    return parts.slice(0, 2).map(function (part) { return part[0].toUpperCase(); }).join("");
  }

  window.UIComponents.Avatar = function Avatar(options) {
    const opts = typeof options === "string" ? { name: options } : (options || {});
    const avatar = document.createElement(opts.imageUrl ? "img" : "span");
    avatar.className = "o-avatar o-avatar-" + (opts.size || "md");

    if (opts.imageUrl) {
      avatar.src = opts.imageUrl;
      avatar.alt = String(opts.alt || opts.name || "Avatar");
    } else {
      avatar.textContent = opts.initials || initialsFromName(opts.name);
    }

    return avatar;
  };
})();
