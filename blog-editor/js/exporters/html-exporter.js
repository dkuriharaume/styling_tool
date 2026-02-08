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
      case 'list':
        return this.convertList(block);
      default:
        return '';
    }
  }
  
  /**
   * Convert header block
   */
  convertHeader(block) {
    const level = block.level || 2;
    let content = block.content || '';
    const classes = this.getHeaderClasses(level, block.preset);
    
    // Clean up unwanted spans and divs
    content = this.cleanupHTML(content);
    
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
    let content = block.content || '';
    const variant = block.variant || 'normal';
    
    // Clean up unwanted spans and divs from contentEditable
    content = this.cleanupHTML(content);
    
    // Build class attribute
    let classes = '';
    if (variant === 'small') {
      classes = ' class="small"';
    } else if (variant === 'small-gray') {
      classes = ' class="small small--gray"';
    }
    
    return `<p${classes}>${content}</p>\n`;
  }
  
  /**
   * Clean up HTML by removing unwanted spans and normalizing formatting
   */
  cleanupHTML(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all span elements but keep their content
    const spans = temp.querySelectorAll('span');
    spans.forEach(span => {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
    
    // Remove div elements but keep their content
    const divs = temp.querySelectorAll('div');
    divs.forEach(div => {
      const parent = div.parentNode;
      while (div.firstChild) {
        parent.insertBefore(div.firstChild, div);
      }
      parent.removeChild(div);
    });
    
    // Normalize whitespace
    return temp.innerHTML.trim();
  }
  
  /**
   * Convert list block
   */
  convertList(block) {
    const listType = block.listType || 'ul';
    const items = block.items || [];
    let html = '';
    
    if (listType === 'ul') {
      html += '<ul class="ul">\n';
      items.forEach(item => {
        const cleanContent = this.cleanupHTML(item.content || '');
        html += `  <li>${cleanContent}</li>\n`;
      });
      html += '</ul>\n';
    } else if (listType === 'ol') {
      html += '<ol class="ol ol--mt">\n';
      items.forEach(item => {
        const cleanContent = this.cleanupHTML(item.content || '');
        html += `  <li>${cleanContent}</li>\n`;
      });
      html += '</ol>\n';
    } else if (listType === 'ol-title') {
      html += '<ol class="ol ol--title ol--mt">\n';
      items.forEach(item => {
        const cleanTitle = this.cleanupHTML(item.title || '');
        const cleanContent = this.cleanupHTML(item.content || '');
        html += '  <li>\n';
        html += `    <h4 class="h4 ol__title">${cleanTitle}</h4>\n`;
        html += `    <p>${cleanContent}</p>\n`;
        html += '  </li>\n';
      });
      html += '</ol>\n';
    } else if (listType === 'dl') {
      html += '<dl class="wide-dl">\n';
      items.forEach(item => {
        const cleanTerm = this.cleanupHTML(item.term || '');
        const cleanDef = this.cleanupHTML(item.definition || '');
        html += `  <dt>${cleanTerm}</dt>\n`;
        html += `  <dd>${cleanDef}</dd>\n`;
      });
      html += '</dl>\n';
    }
    
    return html;
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
