const SAMPLE_TEXT = `[color=gray][b]1楼　仓鼠赛高（楼主）[/b]　03/02 23:51[/color]
不点名，懂的都懂，一直病殃殃看着没精神的那个。
今天跟一个行政的朋友聊天听说的，他递辞呈了，正在系统里走OA。
我先开瓶汽水庆祝一下。[br]
[color=gray][b]2楼　奔跑的小白杨[/b]　03/02 23:58[/color]
沙发。
秒解码，上个月我精神力超载，看疏导申请的推荐栏他排第一就申请了，一直排到昨天才轮上。
结果到那一句安慰没有，还被他嘲讽。[br]
[color=gray][b]3楼　吃瓜群众丙[/b]　03/03 00:23[/color]
[blockquote][size=14]2楼 奔跑的小白杨 03/02 23:58
结果到那一句安慰没有，还被他嘲讽。[/size][/blockquote]
话说他吃这么多差评还能回回推荐栏第一，有黑幕？`;

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
