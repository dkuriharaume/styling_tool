/**
 * Paragraph Component - Web Component for Paragraphs with formatting
 */

class ParagraphComponent extends HTMLElement {
  constructor() {
    super();
    this.blockData = null;
  }
  
  connectedCallback() {
    this.render();
  }
  
  setData(data) {
    this.blockData = data;
    this.render();
  }
  
  render() {
    if (!this.blockData) return;
    
    const content = this.blockData.content || 'Type your paragraph text here...';
    const variant = this.blockData.variant || 'normal'; // normal, small, small-gray
    
    // Create paragraph element
    const p = document.createElement('p');
    
    // Apply classes based on variant
    if (variant === 'small') {
      p.className = 'small';
    } else if (variant === 'small-gray') {
      p.className = 'small small--gray';
    }
    
    p.contentEditable = 'true';
    p.innerHTML = content;
    
    // Handle content changes
    p.addEventListener('blur', (e) => {
      this.handleContentChange(e.target.innerHTML);
    });
    
    // Handle text selection for formatting toolbar
    p.addEventListener('mouseup', () => {
      this.handleTextSelection();
    });
    
    p.addEventListener('keyup', () => {
      this.handleTextSelection();
    });
    
    // Clear and append
    this.innerHTML = '';
    this.appendChild(p);
  }
  
  handleContentChange(content) {
    // Emit custom event for parent to handle
    this.dispatchEvent(new CustomEvent('content-change', {
      detail: { content },
      bubbles: true
    }));
  }
  
  handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Show formatting toolbar
      if (window.formattingToolbar) {
        window.formattingToolbar.show(selection, rect);
      }
    } else {
      // Hide toolbar when no selection
      if (window.formattingToolbar) {
        window.formattingToolbar.hide();
      }
    }
  }
}

// Register the custom element
customElements.define('paragraph-component', ParagraphComponent);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParagraphComponent;
} else if (typeof window !== 'undefined') {
  window.ParagraphComponent = ParagraphComponent;
}
