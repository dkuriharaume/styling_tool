/**
 * Blog Editor Events Module (keyboard/global click/blur)
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  const setupKeyboard = (app) => {
    // Track IME composition state
    let isComposing = false;

    document.addEventListener('compositionstart', () => {
      isComposing = true;
    });

    document.addEventListener('compositionend', () => {
      isComposing = false;
    });

    document.addEventListener('keydown', (e) => {
      // Ignore all keyboard shortcuts during IME composition
      if (isComposing) {
        return;
      }

      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        app.state.undo();
      }

      // Cmd/Ctrl + Shift + Z = Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        app.state.redo();
      }

      // Delete/Backspace on selected block
      if ((e.key === 'Delete' || e.key === 'Backspace') &&
          app.state.selectedBlockId &&
          !e.target.isContentEditable) {
        e.preventDefault();
        app.state.deleteBlock(app.state.selectedBlockId);
      }
    });
  };

  const setupGlobalClickHandler = (app) => {
    document.addEventListener('click', (e) => {
      // Check if click is on canvas or inside editor blocks
      const clickedInsideBlock = app.isInside(e.target, '.editor-block');
      const clickedInsideCanvas = app.isInside(e.target, '.editor-canvas');
      const clickedInsideProperties = app.isInside(e.target, '.properties-panel');
      const clickedInsideModal = app.isInside(e.target, '.modal-content');
      const clickedInsideToolbar = app.isInside(e.target, '.formatting-toolbar');
      const clickedInsidePalette = app.isInside(e.target, '.component-palette');

      // If clicked on canvas (not on a block) while in draft browser, close it and show file operations
      if (clickedInsideCanvas && !clickedInsideBlock && app.isInDraftsBrowser) {
        app.showFileOperations();
        return; // Don't deselect in this case
      }

      // If viewing file operations, don't close them when clicking on canvas
      const isViewingFileOperations = !app.isInDraftsBrowser && app.getFileOperationsElement();
      if (clickedInsideCanvas && !clickedInsideBlock && isViewingFileOperations) {
        // Just deselect any selected block, but keep file operations open
        app.clearSelectedBlock();
        return;
      }

      // If clicked outside all interactive areas, deselect
      if (!clickedInsideBlock && !clickedInsideProperties && !clickedInsideModal && !clickedInsideToolbar && !clickedInsidePalette) {
        app.clearSelectedBlock();
      }
    });

    // Also handle clicks on the canvas background (not on blocks)
    const canvas = app.getCanvasBlocks();
    canvas.addEventListener('click', (e) => {
      // If clicking directly on canvas (not on a block), deselect
      if (e.target === canvas || e.target.classList.contains('empty-state')) {
        app.clearSelectedBlock();
      }
    });
  };

  const setupBlurHandler = (app) => {
    document.addEventListener('focusout', (e) => {
      // Check if focus is leaving a contentEditable element
      if (app.isEditableElement(e.target)) {
        // Use setTimeout to allow focus to move to new element
        setTimeout(() => {
          // Check if new focus target is not another contentEditable element
          const newFocus = document.activeElement;
          const isEditingAnotherElement = app.isEditableElement(newFocus);
          const isInPropertiesPanel = app.isInside(newFocus, '.properties-panel');
          const isInModal = app.isInside(newFocus, '.modal-content');
          const isInToolbar = app.isInside(newFocus, '.formatting-toolbar');

          // If not editing another element and not in UI panels, deselect
          if (!isEditingAnotherElement && !isInPropertiesPanel && !isInModal && !isInToolbar) {
            app.clearSelectedBlock();
          }
        }, 0);
      }
    });
  };

  modules.events = {
    setupKeyboard,
    setupGlobalClickHandler,
    setupBlurHandler
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
