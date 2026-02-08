/**
 * Blog Editor Formatting Toolbar Module
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  class FormattingToolbar {
    constructor() {
      this.toolbar = null;
      this.currentSelection = null;
      this.init();
    }

    init() {
      this.createToolbar();
      this.attachToBody();
      this.hide();
    }

    createToolbar() {
      this.toolbar = document.createElement('div');
      this.toolbar.className = 'formatting-toolbar';
      this.toolbar.innerHTML = `
        <button class="toolbar-btn" data-action="bold" title="Bold (Cmd+B)">
          <strong>B</strong>
        </button>
        <button class="toolbar-btn" data-action="info" title="Info (Primary Color)">
          <span style="color: #2C7AC0; font-weight: bold;">Info</span>
        </button>
        <button class="toolbar-btn" data-action="warning" title="Warning (Red Color)">
          <span style="color: #B12D3E; font-weight: bold;">Warn</span>
        </button>
        <button class="toolbar-btn" data-action="link" title="Add Link">
          🔗
        </button>
        <button class="toolbar-btn" data-action="clear" title="Clear Formatting">
          ✕
        </button>
      `;

      // Add event listeners
      this.toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault(); // Prevent losing selection
          const action = btn.dataset.action;
          this.applyFormatting(action);
        });
      });
    }

    attachToBody() {
      document.body.appendChild(this.toolbar);
    }

    show(selection, rect) {
      this.currentSelection = selection;

      // Position toolbar above selection
      const top = rect.top - this.toolbar.offsetHeight - 10 + window.scrollY;
      const left = rect.left + (rect.width / 2) - (this.toolbar.offsetWidth / 2) + window.scrollX;

      this.toolbar.style.top = `${top}px`;
      this.toolbar.style.left = `${left}px`;
      this.toolbar.classList.add('visible');
    }

    hide() {
      this.toolbar.classList.remove('visible');
      this.currentSelection = null;
    }

    applyFormatting(action) {
      if (!this.currentSelection) return;

      // Restore selection
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      let wrapper;

      switch (action) {
        case 'bold':
          wrapper = document.createElement('strong');
          wrapper.className = 'strong';
          wrapper.textContent = selectedText;
          break;

        case 'info':
          wrapper = document.createElement('strong');
          wrapper.className = 'strong strong--info';
          wrapper.textContent = selectedText;
          break;

        case 'warning':
          wrapper = document.createElement('strong');
          wrapper.className = 'strong strong--warning';
          wrapper.textContent = selectedText;
          break;

        case 'link': {
          const url = prompt('Enter URL:', 'https://');
          if (!url) return;
          wrapper = document.createElement('a');
          wrapper.className = 'txtlink';
          wrapper.href = url;
          wrapper.target = '_blank';
          wrapper.rel = 'noopener';
          wrapper.textContent = selectedText;
          break;
        }

        case 'clear':
          // Just replace with plain text
          range.deleteContents();
          range.insertNode(document.createTextNode(selectedText));
          this.hide();
          return;

        default:
          return;
      }

      // Replace selection with wrapped element
      range.deleteContents();
      range.insertNode(wrapper);

      // Trigger content change event
      const event = new Event('blur', { bubbles: true });
      range.commonAncestorContainer.parentElement.dispatchEvent(event);

      this.hide();
    }
  }

  const initFormattingToolbar = () => {
    if (!window.formattingToolbar) {
      window.formattingToolbar = new FormattingToolbar();
    }
    return window.formattingToolbar;
  };

  modules.toolbar = {
    FormattingToolbar,
    initFormattingToolbar
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
