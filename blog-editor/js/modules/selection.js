/**
 * Blog Editor Selection Module
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  const clearSelectedBlock = (app) => {
    if (app.state.selectedBlockId) {
      app.state.selectBlock(null);
    }
  };

  const updateSelectedBlockStyles = (app, selectedId) => {
    app.getElementsBySelector('.editor-block').forEach(el => {
      if (el.dataset.blockId === selectedId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  };

  const handleBlockSelect = (app, id) => {
    // Update visual selection
    app.updateSelectedBlockStyles(id);

    // Update properties panel
    app.updatePropertiesPanel();
  };

  modules.selection = {
    clearSelectedBlock,
    updateSelectedBlockStyles,
    handleBlockSelect
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
