/**
 * Blog Editor Exporters Module
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  const createHtmlExporter = (state) => {
    if (typeof HTMLExporter === 'function') {
      return new HTMLExporter(state);
    }
    console.warn('HTMLExporter not found. Ensure js/exporters/html-exporter.js is loaded before app.js.');
    return null;
  };

  modules.exporters = {
    createHtmlExporter
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
