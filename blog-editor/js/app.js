/**
 * LINKEY Blog Editor - Main Application
 */

const VIEWPORT_CONFIG = {
  desktop: { label: 'Desktop 4K - 3840px' },
  laptop: { label: 'Laptop Full HD - 1920px' },
  tablet: { label: 'Tablet - 1024px' },
  mobile: { label: 'Mobile - 414px' }
};

const VIEWPORTS = Object.keys(VIEWPORT_CONFIG);

const STORAGE_KEYS = {
  language: 'linkey-lang',
  viewport: 'linkey-editor-viewport',
  scrollPosition: 'blog-editor-scroll-position'
};

const COMPONENT_DEFS = [
  // Headers
  { type: 'header', level: 2, key: 'h2' },
  { type: 'header', level: 3, key: 'h3' },
  { type: 'header', level: 4, key: 'h4' },
  // Paragraphs
  { type: 'paragraph', variant: 'normal', key: 'p' },
  { type: 'paragraph', variant: 'small', key: 'p-small' },
  { type: 'paragraph', variant: 'small-gray', key: 'p-small-gray' },
  // Lists
  { type: 'list', listType: 'ul', key: 'ul' },
  { type: 'list', listType: 'ol', key: 'ol' },
  { type: 'list', listType: 'ol-title', key: 'ol-title' },
  { type: 'list', listType: 'dl', key: 'dl' },
  // Future components (cards, buttons, boxes, images)
  { type: 'card', subtype: '2-col', key: 'card-2col' },
  { type: 'card', subtype: '3-col', key: 'card-3col' },
  { type: 'button', subtype: 'regular', key: 'button' },
  { type: 'button', subtype: 'large', key: 'button-large' },
  { type: 'box', subtype: 'basic', key: 'box-basic' },
  { type: 'box', subtype: 'shadow', key: 'box-shadow' },
  { type: 'box', subtype: 'summary', key: 'box-summary' },
  { type: 'box', subtype: 'qa', key: 'box-qa' },
  { type: 'image', key: 'image' }
];

const MARGIN_CONFIG = {
  header: {
    top: {
      2: { mobile: 30, desktop: 50 },
      3: { mobile: 0, desktop: 50 },
      4: { mobile: 30, desktop: 30 }
    },
    bottom: {
      2: { mobile: 20, desktop: 30 },
      3: { mobile: 30, desktop: 40 },
      4: { mobile: 20, desktop: 20 }
    }
  },
  paragraph: {
    top: { default: 10 },
    bottom: { default: 0 }
  },
  list: {
    top: { ul: 0, ol: 60, 'ol-title': 60, dl: 50 },
    bottom: { default: 0 }
  },
  card: {
    top: { mobile: 30, desktop: 50 },
    bottom: { mobile: 20, desktop: 40 }
  },
  button: {
    top: { mobile: 20, desktop: 30 },
    bottom: { default: 0 }
  },
  box: {
    top: { mobile: 30, desktop: 40 },
    bottom: { mobile: 20, desktop: 30 }
  },
  image: {
    top: { mobile: 20, desktop: 30 },
    bottom: { mobile: 15, desktop: 20 }
  }
};

const resolveMarginValue = (values, isMobile) => {
  if (!values) return 0;
  if (typeof values === 'number') return values;
  if (isMobile) return values.mobile ?? values.desktop ?? values.default ?? 0;
  return values.desktop ?? values.mobile ?? values.default ?? 0;
};

class BlogEditorApp {
  constructor() {
    this.state = new EditorState();
    this.htmlExporter = new HTMLExporter(this.state);
    this.draggedComponent = null;
    this.draggedBlock = null;
    this.dropPosition = -1;
    this.currentViewport = 'desktop';
    this.isDragging = false;
    this.statusTimer = null;
    this.isInDraftsBrowser = false; // Track if user is browsing drafts
    this.currentLang = localStorage.getItem(STORAGE_KEYS.language) || 'en';

    // Pre-calculate margin collapse lookup table for all combinations
    this.marginLookup = this.buildMarginLookupTable();

    // i18n translations
    this.translations = {
      en: {
        export: {
          label: 'Copy HTML',
          desc: 'Export as HTML code'
        },
        status: {
          autoSave: 'Auto-save enabled',
          loaded: 'Loaded',
          pageLoaded: 'Page loaded',
          saving: 'Saving...',
          saved: 'Saved'
        },
        fileOps: {
          recent: 'Recent Files',
          current: 'Current',
          document: 'Document',
          newDraft: 'New Draft',
          newDraftDesc: 'Create a new draft with title',
          openDraft: 'Open Draft',
          openDraftDesc: 'Browse and open saved drafts',
          saveAs: 'Save As',
          saveAsDesc: 'Save a copy with new name'
        },
        palette: {
          headers: 'Headers',
          text: 'Text',
          lists: 'Lists',
          unordered: 'Unordered',
          ordered: 'Ordered',
          orderedTitle: 'Ordered w/ Title',
          dictionary: 'Dictionary'
        },
        properties: {
          header: 'Header',
          level: 'Level',
          paragraph: 'Paragraph',
          list: 'List',
          type: 'Type',
          items: 'Items',
          itemsNote: 'Edit list items directly in the canvas. Use buttons below to add/remove items.',
          addItem: '+ Add Item',
          deleteBlock: 'Delete Block'
        }
      },
      ja: {
        export: {
          label: 'HTML エクスポート',
          desc: 'HTMLコードとして出力'
        },
        status: {
          autoSave: '編集内容は自動でセーブされます',
          loaded: '読み込み完了',
          pageLoaded: 'ページ読み込み完了',
          saving: '保存中...',
          saved: '保存しました'
        },
        fileOps: {
          recent: '最近使用したファイル',
          current: '現在',
          document: 'ドキュメント',
          newDraft: '新規ドラフト',
          newDraftDesc: 'タイトル付きの新規ドラフトを作成',
          openDraft: 'ドラフトを開く',
          openDraftDesc: '保存済みのドラフトを参照して開く',
          saveAs: '名前を付けて保存',
          saveAsDesc: '新しい名前でコピーを保存'
        },
        palette: {
          headers: '見出し',
          text: 'テキスト',
          lists: 'リスト',
          unordered: '箇条書き',
          ordered: '番号付き',
          orderedTitle: '番号付き（タイトル有）',
          dictionary: '用語集'
        },
        properties: {
          header: '見出し',
          level: 'レベル',
          paragraph: '段落',
          list: 'リスト',
          type: 'タイプ',
          items: '項目',
          itemsNote: 'リスト項目はキャンバス上で直接編集できます。以下のボタンで項目を追加・削除できます。',
          addItem: '+ 項目を追加',
          deleteBlock: 'ブロックを削除'
        }
      }
    };

    this.init();
  }
  
  init() {
    // Setup event listeners
    this.setupPalette();
    this.setupCanvas();
    this.setupProperties();
    this.setupHeader();
    this.setupViewportToggle();
    this.setupLanguageToggle();
    this.setupKeyboard();
    this.setupGlobalClickHandler();
    this.setupBlurHandler();
    this.setupScrollPersistence();
    
    // Listen to state changes
    this.state.on('change', () => {
      // Don't re-render during drag operations
      if (!this.isDragging) {
        this.render();
      }
    });
    this.state.on('select', (id) => this.handleBlockSelect(id));
    this.state.on('saving', () => this.showStatus(this.t('status.saving'), 'saving', 0));
    this.state.on('save', () => this.showSaveIndicator());
    
    // Apply saved language
    this.applyLanguage();
    
    // Load last edited draft on startup
    this.loadLastEditedDraft();
    
    // Initial render
    this.render();
    this.applyViewport();
    
    // Restore scroll position after render
    this.restoreScrollPosition();
  }
  
