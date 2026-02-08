/**
 * LINKEY Blog Editor - Main Application
 */
const {
  VIEWPORT_CONFIG = {},
  VIEWPORTS = [],
  STORAGE_KEYS = {},
  COMPONENT_DEFS = [],
  MARGIN_CONFIG = {},
  resolveMarginValue = () => 0
} = window.BLOG_EDITOR_CONSTANTS || {};

if (!window.BLOG_EDITOR_CONSTANTS) {
  console.warn('BLOG_EDITOR_CONSTANTS not found. Ensure js/constants.js is loaded before app.js.');
}

const DOM_UTILS = window.BLOG_EDITOR_UTILS || {};
const getById = DOM_UTILS.getById || ((id) => document.getElementById(id));
const qs = DOM_UTILS.qs || ((selector, root = document) => root.querySelector(selector));
const qsa = DOM_UTILS.qsa || ((selector, root = document) => root.querySelectorAll(selector));
const isInsideElement = DOM_UTILS.isInside || ((target, selector) => !!(target && target.closest && target.closest(selector)));
const isEditable = DOM_UTILS.isEditableElement || ((element) => !!(element && (element.isContentEditable || element.contentEditable === 'true')));
const escapeHtmlText = DOM_UTILS.escapeHtml || ((text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
});

const DIALOGS = window.BLOG_EDITOR_DIALOGS || {};
const showConfirmDialog = DIALOGS.showConfirm || ((title, message) => Promise.resolve(window.confirm(`${title}\n\n${message}`)));
const showPromptDialog = DIALOGS.showPrompt || ((title, message, defaultValue = '') => Promise.resolve(window.prompt(`${title}\n\n${message}`, defaultValue)));

const MODULES = window.BLOG_EDITOR_MODULES || {};
const paletteModule = MODULES.palette || {};
const componentsModule = MODULES.components || {};
const exportersModule = MODULES.exporters || {};
const editorModule = MODULES.editor || {};
const propertiesModule = MODULES.properties || {};
const uiModule = MODULES.ui || {};
const draftsModule = MODULES.drafts || {};
const eventsModule = MODULES.events || {};
const selectionModule = MODULES.selection || {};

if (!MODULES.palette || !MODULES.components || !MODULES.exporters || !MODULES.editor || !MODULES.properties || !MODULES.ui || !MODULES.drafts || !MODULES.events || !MODULES.selection) {
  console.warn('BLOG_EDITOR_MODULES not fully loaded. Ensure palette/components/exporters/editor/properties/ui/drafts/events/selection modules are loaded before app.js.');
}

if (!window.BLOG_EDITOR_UTILS) {
  console.warn('BLOG_EDITOR_UTILS not found. Ensure js/utils.js is loaded before app.js.');
}

class BlogEditorApp {
  constructor() {
    this.state = new EditorState();
    this.htmlExporter = exportersModule.createHtmlExporter
      ? exportersModule.createHtmlExporter(this.state)
      : new HTMLExporter(this.state);
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
    this.translations = (window.BLOG_EDITOR_I18N && window.BLOG_EDITOR_I18N.translations) || {};
    if (!window.BLOG_EDITOR_I18N) {
      console.warn('BLOG_EDITOR_I18N not found. Ensure js/i18n.js is loaded before app.js.');
    }

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
    return uiModule.setupScrollPersistence ? uiModule.setupScrollPersistence(this) : undefined;
  }
  
  /**
   * Save current scroll position
   */
  saveScrollPosition() {
    return uiModule.saveScrollPosition ? uiModule.saveScrollPosition(this) : undefined;
  }
  
  /**
   * Restore saved scroll position
   */
  restoreScrollPosition() {
    return uiModule.restoreScrollPosition ? uiModule.restoreScrollPosition(this) : undefined;
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
    return paletteModule.setupPalette ? paletteModule.setupPalette(this) : undefined;
  }
  
  /**
   * Setup editor canvas
   */
  setupCanvas() {
    return editorModule.setupCanvas ? editorModule.setupCanvas(this) : undefined;
  }
  
