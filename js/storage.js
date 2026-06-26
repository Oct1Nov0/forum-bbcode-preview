const Storage = {
  draftKey: "forum_bbcode_preview_draft_v1",
  themeKey: "forum_bbcode_preview_theme_v1",
  fontKey: "forum_bbcode_preview_font_v1",
  tabKey: "forum_bbcode_preview_tab_v1",

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
  }
};
