(function () {
  window.FieldWidgets = window.FieldWidgets || {};

  function render(container, fieldName, value, options) {
    const opts = options || {};
    const readonly = Boolean(opts.readonly);
    const fileName = opts.fileName || "attachment.bin";

    container.innerHTML = "";
    if (readonly) {
      const link = document.createElement("a");
      link.className = "o-binary-download";
      link.textContent = fileName;
      link.href = value || "#";
      link.download = fileName;
      container.appendChild(link);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.name = fieldName || "";
    input.className = "o-input-file";

    const details = document.createElement("small");
    details.className = "o-binary-meta";
    details.textContent = "No file selected";

    input.addEventListener("change", function () {
      const file = input.files && input.files[0];
      if (!file) {
        details.textContent = "No file selected";
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        details.textContent = file.name + " (" + file.size + " bytes)";
        container.dispatchEvent(
          new CustomEvent("change", {
            bubbles: true,
            detail: {
              fieldName: fieldName,
              value: String(reader.result || ""),
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || "application/octet-stream",
            },
          })
        );
      };
      reader.readAsDataURL(file);
    });

    container.appendChild(input);
    container.appendChild(details);
  }

  window.FieldWidgets.binary_widget = { render: render };
})();
