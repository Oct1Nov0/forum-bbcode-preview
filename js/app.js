const SAMPLE_TEXT = `[color=gray][b]1楼　示例用户[/b]　01/01 12:00[/color]
这里是默认预览文本。
你可以在左侧输入平台支持的 BBCode，右侧会即时显示接近发布后的效果。[br]
[color=gray][b]2楼　路过的人[/b]　01/01 12:05[/color]
这是第二层楼。

[blockquote][size=14]1楼 示例用户 01/01 12:00
这里是默认预览文本。[/size][/blockquote]

引用内容会显示成平台里的引用样式。[br]
[color=gray][b]3楼　测试账号[/b]　01/01 12:10[/color]
支持基础格式，比如 [b]加粗[/b]、[i]斜体[/i]、[u]下划线[/u]、[color=gray]灰色文字[/color]。

每一楼之间请用 [br] 分隔。`;

document.addEventListener("DOMContentLoaded", () => {
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");
  const previewScroll = document.getElementById("previewScroll");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");
  const themeBtn = document.getElementById("themeBtn");
  const fontSizeSelect = document.getElementById("fontSizeSelect");
  const draftStatus = document.getElementById("draftStatus");
  const stats = document.getElementById("stats");

  const elements = {
    editorPane: document.getElementById("editorPane"),
    previewPane: document.getElementById("previewPane"),
    editTab: document.getElementById("editTab"),
    previewTab: document.getElementById("previewTab")
  };

  let saveTimer = null;

  function updateDraftStatus(text) {
    draftStatus.textContent = text;
  }

  function applyTheme() {
    const theme = Storage.getTheme();
    document.body.classList.toggle("dark", theme === "dark");
    themeBtn.textContent = theme === "dark" ? "浅色模式" : "深色模式";
  }

  function applyFontSize() {
    document.documentElement.style.setProperty("--preview-font-size", fontSizeSelect.value + "px");
    document.querySelector(".platform-preview").style.fontSize = fontSizeSelect.value + "px";
  }

  function render() {
    const source = editor.value;
    preview.innerHTML = Preview.render(source);

    const result = Preview.getStats(source);
    stats.textContent = `${result.floors}楼 · ${result.chars}字`;

    applyFontSize();
  }

  function save() {
    Storage.setDraft(editor.value);
    updateDraftStatus("已自动保存");
  }

  function scheduleSave() {
    updateDraftStatus("保存中…");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
  }

  editor.value = Storage.getDraft() || SAMPLE_TEXT;

  applyTheme();

  fontSizeSelect.value = Storage.getFontSize();
  render();

  editor.addEventListener("input", () => {
    render();
    scheduleSave();
  });

  editor.addEventListener("scroll", () => {
    if (window.innerWidth <= 900) return;

    const maxEditor = Math.max(1, editor.scrollHeight - editor.clientHeight);
    const maxPreview = Math.max(1, previewScroll.scrollHeight - previewScroll.clientHeight);
    previewScroll.scrollTop = (editor.scrollTop / maxEditor) * maxPreview;
  });

  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(editor.value);
    copyBtn.textContent = "已复制";
    setTimeout(() => copyBtn.textContent = "复制 BBCode", 900);
  });

  clearBtn.addEventListener("click", () => {
    if (!confirm("确定清空当前草稿吗？")) return;
    Editor.clear(editor);
    render();
    save();
  });

  themeBtn.addEventListener("click", () => {
    const next = Storage.getTheme() === "dark" ? "light" : "dark";
    Storage.setTheme(next);
    applyTheme();
  });

  fontSizeSelect.addEventListener("change", () => {
    Storage.setFontSize(fontSizeSelect.value);
    applyFontSize();
  });

  Shortcuts.bind(editor, () => {
    render();
    scheduleSave();
  });

  Mobile.bind(elements, render);
});
