/**
 * HTML Exporter - Export to HTML Format
 */

class HTMLExporter {
  constructor(state) {
    this.state = state;
  }
  
  /**
   * Export current state to HTML
   */
  export() {
    let html = '';
    
    // Process each block
    for (const block of this.state.blocks) {
      html += this.convertBlock(block);
    }
    
    return html;
  }
  
  /**
   * Convert a single block to HTML
   */
  convertBlock(block) {
    switch (block.type) {
      case 'header':
        return this.convertHeader(block);
      case 'paragraph':
        return this.convertParagraph(block);
      default:
        return '';
    }
  }
  
  /**
   * Convert header block
   */
  convertHeader(block) {
    const level = block.level || 2;
    const content = block.content || '';
    const classes = this.getHeaderClasses(level, block.preset);
    
    return `<h${level} class="${classes}">${content}</h${level}>\n`;
  }
  
  /**
   * Get header CSS classes
   */
  getHeaderClasses(level, preset) {
    const classes = [`h${level}`];
    
    if (level === 2) {
      if (preset === 'red') {
        classes.push('h2--red');
      } else {
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
  
  /**
   * Convert paragraph block
   */
  convertParagraph(block) {
    const content = block.content || '';
    return `<p>${content}</p>\n`;
  }
  
  /**
   * Copy to clipboard
   */
  async copyToClipboard() {
    const html = this.export();
    try {
      await navigator.clipboard.writeText(html);
      return true;
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
      return false;
    }
  }
  
  /**
   * Download as file
   */
  download(filename = 'blog-post.html') {
    const html = this.export();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export for use in other modules
window.HTMLExporter = HTMLExporter;