  /**
   * Setup properties panel
   */
  setupProperties() {
    return propertiesModule.setupProperties ? propertiesModule.setupProperties(this) : undefined;
  }
  
  /**
   * Setup header actions
   */
  setupHeader() {
    return uiModule.setupHeader ? uiModule.setupHeader(this) : undefined;
  }

  /**
   * Bind a click handler to a header button by id
   */
  bindHeaderButton(id, handler) {
    return uiModule.bindHeaderButton ? uiModule.bindHeaderButton(this, id, handler) : undefined;
  }

  /**
   * Bind a click handler to the drafts modal
   */
  bindHeaderModal(handler) {
    return uiModule.bindHeaderModal ? uiModule.bindHeaderModal(this, handler) : undefined;
  }

  /**
   * Get export button parts and original text
   */
  getExportButtonParts(button) {
    return uiModule.getExportButtonParts ? uiModule.getExportButtonParts(this, button) : { icon: null, label: null };
  }

  /**
   * Set export button loading state
   */
  setExportButtonLoading(button, parts) {
    return uiModule.setExportButtonLoading ? uiModule.setExportButtonLoading(this, button, parts) : undefined;
  }

  /**
   * Set export button success state
   */
  setExportButtonSuccess(button, parts) {
    return uiModule.setExportButtonSuccess ? uiModule.setExportButtonSuccess(this, button, parts) : undefined;
  }

  /**
   * Set export button error state
   */
  setExportButtonError(button, parts) {
    return uiModule.setExportButtonError ? uiModule.setExportButtonError(this, button, parts) : undefined;
  }

  /**
   * Reset export button state
   */
  resetExportButton(button, parts, className) {
    return uiModule.resetExportButton ? uiModule.resetExportButton(this, button, parts, className) : undefined;
  }
  
  /**
   * Show toast notification
   */
  /**
   * Show message in status bar
   */
  showStatus(message, type = 'info', duration = 3000) {
    return uiModule.showStatus ? uiModule.showStatus(this, message, type, duration) : undefined;
  }
  
  /**
   * Show toast notification (legacy - now redirects to status bar)
   */
  showToast(message, type = 'info') {
    return uiModule.showToast ? uiModule.showToast(this, message, type) : undefined;
  }
  
  /**
   * Show save indicator briefly
   */
  showSaveIndicator() {
    return uiModule.showSaveIndicator ? uiModule.showSaveIndicator(this) : undefined;
  }

  /**
   * Show status message with default duration
   */
  showStatusWithDefaults(message, type = 'info', duration = 3000) {
    return uiModule.showStatusWithDefaults ? uiModule.showStatusWithDefaults(this, message, type, duration) : undefined;
  }

  /**
   * Get status bar elements
   */
  getStatusElements() {
    return uiModule.getStatusElements ? uiModule.getStatusElements(this) : { statusMessage: null, statusIcon: null, statusText: null };
  }
  
  /**
   * Setup viewport toggle
   */
  setupViewportToggle() {
    return uiModule.setupViewportToggle ? uiModule.setupViewportToggle(this) : undefined;
  }
  
  /**
   * Setup language toggle
   */
  setupLanguageToggle() {
    return uiModule.setupLanguageToggle ? uiModule.setupLanguageToggle(this) : undefined;
  }
  
  /**
   * Get translation
   */
  t(key) {
    return uiModule.t ? uiModule.t(this, key) : key;
  }

  /**
   * Update active class on a button group
   */
  updateActiveButtons(buttons, isActive) {
    return uiModule.updateActiveButtons ? uiModule.updateActiveButtons(this, buttons, isActive) : undefined;
  }
  
  /**
   * Apply language to UI
   */
  applyLanguage() {
    return uiModule.applyLanguage ? uiModule.applyLanguage(this) : undefined;
  }
  
  /**
   * Apply viewport size to canvas
   */
  applyViewport() {
    return uiModule.applyViewport ? uiModule.applyViewport(this) : undefined;
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
    return getById(id);
  }

