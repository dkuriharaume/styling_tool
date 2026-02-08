/**
 * LINKEY Blog Editor - Main Application
 */

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
    this.currentLang = localStorage.getItem('linkey-lang') || 'en';
    
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
    const editorCanvas = document.querySelector('.editor-canvas');
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
    const editorCanvas = document.querySelector('.editor-canvas');
    if (editorCanvas) {
      localStorage.setItem('blog-editor-scroll-position', editorCanvas.scrollTop);
    }
  }
  
  /**
   * Restore saved scroll position
   */
  restoreScrollPosition() {
    const editorCanvas = document.querySelector('.editor-canvas');
    const savedPosition = localStorage.getItem('blog-editor-scroll-position');
    
    if (editorCanvas && savedPosition !== null) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        editorCanvas.scrollTop = parseInt(savedPosition, 10);
      });
    }
  }
  
  /**
   * Setup component palette
   */
  setupPalette() {
    const paletteItems = document.querySelectorAll('.component-item');
    
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
        document.body.classList.add('dragging');
      });
      
      item.addEventListener('dragend', () => {
        this.isDragging = false;
        this.draggedComponent = null;
        document.body.classList.remove('dragging');
        this.clearDropZones();
        this.render(); // Re-render after drag ends
      });
    });
  }
  
  /**
   * Setup editor canvas
   */
  setupCanvas() {
    const canvas = document.getElementById('canvas-blocks');
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    const editorCanvas = document.querySelector('.editor-canvas');
    
    // Auto-scroll configuration
    let autoScrollInterval = null;
    
    // Setup title input
    const titleInput = document.getElementById('canvas-title-input');
    titleInput.value = this.state.title;
    titleInput.addEventListener('input', (e) => {
      this.state.setTitle(e.target.value);
    });
    
    // Global dragover prevention to keep drag alive
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.isDragging) {
        e.dataTransfer.dropEffect = 'move';
      } else {
        e.dataTransfer.dropEffect = 'copy';
      }
    });
    
    // Drag over editor canvas - implement continuous auto-scroll based on mouse position
    // Use editorCanvas (the full scrollable area) instead of just canvas (the blocks container)
    const scrollTarget = editorCanvas || canvasWrapper;
    scrollTarget.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.isDragging) {
        e.dataTransfer.dropEffect = 'move';
      } else {
        e.dataTransfer.dropEffect = 'copy';
      }
      
      // Clear existing interval
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
      
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
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
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
              clearInterval(autoScrollInterval);
              autoScrollInterval = null;
            }
          }, 16); // ~60fps
        }
      }
    });
    
    // Stop auto-scroll on drag leave
    canvas.addEventListener('dragleave', () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    });
    
    // Stop auto-scroll on drop
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      
      // Clear auto-scroll
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
      
      // If dropping on empty canvas, add at the end
      if (this.state.blocks.length === 0) {
        this.handleDrop(0);
      }
    });
    
    // Stop auto-scroll on drag end (via palette)
    document.body.addEventListener('dragend', () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
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
    document.getElementById('btn-new').addEventListener('click', async () => {
      const title = await this.showPrompt('Create New Draft', 'Enter a title for your new draft:', 'Untitled Draft');
      if (title) {
        this.state.newDraft();
        this.state.setTitle(title);
        this.showStatus('New draft created', 'success');
      }
    });
    
    // Open button
    document.getElementById('btn-open').addEventListener('click', () => {
      this.showDraftsBrowser();
    });
    
    // Save As button (create new draft with custom name)
    document.getElementById('btn-save-as').addEventListener('click', () => {
      this.saveAsNewDraft();
    });
    
    // Export HTML button (in header)
    document.getElementById('btn-export-html-header').addEventListener('click', async (e) => {
      const button = e.currentTarget;
      const icon = button.querySelector('.file-btn-icon');
      const label = button.querySelector('.file-btn-label');
      const originalIcon = icon.textContent;
      const originalLabel = label.textContent;
      
      // Show loading state
      button.style.pointerEvents = 'none';
      icon.textContent = '⏳';
      label.textContent = 'Copying...';
      
      const success = await this.htmlExporter.copyToClipboard();
      
      if (success) {
        // Show success state
        button.classList.add('export-success');
        icon.textContent = '✓';
        label.textContent = 'Copied to clipboard!';
        // Don't show status message - button feedback is enough
        
        // Reset after 2 seconds
        setTimeout(() => {
          button.classList.remove('export-success');
          icon.textContent = originalIcon;
          label.textContent = originalLabel;
          button.style.pointerEvents = '';
        }, 2000);
      } else {
        // Show error state
        button.classList.add('export-error');
        icon.textContent = '✗';
        label.textContent = 'Failed to copy';
        this.showToast('Failed to copy to clipboard', 'error');
        
        // Reset after 2 seconds
        setTimeout(() => {
          button.classList.remove('export-error');
          icon.textContent = originalIcon;
          label.textContent = originalLabel;
          button.style.pointerEvents = '';
        }, 2000);
      }
    });
    
    // Modal close button
    document.getElementById('modal-close').addEventListener('click', () => {
      this.closeDraftsModal();
    });
    
    // Close modal on background click
    document.getElementById('drafts-modal').addEventListener('click', (e) => {
      if (e.target.id === 'drafts-modal') {
        this.closeDraftsModal();
      }
    });
  }
  
  /**
   * Show toast notification
   */
  /**
   * Show message in status bar
   */
  showStatus(message, type = 'info', duration = 3000) {
    const statusMessage = document.getElementById('status-message');
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    
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
    this.showStatus(message, type, 3000);
  }
  
  /**
   * Show save indicator briefly
   */
  showSaveIndicator() {
    // Show in status bar instead
    this.showStatus('Saved', 'success', 2000);
  }
  
  /**
   * Setup viewport toggle
   */
  setupViewportToggle() {
    const viewportButtons = document.querySelectorAll('.viewport-btn');
    
    // Load saved viewport preference
    const savedViewport = localStorage.getItem('linkey-editor-viewport');
    if (savedViewport) {
      this.currentViewport = savedViewport;
      // Update button active state
      viewportButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.viewport === savedViewport);
      });
    }
    
    viewportButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        viewportButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update viewport
        this.currentViewport = btn.dataset.viewport;
        
        // Save viewport preference
        localStorage.setItem('linkey-editor-viewport', this.currentViewport);
        
        this.applyViewport();
      });
    });
  }
  
  /**
   * Setup language toggle
   */
  setupLanguageToggle() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    // Set active button based on current language
    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
    });
    
    langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        langButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update language
        this.currentLang = btn.dataset.lang;
        
        // Save language preference
        localStorage.setItem('linkey-lang', this.currentLang);
        
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
   * Apply language to UI
   */
  applyLanguage() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
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
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    const viewportInfo = document.getElementById('viewport-info');
    
    // Remove all viewport classes
    canvasWrapper.classList.remove('viewport-desktop', 'viewport-laptop', 'viewport-tablet', 'viewport-mobile');
    
    // Add current viewport class
    canvasWrapper.classList.add(`viewport-${this.currentViewport}`);
    
    // Update info text
    const viewportSizes = {
      desktop: 'Desktop 4K - 3840px',
      laptop: 'Laptop Full HD - 1920px',
      tablet: 'Tablet - 1024px',
      mobile: 'Mobile - 414px'
    };
    
    viewportInfo.textContent = viewportSizes[this.currentViewport];
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
      const clickedInsideBlock = e.target.closest('.editor-block');
      const clickedInsideCanvas = e.target.closest('.editor-canvas');
      const clickedInsideProperties = e.target.closest('.properties-panel');
      const clickedInsideModal = e.target.closest('.modal-content');
      const clickedInsideToolbar = e.target.closest('.formatting-toolbar');
      const clickedInsidePalette = e.target.closest('.component-palette');
      
      // If clicked on canvas (not on a block) while in draft browser, close it and show file operations
      if (clickedInsideCanvas && !clickedInsideBlock && this.isInDraftsBrowser) {
        this.showFileOperations();
        return; // Don't deselect in this case
      }
      
      // If viewing file operations, don't close them when clicking on canvas
      const isViewingFileOperations = !this.isInDraftsBrowser && document.querySelector('.file-operations');
      if (clickedInsideCanvas && !clickedInsideBlock && isViewingFileOperations) {
        // Just deselect any selected block, but keep file operations open
        if (this.state.selectedBlockId) {
          this.state.selectBlock(null);
        }
        return;
      }
      
      // If clicked outside all interactive areas, deselect
      if (!clickedInsideBlock && !clickedInsideProperties && !clickedInsideModal && !clickedInsideToolbar && !clickedInsidePalette) {
        if (this.state.selectedBlockId) {
          this.state.selectBlock(null);
        }
      }
    });
    
    // Also handle clicks on the canvas background (not on blocks)
    const canvas = document.getElementById('canvas-blocks');
    canvas.addEventListener('click', (e) => {
      // If clicking directly on canvas (not on a block), deselect
      if (e.target === canvas || e.target.classList.contains('empty-state')) {
        if (this.state.selectedBlockId) {
          this.state.selectBlock(null);
        }
      }
    });
  }
  
  /**
   * Setup blur handler to deselect blocks when focus leaves contentEditable elements
   */
  setupBlurHandler() {
    document.addEventListener('focusout', (e) => {
      // Check if focus is leaving a contentEditable element
      if (e.target.isContentEditable || e.target.contentEditable === 'true') {
        // Use setTimeout to allow focus to move to new element
        setTimeout(() => {
          // Check if new focus target is not another contentEditable element
          const newFocus = document.activeElement;
          const isEditingAnotherElement = newFocus && (newFocus.isContentEditable || newFocus.contentEditable === 'true');
          const isInPropertiesPanel = newFocus && newFocus.closest('.properties-panel');
          const isInModal = newFocus && newFocus.closest('.modal-content');
          const isInToolbar = newFocus && newFocus.closest('.formatting-toolbar');
          
          // If not editing another element and not in UI panels, deselect
          if (!isEditingAnotherElement && !isInPropertiesPanel && !isInModal && !isInToolbar) {
            if (this.state.selectedBlockId) {
              this.state.selectBlock(null);
            }
          }
        }, 0);
      }
    });
  }
  
  /**
   * Render all blocks
   */
  render() {
    const canvas = document.getElementById('canvas-blocks');
    const titleInput = document.getElementById('canvas-title-input');
    
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
    const viewports = ['desktop', 'laptop', 'tablet', 'mobile'];
    
    // Define all possible component types and their variants
    const components = [
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
    
    // Calculate for all combinations
    viewports.forEach(viewport => {
      const isMobile = viewport === 'mobile' || viewport === 'tablet';
      
      components.forEach(prev => {
        const prevBottom = this.getComponentBottomMargin(prev, isMobile);
        
        components.forEach(current => {
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
    switch (component.type) {
      case 'header':
        if (component.level === 2) return isMobile ? 20 : 30;
        if (component.level === 3) return isMobile ? 30 : 40;
        if (component.level === 4) return 20;
        break;
      case 'paragraph':
        return 0; // Paragraphs only have top margin
      case 'list':
        return 0; // Lists have internal spacing only
      case 'card':
        return isMobile ? 20 : 40; // Assume cards need spacing
      case 'button':
        return 0;
      case 'box':
        return isMobile ? 20 : 30;
      case 'image':
        return isMobile ? 15 : 20;
    }
    return 0;
  }
  
  /**
   * Get top margin for a component (used in lookup table building)
   */
  getComponentTopMargin(component, isMobile) {
    switch (component.type) {
      case 'header':
        if (component.level === 2) return isMobile ? 30 : 50;
        if (component.level === 3) return isMobile ? 0 : 50;
        if (component.level === 4) return 30;
        break;
      case 'paragraph':
        return 10; // All paragraphs (including small) have 1rem top
      case 'list':
        if (component.listType === 'ol' || component.listType === 'ol-title') return 60;
        if (component.listType === 'dl') return 50;
        if (component.listType === 'ul') return 0;
        break;
      case 'card':
        return isMobile ? 30 : 50;
      case 'button':
        return isMobile ? 20 : 30;
      case 'box':
        return isMobile ? 30 : 40;
      case 'image':
        return isMobile ? 20 : 30;
    }
    return 0;
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
      return block.listType;
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
    const viewport = this.currentViewport;
    const isMobile = viewport === 'mobile' || viewport === 'tablet';
    
    switch (block.type) {
      case 'header':
        // h2: margin: 5rem 0 3rem → bottom: 30px
        // h3: margin: 5rem 0 4rem → bottom: 40px  
        // h4: margin-bottom: 2rem → bottom: 20px
        if (block.level === 2) {
          return isMobile ? 20 : 30;
        } else if (block.level === 3) {
          return isMobile ? 30 : 40;
        } else if (block.level === 4) {
          return 20;
        }
        break;
      case 'paragraph':
        if (block.variant === 'small' || block.variant === 'small-gray') {
          return 0; // .small has no explicit bottom margin
        }
        return 0; // p:not(:first-child) only has margin-top
      case 'list':
        // Lists generally don't have bottom margin, spacing is internal
        return 0;
    }
    
    return 0;
  }
  
  /**
   * Get top margin for a block type (in pixels, at base 10px font-size)
   */
  getTopMargin(block) {
    const viewport = this.currentViewport;
    const isMobile = viewport === 'mobile' || viewport === 'tablet';
    
    switch (block.type) {
      case 'header':
        // h2: margin: 5rem 0 3rem → top: 50px
        // h3: margin: 5rem 0 4rem → top: 50px  
        // h4: margin-top: 3rem → top: 30px
        if (block.level === 2) {
          return isMobile ? 30 : 50;
        } else if (block.level === 3) {
          return isMobile ? 0 : 50; // Mobile: margin: 0 0 3rem
        } else if (block.level === 4) {
          return 30;
        }
        break;
      case 'paragraph':
        if (block.variant === 'small' || block.variant === 'small-gray') {
          // .small by itself has no top margin
          // .small--mt has margin-top: 4rem (40px) on desktop, 2rem (20px) on mobile
          // But we don't have a separate --mt tracking, so default to base paragraph spacing
          return 10;
        }
        // p:not(:first-child) has margin-top: 1rem
        return 10;
      case 'list':
        // .ol--mt has margin-top: 6rem (60px)
        // .wide-dl has margin-top: 5rem (50px)
        if (block.listType === 'ol' || block.listType === 'ol-title') {
          return 60;
        } else if (block.listType === 'dl') {
          return 50;
        } else if (block.listType === 'ul') {
          return 0; // UL has no explicit top margin
        }
        return 0;
    }
    
    return 0;
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
    document.querySelectorAll('.drop-zone').forEach(zone => {
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
      const canvasWrapper = document.querySelector('.canvas-wrapper');
      
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
        document.body.classList.add('dragging');
        
        // Hide adjacent drop zones
        const draggedIndex = this.state.blocks.findIndex(b => b.id === block.id);
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach((zone) => {
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
      document.body.classList.remove('dragging');
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
    document.querySelectorAll('.editor-block').forEach(el => {
      if (el.dataset.blockId === id) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
    
    // Update properties panel
    this.updatePropertiesPanel();
  }
  
  /**
   * Update properties panel
   */
  updatePropertiesPanel() {
    const panel = document.getElementById('properties-content');
    const selectedBlock = this.state.getSelectedBlock();
    
    if (!selectedBlock) {
      // If draft browser is showing and no block selected, keep it
      if (this.isInDraftsBrowser) {
        return;
      }
      
      // Show file operations when no block selected
      this.showFileOperations();
      
      // Clear block properties when nothing is selected
      const propsContainer = panel.querySelector('.block-properties');
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
    const fileOps = panel.querySelector('.file-operations');
    if (fileOps) {
      fileOps.style.display = 'none';
    }
    
    // Remove draft browser if it's showing
    const draftsBrowser = panel.querySelector('.drafts-browser');
    if (draftsBrowser) {
      draftsBrowser.remove();
    }
    
    // Create properties container if not exists
    let propsContainer = panel.querySelector('.block-properties');
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
    document.getElementById('prop-level').addEventListener('change', (e) => {
      this.state.updateBlock(block.id, { level: parseInt(e.target.value) });
    });
    
    document.getElementById('prop-preset').addEventListener('change', (e) => {
      this.state.updateBlock(block.id, { preset: e.target.value });
    });
    
    document.getElementById('prop-content').addEventListener('input', (e) => {
      this.state.updateBlock(block.id, { content: e.target.value });
    });
    
    document.getElementById('prop-delete').addEventListener('click', async () => {
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
    document.getElementById('prop-variant').addEventListener('change', (e) => {
      this.state.updateBlock(block.id, { variant: e.target.value });
    });
    
    document.getElementById('prop-delete').addEventListener('click', async () => {
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
    document.getElementById('prop-list-type').addEventListener('change', (e) => {
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
    
    document.getElementById('prop-add-item').addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent focus changes
      const component = document.querySelector(`[data-block-id="${block.id}"] list-component`);
      if (component) {
        component.addItem();
      }
    });
    
    document.getElementById('prop-delete').addEventListener('click', async () => {
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
    const panel = document.getElementById('properties-content');
    
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
      const btn = panel.querySelector(`[data-draft-id="${draft.id}"]`);
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
    const panel = document.getElementById('properties-content');
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
    const backBtn = document.getElementById('btn-back-to-files');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showFileOperations();
      });
    }
    
    // Add listeners for clicking on draft cards (open draft)
    panel.querySelectorAll('.draft-item').forEach(item => {
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
    panel.querySelectorAll('.btn-delete-draft').forEach(btn => {
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
    const modal = document.getElementById('drafts-modal');
    const draftsList = document.getElementById('drafts-list');
    const emptyState = document.getElementById('empty-state');
    
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
    const modal = document.getElementById('drafts-modal');
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
      const dialog = document.getElementById('confirm-dialog');
      const titleEl = document.getElementById('confirm-title');
      const messageEl = document.getElementById('confirm-message');
      const okBtn = document.getElementById('confirm-ok');
      const cancelBtn = document.getElementById('confirm-cancel');
      
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
        if (e.target.id === 'confirm-dialog') {
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
      const dialog = document.getElementById('prompt-dialog');
      const titleEl = document.getElementById('prompt-title');
      const messageEl = document.getElementById('prompt-message');
      const inputEl = document.getElementById('prompt-input');
      const okBtn = document.getElementById('prompt-ok');
      const cancelBtn = document.getElementById('prompt-cancel');
      
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
        if (e.target.id === 'prompt-dialog') {
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
