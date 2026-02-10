/**
 * Blog Editor DOM Utilities
 */

(() => {
  const getById = (id) => document.getElementById(id);

  const qs = (selector, root = document) => root.querySelector(selector);

  const qsa = (selector, root = document) => root.querySelectorAll(selector);

  const isInside = (target, selector) => !!(target && target.closest && target.closest(selector));

  const isEditableElement = (element) => !!(element && (element.isContentEditable || element.contentEditable === 'true'));

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const memoryStore = new Map();
  const storage = {
    getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
    setItem: (key, value) => {
      memoryStore.set(key, String(value));
    },
    removeItem: (key) => {
      memoryStore.delete(key);
    }
  };

  window.BLOG_EDITOR_UTILS = {
    getById,
    qs,
    qsa,
    isInside,
    isEditableElement,
    escapeHtml,
    storage
  };
})();