  /**
   * Generic querySelector helper
   */
  getElementBySelector(selector) {
    return qs(selector);
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
    return qsa(selector);
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
    return isInsideElement(target, selector);
  }

  /**
   * Check if an element is content editable
   */
  isEditableElement(element) {
    return isEditable(element);
  }

  /**
   * Clear selected block state
   */
  clearSelectedBlock() {
    return selectionModule.clearSelectedBlock ? selectionModule.clearSelectedBlock(this) : undefined;
  }

  /**
   * Update selection classes for blocks
   */
  updateSelectedBlockStyles(selectedId) {
    return selectionModule.updateSelectedBlockStyles
      ? selectionModule.updateSelectedBlockStyles(this, selectedId)
      : undefined;
  }

  /**
   * Get confirm dialog elements
   */
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
    return eventsModule.setupKeyboard ? eventsModule.setupKeyboard(this) : undefined;
  }
  
  /**
   * Setup global click handler for deselecting blocks
   */
  setupGlobalClickHandler() {
    return eventsModule.setupGlobalClickHandler ? eventsModule.setupGlobalClickHandler(this) : undefined;
  }
  
  /**
   * Setup blur handler to deselect blocks when focus leaves contentEditable elements
   */
  setupBlurHandler() {
    return eventsModule.setupBlurHandler ? eventsModule.setupBlurHandler(this) : undefined;
  }
  
  /**
   * Render all blocks
   */
  render() {
    return editorModule.render ? editorModule.render(this) : undefined;
  }
  
  /**
   * Build a comprehensive margin lookup table for all component combinations
   * Key format: "prevType-prevSubtype_currentType-currentSubtype_viewport"
   * Returns: collapsed margin value in pixels (negative for overlap)
   */
  buildMarginLookupTable() {
    return editorModule.buildMarginLookupTable ? editorModule.buildMarginLookupTable(this) : {};
  }
  
  /**
   * Get bottom margin for a component (used in lookup table building)
   */
  getComponentBottomMargin(component, isMobile) {
    return editorModule.getComponentBottomMargin
      ? editorModule.getComponentBottomMargin(this, component, isMobile)
      : 0;
  }
  
  /**
   * Get top margin for a component (used in lookup table building)
   */
  getComponentTopMargin(component, isMobile) {
    return editorModule.getComponentTopMargin
      ? editorModule.getComponentTopMargin(this, component, isMobile)
      : 0;
  }
  
  /**
   * Normalize list key
   */
  getListKey(listType) {
    return editorModule.getListKey ? editorModule.getListKey(this, listType) : (listType || 'ul');
  }

  /**
   * Get lookup key for a block
   */
  getBlockLookupKey(block) {
    return editorModule.getBlockLookupKey ? editorModule.getBlockLookupKey(this, block) : block.type;
  }
  
  /**
   * Calculate margin collapse offset between two blocks
   * Returns negative value to negate the excess margin
   */
  calculateMarginCollapse(prevBlock, currentBlock) {
    return editorModule.calculateMarginCollapse
      ? editorModule.calculateMarginCollapse(this, prevBlock, currentBlock)
      : 0;
  }
  
  /**
   * Get bottom margin for a block type (in pixels, at base 10px font-size)
   */
  getBottomMargin(block) {
    return editorModule.getBottomMargin ? editorModule.getBottomMargin(this, block) : 0;
  }
  
  /**
   * Get top margin for a block type (in pixels, at base 10px font-size)
   */
  getTopMargin(block) {
    return editorModule.getTopMargin ? editorModule.getTopMargin(this, block) : 0;
  }

  /**
   * Resolve margin value for a block
   */
  getBlockMarginValue(block, edge) {
    return editorModule.getBlockMarginValue
      ? editorModule.getBlockMarginValue(this, block, edge)
      : 0;
  }
  
  /**
   * Create a drop zone element
   */
  createDropZone(position) {
    return editorModule.createDropZone ? editorModule.createDropZone(this, position) : null;
  }
  
  /**
   * Clear all drop zone highlights
   */
  clearDropZones() {
    return editorModule.clearDropZones ? editorModule.clearDropZones(this) : undefined;
  }
  
  /**
   * Handle component drop (from palette or reorder)
   */
  handleDrop(position) {
    return editorModule.handleDrop ? editorModule.handleDrop(this, position) : undefined;
  }
  
  /**
   * Create block data from component type
   */
  createBlockData(component) {
    return editorModule.createBlockData ? editorModule.createBlockData(this, component) : { type: component.type };
  }
  
  /**
   * Create a block element
   */
  createBlock(block) {
    return editorModule.createBlock ? editorModule.createBlock(this, block) : document.createElement('div');
  }
  
  /**
   * Create component element based on type
   */
  createComponent(block) {
    return editorModule.createComponent ? editorModule.createComponent(this, block) : document.createElement('div');
  }
  
  /**
   * Handle block selection
   */
  handleBlockSelect(id) {
    return selectionModule.handleBlockSelect ? selectionModule.handleBlockSelect(this, id) : undefined;
  }
  
  /**
   * Update properties panel
   */
  updatePropertiesPanel() {
    return propertiesModule.updatePropertiesPanel ? propertiesModule.updatePropertiesPanel(this) : undefined;
  }
  
  /**
   * Render header properties
   */
  renderHeaderProperties(block, container) {
    return propertiesModule.renderHeaderProperties
      ? propertiesModule.renderHeaderProperties(this, block, container)
      : undefined;
  }
  
  /**
   * Render paragraph properties
   */
  renderParagraphProperties(block, container) {
    return propertiesModule.renderParagraphProperties
      ? propertiesModule.renderParagraphProperties(this, block, container)
      : undefined;
  }
  
  /**
   * Render list properties
   */
  renderListProperties(block, container) {
    return propertiesModule.renderListProperties
      ? propertiesModule.renderListProperties(this, block, container)
      : undefined;
  }
  
  /**
   * Show file operations in properties panel
   */
  showFileOperations() {
    return propertiesModule.showFileOperations ? propertiesModule.showFileOperations(this) : undefined;
  }
  
  /**
   * Show drafts browser in properties panel
   */
  showDraftsBrowser() {
    return propertiesModule.showDraftsBrowser ? propertiesModule.showDraftsBrowser(this) : undefined;
  }
  
  /**
   * Open drafts manager modal (deprecated - keeping for compatibility)
   */
  openDraftsModal() {
    return draftsModule.openDraftsModal ? draftsModule.openDraftsModal(this) : undefined;
  }
  
  /**
   * Old modal function - keeping structure for now
   */
  openDraftsModalOld() {
    return draftsModule.openDraftsModalOld ? draftsModule.openDraftsModalOld(this) : undefined;
  }
  
  /**
   * Save as new draft (prompts for name)
   */
  async saveAsNewDraft() {
    return draftsModule.saveAsNewDraft ? draftsModule.saveAsNewDraft(this) : undefined;
  }
  
  /**
   * Close drafts manager modal
   */
  closeDraftsModal() {
    return draftsModule.closeDraftsModal ? draftsModule.closeDraftsModal(this) : undefined;
  }
  
  /**
   * Load a draft
   */
  loadDraft(draftId) {
    return draftsModule.loadDraft ? draftsModule.loadDraft(this, draftId) : false;
  }
  
  /**
   * Load the last edited draft on startup
   */
  loadLastEditedDraft() {
    return draftsModule.loadLastEditedDraft ? draftsModule.loadLastEditedDraft(this) : undefined;
  }
  
  /**
   * Escape HTML for safe display
   */
  escapeHtml(text) {
    return escapeHtmlText(text);
  }
  
  /**
   * Show custom confirm dialog
   */
  showConfirm(title, message) {
    return showConfirmDialog(title, message);
  }
  
  /**
   * Show custom prompt dialog
   */
  showPrompt(title, message, defaultValue = '') {
    return showPromptDialog(title, message, defaultValue);
  }
}

