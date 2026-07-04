const Storage = {
  draftKey: "forum_bbcode_preview_draft_v2",
  themeKey: "forum_bbcode_preview_theme_v2",
  fontKey: "forum_bbcode_preview_font_v2",
  tabKey: "forum_bbcode_preview_tab_v2",
  modeKey: "forum_bbcode_preview_mode_v2",

  getDraft() {
    return localStorage.getItem(this.draftKey);
  },

  setDraft(value) {
    localStorage.setItem(this.draftKey, value);
  },

  getTheme() {
    return localStorage.getItem(this.themeKey) || "light";
  },

  setTheme(value) {
    localStorage.setItem(this.themeKey, value);
  },

  getFontSize() {
    return localStorage.getItem(this.fontKey) || "16";
  },

  setFontSize(value) {
    localStorage.setItem(this.fontKey, value);
  },

  getMobileTab() {
    return localStorage.getItem(this.tabKey) || "edit";
  },

  setMobileTab(value) {
    localStorage.setItem(this.tabKey, value);
  },

  getMode() {
    return localStorage.getItem(this.modeKey) || "visual";
  },

  setMode(value) {
    localStorage.setItem(this.modeKey, value);
  }
};


/* ===== merged file separator ===== */

const BBCodeParser = (() => {
  function escapeHtml(input) {
    return String(input).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function sanitizeUrl(url) {
    const trimmed = String(url).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return "";
  }

  function parseColorValue(value) {
    const raw = String(value).trim().toLowerCase();
    if (raw === "gray" || raw === "grey") return "gray";
    if (raw === "red") return "red";
    if (raw === "blue") return "blue";
    if (raw === "green") return "green";
    if (raw === "black") return "black";
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw)) return raw;
    return "";
  }

  function parseInline(input) {
    let html = escapeHtml(input);

    html = html.replace(/\[blockquote\]([\s\S]*?)\[\/blockquote\]/gi, '<div class="bb-quote">$1</div>');
    html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<div class="bb-quote">$1</div>');

    html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
    html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
    html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
    html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>");

    html = html.replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi, (_, size, content) => {
      const n = Math.max(10, Math.min(30, Number(size)));
      return `<span class="bb-size" style="font-size:${n}px">${content}</span>`;
    });

    html = html.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, (_, value, content) => {
      const color = parseColorValue(value);
      if (!color) return content;
      if (color === "gray" || color === "grey") {
        return `<span class="bb-gray">${content}</span>`;
      }
      return `<span style="color:${color}">${content}</span>`;
    });

    html = html.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<span class="bb-spoiler">$1</span>');

    html = html.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (_, url, label) => {
      const safeUrl = sanitizeUrl(url);
      if (!safeUrl) return label;
      return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });

    html = html.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_, url) => {
      const safeUrl = sanitizeUrl(url);
      if (!safeUrl) return escapeHtml(url);
      return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrl)}</a>`;
    });

    html = html.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, (_, url) => {
      const safeUrl = sanitizeUrl(url);
      if (!safeUrl) return "";
      return `<img src="${escapeHtml(safeUrl)}" alt="">`;
    });

    html = html.replace(/\[br\]/gi, "<br>");

    return html;
  }

  function normalizeLineBreaks(text) {
    return String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  function splitFloors(source) {
    const normalized = normalizeLineBreaks(source);
    const parts = [];
    let buffer = "";
    let depth = 0;
    let i = 0;

    while (i < normalized.length) {
      const rest = normalized.slice(i);
      const lower = rest.toLowerCase();

      if (lower.startsWith("[blockquote]")) {
        depth += 1;
        buffer += rest.slice(0, 12);
        i += 12;
        continue;
      }

      if (lower.startsWith("[/blockquote]")) {
        depth = Math.max(0, depth - 1);
        buffer += rest.slice(0, 13);
        i += 13;
        continue;
      }

      if (lower.startsWith("[quote]")) {
        depth += 1;
        buffer += rest.slice(0, 7);
        i += 7;
        continue;
      }

      if (lower.startsWith("[/quote]")) {
        depth = Math.max(0, depth - 1);
        buffer += rest.slice(0, 8);
        i += 8;
        continue;
      }

      if (lower.startsWith("[br]") && depth === 0) {
        if (buffer.trim()) parts.push(buffer.trim());
        buffer = "";
        i += 4;
        continue;
      }

      buffer += normalized[i];
      i += 1;
    }

    if (buffer.trim()) parts.push(buffer.trim());
    return parts;
  }

  function parseHeader(line) {
    const pattern = /^\s*\[color=gray\]\[b\](\d+楼)\s*[　 ]+(.+?)\[\/b\]\s*[　 ]*([0-9]{2}\/[0-9]{2}\s+[0-9]{2}:[0-9]{2})\[\/color\]\s*$/i;
    const match = line.match(pattern);
    if (!match) return null;

    return {
      floor: match[1],
      name: match[2],
      time: match[3],
      raw: line
    };
  }

  function linesToParagraphs(text) {
    const normalized = normalizeLineBreaks(text).trim();
    if (!normalized) return "";

    return normalized
      .split(/\n{2,}/)
      .map(block => {
        const html = parseInline(block).replace(/\n/g, "<br>");
        return `<p>${html}</p>`;
      })
      .join("");
  }

  function plainTextForCount(source) {
    return normalizeLineBreaks(source)
      .replace(/\[br\]/gi, "\n")
      .replace(/\[[^\]]+\]/g, "")
      .replace(/\s+/g, "");
  }

  function sourceToFloors(source) {
    return splitFloors(source).map((raw, index) => {
      const lines = normalizeLineBreaks(raw).split("\n");
      const header = parseHeader(lines[0] || "");
      const body = header ? lines.slice(1).join("\n").trim() : raw.trim();

      return {
        floor: header ? header.floor : `${index + 1}楼`,
        name: header ? header.name : "用户名",
        time: header ? header.time : "01/01 12:00",
        body
      };
    });
  }

  return {
    escapeHtml,
    parseInline,
    splitFloors,
    parseHeader,
    linesToParagraphs,
    plainTextForCount,
    sourceToFloors
  };
})();


/* ===== merged file separator ===== */

const Preview = (() => {
  function renderFloor(raw, index) {
    const lines = raw.split("\n");
    const firstLine = lines[0] || "";
    const header = BBCodeParser.parseHeader(firstLine);

    let headerHtml = "";
    let bodySource = raw;

    if (header) {
      headerHtml = `
        <p class="floor-header">
          <strong>${BBCodeParser.escapeHtml(header.floor)}　${BBCodeParser.escapeHtml(header.name)}</strong>　${BBCodeParser.escapeHtml(header.time)}
        </p>`;
      bodySource = lines.slice(1).join("\n");
    } else {
      headerHtml = `
        <p class="floor-header preview-error">
          <strong>${index + 1}楼　未识别楼层头</strong>
        </p>`;
    }

    const bodyHtml = BBCodeParser.linesToParagraphs(bodySource);

    return `
      <section class="floor-post" data-floor="${index + 1}">
        ${headerHtml}
        <div class="floor-body">${bodyHtml}</div>
      </section>
    `;
  }

  function render(source) {
    const floors = BBCodeParser.splitFloors(source);

    if (!floors.length) {
      return '<div class="preview-empty">左边输入内容后，这里会显示平台效果。</div>';
    }

    return floors.map(renderFloor).join("");
  }

  function getStats(source) {
    const floors = BBCodeParser.splitFloors(source).length;
    const chars = BBCodeParser.plainTextForCount(source).length;
    return { floors, chars };
  }

  return { render, getStats };
})();


/* ===== merged file separator ===== */

const VisualEditor = (() => {
  let lastFocusedBody = null;

  function nowTime() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${hour}:${minute}`;
  }

  function htmlToBBCode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(htmlToBBCode).join("");

    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") return `[b]${children}[/b]`;
    if (tag === "em" || tag === "i") return `[i]${children}[/i]`;
    if (tag === "u") return `[u]${children}[/u]`;
    if (tag === "s" || tag === "strike" || tag === "del") return `[s]${children}[/s]`;
    if (tag === "blockquote" || node.classList.contains("bb-quote")) {
      return `\n[blockquote]${children.trim()}[/blockquote]\n`;
    }
    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      return href ? `[url=${href}]${children}[/url]` : children;
    }
    if (tag === "img") {
      const src = node.getAttribute("src") || "";
      return src ? `\n[img]${src}[/img]\n` : "";
    }
    if (tag === "span") {
      const color = (node.style.color || "").toLowerCase();
      const data = node.dataset.bbcode;
      if (data === "gray" || color.includes("gray") || color.includes("128")) {
        return `[color=gray]${children}[/color]`;
      }

      const size = node.style.fontSize;
      if (size && size.endsWith("px")) {
        return `[size=${parseInt(size, 10)}]${children}[/size]`;
      }

      return children;
    }
    if (tag === "div" || tag === "p") {
      return `${children}\n`;
    }

    return children;
  }

  function cleanupBBCode(text) {
    return text
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function bodyHTMLFromBBCode(source) {
    if (!source.trim()) return "";
    return BBCodeParser.linesToParagraphs(source);
  }

  function createFloorElement(data, index) {
    const wrapper = document.createElement("section");
    wrapper.className = "visual-floor";

    wrapper.innerHTML = `
      <div class="visual-head">
        <input class="floor-input" value="${BBCodeParser.escapeHtml(data.floor || `${index + 1}楼`)}" aria-label="楼层">
        <input class="name-input" value="${BBCodeParser.escapeHtml(data.name || "用户名")}" aria-label="用户名">
        <input class="time-input" value="${BBCodeParser.escapeHtml(data.time || nowTime())}" aria-label="时间">
        <button class="insert-floor" type="button">插入下方</button>
        <button class="delete-floor" type="button">删除</button>
      </div>
      <div class="visual-body" contenteditable="true"></div>
    `;

    const body = wrapper.querySelector(".visual-body");
    body.innerHTML = bodyHTMLFromBBCode(data.body || "");

    body.addEventListener("focus", () => {
      lastFocusedBody = body;
    });

    return wrapper;
  }

  function getTargetBody() {
    const active = document.activeElement;
    if (active && active.classList && active.classList.contains("visual-body")) return active;
    return lastFocusedBody || document.querySelector(".visual-body");
  }

  function setFloors(list, floors) {
    list.innerHTML = "";
    const data = floors.length ? floors : [{
      floor: "1楼",
      name: "示例用户",
      time: "01/01 12:00",
      body: "这里是正文。你可以像普通文本一样输入，最后点击复制 BBCode。"
    }];

    data.forEach((floor, index) => {
      list.appendChild(createFloorElement(floor, index));
    });
  }

  function exportBBCode(list) {
    const floors = Array.from(list.querySelectorAll(".visual-floor"));

    return floors.map(item => {
      const floor = item.querySelector(".floor-input").value.trim() || "1楼";
      const name = item.querySelector(".name-input").value.trim() || "用户名";
      const time = item.querySelector(".time-input").value.trim() || nowTime();
      const body = item.querySelector(".visual-body");
      const bodyCode = cleanupBBCode(Array.from(body.childNodes).map(htmlToBBCode).join(""));

      return `[color=gray][b]${floor}　${name}[/b]　${time}[/color]\n${bodyCode}`;
    }).join("[br]\n");
  }

  function addFloor(list) {
    const count = list.querySelectorAll(".visual-floor").length;
    const next = createFloorElement({
      floor: `${count + 1}楼`,
      name: "用户名",
      time: nowTime(),
      body: ""
    }, count);

    list.appendChild(next);
    next.querySelector(".name-input").focus();
  }

  function execCommand(command) {
    const body = getTargetBody();
    if (!body) return;

    body.focus();

    if (command === "bold") document.execCommand("bold", false);
    if (command === "italic") document.execCommand("italic", false);
    if (command === "underline") document.execCommand("underline", false);
    if (command === "strike") document.execCommand("strikeThrough", false);

    if (command === "gray") {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        document.execCommand("insertHTML", false, '<span data-bbcode="gray" style="color:gray">灰色文字</span>');
      } else {
        const content = range.extractContents();
        const span = document.createElement("span");
        span.dataset.bbcode = "gray";
        span.style.color = "gray";
        span.appendChild(content);
        range.insertNode(span);
      }
    }

    if (command === "quote") {
      document.execCommand("insertHTML", false, '<blockquote>这里输入引用内容</blockquote><br>');
    }

    if (command === "link") {
      const url = prompt("请输入链接地址，以 https:// 开头");
      if (!url) return;
      const text = prompt("请输入显示文字，不填则显示链接") || url;
      document.execCommand("insertHTML", false, `<a href="${BBCodeParser.escapeHtml(url)}">${BBCodeParser.escapeHtml(text)}</a>`);
    }

    if (command === "image") {
      const url = prompt("请输入图片地址，以 https:// 开头");
      if (!url) return;
      document.execCommand("insertHTML", false, `<img src="${BBCodeParser.escapeHtml(url)}" alt="">`);
    }
  }

  function parseFloorNumber(value) {
    const match = String(value || "").match(/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  function parseStoryTime(value) {
    const match = String(value || "").trim().match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2})[:：](\d{1,2})$/);
    if (!match) return null;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const hour = Number(match[3]);
    const minute = Number(match[4]);

    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (hour < 0 || hour > 23) return null;
    if (minute < 0 || minute > 59) return null;

    return new Date(2026, month - 1, day, hour, minute, 0, 0);
  }

  function formatStoryTime(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${hour}:${minute}`;
  }

  function randomStepMinutes() {
    return Math.floor(Math.random() * 10) + 1;
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  function getFloorDataFromElement(item) {
    return {
      floorNumber: parseFloorNumber(item.querySelector(".floor-input").value),
      timeDate: parseStoryTime(item.querySelector(".time-input").value),
      name: item.querySelector(".name-input").value.trim()
    };
  }

  function addGeneratedFloors(list, count, defaultName = "用户名") {
    const safeCount = Math.max(1, Math.min(300, Number(count) || 1));
    let floors = Array.from(list.querySelectorAll(".visual-floor"));

    if (!floors.length) {
      setFloors(list, [{
        floor: "1楼",
        name: defaultName || "用户名",
        time: nowTime(),
        body: ""
      }]);
      floors = Array.from(list.querySelectorAll(".visual-floor"));
    }

    const last = floors[floors.length - 1];
    const first = floors[0];

    const lastData = getFloorDataFromElement(last);
    const firstData = getFloorDataFromElement(first);

    let currentFloorNumber = lastData.floorNumber ?? floors.length;
    let currentTime = lastData.timeDate || firstData.timeDate || parseStoryTime(nowTime());

    for (let i = 0; i < safeCount; i += 1) {
      currentFloorNumber += 1;
      currentTime = addMinutes(currentTime, randomStepMinutes());

      const next = createFloorElement({
        floor: `${currentFloorNumber}楼`,
        name: defaultName || "用户名",
        time: formatStoryTime(currentTime),
        body: ""
      }, floors.length + i);

      list.appendChild(next);
    }
  }

  function renumberFromFirst(list) {
    const floors = Array.from(list.querySelectorAll(".visual-floor"));
    if (!floors.length) return;

    const firstData = getFloorDataFromElement(floors[0]);
    const startFloorNumber = firstData.floorNumber ?? 1;

    floors.forEach((item, index) => {
      item.querySelector(".floor-input").value = `${startFloorNumber + index}楼`;
    });
  }

  function insertFloorAfter(list, currentItem) {
    const floors = Array.from(list.querySelectorAll(".visual-floor"));
    const index = Math.max(0, floors.indexOf(currentItem));
    const currentData = getFloorDataFromElement(currentItem);
    const nextItem = floors[index + 1];
    const nextData = nextItem ? getFloorDataFromElement(nextItem) : null;

    const currentFloorNumber = currentData.floorNumber ?? (index + 1);
    const currentTime = currentData.timeDate || parseStoryTime(nowTime());

    let step = randomStepMinutes();
    if (nextData && nextData.timeDate && currentTime && nextData.timeDate > currentTime) {
      const diff = Math.floor((nextData.timeDate.getTime() - currentTime.getTime()) / 60000);
      if (diff > 1) step = Math.min(step, diff - 1);
      if (diff <= 1) step = 1;
    }

    const nextTime = currentTime ? addMinutes(currentTime, step) : parseStoryTime(nowTime());
    const name = currentData.name || "用户名";

    const inserted = createFloorElement({
      floor: `${currentFloorNumber + 1}楼`,
      name,
      time: formatStoryTime(nextTime),
      body: ""
    }, index + 1);

    currentItem.after(inserted);
    renumberFromFirst(list);

    const body = inserted.querySelector(".visual-body");
    if (body) body.focus();

    return inserted;
  }

  function rerollFromFirst(list) {
    const floors = Array.from(list.querySelectorAll(".visual-floor"));
    if (floors.length < 2) return false;

    const first = floors[0];
    const firstData = getFloorDataFromElement(first);

    if (!firstData.timeDate) {
      alert("第一楼的时间格式需要类似 03/03 11:23");
      return false;
    }

    const startFloorNumber = firstData.floorNumber ?? 1;
    let currentTime = firstData.timeDate;

    floors.forEach((item, index) => {
      item.querySelector(".floor-input").value = `${startFloorNumber + index}楼`;

      if (index === 0) {
        item.querySelector(".time-input").value = formatStoryTime(currentTime);
        return;
      }

      currentTime = addMinutes(currentTime, randomStepMinutes());
      item.querySelector(".time-input").value = formatStoryTime(currentTime);
    });

    return true;
  }

  function bind(list, onChange) {
    list.addEventListener("input", onChange);

    list.addEventListener("click", event => {
      if (event.target.classList.contains("insert-floor")) {
        const currentItem = event.target.closest(".visual-floor");
        if (!currentItem) return;
        insertFloorAfter(list, currentItem);
        onChange();
        return;
      }

      if (event.target.classList.contains("delete-floor")) {
        const floors = list.querySelectorAll(".visual-floor");
        if (floors.length <= 1) {
          alert("至少保留一层楼。");
          return;
        }

        event.target.closest(".visual-floor").remove();
        renumberFromFirst(list);
        onChange();
      }
    });

    list.addEventListener("focusin", event => {
      if (event.target.classList.contains("visual-body")) {
        lastFocusedBody = event.target;
      }
    });
  }

  return {
    setFloors,
    exportBBCode,
    addFloor,
    addGeneratedFloors,
    insertFloorAfter,
    renumberFromFirst,
    rerollFromFirst,
    execCommand,
    bind,
    nowTime
  };
})();


/* ===== merged file separator ===== */

const Mobile = (() => {
  function show(tab, elements) {
    const isEdit = tab === "edit";

    elements.editorPane.classList.toggle("hidden-mobile", !isEdit);
    elements.previewPane.classList.toggle("hidden-mobile", isEdit);
    elements.editTab.classList.toggle("active", isEdit);
    elements.previewTab.classList.toggle("active", !isEdit);

    Storage.setMobileTab(tab);
  }

  function bind(elements, onPreview) {
    elements.editTab.addEventListener("click", () => show("edit", elements));

    elements.previewTab.addEventListener("click", () => {
      onPreview();
      show("preview", elements);
    });

    const savedTab = Storage.getMobileTab();
    if (savedTab === "preview") {
      show("preview", elements);
    }
  }

  return { bind, show };
})();


/* ===== merged file separator ===== */

const SAMPLE_TEXT = `[color=gray][b]1楼　示例用户[/b]　01/01 12:00[/color]
这里是默认预览文本。
你可以像写普通文本一样输入内容，点“复制 BBCode”后会自动导出平台能用的代码。[br]
[color=gray][b]2楼　路过的人[/b]　01/01 12:05[/color]
这是第二层楼。

[blockquote][size=14]1楼 示例用户 01/01 12:00
这里是默认预览文本。[/size][/blockquote]

引用内容会显示成平台里的引用样式。[br]
[color=gray][b]3楼　测试账号[/b]　01/01 12:10[/color]
支持基础格式，比如 [b]加粗[/b]、[i]斜体[/i]、[u]下划线[/u]、[color=gray]灰色文字[/color]。

每一楼之间会自动用 [br] 分隔。`;

document.addEventListener("DOMContentLoaded", () => {
  const preview = document.getElementById("preview");
  const previewScroll = document.getElementById("previewScroll");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");
  const themeBtn = document.getElementById("themeBtn");
  const toolDrawerBtn = document.getElementById("toolDrawerBtn");
  const toolDrawer = document.getElementById("toolDrawer");
  const fontSizeSelect = document.getElementById("fontSizeSelect");
  const draftStatus = document.getElementById("draftStatus");
  const stats = document.getElementById("stats");

  const visualModeBtn = document.getElementById("visualModeBtn");
  const sourceModeBtn = document.getElementById("sourceModeBtn");
  const visualPanel = document.getElementById("visualPanel");
  const sourcePanel = document.getElementById("sourcePanel");
  const visualList = document.getElementById("visualList");
  const sourceEditor = document.getElementById("sourceEditor");
  const importSourceBtn = document.getElementById("importSourceBtn");
  const addFloorBtn = document.getElementById("addFloorBtn");
  const batchCountInput = document.getElementById("batchCountInput");
  const batchNameInput = document.getElementById("batchNameInput");
  const generateFloorsBtn = document.getElementById("generateFloorsBtn");
  const rerollTimeBtn = document.getElementById("rerollTimeBtn");
  const batchDrawerBtn = document.getElementById("batchDrawerBtn");
  const batchDrawerContent = document.getElementById("batchDrawerContent");

  const elements = {
    editorPane: document.getElementById("editorPane"),
    previewPane: document.getElementById("previewPane"),
    editTab: document.getElementById("editTab"),
    previewTab: document.getElementById("previewTab")
  };

  let saveTimer = null;
  let currentMode = Storage.getMode();

  function getCurrentBBCode() {
    if (currentMode === "source") return sourceEditor.value;
    return VisualEditor.exportBBCode(visualList);
  }

  function updateDraftStatus(text) {
    draftStatus.textContent = text;
  }

  function applyTheme() {
    const theme = Storage.getTheme();
    document.body.classList.toggle("dark", theme === "dark");
    themeBtn.textContent = theme === "dark" ? "浅色模式" : "深色模式";
  }

  function applyFontSize() {
    document.querySelector(".platform-preview").style.fontSize = fontSizeSelect.value + "px";
  }

  function render() {
    const source = getCurrentBBCode();
    preview.innerHTML = Preview.render(source);

    const result = Preview.getStats(source);
    stats.textContent = `${result.floors}楼 · ${result.chars}字`;

    applyFontSize();
  }

  function save() {
    Storage.setDraft(getCurrentBBCode());
    updateDraftStatus("已自动保存");
  }

  function scheduleSave() {
    updateDraftStatus("保存中…");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
  }

  function onChange() {
    render();
    scheduleSave();
  }

  function setDrawer(button, panel, storageKey, open) {
    panel.classList.toggle("drawer-collapsed", !open);
    const label = button.dataset.label || button.textContent.replace(/[▾▸]/g, "").trim();
    button.dataset.label = label;
    button.textContent = `${label} ${open ? "▾" : "▸"}`;
    localStorage.setItem(storageKey, open ? "open" : "closed");
  }

  function bindDrawer(button, panel, storageKey, defaultOpen = true) {
    const saved = localStorage.getItem(storageKey);
    const open = saved ? saved === "open" : defaultOpen;
    setDrawer(button, panel, storageKey, open);

    button.addEventListener("click", () => {
      const next = panel.classList.contains("drawer-collapsed");
      setDrawer(button, panel, storageKey, next);
    });
  }

  function setMode(mode) {
    if (mode === currentMode) return;

    if (mode === "source") {
      sourceEditor.value = VisualEditor.exportBBCode(visualList);
    } else {
      VisualEditor.setFloors(visualList, BBCodeParser.sourceToFloors(sourceEditor.value));
    }

    currentMode = mode;
    Storage.setMode(mode);

    visualModeBtn.classList.toggle("active", mode === "visual");
    sourceModeBtn.classList.toggle("active", mode === "source");
    visualPanel.classList.toggle("hidden", mode !== "visual");
    sourcePanel.classList.toggle("hidden", mode !== "source");

    render();
    save();
  }

  const initialDraft = Storage.getDraft() || SAMPLE_TEXT;
  VisualEditor.setFloors(visualList, BBCodeParser.sourceToFloors(initialDraft));
  sourceEditor.value = initialDraft;

  applyTheme();

  fontSizeSelect.value = Storage.getFontSize();

  if (currentMode === "source") {
    visualPanel.classList.add("hidden");
    sourcePanel.classList.remove("hidden");
    sourceModeBtn.classList.add("active");
    visualModeBtn.classList.remove("active");
  } else {
    currentMode = "visual";
    Storage.setMode("visual");
  }

  render();

  bindDrawer(toolDrawerBtn, toolDrawer, "forum_bbcode_preview_tool_drawer_v1", true);
  bindDrawer(batchDrawerBtn, batchDrawerContent, "forum_bbcode_preview_batch_drawer_v1", true);

  VisualEditor.bind(visualList, onChange);

  sourceEditor.addEventListener("input", onChange);

  document.querySelectorAll(".visual-toolbar [data-cmd]").forEach(button => {
    button.addEventListener("click", () => {
      VisualEditor.execCommand(button.dataset.cmd);
      onChange();
    });
  });

  addFloorBtn.addEventListener("click", () => {
    VisualEditor.addFloor(visualList);
    onChange();
  });

  generateFloorsBtn.addEventListener("click", () => {
    const count = Number(batchCountInput.value || 1);
    const defaultName = batchNameInput.value.trim() || "用户名";

    VisualEditor.addGeneratedFloors(visualList, count, defaultName);
    onChange();
  });

  rerollTimeBtn.addEventListener("click", () => {
    const changed = VisualEditor.rerollFromFirst(visualList);
    if (changed) onChange();
  });

  visualModeBtn.addEventListener("click", () => setMode("visual"));
  sourceModeBtn.addEventListener("click", () => setMode("source"));

  importSourceBtn.addEventListener("click", () => {
    VisualEditor.setFloors(visualList, BBCodeParser.sourceToFloors(sourceEditor.value));
    setMode("visual");
  });

  copyBtn.addEventListener("click", async () => {
    const code = getCurrentBBCode();
    await navigator.clipboard.writeText(code);
    copyBtn.textContent = "已复制";
    setTimeout(() => copyBtn.textContent = "复制 BBCode", 900);
  });

  clearBtn.addEventListener("click", () => {
    if (!confirm("确定清空当前草稿吗？")) return;

    VisualEditor.setFloors(visualList, [{
      floor: "1楼",
      name: "用户名",
      time: VisualEditor.nowTime(),
      body: ""
    }]);

    sourceEditor.value = "";
    currentMode = "visual";
    Storage.setMode("visual");
    visualModeBtn.classList.add("active");
    sourceModeBtn.classList.remove("active");
    visualPanel.classList.remove("hidden");
    sourcePanel.classList.add("hidden");

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

  previewScroll.addEventListener("scroll", () => {});

  Mobile.bind(elements, render);
});
