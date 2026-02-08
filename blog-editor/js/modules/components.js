/**
 * Blog Editor Component Registry Module
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  const registry = {};

  const registerComponent = (type, handlers) => {
    if (!type || !handlers) return;
    registry[type] = handlers;
  };

  const getDefaultBlockData = (component) => {
    const entry = registry[component.type];
    if (entry && entry.createDefault) {
      return entry.createDefault(component);
    }
    return { type: component.type };
  };

  const createComponentElement = (block) => {
    const entry = registry[block.type];
    if (entry && entry.createElement) {
      return entry.createElement(block);
    }
    const div = document.createElement('div');
    div.textContent = `Unknown component: ${block.type}`;
    return div;
  };

  modules.components = {
    registerComponent,
    getDefaultBlockData,
    createComponentElement
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
