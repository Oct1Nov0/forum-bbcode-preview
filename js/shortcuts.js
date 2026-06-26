const Shortcuts = (() => {
  function bind(textarea, onChange) {
    textarea.addEventListener("keydown", event => {
      const key = event.key.toLowerCase();

      if (event.ctrlKey && key === "b") {
        event.preventDefault();
        Editor.wrapSelection(textarea, "[b]", "[/b]");
        onChange();
      }

      if (event.ctrlKey && key === "i") {
        event.preventDefault();
        Editor.wrapSelection(textarea, "[i]", "[/i]");
        onChange();
      }

      if (event.ctrlKey && key === "u") {
        event.preventDefault();
        Editor.wrapSelection(textarea, "[u]", "[/u]");
        onChange();
      }

      if (event.ctrlKey && key === "q") {
        event.preventDefault();
        Editor.wrapSelection(textarea, "[blockquote]", "[/blockquote]");
        onChange();
      }
    });
  }

  return { bind };
})();
