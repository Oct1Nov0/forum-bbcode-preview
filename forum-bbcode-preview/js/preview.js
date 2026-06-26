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
      return '<div class="preview-empty">左边输入 BBCode 后，这里会显示平台效果。</div>';
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
