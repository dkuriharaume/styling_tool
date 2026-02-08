/**
 * Header Component - Web Component for Headers
 */

class HeaderComponent extends HTMLElement {
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
    
    const level = this.blockData.level || 2;
    const content = this.blockData.content || 'Heading text...';
    const preset = this.blockData.preset || 'default';
    
    // Get appropriate classes
    const classes = this.getClasses(level, preset);
    
    // Create header element
    const header = document.createElement(`h${level}`);
    header.className = classes;
    header.contentEditable = 'true';
    header.textContent = content;
    
    // Handle content changes
    header.addEventListener('blur', (e) => {
      this.handleContentChange(e.target.textContent);
    });
    
    // Handle Enter key (prevent new line, but allow IME composition)
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        e.target.blur();
      }
    });
    
    // Clear and append
    this.innerHTML = '';
    this.appendChild(header);
  }
  
  getClasses(level, preset) {
    const classes = [`h${level}`];
    
    if (level === 2) {
      if (preset === 'red') {
        classes.push('h2--red');
      } else {
        // Default to blue for h2
        classes.push('h2--blue');
      }
    } else if (level === 4) {
      if (preset === 'blue') {
        classes.push('h4--blue');
      } else if (preset === 'red') {
        classes.push('h4--red');
      }
    }
    
    return classes.join(' ');
  }
  
  handleContentChange(content) {
    // Emit custom event for parent to handle
    this.dispatchEvent(new CustomEvent('content-change', {
      detail: { content },
      bubbles: true
    }));
  }
}

// Register the custom element
customElements.define('header-component', HeaderComponent);

// Export for use in other modules
window.HeaderComponent = HeaderComponent;
