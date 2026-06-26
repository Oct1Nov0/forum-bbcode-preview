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

    return html;
  }

  function normalizeLineBreaks(text) {
    return String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  function splitFloors(source) {
    const normalized = normalizeLineBreaks(source);
    return normalized
      .split(/\[br\]/i)
      .map(part => part.trim())
      .filter(Boolean);
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

  return {
    escapeHtml,
    parseInline,
    splitFloors,
    parseHeader,
    linesToParagraphs,
    plainTextForCount
  };
})();
