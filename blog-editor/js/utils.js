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

  window.BLOG_EDITOR_UTILS = {
    getById,
    qs,
    qsa,
    isInside,
    isEditableElement,
    escapeHtml
  };
})();
