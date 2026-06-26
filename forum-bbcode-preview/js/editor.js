const Editor = (() => {
  function wrapSelection(textarea, before, after) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);

    textarea.setRangeText(before + selected + after, start, end, "end");
    textarea.focus();

    if (!selected) {
      textarea.selectionStart = textarea.selectionEnd = start + before.length;
    }
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText(text, start, end, "end");
    textarea.focus();
  }

  function clear(textarea) {
    textarea.value = "";
  }

  function createNewFloorTemplate(nextFloor = 1) {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");

    return `[br]\n[color=gray][b]${nextFloor}楼　用户名[/b]　${month}/${day} ${hour}:${minute}[/color]\n`;
  }

  return {
    wrapSelection,
    insertAtCursor,
    clear,
    createNewFloorTemplate
  };
})();
