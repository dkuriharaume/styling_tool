/**
 * Blog Editor Palette Module
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  const setupPalette = (app) => {
    const paletteItems = app.getElementsBySelector('.component-item');

    paletteItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        app.isDragging = true;
        app.draggedComponent = {
          type: item.dataset.type,
          subtype: item.dataset.subtype,
          variant: item.dataset.variant,
          listType: item.dataset.listType
        };
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', ''); // Required for Firefox

        // Add visual feedback
        app.getBody().classList.add('dragging');
        document.documentElement.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        app.isDragging = false;
        app.draggedComponent = null;
        app.getBody().classList.remove('dragging');
        document.documentElement.classList.remove('dragging');
        app.clearDropZones();
        app.render(); // Re-render after drag ends
      });
    });
  };

  modules.palette = { setupPalette };
  window.BLOG_EDITOR_MODULES = modules;
})();