  /**
   * Setup scroll position persistence
   */
  setupScrollPersistence() {
    const editorCanvas = this.getEditorCanvas();
    if (!editorCanvas) return;
    
    // Save scroll position periodically
    let scrollTimeout;
    editorCanvas.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.saveScrollPosition();
      }, 200);
    });
    
    // Save before unload
    window.addEventListener('beforeunload', () => {
      this.saveScrollPosition();
    });
  }
  
  /**
   * Save current scroll position
   */
  saveScrollPosition() {
    const editorCanvas = this.getEditorCanvas();
    if (editorCanvas) {
      localStorage.setItem(STORAGE_KEYS.scrollPosition, editorCanvas.scrollTop);
    }
  }
  
  /**
   * Restore saved scroll position
   */
  restoreScrollPosition() {
    const editorCanvas = this.getEditorCanvas();
    const savedPosition = localStorage.getItem(STORAGE_KEYS.scrollPosition);
    
    if (editorCanvas && savedPosition !== null) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        editorCanvas.scrollTop = parseInt(savedPosition, 10);
      });
    }
  }

  /**
   * Get editor canvas element
   */
  getEditorCanvas() {
    return this.getElementBySelector('.editor-canvas');
  }
  
  /**
   * Setup component palette
   */
  setupPalette() {
    const paletteItems = this.getElementsBySelector('.component-item');
    
    paletteItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this.isDragging = true;
        this.draggedComponent = {
          type: item.dataset.type,
          subtype: item.dataset.subtype,
          variant: item.dataset.variant,
          listType: item.dataset.listType
        };
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', ''); // Required for Firefox
        
        // Add visual feedback
        this.getBody().classList.add('dragging');
      });
      
      item.addEventListener('dragend', () => {
        this.isDragging = false;
        this.draggedComponent = null;
        this.getBody().classList.remove('dragging');
        this.clearDropZones();
        this.render(); // Re-render after drag ends
      });
    });
  }
  
  /**
   * Setup editor canvas
   */
  setupCanvas() {
    const canvas = this.getCanvasBlocks();
    const canvasWrapper = this.getCanvasWrapper();
    const editorCanvas = this.getEditorCanvas();
    
    // Auto-scroll configuration
    let autoScrollInterval = null;
    const clearAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    };
    
    // Setup title input
    const titleInput = this.getCanvasTitleInput();
    titleInput.value = this.state.title;
    titleInput.addEventListener('input', (e) => {
      this.state.setTitle(e.target.value);
    });
    
    // Global dragover prevention to keep drag alive
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.setDropEffect(e);
    });
    
    // Drag over editor canvas - implement continuous auto-scroll based on mouse position
    // Use editorCanvas (the full scrollable area) instead of just canvas (the blocks container)
    const scrollTarget = editorCanvas || canvasWrapper;
    scrollTarget.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.setDropEffect(e);
      
      // Clear existing interval
      clearAutoScroll();
      
      // Get viewport bounds (the scrollable area)
      const rect = scrollTarget.getBoundingClientRect();
      const mouseY = e.clientY;
      const relativeY = mouseY - rect.top;
      const centerY = rect.height / 2;
      const offsetFromCenter = relativeY - centerY;
      
      // Calculate scroll speed based on distance from center
      // Speed increases as you move further from center
      const maxSpeed = 40;
      const distanceFromCenter = Math.abs(offsetFromCenter);
      const maxDistance = rect.height / 2;
      
      // Normalize distance (0 at center, 1 at edges)
      const normalizedDistance = distanceFromCenter / maxDistance;
      
      // Calculate speed with smooth acceleration (quadratic easing)
      const speed = normalizedDistance * normalizedDistance * maxSpeed;
      
      // Scroll if in upper or lower half
      if (offsetFromCenter < 0 && scrollTarget.scrollTop > 0) {
        // Upper half - scroll up
        autoScrollInterval = setInterval(() => {
          const scrollAmount = Math.max(1, speed);
          scrollTarget.scrollTop -= scrollAmount;
          if (scrollTarget.scrollTop <= 0) {
            clearAutoScroll();
          }
        }, 16); // ~60fps
      } else if (offsetFromCenter > 0) {
        // Lower half - scroll down
        const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
        if (scrollTarget.scrollTop < maxScroll) {
          autoScrollInterval = setInterval(() => {
            const scrollAmount = Math.max(1, speed);
            scrollTarget.scrollTop += scrollAmount;
            const currentMaxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
            if (scrollTarget.scrollTop >= currentMaxScroll) {
              clearAutoScroll();
            }
          }, 16); // ~60fps
        }
      }
    });
    
    // Stop auto-scroll on drag leave
    canvas.addEventListener('dragleave', () => {
      clearAutoScroll();
    });
    
    // Stop auto-scroll on drop
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      
      // Clear auto-scroll
      clearAutoScroll();
      
      // If dropping on empty canvas, add at the end
      if (this.state.blocks.length === 0) {
        this.handleDrop(0);
      }
    });
    
    // Stop auto-scroll on drag end (via palette)
    this.getBody().addEventListener('dragend', () => {
      clearAutoScroll();
    });
  }
  
  /**
   * Setup properties panel
   */
  setupProperties() {
    // Will be populated when a block is selected
  }
  
  /**
   * Setup header actions
   */
  setupHeader() {
    // New button
    this.bindHeaderButton('btn-new', async () => {
      const title = await this.showPrompt('Create New Draft', 'Enter a title for your new draft:', 'Untitled Draft');
      if (title) {
        this.state.newDraft();
        this.state.setTitle(title);
        this.showStatus('New draft created', 'success');
      }
    });
    
    // Open button
    this.bindHeaderButton('btn-open', () => {
      this.showDraftsBrowser();
    });
    
    // Save As button (create new draft with custom name)
    this.bindHeaderButton('btn-save-as', () => {
      this.saveAsNewDraft();
    });
    
    // Export HTML button (in header)
    this.bindHeaderButton('btn-export-html-header', async (e) => {
      const button = e.currentTarget;
      const parts = this.getExportButtonParts(button);
      
      // Show loading state
      this.setExportButtonLoading(button, parts);
      
      const success = await this.htmlExporter.copyToClipboard();
      
      if (success) {
        // Show success state
        this.setExportButtonSuccess(button, parts);
        // Don't show status message - button feedback is enough
        
        // Reset after 2 seconds
        setTimeout(() => {
          this.resetExportButton(button, parts, 'export-success');
        }, 2000);
      } else {
        // Show error state
        this.setExportButtonError(button, parts);
        this.showToast('Failed to copy to clipboard', 'error');
        
        // Reset after 2 seconds
        setTimeout(() => {
          this.resetExportButton(button, parts, 'export-error');
        }, 2000);
      }
    });
    
    // Modal close button
    this.bindHeaderButton('modal-close', () => {
      this.closeDraftsModal();
    });
    
    // Close modal on background click
    this.bindHeaderModal((e) => {
      if (e.target.id === 'drafts-modal') {
        this.closeDraftsModal();
      }
    });
  }

  /**
   * Bind a click handler to a header button by id
   */
  bindHeaderButton(id, handler) {
    const button = this.getHeaderButton(id);
    if (!button) return;
    button.addEventListener('click', handler);
  }

  /**
   * Bind a click handler to the drafts modal
   */
  bindHeaderModal(handler) {
    const modal = this.getDraftsModal();
    if (!modal) return;
    modal.addEventListener('click', handler);
  }

  /**
   * Get export button parts and original text
   */
  getExportButtonParts(button) {
    const icon = button.querySelector('.file-btn-icon');
    const label = button.querySelector('.file-btn-label');
    return {
      icon,
      label,
      originalIcon: icon?.textContent || '',
      originalLabel: label?.textContent || ''
    };
  }

  /**
   * Set export button loading state
   */
  setExportButtonLoading(button, parts) {
    button.style.pointerEvents = 'none';
    if (parts.icon) parts.icon.textContent = '⏳';
    if (parts.label) parts.label.textContent = 'Copying...';
  }

  /**
   * Set export button success state
   */
  setExportButtonSuccess(button, parts) {
    button.classList.add('export-success');
    if (parts.icon) parts.icon.textContent = '✓';
    if (parts.label) parts.label.textContent = 'Copied to clipboard!';
  }

  /**
   * Set export button error state
   */
  setExportButtonError(button, parts) {
    button.classList.add('export-error');
    if (parts.icon) parts.icon.textContent = '✗';
    if (parts.label) parts.label.textContent = 'Failed to copy';
  }

  /**
   * Reset export button state
   */
  resetExportButton(button, parts, className) {
    button.classList.remove(className);
    if (parts.icon) parts.icon.textContent = parts.originalIcon;
    if (parts.label) parts.label.textContent = parts.originalLabel;
    button.style.pointerEvents = '';
  }
  
  /**
   * Show toast notification
   */
  /**
   * Show message in status bar
   */
  showStatus(message, type = 'info', duration = 3000) {
    const { statusMessage, statusIcon, statusText } = this.getStatusElements();
    
    if (!statusMessage || !statusIcon || !statusText) return;
    
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
      clearTimeout(this.statusTimer);
      this.statusTimer = setTimeout(() => {
        statusText.textContent = this.t('status.autoSave');
        statusMessage.classList.remove('success', 'error', 'info', 'saving');
      }, duration);
    }
  }
  
  /**
   * Show toast notification (legacy - now redirects to status bar)
   */
  showToast(message, type = 'info') {
    this.showStatusWithDefaults(message, type, 3000);
  }
  
  /**
   * Show save indicator briefly
   */
  showSaveIndicator() {
    this.showStatusWithDefaults('Saved', 'success', 2000);
  }

  /**
   * Show status message with default duration
   */
  showStatusWithDefaults(message, type = 'info', duration = 3000) {
    this.showStatus(message, type, duration);
  }

  /**
   * Get status bar elements
   */
  getStatusElements() {
    return {
      statusMessage: this.getElement('status-message'),
      statusIcon: this.getElement('status-icon'),
      statusText: this.getElement('status-text')
    };
  }
  
  /**
   * Setup viewport toggle
   */
  setupViewportToggle() {
    const viewportButtons = this.getElementsBySelector('.viewport-btn');
    
    // Load saved viewport preference
    const savedViewport = localStorage.getItem(STORAGE_KEYS.viewport);
    if (savedViewport) {
      this.currentViewport = savedViewport;
      this.updateActiveButtons(viewportButtons, btn => btn.dataset.viewport === savedViewport);
    }
    
    viewportButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateActiveButtons(viewportButtons, button => button === btn);
        
        // Update viewport
        this.currentViewport = btn.dataset.viewport;
        
        // Save viewport preference
        localStorage.setItem(STORAGE_KEYS.viewport, this.currentViewport);
        
        this.applyViewport();
      });
    });
  }
  
  /**
   * Setup language toggle
   */
  setupLanguageToggle() {
    const langButtons = this.getElementsBySelector('.lang-btn');
    
    // Set active button based on current language
    this.updateActiveButtons(langButtons, btn => btn.dataset.lang === this.currentLang);
    
    langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateActiveButtons(langButtons, button => button === btn);
        
        // Update language
        this.currentLang = btn.dataset.lang;
        
    // Save language preference
    localStorage.setItem(STORAGE_KEYS.language, this.currentLang);
        
        // Apply language to UI
        this.applyLanguage();
      });
    });
  }
  
  /**
   * Get translation
   */
  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }

  /**
   * Update active class on a button group
   */
  updateActiveButtons(buttons, isActive) {
    buttons.forEach(btn => {
      btn.classList.toggle('active', isActive(btn));
    });
  }
  
  /**
   * Apply language to UI
   */
  applyLanguage() {
    // Update all elements with data-i18n attribute
    this.getElementsBySelector('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    
    // Update properties panel if showing file operations
    if (!this.state.getSelectedBlock() && !this.isInDraftsBrowser) {
      this.showFileOperations();
    }
  }
  
  /**
   * Apply viewport size to canvas
   */
  applyViewport() {
    const canvasWrapper = this.getCanvasWrapper();
    const viewportInfo = this.getViewportInfo();
    
    // Remove all viewport classes
    VIEWPORTS.forEach(viewport => {
      canvasWrapper.classList.remove(`viewport-${viewport}`);
    });
    
    // Add current viewport class
    canvasWrapper.classList.add(`viewport-${this.currentViewport}`);
    
    // Update info text
    viewportInfo.textContent = this.getViewportLabel(this.currentViewport);
  }

  /**
   * Get canvas wrapper element
   */
  getCanvasWrapper() {
    return this.getElementBySelector('.canvas-wrapper');
  }

  /**
   * Get canvas blocks container
   */
  getCanvasBlocks() {
    return this.getElement('canvas-blocks');
  }

  /**
   * Get canvas title input
   */
  getCanvasTitleInput() {
    return this.getElement('canvas-title-input');
  }

  /**
   * Get viewport info element
   */
  getViewportInfo() {
    return this.getElement('viewport-info');
  }

  /**
   * Get header button element
   */
  getHeaderButton(id) {
    return this.getElement(id);
  }

  /**
   * Get drafts modal element
   */
  getDraftsModal() {
    return this.getElement('drafts-modal');
  }

  /**
   * Get drafts list elements
   */
  getDraftsListElements() {
    return {
      draftsList: this.getElement('drafts-list'),
      emptyState: this.getElement('empty-state')
    };
  }

  /**
   * Get properties panel container
   */
  getPropertiesPanel() {
    return this.getElement('properties-content');
  }

  /**
   * Get a control inside the properties panel
   */
  getPropertiesControl(id) {
    return this.getPanelElement(`#${id}`);
  }

  /**
   * Generic getElementById helper
   */
  getElement(id) {
    return document.getElementById(id);
  }

  /**
   * Generic querySelector helper
   */
  getElementBySelector(selector) {
    return document.querySelector(selector);
  }

  /**
   * Get document body
   */
  getBody() {
    return document.body;
  }

  /**
   * Generic querySelectorAll helper
   */
  getElementsBySelector(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Get file operations element
   */
  getFileOperationsElement() {
    return this.getPanelElement('.file-operations');
  }

  /**
   * Get block properties container
   */
  getBlockPropertiesContainer() {
    return this.getPanelElement('.block-properties');
  }

  /**
   * Get drafts browser element
   */
  getDraftsBrowserElement() {
    return this.getPanelElement('.drafts-browser');
  }

  /**
   * Get drafts back button
   */
  getDraftsBackButton() {
    return this.getPanelElement('#btn-back-to-files');
  }

  /**
   * Get draft item elements
   */
  getDraftItemElements() {
    return this.getPanelElements('.draft-item');
  }

  /**
   * Get draft delete buttons
   */
  getDraftDeleteButtons() {
    return this.getPanelElements('.btn-delete-draft');
  }

  /**
   * Query within the properties panel
   */
  getPanelElement(selector) {
    const panel = this.getPropertiesPanel();
    if (!panel) return null;
    return panel.querySelector(selector);
  }

  /**
   * Query all elements within the properties panel
   */
  getPanelElements(selector) {
    const panel = this.getPropertiesPanel();
    if (!panel) return [];
    return panel.querySelectorAll(selector);
  }

  /**
   * Check if a target is inside a selector
   */
  isInside(target, selector) {
    return !!(target && target.closest(selector));
  }

  /**
   * Check if an element is content editable
   */
  isEditableElement(element) {
    return !!(element && (element.isContentEditable || element.contentEditable === 'true'));
  }

  /**
   * Clear selected block state
   */
  clearSelectedBlock() {
    if (this.state.selectedBlockId) {
      this.state.selectBlock(null);
    }
  }

  /**
   * Update selection classes for blocks
   */
  updateSelectedBlockStyles(selectedId) {
    this.getElementsBySelector('.editor-block').forEach(el => {
      if (el.dataset.blockId === selectedId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  /**
   * Get confirm dialog elements
   */
  getConfirmDialogElements() {
    return {
      dialog: this.getElement('confirm-dialog'),
      titleEl: this.getElement('confirm-title'),
      messageEl: this.getElement('confirm-message'),
      okBtn: this.getElement('confirm-ok'),
      cancelBtn: this.getElement('confirm-cancel')
    };
  }

  /**
   * Get prompt dialog elements
   */
  getPromptDialogElements() {
    return {
      dialog: this.getElement('prompt-dialog'),
      titleEl: this.getElement('prompt-title'),
      messageEl: this.getElement('prompt-message'),
      inputEl: this.getElement('prompt-input'),
      okBtn: this.getElement('prompt-ok'),
      cancelBtn: this.getElement('prompt-cancel')
    };
  }

  /**
   * Set drag drop effect based on current drag state
   */
  setDropEffect(event) {
    event.dataTransfer.dropEffect = this.isDragging ? 'move' : 'copy';
  }

  /**
   * Get viewport label for UI
   */
  getViewportLabel(viewport) {
    return VIEWPORT_CONFIG[viewport]?.label || '';
  }

  /**
   * Check if viewport is mobile/tablet
   */
  isMobileViewport(viewport) {
    return viewport === 'mobile' || viewport === 'tablet';
  }
  
  /**
   * Setup keyboard shortcuts
   */
  setupKeyboard() {
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
        this.state.undo();
      }
      
      // Cmd/Ctrl + Shift + Z = Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        this.state.redo();
      }
      
      // Delete/Backspace on selected block
      if ((e.key === 'Delete' || e.key === 'Backspace') && 
          this.state.selectedBlockId && 
          !e.target.isContentEditable) {
        e.preventDefault();
        this.state.deleteBlock(this.state.selectedBlockId);
      }
    });
  }
  
  /**
   * Setup global click handler for deselecting blocks
   */
  setupGlobalClickHandler() {
    document.addEventListener('click', (e) => {
      // Check if click is on canvas or inside editor blocks
  const clickedInsideBlock = this.isInside(e.target, '.editor-block');
  const clickedInsideCanvas = this.isInside(e.target, '.editor-canvas');
  const clickedInsideProperties = this.isInside(e.target, '.properties-panel');
  const clickedInsideModal = this.isInside(e.target, '.modal-content');
  const clickedInsideToolbar = this.isInside(e.target, '.formatting-toolbar');
  const clickedInsidePalette = this.isInside(e.target, '.component-palette');
      
      // If clicked on canvas (not on a block) while in draft browser, close it and show file operations
      if (clickedInsideCanvas && !clickedInsideBlock && this.isInDraftsBrowser) {
        this.showFileOperations();
        return; // Don't deselect in this case
      }
      
      // If viewing file operations, don't close them when clicking on canvas
      const isViewingFileOperations = !this.isInDraftsBrowser && this.getFileOperationsElement();
      if (clickedInsideCanvas && !clickedInsideBlock && isViewingFileOperations) {
        // Just deselect any selected block, but keep file operations open
        this.clearSelectedBlock();
        return;
      }
      
      // If clicked outside all interactive areas, deselect
      if (!clickedInsideBlock && !clickedInsideProperties && !clickedInsideModal && !clickedInsideToolbar && !clickedInsidePalette) {
        this.clearSelectedBlock();
      }
    });
    
    // Also handle clicks on the canvas background (not on blocks)
    const canvas = this.getCanvasBlocks();
    canvas.addEventListener('click', (e) => {
      // If clicking directly on canvas (not on a block), deselect
      if (e.target === canvas || e.target.classList.contains('empty-state')) {
        this.clearSelectedBlock();
      }
    });
  }
  
  /**
   * Setup blur handler to deselect blocks when focus leaves contentEditable elements
   */
  setupBlurHandler() {
    document.addEventListener('focusout', (e) => {
      // Check if focus is leaving a contentEditable element
  if (this.isEditableElement(e.target)) {
        // Use setTimeout to allow focus to move to new element
        setTimeout(() => {
          // Check if new focus target is not another contentEditable element
          const newFocus = document.activeElement;
          const isEditingAnotherElement = this.isEditableElement(newFocus);
          const isInPropertiesPanel = this.isInside(newFocus, '.properties-panel');
          const isInModal = this.isInside(newFocus, '.modal-content');
          const isInToolbar = this.isInside(newFocus, '.formatting-toolbar');
          
          // If not editing another element and not in UI panels, deselect
          if (!isEditingAnotherElement && !isInPropertiesPanel && !isInModal && !isInToolbar) {
            this.clearSelectedBlock();
          }
        }, 0);
      }
    });
  }
  
  /**
   * Render all blocks
   */
  render() {
    const canvas = this.getCanvasBlocks();
    const titleInput = this.getCanvasTitleInput();
    
    // Update title input to match state
    if (titleInput && titleInput.value !== this.state.title) {
      titleInput.value = this.state.title;
    }
    
    canvas.innerHTML = '';
    
    // Show empty state if no blocks, but still add a drop zone
    if (this.state.blocks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="icon">📝</div>
        <p>Start by dragging a component from the left panel</p>
        <p style="font-size: 12px; color: #ccc;">Or click a component to add it here</p>
      `;
      canvas.appendChild(emptyState);
      
      // Add a drop zone for the first item
      const dropZone = this.createDropZone(0);
      canvas.appendChild(dropZone);
      
      // Update properties panel
      this.updatePropertiesPanel();
      return;
    }
    
    // Get dragged block index if reordering
    const draggedBlockIndex = this.draggedBlock 
      ? this.state.blocks.findIndex(b => b.id === this.draggedBlock.id)
      : -1;
    
    // Render each block
    this.state.blocks.forEach((block, index) => {
      // Add drop zone before each block
      // Skip drop zone if it's directly before or after the dragged block
      // position === draggedBlockIndex means drop zone right before the dragged block
      // position === draggedBlockIndex + 1 means drop zone right after the dragged block
      const shouldSkipDropZone = draggedBlockIndex !== -1 && 
                                  (index === draggedBlockIndex || index === draggedBlockIndex + 1);
      
      if (!shouldSkipDropZone) {
        const dropZoneBefore = this.createDropZone(index);
        canvas.appendChild(dropZoneBefore);
      }
      
      // Add the block
      const blockElement = this.createBlock(block);
      
      // Calculate and apply margin collapse
      if (index > 0) {
        const prevBlock = this.state.blocks[index - 1];
        const marginOffset = this.calculateMarginCollapse(prevBlock, block);
        if (marginOffset !== 0) {
          // Don't scale the margin - CSS zoom will handle it naturally
          // The marginOffset is in base pixels matching the theme's rem units (1rem = 10px)
          blockElement.style.marginTop = `${marginOffset}px`;
        } else {
          // Clear any previous margin
          blockElement.style.marginTop = '';
        }
      } else {
        // Clear margin for first block
        blockElement.style.marginTop = '';
      }
      
      canvas.appendChild(blockElement);
    });
    
    // Add final drop zone
    // Skip if position (this.state.blocks.length) equals draggedBlockIndex + 1
    const finalPosition = this.state.blocks.length;
    const shouldSkipFinalDropZone = draggedBlockIndex !== -1 && 
                                     finalPosition === draggedBlockIndex + 1;
    
    if (!shouldSkipFinalDropZone) {
      const dropZoneAfter = this.createDropZone(finalPosition);
      canvas.appendChild(dropZoneAfter);
    }
    
    // Update properties panel
    this.updatePropertiesPanel();
  }
  
  /**
   * Build a comprehensive margin lookup table for all component combinations
   * Key format: "prevType-prevSubtype_currentType-currentSubtype_viewport"
   * Returns: collapsed margin value in pixels (negative for overlap)
   */
  buildMarginLookupTable() {
    const table = {};
    const viewports = VIEWPORTS;
    
    // Calculate for all combinations
    viewports.forEach(viewport => {
      const isMobile = this.isMobileViewport(viewport);
      
      COMPONENT_DEFS.forEach(prev => {
        const prevBottom = this.getComponentBottomMargin(prev, isMobile);
        
        COMPONENT_DEFS.forEach(current => {
          const currentTop = this.getComponentTopMargin(current, isMobile);
          
          // Calculate collapsed margin
          let collapsedMargin = 0;
          if (prevBottom > 0 && currentTop > 0) {
            // Both have margins - collapse by negating the smaller one
            collapsedMargin = -Math.min(prevBottom, currentTop);
          }
          
          // Store in lookup table
          const key = `${prev.key}_${current.key}_${viewport}`;
          table[key] = collapsedMargin;
        });
      });
    });
    
    return table;
  }
  
  /**
   * Get bottom margin for a component (used in lookup table building)
   */
  getComponentBottomMargin(component, isMobile) {
    const config = MARGIN_CONFIG[component.type];
    if (!config) return 0;

    if (component.type === 'header') {
      return resolveMarginValue(config.bottom?.[component.level], isMobile);
    }

    if (component.type === 'list') {
      return resolveMarginValue(config.bottom?.default, isMobile);
    }

    return resolveMarginValue(config.bottom, isMobile);
  }
  
  /**
   * Get top margin for a component (used in lookup table building)
   */
  getComponentTopMargin(component, isMobile) {
    const config = MARGIN_CONFIG[component.type];
    if (!config) return 0;

    if (component.type === 'header') {
      return resolveMarginValue(config.top?.[component.level], isMobile);
    }

    if (component.type === 'list') {
      const listKey = this.getListKey(component.listType);
      return resolveMarginValue(config.top?.[listKey], isMobile);
    }

    return resolveMarginValue(config.top, isMobile);
  }
  
  /**
   * Normalize list key
   */
  getListKey(listType) {
    return listType || 'ul';
  }

  /**
   * Get lookup key for a block
   */
  getBlockLookupKey(block) {
    if (block.type === 'header') {
      return `h${block.level}`;
    } else if (block.type === 'paragraph') {
      if (block.variant === 'small' || block.variant === 'small-gray') {
        return `p-${block.variant}`;
      }
      return 'p';
    } else if (block.type === 'list') {
      return this.getListKey(block.listType);
    } else if (block.type === 'card') {
      return `card-${block.subtype || '2-col'}`;
    } else if (block.type === 'button') {
      return block.subtype === 'large' ? 'button-large' : 'button';
    } else if (block.type === 'box') {
      return `box-${block.subtype || 'basic'}`;
    } else if (block.type === 'image') {
      return 'image';
    }
    return block.type;
  }
  
  /**
   * Calculate margin collapse offset between two blocks
   * Returns negative value to negate the excess margin
   */
  calculateMarginCollapse(prevBlock, currentBlock) {
    // Get lookup keys for both blocks
    const prevKey = this.getBlockLookupKey(prevBlock);
    const currentKey = this.getBlockLookupKey(currentBlock);
    const lookupKey = `${prevKey}_${currentKey}_${this.currentViewport}`;
    
    // Look up pre-calculated margin
    const margin = this.marginLookup[lookupKey];
    
    if (margin !== undefined) {
      return margin;
    }
    
    // Fallback to dynamic calculation if not in lookup table
    const prevBottomMargin = this.getBottomMargin(prevBlock);
    const currentTopMargin = this.getTopMargin(currentBlock);
    
    if (prevBottomMargin > 0 && currentTopMargin > 0) {
      return -Math.min(prevBottomMargin, currentTopMargin);
    }
    
    return 0;
  }
  
  /**
   * Get bottom margin for a block type (in pixels, at base 10px font-size)
   */
  getBottomMargin(block) {
    return this.getBlockMarginValue(block, 'bottom');
  }
  
  /**
   * Get top margin for a block type (in pixels, at base 10px font-size)
   */
  getTopMargin(block) {
    return this.getBlockMarginValue(block, 'top');
  }

  /**
   * Resolve margin value for a block
   */
  getBlockMarginValue(block, edge) {
    const viewport = this.currentViewport;
    const isMobile = this.isMobileViewport(viewport);
    const config = MARGIN_CONFIG[block.type];

    if (!config) return 0;

    if (block.type === 'header') {
      return resolveMarginValue(config[edge]?.[block.level], isMobile);
    }

    if (block.type === 'paragraph') {
      return resolveMarginValue(config[edge]?.default, isMobile);
    }

    if (block.type === 'list') {
      if (edge === 'top') {
        const listKey = this.getListKey(block.listType);
        return resolveMarginValue(config[edge]?.[listKey], isMobile);
      }
      return resolveMarginValue(config[edge]?.default, isMobile);
    }

    return resolveMarginValue(config[edge], isMobile);
  }
  
  /**
   * Create a drop zone element
   */
  createDropZone(position) {
    const zone = document.createElement('div');
    zone.className = 'drop-zone';
    zone.dataset.position = position;
    
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('active');
      this.dropPosition = position;
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('active');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Drop on zone at position:', position);
      zone.classList.remove('active');
      this.handleDrop(position);
    });
    
    return zone;
  }
  
  /**
   * Clear all drop zone highlights
   */
  clearDropZones() {
    this.getElementsBySelector('.drop-zone').forEach(zone => {
      zone.classList.remove('active');
    });
  }
  
  /**
   * Handle component drop (from palette or reorder)
   */
  handleDrop(position) {
    // Handle block reordering
    if (this.draggedBlock) {
      const currentIndex = this.state.blocks.findIndex(b => b.id === this.draggedBlock.id);
      
      if (currentIndex !== -1 && currentIndex !== position && currentIndex !== position - 1) {
        const targetPosition = position > currentIndex ? position - 1 : position;
        this.state.moveBlock(this.draggedBlock.id, targetPosition);
        
        // Force re-render to fix spacing
        setTimeout(() => {
          this.render();
        }, 0);
      }
      this.draggedBlock = null;
      return;
    }
    
    // Handle new component from palette
    if (this.draggedComponent) {
      const blockData = this.createBlockData(this.draggedComponent);
      const block = this.state.addBlock(blockData, position);
      
      // Select the newly added block
      this.state.selectBlock(block.id);
      
      this.draggedComponent = null;
    }
  }
  
  /**
   * Create block data from component type
   */
  createBlockData(component) {
    switch (component.type) {
      case 'header':
        return {
          type: 'header',
          level: parseInt(component.subtype) || 2,
          preset: component.subtype === '2' ? 'blue' : 'default',
          content: 'New Heading'
        };
      case 'paragraph':
        return {
          type: 'paragraph',
          variant: component.variant || 'normal',
          content: 'Click to start typing...'
        };
      case 'list':
        return {
          type: 'list',
          listType: component.listType || 'ul',
          items: component.listType === 'dl' 
            ? [
                { term: 'Key 1', definition: 'Value 1' },
                { term: 'Key 2', definition: 'Value 2' },
                { term: 'Key 3', definition: 'Value 3' }
              ]
            : component.listType === 'ol-title'
            ? [
                { title: 'First point', content: 'Description here' },
                { title: 'Second point', content: 'Description here' },
                { title: 'Third point', content: 'Description here' }
              ]
            : [
                { content: 'List item 1' },
                { content: 'List item 2' },
                { content: 'List item 3' }
              ]
        };
      default:
        return { type: component.type };
    }
  }
  
  /**
   * Create a block element
   */
  createBlock(block) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-block';
    wrapper.dataset.blockId = block.id;
    
    if (block.id === this.state.selectedBlockId) {
      wrapper.classList.add('selected');
    }
    
    // Create drag handle (separate from toolbar, on the left)
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.draggable = true; // Set as property
    dragHandle.setAttribute('draggable', 'true'); // Also set as attribute for compatibility
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = 'Drag to reorder';
    wrapper.appendChild(dragHandle);
    
    // Setup drag handlers on the drag handle
    dragHandle.addEventListener('dragstart', (e) => {
      // Set drag data - MUST be done synchronously
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', block.id);
      
      // Create custom drag image - clone the wrapper with all styles
      const dragImage = wrapper.cloneNode(true);
    const canvasWrapper = this.getCanvasWrapper();
      
      // Position off-screen but keep it in the canvas wrapper to inherit zoom
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-9999px';
      dragImage.style.left = '0';
      dragImage.style.opacity = '0.8';
      dragImage.style.pointerEvents = 'none';
      dragImage.style.zIndex = '10000';
      
      // Remove the drag handle and toolbar from the clone
      const clonedHandle = dragImage.querySelector('.drag-handle');
      const clonedToolbar = dragImage.querySelector('.block-toolbar');
      if (clonedHandle) clonedHandle.remove();
      if (clonedToolbar) clonedToolbar.remove();
      
      // Add a border for visibility
      dragImage.style.border = '2px solid var(--editor-primary)';
      dragImage.style.borderRadius = '8px';
      dragImage.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      dragImage.style.background = 'white';
      
      // Append to canvas-wrapper so it inherits zoom
      canvasWrapper.appendChild(dragImage);
      
      // Set the drag image
      e.dataTransfer.setDragImage(dragImage, 20, 20);
      
      // Remove the clone after a brief delay
      setTimeout(() => {
        if (dragImage.parentNode) {
          dragImage.parentNode.removeChild(dragImage);
        }
      }, 100);
      
      // Store dragged block reference - MUST be done synchronously
      this.isDragging = true;
      this.draggedBlock = block;
      this.draggedComponent = null;
      
      // Defer DOM manipulations to avoid interfering with drag
      setTimeout(() => {
        wrapper.classList.add('dragging-block');
        this.getBody().classList.add('dragging');
        
        // Hide adjacent drop zones
        const draggedIndex = this.state.blocks.findIndex(b => b.id === block.id);
        this.getElementsBySelector('.drop-zone').forEach((zone) => {
          const position = parseInt(zone.dataset.position);
          if (position === draggedIndex || position === draggedIndex + 1) {
            zone.style.display = 'none';
          }
        });
      }, 0);
    });
    
    dragHandle.addEventListener('dragend', (e) => {
      // Clean up after drag
      this.isDragging = false;
      this.draggedBlock = null;
      wrapper.classList.remove('dragging-block');
  this.getBody().classList.remove('dragging');
      this.clearDropZones();
      
      // Re-render to clean up drop zones and fix spacing
      setTimeout(() => {
        this.render();
      }, 0);
    });
    
    // Create toolbar (on the right, without drag button)
    const toolbar = document.createElement('div');
    toolbar.className = 'block-toolbar';
    toolbar.innerHTML = `
      <button class="btn-delete" title="Delete">🗑️</button>
      <button class="btn-move-up" title="Move Up">⬆️</button>
      <button class="btn-move-down" title="Move Down">⬇️</button>
    `;
    wrapper.appendChild(toolbar);
    
    // Setup toolbar actions
    toolbar.querySelector('.btn-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = await this.showConfirm('Delete Block', 'Are you sure you want to delete this block?');
      if (confirmed) {
        this.state.deleteBlock(block.id);
      }
    });
    
    toolbar.querySelector('.btn-move-up').addEventListener('click', (e) => {
      e.stopPropagation();
      const index = this.state.blocks.findIndex(b => b.id === block.id);
      if (index > 0) {
        this.state.moveBlock(block.id, index - 1);
      }
    });
    
    toolbar.querySelector('.btn-move-down').addEventListener('click', (e) => {
      e.stopPropagation();
      const index = this.state.blocks.findIndex(b => b.id === block.id);
      if (index < this.state.blocks.length - 1) {
        this.state.moveBlock(block.id, index + 1);
      }
    });
    
    // Create component
    const component = this.createComponent(block);
    wrapper.appendChild(component);
    
    // Select on click
    wrapper.addEventListener('click', () => {
      this.state.selectBlock(block.id);
    });
    
    // Handle content changes
    component.addEventListener('content-change', (e) => {
      if (block.type === 'list') {
        // List component sends data object with type and items
        this.state.updateBlock(block.id, { 
          listType: e.detail.data.type,
          items: e.detail.data.items 
        });
      } else {
        // Other components send content
        this.state.updateBlock(block.id, { content: e.detail.content });
      }
    });
    
    return wrapper;
  }
  
  /**
   * Create component element based on type
   */
  createComponent(block) {
    switch (block.type) {
      case 'header':
        const header = document.createElement('header-component');
        header.setData(block);
        return header;
      case 'paragraph':
        const paragraph = document.createElement('paragraph-component');
        paragraph.setData(block);
        return paragraph;
      case 'list':
        const list = document.createElement('list-component');
        list.setData({ type: block.listType, items: block.items });
        return list;
      default:
        const div = document.createElement('div');
        div.textContent = `Unknown component: ${block.type}`;
        return div;
    }
  }
  
  /**
   * Handle block selection
   */
  handleBlockSelect(id) {
    // Update visual selection
    this.updateSelectedBlockStyles(id);
    
    // Update properties panel
    this.updatePropertiesPanel();
  }
  
  /**
   * Update properties panel
   */
  updatePropertiesPanel() {
    const panel = this.getPropertiesPanel();
    const selectedBlock = this.state.getSelectedBlock();
    
    if (!selectedBlock) {
      // If draft browser is showing and no block selected, keep it
      if (this.isInDraftsBrowser) {
        return;
      }
      
      // Show file operations when no block selected
      this.showFileOperations();
      
      // Clear block properties when nothing is selected
      const propsContainer = this.getBlockPropertiesContainer();
      if (propsContainer) {
        propsContainer.remove();
      }
      
      return;
    }
    
    // Close draft browser if it's open when a block is selected
    if (this.isInDraftsBrowser) {
      this.isInDraftsBrowser = false;
    }
    
    // Hide file operations when block is selected
    const fileOps = this.getFileOperationsElement();
    if (fileOps) {
      fileOps.style.display = 'none';
    }
    
    // Remove draft browser if it's showing
    const draftsBrowser = this.getDraftsBrowserElement();
    if (draftsBrowser) {
      draftsBrowser.remove();
    }
    
    // Create properties container if not exists
    let propsContainer = this.getBlockPropertiesContainer();
    if (!propsContainer) {
      propsContainer = document.createElement('div');
      propsContainer.className = 'block-properties';
      panel.appendChild(propsContainer);
    }
    
    // Render properties based on block type
    switch (selectedBlock.type) {
      case 'header':
        this.renderHeaderProperties(selectedBlock, propsContainer);
        break;
      case 'paragraph':
        this.renderParagraphProperties(selectedBlock, propsContainer);
        break;
      case 'list':
        this.renderListProperties(selectedBlock, propsContainer);
        break;
      default:
        propsContainer.innerHTML = '<p>No properties available</p>';
    }
  }
  
  /**
   * Render header properties
   */
  renderHeaderProperties(block, container) {
    container.innerHTML = `
      <h3>${this.t('properties.header')}</h3>
      
      <div class="property-group">
        <label>${this.t('properties.level')}</label>
        <select id="prop-level">
          <option value="1" ${block.level === 1 ? 'selected' : ''}>H1</option>
          <option value="2" ${block.level === 2 ? 'selected' : ''}>H2</option>
          <option value="3" ${block.level === 3 ? 'selected' : ''}>H3</option>
          <option value="4" ${block.level === 4 ? 'selected' : ''}>H4</option>
        </select>
      </div>
      
      <div class="property-group">
        <label>Style Preset</label>
        <select id="prop-preset">
          <option value="default" ${block.preset === 'default' ? 'selected' : ''}>Default</option>
          ${block.level === 2 || block.level === 4 ? '<option value="blue" ' + (block.preset === 'blue' ? 'selected' : '') + '>Blue</option>' : ''}
          ${block.level === 2 || block.level === 4 ? '<option value="red" ' + (block.preset === 'red' ? 'selected' : '') + '>Red</option>' : ''}
        </select>
      </div>
      
      <div class="property-group">
        <label>Content</label>
        <textarea id="prop-content">${block.content || ''}</textarea>
      </div>
      
      <button class="btn btn-danger btn-small" id="prop-delete">${this.t('properties.deleteBlock')}</button>
    `;
    
    // Setup property change listeners
    this.getPropertiesControl('prop-level').addEventListener('change', (e) => {
      this.state.updateBlock(block.id, { level: parseInt(e.target.value) });
    });
    
    this.getPropertiesControl('prop-preset').addEventListener('change', (e) => {
      this.state.updateBlock(block.id, { preset: e.target.value });
    });
    
    this.getPropertiesControl('prop-content').addEventListener('input', (e) => {
      this.state.updateBlock(block.id, { content: e.target.value });
    });
    
    this.getPropertiesControl('prop-delete').addEventListener('click', async () => {
      const confirmed = await this.showConfirm('Delete Block', 'Are you sure you want to delete this block?');
      if (confirmed) {
        this.state.deleteBlock(block.id);
      }
    });
  }
  
  /**
   * Render paragraph properties
   */
  renderParagraphProperties(block, container) {
    container.innerHTML = `
      <h3>${this.t('properties.paragraph')}</h3>
      
      <div class="property-group">
        <label>Text Variant</label>
        <select id="prop-variant">
          <option value="normal" ${block.variant === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="small" ${block.variant === 'small' ? 'selected' : ''}>Small (Highlighted)</option>
          <option value="small-gray" ${block.variant === 'small-gray' ? 'selected' : ''}>Small (Gray)</option>
        </select>
      </div>
      
      <div class="property-group">
        <label>Content</label>
        <div class="property-note">Select text in the editor to format it (bold, info, warning, link).</div>
      </div>
      
      <button class="btn btn-danger btn-small" id="prop-delete">${this.t('properties.deleteBlock')}</button>
    `;
    
    // Setup property change listeners
    this.getPropertiesControl('prop-variant').addEventListener('change', (e) => {
      this.state.updateBlock(block.id, { variant: e.target.value });
    });
    
    this.getPropertiesControl('prop-delete').addEventListener('click', async () => {
      const confirmed = await this.showConfirm('Delete Block', 'Are you sure you want to delete this block?');
      if (confirmed) {
        this.state.deleteBlock(block.id);
      }
    });
  }
  
  /**
   * Render list properties
   */
  renderListProperties(block, container) {
    const listTypeLabels = {
      'ul': this.t('palette.unordered'),
      'ol': this.t('palette.ordered'),
      'ol-title': this.t('palette.orderedTitle'),
      'dl': this.t('palette.dictionary')
    };
    
    container.innerHTML = `
      <h3>${this.t('properties.list')}</h3>
      
      <div class="property-group">
        <label>${this.t('properties.type')}</label>
        <select id="prop-list-type">
          <option value="ul" ${block.listType === 'ul' ? 'selected' : ''}>${listTypeLabels['ul']}</option>
          <option value="ol" ${block.listType === 'ol' ? 'selected' : ''}>${listTypeLabels['ol']}</option>
          <option value="ol-title" ${block.listType === 'ol-title' ? 'selected' : ''}>${listTypeLabels['ol-title']}</option>
          <option value="dl" ${block.listType === 'dl' ? 'selected' : ''}>${listTypeLabels['dl']}</option>
        </select>
      </div>
      
      <div class="property-group">
        <label>${this.t('properties.items')}</label>
        <div class="property-note">${this.t('properties.itemsNote')}</div>
        <button class="btn btn-secondary btn-small" id="prop-add-item" style="margin-top: 1rem;">${this.t('properties.addItem')}</button>
      </div>
      
      <button class="btn btn-danger btn-small" id="prop-delete">${this.t('properties.deleteBlock')}</button>
    `;
    
    // Setup property change listeners
    this.getPropertiesControl('prop-list-type').addEventListener('change', (e) => {
      const newType = e.target.value;
      const oldType = block.listType;
      
      // Convert items format when changing type, preserving existing content
      let newItems;
      
      if (newType === 'dl') {
        // Converting to dictionary list
        newItems = block.items.map((item, index) => {
          if (item.term !== undefined) {
            // Already a dictionary item
            return item;
          } else if (item.title !== undefined) {
            // From ol-title
            return { term: item.title, definition: item.content || '' };
          } else {
            // From ul or ol - ALWAYS parse content looking for " : " separator
            const content = item.content || '';
            const separatorIndex = content.indexOf(' : ');
            if (separatorIndex > 0) {
              // Split by " : " separator
              return { 
                term: content.substring(0, separatorIndex).trim(), 
                definition: content.substring(separatorIndex + 3).trim()
              };
            } else {
              // No separator found - use content as term, leave definition BLANK
              return { term: content || `Term ${index + 1}`, definition: '' };
            }
          }
        });
      } else if (newType === 'ol-title') {
        // Converting to ordered list with titles
        newItems = block.items.map((item, index) => {
          if (item.title !== undefined) {
            // Already has title
            return item;
          } else if (item.term !== undefined) {
            // From dictionary
            return { title: item.term, content: item.definition || '' };
          } else {
            // From ul or ol - parse content looking for " : " separator
            const content = item.content || '';
            const separatorIndex = content.indexOf(' : ');
            if (separatorIndex > 0) {
              // Split by " : " separator
              return { 
                title: content.substring(0, separatorIndex).trim(), 
                content: content.substring(separatorIndex + 3).trim()
              };
            } else {
              // No separator found - use content as title, leave content BLANK
              return { title: content || `Title ${index + 1}`, content: '' };
            }
          }
        });
      } else {
        // Converting to ul or ol (simple list)
        newItems = block.items.map((item) => {
          if (item.content !== undefined && item.title === undefined && item.term === undefined) {
            // Already a simple item
            return item;
          } else if (item.title !== undefined) {
            // From ol-title
            if (item.content && item.content.trim()) {
              // Has content - combine with separator
              return { content: item.title + ' : ' + item.content };
            } else {
              // No content - just use title
              return { content: item.title };
            }
          } else if (item.term !== undefined) {
            // From dictionary
            if (item.definition && item.definition.trim()) {
              // Has definition - combine with separator
              return { content: item.term + ' : ' + item.definition };
            } else {
              // No definition - just use term
              return { content: item.term };
            }
          } else {
            return { content: item.content || '' };
          }
        });
      }
      
      this.state.updateBlock(block.id, { listType: newType, items: newItems });
    });
    
    this.getPropertiesControl('prop-add-item').addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent focus changes
      const component = this.getElementBySelector(`[data-block-id="${block.id}"] list-component`);
      if (component) {
        component.addItem();
      }
    });
    
    this.getPropertiesControl('prop-delete').addEventListener('click', async () => {
      const confirmed = await this.showConfirm('Delete Block', 'Are you sure you want to delete this block?');
      if (confirmed) {
        this.state.deleteBlock(block.id);
      }
    });
  }
  
  /**
   * Show file operations in properties panel
   */
  showFileOperations() {
    this.isInDraftsBrowser = false;
    const panel = this.getPropertiesPanel();
    
    // Get recent drafts
    const drafts = this.state.getDraftsList();
    const recentDrafts = drafts
      .sort((a, b) => {
        const timeA = a.updatedAt || a.timestamp || 0;
        const timeB = b.updatedAt || b.timestamp || 0;
        return timeB - timeA;
      })
      .slice(0, 3);
    
    let recentFilesHtml = '';
    if (recentDrafts.length > 0) {
      const recentItems = recentDrafts.map(draft => {
        const isCurrent = draft.id === this.state.currentDraftId;
        return `
          <button class="recent-file-item ${isCurrent ? 'current' : ''}" data-draft-id="${draft.id}">
            <span class="recent-file-icon">📄</span>
            <span class="recent-file-name">${this.escapeHtml(draft.name)}</span>
            ${isCurrent ? `<span class="recent-file-badge">${this.t('fileOps.current')}</span>` : ''}
          </button>
        `;
      }).join('');
      
      recentFilesHtml = `
        <div class="recent-files-section">
          <h4>${this.t('fileOps.recent')}</h4>
          <div class="recent-files-list">
            ${recentItems}
          </div>
        </div>
      `;
    }
    
    panel.innerHTML = `
      <!-- File Operations (shown when no block selected) -->
      <div class="file-operations">
        ${recentFilesHtml}
        
        <div class="file-section">
          <h4>${this.t('fileOps.document')}</h4>
          <button class="file-btn" id="btn-new">
            <span class="file-btn-icon">📄</span>
            <div class="file-btn-content">
              <span class="file-btn-label">${this.t('fileOps.newDraft')}</span>
              <span class="file-btn-desc">${this.t('fileOps.newDraftDesc')}</span>
            </div>
          </button>
          <button class="file-btn" id="btn-open">
            <span class="file-btn-icon">📂</span>
            <div class="file-btn-content">
              <span class="file-btn-label">${this.t('fileOps.openDraft')}</span>
              <span class="file-btn-desc">${this.t('fileOps.openDraftDesc')}</span>
            </div>
          </button>
          <button class="file-btn" id="btn-save-as">
            <span class="file-btn-icon">💾</span>
            <div class="file-btn-content">
              <span class="file-btn-label">${this.t('fileOps.saveAs')}</span>
              <span class="file-btn-desc">${this.t('fileOps.saveAsDesc')}</span>
            </div>
          </button>
        </div>
      </div>
    `;
    
    // Attach event listeners for recent files
    recentDrafts.forEach(draft => {
      const btn = this.getPanelElement(`[data-draft-id="${draft.id}"]`);
      if (btn && draft.id !== this.state.currentDraftId) {
        btn.addEventListener('click', () => {
          this.loadDraft(draft.id);
        });
      }
    });
    
    // Re-attach event listeners
    this.setupHeader();
  }
  
  /**
   * Show drafts browser in properties panel
   */
  showDraftsBrowser() {
    this.isInDraftsBrowser = true;
    const panel = this.getPropertiesPanel();
    const drafts = this.state.getDraftsList();
    
    if (drafts.length === 0) {
      panel.innerHTML = `
        <div class="drafts-browser">
          <div class="drafts-header">
            <h3>Open Draft</h3>
            <button class="btn-back" id="btn-back-to-files">← Back</button>
          </div>
          <div class="empty-state">
            <p>No saved drafts found</p>
            <p style="font-size: 12px; color: #999;">Create a new draft to get started</p>
          </div>
        </div>
      `;
    } else {
      const draftsHtml = drafts.map(draft => {
        const date = new Date(draft.updatedAt || draft.timestamp);
        const dateStr = date.toLocaleString();
        const isCurrent = draft.id === this.state.currentDraftId;
        
        return `
          <div class="draft-item ${isCurrent ? 'current' : ''}" data-id="${draft.id}">
            <div class="draft-info">
              <div class="draft-name">${this.escapeHtml(draft.name)}</div>
              <div class="draft-meta">${dateStr}</div>
              ${isCurrent ? '<div class="draft-badge">Current</div>' : ''}
            </div>
            <div class="draft-actions">
              <button class="btn-delete-draft" data-id="${draft.id}">Delete</button>
            </div>
          </div>
        `;
      }).join('');
      
      panel.innerHTML = `
        <div class="drafts-browser">
          <div class="drafts-header">
            <h3>Open Draft</h3>
            <button class="btn-back" id="btn-back-to-files">← Back</button>
          </div>
          <div class="drafts-list">
            ${draftsHtml}
          </div>
        </div>
      `;
    }
    
    // Add event listeners
    const backBtn = this.getDraftsBackButton();
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showFileOperations();
      });
    }
    
    // Add listeners for clicking on draft cards (open draft)
    this.getDraftItemElements().forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on delete button
        if (e.target.closest('.btn-delete-draft')) {
          return;
        }
        const draftId = item.dataset.id;
        this.loadDraft(draftId);
        // Stay in the browser - don't close it
        // Refresh the list to update the "Current" badge
        this.showDraftsBrowser();
      });
    });
    
    // Add listeners for delete button
    this.getDraftDeleteButtons().forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const draftId = btn.dataset.id;
        const draft = drafts.find(d => d.id === draftId);
        const confirmed = await this.showConfirm('Delete Draft', `Are you sure you want to delete "${draft.name}"?`);
        if (confirmed) {
          this.state.deleteDraft(draftId);
          this.showStatus('Draft deleted', 'success');
          this.showDraftsBrowser(); // Refresh list
        }
      });
    });
  }
  
  /**
   * Open drafts manager modal (deprecated - keeping for compatibility)
   */
  openDraftsModal() {
    // Redirect to new browser
    this.showDraftsBrowser();
  }
  
  /**
   * Old modal function - keeping structure for now
   */
  openDraftsModalOld() {
    const modal = this.getDraftsModal();
    const { draftsList, emptyState } = this.getDraftsListElements();
    
    // Get all drafts
    const drafts = this.state.getDraftsList();
    
    // Clear list
    draftsList.innerHTML = '';
    
    if (drafts.length === 0) {
      emptyState.style.display = 'block';
      draftsList.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      draftsList.style.display = 'flex';
      
      // Populate drafts
      drafts.forEach(draft => {
        const item = document.createElement('div');
        item.className = 'draft-item';
        
        const date = new Date(draft.updatedAt || draft.timestamp);
        const dateStr = date.toLocaleString();
        
        item.innerHTML = `
          <div class="draft-info">
            <div class="draft-name">${this.escapeHtml(draft.name)}</div>
            <div class="draft-meta">Last modified: ${dateStr}</div>
          </div>
          <div class="draft-actions">
            <button class="btn-open-draft" data-id="${draft.id}">Open</button>
            <button class="btn-delete-draft" data-id="${draft.id}">Delete</button>
          </div>
        `;
        
        draftsList.appendChild(item);
        
        // Add event listeners
        item.querySelector('.btn-open-draft').addEventListener('click', (e) => {
          e.stopPropagation();
          this.loadDraft(draft.id);
        });
        
        item.querySelector('.btn-delete-draft').addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = await this.showConfirm('Delete Draft', `Are you sure you want to delete "${draft.name}"?`);
          if (confirmed) {
            this.state.deleteDraft(draft.id);
            this.openDraftsModal(); // Refresh list
            this.showToast('Draft deleted', 'success');
          }
        });
        
        // Click on item to open
        item.addEventListener('click', () => {
          this.loadDraft(draft.id);
        });
      });
    }
    
    modal.classList.add('show');
  }
  
  /**
   * Save as new draft (prompts for name)
   */
  async saveAsNewDraft() {
    const name = await this.showPrompt('Save As', 'Enter draft name:', this.state.title || 'Untitled Draft');
    if (name !== null && name.trim() !== '') {
      this.state.saveAs(name);
      this.showStatus('Draft saved as new!', 'success');
    }
  }
  
  /**
   * Close drafts manager modal
   */
  closeDraftsModal() {
    const modal = this.getDraftsModal();
    modal.classList.remove('show');
  }
  
  /**
   * Load a draft
   */
  loadDraft(draftId) {
    if (this.state.load(draftId)) {
      this.closeDraftsModal();
      this.showStatus('Draft loaded', 'success');
    } else {
      this.showStatus('Failed to load draft', 'error');
    }
  }
  
  /**
   * Load the last edited draft on startup
   */
  loadLastEditedDraft() {
    const drafts = this.state.getDraftsList();
    
    if (drafts.length === 0) {
      // No drafts exist, stay with new draft
      this.showStatus(`✓ ${this.t('status.pageLoaded')}`, 'success', 2000);
      return;
    }
    
    // Sort drafts by updatedAt timestamp (most recent first)
    const sortedDrafts = drafts.sort((a, b) => {
      const timeA = a.updatedAt || a.timestamp || 0;
      const timeB = b.updatedAt || b.timestamp || 0;
      return timeB - timeA;
    });
    
    // Load the most recently edited draft
    const lastDraft = sortedDrafts[0];
    if (lastDraft && lastDraft.id) {
      this.state.load(lastDraft.id);
      this.showStatus(`✓ ${this.t('status.loaded')}: ${lastDraft.name}`, 'success', 2000);
      console.log(`Loaded last edited draft: ${lastDraft.name}`);
    } else {
      this.showStatus(`✓ ${this.t('status.pageLoaded')}`, 'success', 2000);
    }
  }
  
  /**
   * Escape HTML for safe display
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Show custom confirm dialog
   */
  showConfirm(title, message) {
    return new Promise((resolve) => {
      const { dialog, titleEl, messageEl, okBtn, cancelBtn } = this.getConfirmDialogElements();
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      dialog.classList.add('show');
      
      const cleanup = () => {
        dialog.classList.remove('show');
        okBtn.removeEventListener('click', handleOk);
        cancelBtn.removeEventListener('click', handleCancel);
        dialog.removeEventListener('click', handleBackdrop);
      };
      
      const handleOk = () => {
        cleanup();
        resolve(true);
      };
      
      const handleCancel = () => {
        cleanup();
        resolve(false);
      };
      
      const handleBackdrop = (e) => {
        if (e.target === dialog) {
          handleCancel();
        }
      };
      
      okBtn.addEventListener('click', handleOk);
      cancelBtn.addEventListener('click', handleCancel);
      dialog.addEventListener('click', handleBackdrop);
    });
  }
  
  /**
   * Show custom prompt dialog
   */
  showPrompt(title, message, defaultValue = '') {
    return new Promise((resolve) => {
      const { dialog, titleEl, messageEl, inputEl, okBtn, cancelBtn } = this.getPromptDialogElements();
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      inputEl.value = defaultValue;
      dialog.classList.add('show');
      
      // Track IME composition state
      let isComposing = false;
      
      // Focus and select input
      setTimeout(() => {
        inputEl.focus();
        inputEl.select();
      }, 100);
      
      const cleanup = () => {
        dialog.classList.remove('show');
        okBtn.removeEventListener('click', handleOk);
        cancelBtn.removeEventListener('click', handleCancel);
        inputEl.removeEventListener('keydown', handleKeydown);
        inputEl.removeEventListener('compositionstart', handleCompositionStart);
        inputEl.removeEventListener('compositionend', handleCompositionEnd);
        dialog.removeEventListener('click', handleBackdrop);
      };
      
      const handleOk = () => {
        const value = inputEl.value.trim();
        cleanup();
        resolve(value || null);
      };
      
      const handleCancel = () => {
        cleanup();
        resolve(null);
      };
      
      const handleCompositionStart = () => {
        isComposing = true;
      };
      
      const handleCompositionEnd = () => {
        isComposing = false;
      };
      
      const handleKeydown = (e) => {
        // Don't process Enter/Escape during IME composition
        if (isComposing) {
          return;
        }
        
        if (e.key === 'Enter') {
          e.preventDefault();
          handleOk();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        }
      };
      
      const handleBackdrop = (e) => {
        if (e.target === dialog) {
          handleCancel();
        }
      };
      
      okBtn.addEventListener('click', handleOk);
      cancelBtn.addEventListener('click', handleCancel);
      inputEl.addEventListener('keydown', handleKeydown);
      inputEl.addEventListener('compositionstart', handleCompositionStart);
      inputEl.addEventListener('compositionend', handleCompositionEnd);
      dialog.addEventListener('click', handleBackdrop);
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BlogEditorApp();
});
