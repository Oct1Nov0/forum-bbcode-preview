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
