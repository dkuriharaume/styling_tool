/**
 * Text Formatting Toolbar (module entrypoint)
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};
  const toolbarModule = modules.toolbar || {};

  if (toolbarModule.initFormattingToolbar) {
    toolbarModule.initFormattingToolbar();
    return;
  }

  console.warn('Toolbar module not found. Ensure js/modules/toolbar.js is loaded before formatting-toolbar.js.');
})();
