/**
 * Blog Editor UI Module (header, status, viewport, i18n, scroll)
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};
  const constants = window.BLOG_EDITOR_CONSTANTS || {};

  const setupScrollPersistence = (app) => {
    const editorCanvas = app.getEditorCanvas();
    if (!editorCanvas) return;

    // Save scroll position periodically
    let scrollTimeout;
    editorCanvas.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        app.saveScrollPosition();
      }, 200);
    });

    // Save before unload
    window.addEventListener('beforeunload', () => {
      app.saveScrollPosition();
    });
  };

  const saveScrollPosition = (app) => {
    const editorCanvas = app.getEditorCanvas();
    if (editorCanvas) {
      localStorage.setItem(constants.STORAGE_KEYS?.scrollPosition || 'blog-editor-scroll-position', editorCanvas.scrollTop);
    }
  };

  const restoreScrollPosition = (app) => {
    const editorCanvas = app.getEditorCanvas();
    const savedPosition = localStorage.getItem(constants.STORAGE_KEYS?.scrollPosition || 'blog-editor-scroll-position');

    if (editorCanvas && savedPosition !== null) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        editorCanvas.scrollTop = parseInt(savedPosition, 10);
      });
    }
  };

  const setupHeader = (app) => {
    // New button
    app.bindHeaderButton('btn-new', async () => {
      const title = await app.showPrompt('Create New Draft', 'Enter a title for your new draft:', 'Untitled Draft');
      if (title) {
        app.state.newDraft();
        app.state.setTitle(title);
        app.showStatus('New draft created', 'success');
      }
    });

    // Open button
    app.bindHeaderButton('btn-open', () => {
      app.showDraftsBrowser();
    });

    // Save As button (create new draft with custom name)
    app.bindHeaderButton('btn-save-as', () => {
      app.saveAsNewDraft();
    });

    // Export HTML button (in header)
    app.bindHeaderButton('btn-export-html-header', async (e) => {
      const button = e.currentTarget;
      const parts = app.getExportButtonParts(button);

      // Show loading state
      app.setExportButtonLoading(button, parts);

      // Safety reset in case clipboard promise hangs
      const safetyTimer = setTimeout(() => {
        app.resetExportButton(button, parts, 'export-success');
        app.resetExportButton(button, parts, 'export-error');
      }, 5000);
      try {
        if (!app.htmlExporter) {
          throw new Error('HTML exporter unavailable');
        }

        const success = await app.htmlExporter.copyToClipboard();

        if (success) {
          // Show success state
          app.setExportButtonSuccess(button, parts);
          // Don't show status message - button feedback is enough

          // Reset after 2 seconds
          setTimeout(() => {
            app.resetExportButton(button, parts, 'export-success');
          }, 2000);
        } else {
          // Show error state
          app.setExportButtonError(button, parts);
          app.showToast('Failed to copy to clipboard', 'error');

          // Reset after 2 seconds
          setTimeout(() => {
            app.resetExportButton(button, parts, 'export-error');
          }, 2000);
        }
      } catch (err) {
        app.setExportButtonError(button, parts);
        app.showToast('Failed to copy to clipboard', 'error');

        setTimeout(() => {
          app.resetExportButton(button, parts, 'export-error');
        }, 2000);
      } finally {
        clearTimeout(safetyTimer);
      }
    });

    // Modal close button
    app.bindHeaderButton('modal-close', () => {
      app.closeDraftsModal();
    });

    // Close modal on background click
    app.bindHeaderModal((e) => {
      if (e.target.id === 'drafts-modal') {
        app.closeDraftsModal();
      }
    });
  };

  const bindHeaderButton = (app, id, handler) => {
    const button = app.getHeaderButton(id);
    if (!button) return;
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', handler);
  };

  const bindHeaderModal = (app, handler) => {
    const modal = app.getDraftsModal();
    if (!modal) return;
    modal.addEventListener('click', handler);
  };

  const getExportButtonParts = (app, button) => {
    const icon = button.querySelector('.file-btn-icon');
    const label = button.querySelector('.file-btn-label');
    if (!button.dataset.originalLabel && label?.textContent) {
      button.dataset.originalLabel = label.textContent;
    }
    return {
      icon,
      label,
      originalIcon: icon?.textContent || '',
      originalLabel: button.dataset.originalLabel || label?.textContent || ''
    };
  };

  const setExportButtonLoading = (app, button, parts) => {
    button.style.pointerEvents = 'none';
    if (!button.dataset.originalLabel && parts.label?.textContent) {
      button.dataset.originalLabel = parts.label.textContent;
    }
    if (parts.icon) parts.icon.textContent = '⏳';
    if (parts.label) parts.label.textContent = 'Copying...';
  };

  const setExportButtonSuccess = (app, button, parts) => {
    button.classList.add('export-success');
    if (parts.icon) parts.icon.textContent = '✓';
    if (parts.label) parts.label.textContent = 'Copied to clipboard!';
  };

  const setExportButtonError = (app, button, parts) => {
    button.classList.add('export-error');
    if (parts.icon) parts.icon.textContent = '✗';
    if (parts.label) parts.label.textContent = 'Failed to copy';
  };

  const resetExportButton = (app, button, parts, className) => {
    button.classList.remove(className);
    if (parts.icon) parts.icon.textContent = parts.originalIcon;
    if (parts.label) {
      const original = button.dataset.originalLabel || parts.originalLabel;
      if (original) {
        parts.label.textContent = original;
      }
    }
    button.style.pointerEvents = '';
  };

  const getStatusElements = (app) => ({
    statusMessage: app.getElement('status-message'),
    statusIcon: app.getElement('status-icon'),
    statusText: app.getElement('status-text')
  });

  const showStatus = (app, message, type = 'info', duration = 3000) => {
    const { statusMessage, statusIcon, statusText } = app.getStatusElements();

    if (!statusMessage || !statusIcon || !statusText) return;

    // Ensure export button label isn't stuck on "Copying..."
    const exportBtn = app.getHeaderButton('btn-export-html-header');
    if (exportBtn) {
      const parts = app.getExportButtonParts(exportBtn);
      if (parts.label && parts.label.textContent === 'Copying...') {
        app.resetExportButton(exportBtn, parts, 'export-success');
        app.resetExportButton(exportBtn, parts, 'export-error');
      }
    }

    // Remove existing type classes
    statusMessage.classList.remove('success', 'error', 'info', 'saving');

    // Add new type class
    if (type) {
      statusMessage.classList.add(type);
    }

    // Set text
    statusText.textContent = message;

    // Auto-clear after duration (if not 0)
    if (duration > 0) {
      clearTimeout(app.statusTimer);
      app.statusTimer = setTimeout(() => {
        statusText.textContent = app.t('status.autoSave');
        statusMessage.classList.remove('success', 'error', 'info', 'saving');
      }, duration);
    }
  };

  const showStatusWithDefaults = (app, message, type = 'info', duration = 3000) => {
    showStatus(app, message, type, duration);
  };

  const showToast = (app, message, type = 'info') => {
    showStatusWithDefaults(app, message, type, 3000);
  };

  const showSaveIndicator = (app) => {
    showStatusWithDefaults(app, 'Saved', 'success', 2000);
  };

  const setupViewportToggle = (app) => {
    const viewportButtons = app.getElementsBySelector('.viewport-btn');

    // Load saved viewport preference
    const savedViewport = localStorage.getItem(constants.STORAGE_KEYS?.viewport || 'linkey-editor-viewport');
    if (savedViewport) {
      app.currentViewport = savedViewport;
      app.updateActiveButtons(viewportButtons, btn => btn.dataset.viewport === savedViewport);
    }

    viewportButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        app.updateActiveButtons(viewportButtons, button => button === btn);

        // Update viewport
        app.currentViewport = btn.dataset.viewport;

        // Save viewport preference
        localStorage.setItem(constants.STORAGE_KEYS?.viewport || 'linkey-editor-viewport', app.currentViewport);

        app.applyViewport();
      });
    });
  };

  const setupLanguageToggle = (app) => {
    const langButtons = app.getElementsBySelector('.lang-btn');

    // Set active button based on current language
    app.updateActiveButtons(langButtons, btn => btn.dataset.lang === app.currentLang);

    langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        app.updateActiveButtons(langButtons, button => button === btn);

        // Update language
        app.currentLang = btn.dataset.lang;

        // Save language preference
        localStorage.setItem(constants.STORAGE_KEYS?.language || 'linkey-lang', app.currentLang);

        // Apply language to UI
        app.applyLanguage();
      });
    });
  };

  const t = (app, key) => {
    const keys = key.split('.');
    let value = app.translations[app.currentLang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const updateActiveButtons = (_app, buttons, isActive) => {
    buttons.forEach(btn => {
      btn.classList.toggle('active', isActive(btn));
    });
  };

  const applyLanguage = (app) => {
    // Update all elements with data-i18n attribute
    app.getElementsBySelector('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = app.t(key);
    });

    // Update properties panel if showing file operations
    if (!app.state.getSelectedBlock() && !app.isInDraftsBrowser) {
      app.showFileOperations();
    }
  };

  const applyViewport = (app) => {
    const canvasWrapper = app.getCanvasWrapper();
    const viewportInfo = app.getViewportInfo();

    // Remove all viewport classes
    (constants.VIEWPORTS || []).forEach(viewport => {
      canvasWrapper.classList.remove(`viewport-${viewport}`);
    });

    // Add current viewport class
    canvasWrapper.classList.add(`viewport-${app.currentViewport}`);

    // Update info text
    viewportInfo.textContent = app.getViewportLabel(app.currentViewport);
  };

  modules.ui = {
    setupScrollPersistence,
    saveScrollPosition,
    restoreScrollPosition,
    setupHeader,
    bindHeaderButton,
    bindHeaderModal,
    getExportButtonParts,
    setExportButtonLoading,
    setExportButtonSuccess,
    setExportButtonError,
    resetExportButton,
    showStatus,
    showToast,
    showSaveIndicator,
    showStatusWithDefaults,
    getStatusElements,
    setupViewportToggle,
    setupLanguageToggle,
    t,
    updateActiveButtons,
    applyLanguage,
    applyViewport
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
