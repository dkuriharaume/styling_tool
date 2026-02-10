/**
 * LINKEY Blog Editor - Main Application
 */
const {
  VIEWPORT_CONFIG = {},
  VIEWPORTS = [],
  STORAGE_KEYS = {},
  SERVER_CONFIG = {},
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
const markdownImporterModule = MODULES.markdownImporter || {};

if (!MODULES.palette || !MODULES.components || !MODULES.exporters || !MODULES.editor || !MODULES.properties || !MODULES.ui || !MODULES.drafts || !MODULES.events || !MODULES.selection || !MODULES.markdownImporter) {
  console.warn('BLOG_EDITOR_MODULES not fully loaded. Ensure palette/components/exporters/editor/properties/ui/drafts/events/selection/markdown-importer modules are loaded before app.js.');
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
    this.isInAiChatView = false;
    this.currentLang = localStorage.getItem(STORAGE_KEYS.language) || 'en';
    this.aiChatHistory = [];

    // Pre-calculate margin collapse lookup table for all combinations
    this.marginLookup = this.buildMarginLookupTable();

    // i18n translations
    this.translations = (window.BLOG_EDITOR_I18N && window.BLOG_EDITOR_I18N.translations) || {};
    if (!window.BLOG_EDITOR_I18N) {
      console.warn('BLOG_EDITOR_I18N not found. Ensure js/i18n.js is loaded before app.js.');
    }

    this.init();
  }

  normalizeAiInlineText(text) {
    const raw = String(text ?? '');
    return raw
      .replace(/<\s*\/\s*(strong|b)\b[^>]*>/gi, '**')
      .replace(/<\s*(strong|b)\b[^>]*>/gi, '**')
      .replace(/<[^>]+>/g, '');
  }

  normalizeAiDraft(draft) {
    if (!draft || !Array.isArray(draft.blocks)) return null;
    const allowedTypes = new Set(['header', 'paragraph', 'list', 'card']);
    const placeholderImage = 'https://www.linkey-lock.com/wp-content/uploads/2025/05/2634fefd9b745aa48f169e9a26c89cf8-1.png';

    const normalizeText = (value) => this.normalizeAiInlineText(value);

    const blocks = draft.blocks.map((block) => {
      if (!block || typeof block !== 'object') {
        return { type: 'paragraph', variant: 'normal', content: normalizeText(block ?? '') };
      }

      const type = allowedTypes.has(block.type) ? block.type : 'paragraph';
      const data = block.data && typeof block.data === 'object' ? block.data : {};

      if (type === 'header') {
        const level = [1, 2, 3, 4].includes(block.level) ? block.level : (data.level || 2);
        let preset = ['default', 'red', 'blue'].includes(block.preset) ? block.preset : (data.preset || 'default');
        let content = normalizeText(block.content ?? data.text ?? data.content ?? '');
        if (/\{red\}/i.test(content)) {
          preset = 'red';
        } else if (/\{blue\}/i.test(content)) {
          preset = 'blue';
        }
        content = content
          .replace(/\{red\}([\s\S]+?)\{\/red\}/gi, '$1')
          .replace(/\{blue\}([\s\S]+?)\{\/blue\}/gi, '$1');
        return {
          ...block,
          type,
          level,
          preset,
          content
        };
      }

      if (type === 'list') {
        const listTypeRaw = String(block.listType || data.listType || '').toLowerCase();
        const listTypeMap = {
          unordered: 'ul',
          ordered: 'ol',
          numbered: 'ol',
          bullets: 'ul',
          bullet: 'ul',
          'ol-title': 'ol-title',
          dl: 'dl',
          ul: 'ul',
          ol: 'ol'
        };
        const listType = listTypeMap[listTypeRaw] || 'ul';
        let items = Array.isArray(block.items) ? block.items : (Array.isArray(data.items) ? data.items : []);

        if (!items.length && typeof (block.content ?? data.text ?? data.content) === 'string') {
          const lines = String(block.content ?? data.text ?? data.content)
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
          if (lines.some(line => /^[-*]\s+/.test(line))) {
            items = lines.filter(line => /^[-*]\s+/.test(line)).map(line => line.replace(/^[-*]\s+/, ''));
          } else if (lines.some(line => /^\d+\.\s+/.test(line))) {
            items = lines.filter(line => /^\d+\.\s+/.test(line)).map(line => line.replace(/^\d+\.\s+/, ''));
          }
        }

        if (listType === 'dl') {
          return {
            ...block,
            type,
            listType,
            items: items.map(item => ({
              term: normalizeText(item?.term ?? item?.key ?? item?.title ?? item?.label ?? ''),
              definition: normalizeText(item?.definition ?? item?.value ?? item?.content ?? item?.text ?? '')
            }))
          };
        }

        if (listType === 'ol-title') {
          return {
            ...block,
            type,
            listType,
            items: items.map(item => ({
              title: normalizeText(item?.title ?? item?.heading ?? item?.label ?? ''),
              content: normalizeText(item?.content ?? item?.description ?? item?.text ?? item?.body ?? '')
            }))
          };
        }

        return {
          ...block,
          type,
          listType,
          items: items.map(item => ({
            content: normalizeText(
              item?.content ??
              item?.text ??
              item?.value ??
              item?.title ??
              item?.label ??
              item?.name ??
              item?.item ??
              item ??
              ''
            )
          }))
        };
      }

      if (type === 'card') {
        const subtype = ['2-col', '3-col'].includes(block.subtype) ? block.subtype : (data.subtype || '2-col');
        const cards = Array.isArray(block.cards) ? block.cards : (Array.isArray(data.cards) ? data.cards : []);
        return {
          ...block,
          type,
          subtype,
          cards: cards.map(card => ({
            title: normalizeText(card?.title ?? ''),
            content: normalizeText(card?.content ?? ''),
            image: String(card?.image ?? placeholderImage),
            alt: String(card?.alt ?? '')
          }))
        };
      }

      const rawContent = normalizeText(block.content ?? data.text ?? data.content ?? block.text ?? '');
      const lines = rawContent.split('\n').map(line => line.trim()).filter(Boolean);
      const bulletLines = lines.filter(line => /^[-*•]\s+/.test(line));
      const orderedLines = lines.filter(line => /^\d+[\.)]\s+/.test(line));

      if (lines.length >= 2) {
        const bulletRatio = bulletLines.length / lines.length;
        const orderedRatio = orderedLines.length / lines.length;
        if (orderedLines.length >= 2 && orderedRatio >= 0.6) {
          return {
            ...block,
            type: 'list',
            listType: 'ol',
            items: orderedLines.map(line => ({ content: normalizeText(line.replace(/^\d+[\.)]\s+/, '')) }))
          };
        }
        if (bulletLines.length >= 2 && bulletRatio >= 0.6) {
          return {
            ...block,
            type: 'list',
            listType: 'ul',
            items: bulletLines.map(line => ({ content: normalizeText(line.replace(/^[-*•]\s+/, '')) }))
          };
        }
      }

      const rawVariant = String(block.variant ?? data.variant ?? block.style ?? block.preset ?? '').toLowerCase().replace(/\s+/g, '-');
      const variantMap = {
        highlight: 'small',
        highlighted: 'small',
        emphasis: 'small',
        note: 'small',
        callout: 'small',
        caption: 'small-gray',
        disclaimer: 'small-gray',
        gray: 'small-gray',
        grey: 'small-gray',
        smallgray: 'small-gray',
        'small-gray': 'small-gray',
        'small_grey': 'small-gray',
        'small_gray': 'small-gray',
        'small-grey': 'small-gray',
        small: 'small',
        normal: 'normal'
      };
      const variant = variantMap[rawVariant] || (['normal', 'small', 'small-gray'].includes(block.variant) ? block.variant : 'normal');
      return {
        ...block,
        type,
        variant,
        content: rawContent
      };
    });

    return {
      ...draft,
      blocks
    };
  }

  areDraftsEquivalent(a, b) {
    if (!a || !b) return false;
    try {
      const pick = (d) => ({
        title: d.title || d.name || '',
        blocks: Array.isArray(d.blocks) ? d.blocks : []
      });
      return JSON.stringify(pick(a)) === JSON.stringify(pick(b));
    } catch (e) {
      return false;
    }
  }

  sanitizeDraftForAi(draft) {
    if (!draft || !Array.isArray(draft.blocks)) return draft;

    const isNonEmptyListItem = (item) => {
      if (!item || typeof item !== 'object') return Boolean(String(item || '').trim());
      const content = String(
        item.content ?? item.text ?? item.value ?? item.title ?? item.label ?? item.name ?? ''
      ).trim();
      const term = String(item.term ?? '').trim();
      const definition = String(item.definition ?? '').trim();
      return Boolean(content || term || definition);
    };

    const blocks = draft.blocks
      .map(block => {
        if (block?.type !== 'list') return block;
        const items = Array.isArray(block.items) ? block.items : [];
        const filteredItems = items.filter(isNonEmptyListItem);
        return { ...block, items: filteredItems };
      })
      .filter(block => {
        if (block?.type !== 'list') return true;
        return Array.isArray(block.items) && block.items.length > 0;
      });

    return { ...draft, blocks };
  }

  getAiSelectionContext() {
    const selected = this.state.getSelectedBlock ? this.state.getSelectedBlock() : null;
    if (!selected) return null;
    const selectionText = (() => {
      try {
        const sel = window.getSelection();
        return sel ? sel.toString().trim() : '';
      } catch (e) {
        return '';
      }
    })();

    const blocks = Array.isArray(this.state.blocks) ? this.state.blocks : [];
    const selectedIndex = blocks.findIndex(block => block && block.id === selected.id);
    let scope = 'block';
    let subtree = null;
    if (selected.type === 'header' && selectedIndex !== -1) {
      scope = 'subtree';
      const level = selected.level || 2;
      const range = this.getHeaderSubtreeRange(blocks, selectedIndex, level);
      if (range) {
        subtree = {
          startIndex: range.start,
          endIndex: range.end,
          blocks: blocks.slice(range.start, range.end + 1)
        };
      }
    }

    return {
      id: selected.id || null,
      type: selected.type || null,
      listType: selected.listType || null,
      level: selected.level || null,
      preset: selected.preset || null,
      variant: selected.variant || null,
      content: typeof selected.content === 'string' ? selected.content : null,
      items: Array.isArray(selected.items) ? selected.items : null,
      cards: Array.isArray(selected.cards) ? selected.cards : null,
      selectionText,
      scope,
      subtree
    };
  }

  getHeaderSubtreeRange(blocks, headerIndex, headerLevel) {
    if (!Array.isArray(blocks) || headerIndex < 0) return null;
    let end = blocks.length - 1;
    for (let i = headerIndex + 1; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (block && block.type === 'header' && typeof block.level === 'number') {
        if (block.level <= headerLevel) {
          end = i - 1;
          break;
        }
      }
    }
    return { start: headerIndex, end };
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
    this.bindDraftBackupButtons();
    this.setupAiPanel();
    
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
    this.state.on('save', () => this.syncCurrentDraftToServer());
    
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
   * Setup AI panel actions
   */
  setupAiPanel() {
    const chatSendBtn = this.getElement('btn-ai-chat-send');
    const chatInput = this.getElement('ai-chat-input');
    const debugCopyBtn = this.getElement('btn-ai-debug-copy');
    const debugClearBtn = this.getElement('btn-ai-debug-clear');
    const debugLog = this.getElement('ai-debug-log');

    if (chatSendBtn && chatSendBtn.dataset.bound !== 'true') {
      chatSendBtn.dataset.bound = 'true';
      chatSendBtn.addEventListener('click', () => {
        if (this._aiChatInFlight) {
          this.abortAiChat();
        } else {
          this.sendAiChatMessage();
        }
      });
    }

    if (chatInput && chatInput.dataset.bound !== 'true') {
      chatInput.dataset.bound = 'true';
      chatInput.addEventListener('keydown', (e) => {
        if (e.isComposing) return;
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          if (!this._aiChatInFlight) {
            this.sendAiChatMessage();
          }
        }
      });
      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = `${Math.min(chatInput.scrollHeight, 140)}px`;
      });
    }

    if (debugCopyBtn && debugCopyBtn.dataset.bound !== 'true') {
      debugCopyBtn.dataset.bound = 'true';
      debugCopyBtn.addEventListener('click', async () => {
        const logs = this.getAiDebugLog();
        try {
          await navigator.clipboard.writeText(logs);
          this.showStatus(this.t('ai.debugCopied'), 'success');
        } catch (e) {
          console.error('Failed to copy debug log:', e);
          this.showStatus(this.t('ai.debugCopyFailed'), 'error');
        }
      });
    }

    if (debugClearBtn && debugClearBtn.dataset.bound !== 'true') {
      debugClearBtn.dataset.bound = 'true';
      debugClearBtn.addEventListener('click', () => {
        this.clearAiDebugLog();
      });
    }

    if (debugLog) {
      debugLog.value = this.getAiDebugLog();
    }


    this.renderAiChatHistory();
  }

  getAiDebugLog() {
    return localStorage.getItem('linkey-ai-debug-log') || '';
  }

  serializeDraftForLog(draft) {
    try {
      return JSON.stringify(draft || {}, null, 2);
    } catch (e) {
      return '{"error":"failed to serialize draft"}';
    }
  }

  appendAiDebugLog(entry) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${entry}`;
    const existing = this.getAiDebugLog();
    const updated = existing ? `${existing}\n${line}` : line;
    localStorage.setItem('linkey-ai-debug-log', updated);
    const debugLog = this.getElement('ai-debug-log');
    if (debugLog) debugLog.value = updated;
  }

  clearAiDebugLog() {
    localStorage.removeItem('linkey-ai-debug-log');
    const debugLog = this.getElement('ai-debug-log');
    if (debugLog) debugLog.value = '';
  }

  getDraftDebugSummary(draft) {
    const blocks = Array.isArray(draft?.blocks) ? draft.blocks : [];
    const typeCounts = {};
    let listBlocksWithItems = 0;
    const blockPreview = [];
    blocks.forEach(block => {
      const type = block?.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      if (type === 'list') {
        const items = Array.isArray(block.items) ? block.items : [];
        const hasItems = items.some(item => {
          if (!item || typeof item !== 'object') return Boolean(String(item || '').trim());
          const content = String(item.content ?? item.text ?? item.value ?? item.title ?? item.label ?? item.name ?? '').trim();
          const term = String(item.term ?? '').trim();
          const definition = String(item.definition ?? '').trim();
          return Boolean(content || term || definition);
        });
        if (hasItems) listBlocksWithItems += 1;
      }

      if (blockPreview.length < 6) {
        const preview = {
          id: block?.id || null,
          type,
          listType: block?.listType || null,
          level: block?.level || null,
          preset: block?.preset || null,
          variant: block?.variant || null,
          content: typeof block?.content === 'string' ? block.content.slice(0, 80) : null,
          items: Array.isArray(block?.items)
            ? block.items.slice(0, 3).map(item => {
                if (!item || typeof item !== 'object') return String(item || '').slice(0, 60);
                return {
                  content: String(item.content ?? item.text ?? item.value ?? item.title ?? item.label ?? item.name ?? '').slice(0, 60),
                  term: String(item.term ?? '').slice(0, 40),
                  definition: String(item.definition ?? '').slice(0, 60)
                };
              })
            : null
        };
        blockPreview.push(preview);
      }
    });
    return {
      blocks: blocks.length,
      listBlocksWithItems,
      typeCounts,
      blockPreview
    };
  }

  getDraftStyleIssues(draft) {
    const blocks = Array.isArray(draft?.blocks) ? draft.blocks : [];
    const issues = [];
    const unsupportedMarkers = /\{(?!red|blue)([a-z-]+)\}/i;
    const unsupportedClosing = /\{\/(?!red|blue)([a-z-]+)\}/i;
    blocks.forEach(block => {
      if (!block) return;
      const id = block.id || 'unknown';
      const contents = [];
      if (typeof block.content === 'string') contents.push(block.content);
      if (Array.isArray(block.items)) {
        block.items.forEach(item => {
          if (!item) return;
          if (typeof item === 'string') contents.push(item);
          if (typeof item.content === 'string') contents.push(item.content);
          if (typeof item.title === 'string') contents.push(item.title);
          if (typeof item.term === 'string') contents.push(item.term);
          if (typeof item.definition === 'string') contents.push(item.definition);
        });
      }
      if (Array.isArray(block.cards)) {
        block.cards.forEach(card => {
          if (!card) return;
          if (typeof card.title === 'string') contents.push(card.title);
          if (typeof card.content === 'string') contents.push(card.content);
        });
      }
      contents.forEach(text => {
        if (unsupportedMarkers.test(text) || unsupportedClosing.test(text)) {
          issues.push({ id, type: block.type, issue: 'unsupported-color-marker', sample: text.slice(0, 120) });
        }
        if (/\<strong[^>]*\>/i.test(text) && !/\*\*/.test(text)) {
          issues.push({ id, type: block.type, issue: 'raw-strong-tag', sample: text.slice(0, 120) });
        }
        if (/\{blue\}/i.test(text) && !/\{\/blue\}/i.test(text)) {
          issues.push({ id, type: block.type, issue: 'unclosed-blue-marker', sample: text.slice(0, 120) });
        }
      });
    });
    return issues;
  }

  getRenderedStyleIssues() {
    const issues = [];
    const canvas = this.getCanvasBlocks ? this.getCanvasBlocks() : null;
    if (!canvas) return issues;

    const candidates = canvas.querySelectorAll(
      'list-component ol li span, list-component ol li h4, list-component ol li p, list-component ol-title li h4, list-component ol-title li p, list-component dl dt span, list-component dl dd, .thmb-card__title, .thmb-card__body'
    );

    candidates.forEach((el) => {
      const text = (el.textContent || '').trim();
      if (!text) return;
      if (/\*\*.+?\*\*/.test(text) || /\{red\}|\{blue\}/i.test(text)) {
        const blockEl = el.closest('.editor-block');
        issues.push({
          id: blockEl?.dataset?.blockId || 'unknown',
          issue: 'unparsed-inline-markers',
          sample: text.slice(0, 120)
        });
      }
    });

    return issues;
  }

  logRenderedStyleIssues() {
    const issues = this.getRenderedStyleIssues();
    if (!issues.length) {
      this._lastRenderedStyleIssuesKey = '';
      return;
    }
    const key = JSON.stringify(issues);
    if (key === this._lastRenderedStyleIssuesKey) return;
    this._lastRenderedStyleIssuesKey = key;
    if (this.appendAiDebugLog) {
      this.appendAiDebugLog(`renderStyleIssues=${key}`);
    }
  }

  /**
   * Bind draft backup buttons if present
   */
  bindDraftBackupButtons() {
    const exportBtn = this.getElement('btn-export-drafts');
    if (exportBtn && exportBtn.dataset.bound !== 'true') {
      exportBtn.dataset.bound = 'true';
      exportBtn.addEventListener('click', () => this.exportDraftsToFile());
    }

    const exportCurrentBtn = this.getElement('btn-export-current-draft');
    if (exportCurrentBtn && exportCurrentBtn.dataset.bound !== 'true') {
      exportCurrentBtn.dataset.bound = 'true';
      exportCurrentBtn.addEventListener('click', () => this.exportCurrentDraftToFile());
    }

    const importBtn = this.getElement('btn-import-drafts');
    if (importBtn && importBtn.dataset.bound !== 'true') {
      importBtn.dataset.bound = 'true';
      importBtn.addEventListener('click', () => this.openDraftsImportDialog());
    }

    const importMarkdownBtn = this.getElement('btn-import-markdown');
    if (importMarkdownBtn && importMarkdownBtn.dataset.bound !== 'true') {
      importMarkdownBtn.dataset.bound = 'true';
      importMarkdownBtn.addEventListener('click', () => this.openMarkdownImportDialog());
    }

    const fileInput = this.getElement('drafts-file-input');
    if (fileInput && fileInput.dataset.bound !== 'true') {
      fileInput.dataset.bound = 'true';
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.importDraftsFromFile(file);
      });
    }

    const markdownInput = this.getElement('markdown-file-input');
    if (markdownInput && markdownInput.dataset.bound !== 'true') {
      markdownInput.dataset.bound = 'true';
      markdownInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.importMarkdownFromFile(file);
      });
    }
  }

  /**
   * Resolve server base URL
   */
  getServerBaseUrl() {
    const stored = localStorage.getItem(STORAGE_KEYS.serverUrl);
    if (stored) return stored;
    if (window.location && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')) {
      return 'http://127.0.0.1:3001';
    }
    return SERVER_CONFIG.baseUrl;
  }

  /**
   * Whether server sync is enabled
   */
  isServerEnabled() {
    return SERVER_CONFIG.enabled && !!this.getServerBaseUrl();
  }

  /**
   * Fetch all drafts from server
   */
  async fetchServerDrafts() {
    if (!this.isServerEnabled()) return [];
    const baseUrl = this.getServerBaseUrl();
    const res = await fetch(`${baseUrl}/drafts`);
    if (!res.ok) throw new Error('Failed to fetch drafts');
    return res.json();
  }

  /**
   * Fetch a single draft from server
   */
  async fetchServerDraft(draftId) {
    if (!this.isServerEnabled()) return null;
    const baseUrl = this.getServerBaseUrl();
    const res = await fetch(`${baseUrl}/drafts/${draftId}`);
    if (!res.ok) return null;
    return res.json();
  }

  /**
   * Save current draft to server
   */
  async syncCurrentDraftToServer() {
    if (!this.isServerEnabled()) return;
    const baseUrl = this.getServerBaseUrl();
    const payload = this.state.exportCurrentDraft();
    try {
      await fetch(`${baseUrl}/drafts/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Server sync failed', e);
    }
  }

  /**
   * Delete draft on server
   */
  async deleteServerDraft(draftId) {
    if (!this.isServerEnabled()) return false;
    const baseUrl = this.getServerBaseUrl();
    const res = await fetch(`${baseUrl}/drafts/${draftId}`, { method: 'DELETE' });
    return res.ok;
  }

  /**
   * Sync all local drafts to server
   */
  async syncAllDraftsToServer() {
    if (!this.isServerEnabled()) return;
    const drafts = this.state.getDraftsList();
    const baseUrl = this.getServerBaseUrl();

    for (const entry of drafts) {
      const raw = localStorage.getItem(`linkey-draft-${entry.id}`);
      if (!raw) continue;
      try {
        const payload = JSON.parse(raw);
        await fetch(`${baseUrl}/drafts/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn('Failed to sync draft', entry.id, e);
      }
    }
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
   * Export all drafts to a JSON file
   */
  exportDraftsToFile() {
    const data = this.state.exportDrafts();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `linkey-drafts-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showStatus('Drafts exported', 'success');
  }

  /**
   * Export current draft to a JSON file
   */
  exportCurrentDraftToFile() {
    const data = this.state.exportCurrentDraft();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    const rawName = (data.name || 'draft').trim();
    const safeTitle = rawName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    const fallback = data.id ? `draft-${data.id}` : 'draft';
    const fileBase = safeTitle || fallback;
    a.href = url;
    a.download = `${fileBase}-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showStatus('Draft exported', 'success');
  }

  /**
   * Open file picker for draft import
   */
  openDraftsImportDialog() {
    const input = this.getElement('drafts-file-input');
    if (input) {
      input.value = '';
      input.click();
    }
  }

  /**
   * Open file picker for markdown import
   */
  openMarkdownImportDialog() {
    const input = this.getElement('markdown-file-input');
    if (input) {
      input.value = '';
      input.click();
    }
  }

  /**
   * Import drafts from selected file
   */
  async importDraftsFromFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const existingCount = this.state.getDraftsList().length;
      let replaceExisting = false;
      if (existingCount > 0) {
        replaceExisting = await this.showConfirm(
          'Replace existing drafts?',
          'Importing can duplicate drafts. Replace will delete existing local and server drafts before importing.'
        );
      }
      const result = this.state.importDrafts(payload, { overwrite: replaceExisting, replace: replaceExisting });
      if (this.isServerEnabled()) {
        if (replaceExisting) {
          try {
            const serverDrafts = await this.fetchServerDrafts();
            for (const draft of serverDrafts) {
              if (draft && draft.id) {
                await this.deleteServerDraft(draft.id);
              }
            }
          } catch (e) {
            console.warn('Failed to clear server drafts before import', e);
          }
        }
        await this.syncAllDraftsToServer();
      }
      if (result.imported || result.updated) {
        this.showStatus(`Imported ${result.imported + result.updated} drafts`, 'success');
      } else {
        this.showStatus('No drafts imported', 'error');
      }
      this.render();
    } catch (e) {
      console.error('Draft import failed:', e);
      this.showStatus('Draft import failed', 'error');
    }
  }

  /**
   * Import markdown file and convert to blocks
   */
  async importMarkdownFromFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const rawBlocks = markdownImporterModule.parseMarkdownToBlocks
        ? markdownImporterModule.parseMarkdownToBlocks(text)
        : [];
      const blocks = rawBlocks.map(block => ({
        ...block,
        id: this.state.generateId()
      }));

      if (!blocks.length) {
        this.showStatus('No blocks parsed from markdown', 'error');
        return;
      }

      const rawName = file.name || 'Imported Markdown';
      const title = rawName.replace(/\.[^/.]+$/, '').trim() || 'Imported Markdown';
      this.state.newDraft();
      this.state.title = title;
      this.state.blocks = blocks;
      this.state.saveAs(title);

      if (this.isServerEnabled()) {
        await this.syncCurrentDraftToServer();
      }

      if (this.isInDraftsBrowser) {
        this.showDraftsBrowser();
      } else {
        this.showFileOperations();
      }

      this.render();
      this.showStatus('Markdown imported', 'success');
    } catch (e) {
      console.error('Markdown import failed:', e);
      this.showStatus('Markdown import failed', 'error');
    }
  }

  /**
   * Request AI suggestions and optional edits
   */
  async requestAiSuggestions() {
    const prompt = (arguments.length > 0 ? arguments[0] : '')?.trim();
    const options = arguments.length > 1 ? arguments[1] : {};
    if (!prompt) {
      this.showStatus('Enter a prompt for the AI', 'error');
      return;
    }

    if (!this.isServerEnabled()) {
      this.showStatus('AI server is not configured', 'error');
      return;
    }

    try {
      this.appendAiDebugLog(`requestAiSuggestions: promptLength=${prompt.length}`);
      this.appendAiDebugLog(`requestAiSuggestions: promptPreview=${prompt.slice(0, 280)}`);
      const baseUrl = this.getServerBaseUrl();
      const selection = this.getAiSelectionContext();
      this.appendAiDebugLog(`requestAiSuggestions: baseUrl=${baseUrl}`);
      this.appendAiDebugLog(`requestAiSuggestions: draftSummary=${JSON.stringify(this.getDraftDebugSummary(this.state.exportCurrentDraft()))}`);
      this.appendAiDebugLog(`requestAiSuggestions: draftFull=${this.serializeDraftForLog(this.state.exportCurrentDraft())}`);
      const preIssues = this.getDraftStyleIssues(this.state.exportCurrentDraft());
      if (preIssues.length) {
        this.appendAiDebugLog(`requestAiSuggestions: styleIssues=${JSON.stringify(preIssues)}`);
      }
      if (selection) {
        this.appendAiDebugLog(`requestAiSuggestions: selection=${JSON.stringify(selection)}`);
      }
      this.appendAiDebugLog('requestAiSuggestions: requireEdits=true');
      const res = await fetch(`${baseUrl}/ai/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: options?.signal,
        body: JSON.stringify({
          prompt,
          draft: this.sanitizeDraftForAi(this.state.exportCurrentDraft()),
          language: this.currentLang,
          requireEdits: true,
          selection
        })
      });

      if (!res.ok) {
        let details = '';
        try {
          const errJson = await res.json();
          details = errJson && (errJson.details || errJson.error) ? `: ${errJson.details || errJson.error}` : '';
        } catch (e) {
          // ignore
        }
        throw new Error(`AI request failed (${res.status})${details}`);
      }

      const data = await res.json();
      this.appendAiDebugLog(`requestAiSuggestions: responseOk suggestions=${Array.isArray(data?.suggestions) ? data.suggestions.length : 0} hasDraft=${!!data?.draft}`);
      if (Array.isArray(data?.suggestions)) {
        this.appendAiDebugLog(`requestAiSuggestions: suggestionsPreview=${data.suggestions.join(' | ').slice(0, 400)}`);
      }
      if (data?.draft) {
        this.appendAiDebugLog(`requestAiSuggestions: draftSummary=${JSON.stringify(this.getDraftDebugSummary(data.draft))}`);
      }
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      const normalized = this.normalizeAiDraft(data && data.draft ? data.draft : null);

      if (normalized) {
        normalized.blocks = this.state.ensureBlockIds(normalized.blocks);
        normalized.id = normalized.id || this.state.currentDraftId || this.state.generateDraftId();
        normalized.title = normalized.title || normalized.name || this.state.title || '';
        normalized.name = normalized.name || normalized.title || this.state.title || 'Untitled Draft';
        this._aiDraftCandidate = normalized;
      } else {
        this._aiDraftCandidate = null;
      }

      return { suggestions, draft: this._aiDraftCandidate };
    } catch (e) {
      this.appendAiDebugLog(`requestAiSuggestions: error=${String(e?.message || e)}`);
      console.error('AI request failed:', e);
      this.showStatus('AI request failed', 'error');
    } finally {
      // no-op
    }

    return null;
  }

  /**
   * Request AI chat response (Q&A)
   */
  async requestAiChatResponse() {
    const message = (arguments.length > 0 ? arguments[0] : '')?.trim();
    const options = arguments.length > 1 ? arguments[1] : {};
    if (!message) {
      this.showStatus('Enter a message for the AI', 'error');
      return;
    }

    if (!this.isServerEnabled()) {
      this.showStatus('AI server is not configured', 'error');
      return;
    }

    try {
      this.appendAiDebugLog(`requestAiChatResponse: messageLength=${message.length}`);
      const baseUrl = this.getServerBaseUrl();
      this.appendAiDebugLog(`requestAiChatResponse: baseUrl=${baseUrl}`);
      const history = Array.isArray(this.aiChatHistory)
        ? this.aiChatHistory
            .filter(entry => entry && entry.role && entry.content)
            .map(entry => ({ role: entry.role, content: entry.content }))
        : [];

      const res = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: options?.signal,
        body: JSON.stringify({
          message,
          history,
          draft: this.sanitizeDraftForAi(this.state.exportCurrentDraft()),
          language: this.currentLang
        })
      });

      if (!res.ok) {
        let details = '';
        try {
          const errJson = await res.json();
          details = errJson && (errJson.details || errJson.error) ? `: ${errJson.details || errJson.error}` : '';
        } catch (e) {
          // ignore
        }
        throw new Error(`AI chat failed (${res.status})${details}`);
      }

      const data = await res.json();
      this.appendAiDebugLog(`requestAiChatResponse: responseOk length=${String(data?.message || '').length}`);
      return data && data.message ? String(data.message) : '';
    } catch (e) {
      this.appendAiDebugLog(`requestAiChatResponse: error=${String(e?.message || e)}`);
      console.error('AI chat failed:', e);
      this.showStatus('AI chat failed', 'error');
    }

    return '';
  }

  /**
   * Apply AI edits to current draft
   */
  async applyAiEdits() {
    try {
      const draft = arguments.length > 0 ? arguments[0] : this._aiDraftCandidate;
      if (!draft) return false;
      this.appendAiDebugLog(`applyAiEdits: draftBlocks=${Array.isArray(draft.blocks) ? draft.blocks.length : 0}`);
      this.appendAiDebugLog(`applyAiEdits: draftPreview=${JSON.stringify(this.getDraftDebugSummary(draft).blockPreview)}`);
      this.appendAiDebugLog(`applyAiEdits: draftFull=${this.serializeDraftForLog(draft)}`);
      const normalized = this.normalizeAiDraft(draft) || draft;
      if (normalized && normalized.blocks) {
        normalized.blocks = this.state.ensureBlockIds(normalized.blocks);
      }
      const current = this.state.exportCurrentDraft();
      const selection = this.getAiSelectionContext();
      this.appendAiDebugLog(`applyAiEdits: currentSummary=${JSON.stringify(this.getDraftDebugSummary(current))}`);
      this.appendAiDebugLog(`applyAiEdits: normalizedSummary=${JSON.stringify(this.getDraftDebugSummary(normalized))}`);
      this.appendAiDebugLog(`applyAiEdits: currentFull=${this.serializeDraftForLog(current)}`);
      this.appendAiDebugLog(`applyAiEdits: normalizedFull=${this.serializeDraftForLog(normalized)}`);
      const currentIssues = this.getDraftStyleIssues(current);
      const normalizedIssues = this.getDraftStyleIssues(normalized);
      if (currentIssues.length) {
        this.appendAiDebugLog(`applyAiEdits: currentStyleIssues=${JSON.stringify(currentIssues)}`);
      }
      if (normalizedIssues.length) {
        this.appendAiDebugLog(`applyAiEdits: normalizedStyleIssues=${JSON.stringify(normalizedIssues)}`);
      }

      const preserveCardImages = (sourceDraft, targetDraft) => {
        if (!sourceDraft || !targetDraft) return;
        const sourceBlocks = Array.isArray(sourceDraft.blocks) ? sourceDraft.blocks : [];
        const targetBlocks = Array.isArray(targetDraft.blocks) ? targetDraft.blocks : [];
        const sourceById = new Map(sourceBlocks.map(block => [block?.id, block]));

        targetBlocks.forEach(block => {
          if (!block || block.type !== 'card' || !Array.isArray(block.cards)) return;
          const source = sourceById.get(block.id);
          if (source && Array.isArray(source.cards)) {
            block.cards = block.cards.map((card, index) => {
              const currentCard = source.cards[index];
              if (currentCard && typeof currentCard.image === 'string') {
                return { ...card, image: currentCard.image };
              }
              return { ...card };
            });
          } else {
            block.cards = block.cards.map(card => ({ ...card, image: '' }));
          }
        });
      };

      preserveCardImages(current, normalized);

      let finalDraft = normalized;
      if (selection && selection.id) {
        const targetId = selection.id;
        const currentBlocks = Array.isArray(current.blocks) ? current.blocks : [];
        const normalizedBlocks = Array.isArray(normalized.blocks) ? normalized.blocks : [];
        const updatedBlock = normalizedBlocks.find(block => block && block.id === targetId);
        if (!updatedBlock) {
          this.appendAiDebugLog(`applyAiEdits: selected block not found in AI draft (${targetId})`);
          this.showStatus(this.t('ai.noEdits'), 'info');
          return false;
        }
        const currentIds = new Set(currentBlocks.map(block => block && block.id).filter(Boolean));
        const extraBlocks = normalizedBlocks.filter(block => block && block.id && !currentIds.has(block.id));
        const insertPosition = normalized.selectionInsert || normalized._selectionInsert || normalized.insertPosition || null;
        let mergedBlocks = currentBlocks.map(block => (block && block.id === targetId ? updatedBlock : block));

        if (selection.scope === 'subtree') {
          const selectedBlock = currentBlocks.find(block => block && block.id === targetId);
          const headerLevel = selectedBlock?.level || selection.level || 2;
          const currentRange = this.getHeaderSubtreeRange(currentBlocks, currentBlocks.findIndex(block => block && block.id === targetId), headerLevel);
          const normalizedRange = this.getHeaderSubtreeRange(normalizedBlocks, normalizedBlocks.findIndex(block => block && block.id === targetId), headerLevel);
          if (currentRange && normalizedRange) {
            mergedBlocks = [
              ...currentBlocks.slice(0, currentRange.start),
              ...normalizedBlocks.slice(normalizedRange.start, normalizedRange.end + 1),
              ...currentBlocks.slice(currentRange.end + 1)
            ];
            this.appendAiDebugLog(`applyAiEdits: replaced subtree ${targetId} (${currentRange.start}-${currentRange.end})`);
          }
        } else if (extraBlocks.length && (insertPosition === 'before' || insertPosition === 'after')) {
          const targetIndex = mergedBlocks.findIndex(block => block && block.id === targetId);
          if (targetIndex !== -1) {
            const insertAt = insertPosition === 'before' ? targetIndex : targetIndex + 1;
            mergedBlocks = [
              ...mergedBlocks.slice(0, insertAt),
              ...extraBlocks,
              ...mergedBlocks.slice(insertAt)
            ];
            this.appendAiDebugLog(`applyAiEdits: inserted ${extraBlocks.length} block(s) ${insertPosition} ${targetId}`);
          }
        }

        finalDraft = {
          ...current,
          blocks: mergedBlocks,
          title: current.title,
          name: current.name || current.title || ''
        };
        this.appendAiDebugLog(`applyAiEdits: applied to selection ${targetId}`);
      }

      if (this.areDraftsEquivalent(current, finalDraft)) {
        this.appendAiDebugLog('applyAiEdits: no changes detected');
        this.showStatus(this.t('ai.noEdits'), 'info');
        return false;
      }

      this.state.applyDraftData(finalDraft);
      this.state.save(finalDraft.name || finalDraft.title || this.state.title || 'Untitled Draft');

      if (this.isServerEnabled()) {
        await this.syncCurrentDraftToServer();
      }

      this.render();
      this.showStatus('AI edits applied', 'success');
      this.appendAiDebugLog('applyAiEdits: applied');
      return true;
    } catch (e) {
      this.appendAiDebugLog(`applyAiEdits: error=${String(e?.message || e)}`);
      console.error('Failed to apply AI edits:', e);
      this.showStatus('Failed to apply AI edits', 'error');
      return false;
    }
  }

  showAiChatView() {
    return propertiesModule.showAiChatView ? propertiesModule.showAiChatView(this) : undefined;
  }

  showEditView() {
    this.isInAiChatView = false;
    return this.updatePropertiesPanel();
  }

  appendAiChatMessage(role, text, record = true) {
    const container = this.getElement('ai-chat-messages');
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = `ai-chat-message ${role}`;
    const content = document.createElement('div');
    content.className = 'ai-chat-message-text';
    content.textContent = text;
    msg.appendChild(content);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    if (record) {
      this.aiChatHistory.push({ role, content: text });
    }
  }

  appendAiSuggestionMessage(text, draft, record = true, entryRef = null) {
    const container = this.getElement('ai-chat-messages');
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = 'ai-chat-message assistant';

    const entry = entryRef || {
      role: 'assistant',
      content: text,
      text,
      draft,
      applied: false,
      undoDraft: null
    };

    const content = document.createElement('div');
    content.className = 'ai-chat-message-text';
    content.textContent = text;
    msg.appendChild(content);

    if (draft) {
      this._pendingAiDraft = draft;
      this._pendingAiSummary = text;

      const actions = document.createElement('div');
      actions.className = 'ai-apply-actions';

      const applyBtn = document.createElement('button');
      applyBtn.className = 'btn btn-primary ai-apply-inline';
      applyBtn.textContent = entry.applied ? this.t('ai.revert') : this.t('ai.apply');
      applyBtn.addEventListener('click', async () => {
        if (applyBtn.disabled) return;
        applyBtn.disabled = true;
        dropBtn.disabled = true;
        const workingMsg = this.appendAiWorkingMessage(this.t('ai.applying'));
        try {
          if (!entry.applied) {
            entry.undoDraft = this.state.exportCurrentDraft();
            const applied = await this.applyAiEdits(draft);
            if (applied) {
              entry.applied = true;
              applyBtn.textContent = this.t('ai.revert');
              this.appendAiChatMessage('assistant', this.t('ai.applyConfirmed'));
            } else {
              this.appendAiChatMessage('assistant', this.t('ai.noEdits'));
            }
          } else if (entry.undoDraft) {
            this.state.applyDraftData(entry.undoDraft);
            this.state.save(entry.undoDraft.name || entry.undoDraft.title || this.state.title || 'Untitled Draft');
            if (this.isServerEnabled()) {
              await this.syncCurrentDraftToServer();
            }
            this.render();
            entry.applied = false;
            applyBtn.textContent = this.t('ai.apply');
            this.appendAiChatMessage('assistant', this.t('ai.revertConfirmed'));
          }
        } catch (e) {
          console.error('Failed to apply AI edits:', e);
          this.appendAiChatMessage('assistant', this.t('ai.applyFailed'));
        } finally {
          if (workingMsg) workingMsg.remove();
          applyBtn.disabled = false;
          dropBtn.disabled = false;
          this._pendingAiDraft = null;
          this._pendingAiSummary = null;
        }
      });

      const dropBtn = document.createElement('button');
      dropBtn.className = 'btn btn-secondary ai-drop-inline';
      dropBtn.textContent = this.t('ai.drop');
      dropBtn.addEventListener('click', () => {
        this._pendingAiDraft = null;
        this._pendingAiSummary = null;
        this.appendAiChatMessage('assistant', this.t('ai.dropConfirmed'));
      });

      actions.appendChild(applyBtn);
      actions.appendChild(dropBtn);
      msg.appendChild(actions);
    }

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    if (record) {
      this.aiChatHistory.push(entry);
    }
  }

  renderAiChatHistory() {
    const container = this.getElement('ai-chat-messages');
    if (!container) return;
    container.innerHTML = '';

    if (!this.aiChatHistory.length) {
      const welcome = document.createElement('div');
      welcome.className = 'ai-chat-message assistant';
      welcome.textContent = this.t('ai.chatWelcome');
      container.appendChild(welcome);
      return;
    }

    this.aiChatHistory.forEach(entry => {
      const text = entry.text || entry.content || '';
      if (entry.role === 'assistant' && entry.draft) {
        this.appendAiSuggestionMessage(text, entry.draft, false, entry);
      } else {
        this.appendAiChatMessage(entry.role, text, false);
      }
    });
  }

  appendAiThinkingMessage() {
    const container = this.getElement('ai-chat-messages');
    if (!container) return null;
    const msg = document.createElement('div');
    msg.className = 'ai-chat-message assistant thinking';
    msg.textContent = this.t('ai.thinking');
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  appendAiWorkingMessage(text) {
    const container = this.getElement('ai-chat-messages');
    if (!container) return null;
    const msg = document.createElement('div');
    msg.className = 'ai-chat-message assistant thinking';
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  updateAiChatBusyState(isBusy) {
    this._aiChatInFlight = isBusy;
    const sendBtn = this.getElement('btn-ai-chat-send');
    if (sendBtn) {
      sendBtn.textContent = isBusy ? this.t('ai.chatStop') : this.t('ai.chatSend');
    }
  }

  abortAiChat() {
    if (this._aiChatAbortController) {
      this._aiChatAbortController.abort();
    }
  }

  async sendAiChatMessage() {
    const input = this.getElement('ai-chat-input');
    const sendBtn = this.getElement('btn-ai-chat-send');
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    if (this._aiChatInFlight) return;

    if (!this.isServerEnabled()) {
      this.showStatus('AI server is not configured', 'error');
      return;
    }

    this.appendAiChatMessage('user', message);
    this.appendAiDebugLog(`chat: userMessage=${message.slice(0, 400)}`);
    input.value = '';
    const thinkingMsg = this.appendAiThinkingMessage();
    this._aiChatAbortController = new AbortController();
    this.updateAiChatBusyState(true);

    try {
      const lower = message.toLowerCase();
      const isApply = /(^(apply|yes|y|ok|okay|sure|はい|うん|お願いします|適用|やって)$)/i.test(lower);
      const isDrop = /(^(drop|no|n|nope|nah|いいえ|やめて|不要)$)/i.test(lower);
      if (this._pendingAiDraft && (isApply || isDrop)) {
        if (isApply) {
          await this.applyAiEdits(this._pendingAiDraft);
          this.appendAiChatMessage('assistant', this.t('ai.applyConfirmed'));
        } else {
          this.appendAiChatMessage('assistant', this.t('ai.dropConfirmed'));
        }
        this._pendingAiDraft = null;
        this._pendingAiSummary = null;
        if (thinkingMsg) thinkingMsg.remove();
        return;
      }

      const editIntent = /(edit|rewrite|improve|suggest|apply|fix|polish|shorten|expand|convert|summarize|draft|rewrite this|make it|change to|revise|refine|rephrase|cleanup|copyedit|proofread|tone|style|rewrite the|update|enhance|optimize|simplify|clarify|make this|make it more|make it less|improve this|edit this|fix this|直して|修正|編集|添削|書き換え|リライト|改善|要約|短く|長く|整えて|言い換え|表現|文章)/i.test(message);
      const wantsEdits = editIntent;
      const result = await this.requestAiSuggestions(message, { signal: this._aiChatAbortController.signal });
      const suggestions = Array.isArray(result?.suggestions) ? result.suggestions : [];
      const proposed = result?.draft || null;
      const current = this.state.exportCurrentDraft();
      const hasDraft = !!proposed;
      const hasChanges = proposed ? !this.areDraftsEquivalent(current, proposed) : false;
      if (thinkingMsg) thinkingMsg.remove();
      if (suggestions.length) {
        this.appendAiSuggestionMessage(suggestions.map((item, index) => `${index + 1}. ${item}`).join('\n'), hasDraft ? proposed : null);
      } else if (hasDraft) {
        this.appendAiSuggestionMessage('Edits are ready.', proposed);
      } else {
        this.appendAiChatMessage('assistant', this.t('ai.noEdits'));
      }
    } catch (e) {
      if (thinkingMsg) thinkingMsg.remove();
      if (e?.name === 'AbortError') {
        // interrupted by user
        return;
      }
      console.error('AI chat failed:', e);
      this.showStatus('AI chat failed', 'error');
      this.appendAiChatMessage('assistant', this.t('ai.chatFailed'));
    } finally {
      this._aiChatAbortController = null;
      this.updateAiChatBusyState(false);
    }
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
   * Get AI help modal element
   */
  getAiHelpModal() {
    return this.getElement('ai-help-modal');
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

  openAiHelpModal() {
    const modal = this.getAiHelpModal();
    if (!modal) return;
    modal.classList.add('show');

    if (modal.dataset.bound !== 'true') {
      modal.dataset.bound = 'true';
      const closeBtn = modal.querySelector('#ai-help-close');
      const okBtn = modal.querySelector('#ai-help-ok');
      const handleClose = () => this.closeAiHelpModal();
      if (closeBtn) {
        closeBtn.addEventListener('click', handleClose);
      }
      if (okBtn) {
        okBtn.addEventListener('click', handleClose);
      }
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          handleClose();
        }
      });
    }
  }

  closeAiHelpModal() {
    const modal = this.getAiHelpModal();
    if (!modal) return;
    modal.classList.remove('show');
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

