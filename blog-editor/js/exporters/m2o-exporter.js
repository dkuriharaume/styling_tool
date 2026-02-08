/**
 * M2O Exporter - Export to M2O Markdown Format
 */

class M2OExporter {
  constructor(state) {
    this.state = state;
  }
  
  /**
   * Export current state to M2O markdown
   */
  export() {
    let markdown = 'M2O:\n';
    
    // Add title if present
    if (this.state.title) {
      markdown += `# ${this.state.title}\n\n`;
    }
    
    // Process each block
    for (const block of this.state.blocks) {
      markdown += this.convertBlock(block);
    }
    
    return markdown;
  }
  
  /**
   * Convert a single block to markdown
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
    const hashes = '#'.repeat(level);
    const content = this.stripHTML(block.content || '');
    const preset = block.preset && block.preset !== 'default' ? ` {${block.preset}}` : '';
    
    return `${hashes} ${content}${preset}\n\n`;
  }
  
  /**
   * Convert paragraph block
   */
  convertParagraph(block) {
    let content = block.content || '';
    
    // Convert HTML formatting to M2O markdown
    content = this.convertHTMLToM2O(content);
    
    // Add variant markers for small text
    const variant = block.variant || 'normal';
    if (variant === 'small') {
      return `{small}\n${content}\n\n`;
    } else if (variant === 'small-gray') {
      return `{small-gray}\n${content}\n\n`;
    }
    
    return `${content}\n\n`;
  }
  
  /**
   * Convert HTML formatting to M2O markdown syntax
   */
  convertHTMLToM2O(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Process nodes recursively
    return this.processNode(temp);
  }
  
  /**
   * Process a node and its children
   */
  processNode(node) {
    let result = '';
    
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const tagName = child.tagName.toLowerCase();
        const className = child.className || '';
        const innerText = this.processNode(child);
        
        if (tagName === 'strong') {
          if (className.includes('strong--info')) {
            result += `**${innerText}** {info}`;
          } else if (className.includes('strong--warning')) {
            result += `**${innerText}** {warning}`;
          } else {
            result += `**${innerText}**`;
          }
        } else if (tagName === 'a') {
          const href = child.getAttribute('href') || '';
          result += `[${innerText}](${href})`;
        } else {
          result += innerText;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Strip HTML tags but preserve formatting
   */
  stripHTML(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }
  
  /**
   * Copy to clipboard
   */
  async copyToClipboard() {
    const markdown = this.export();
    try {
      await navigator.clipboard.writeText(markdown);
      return true;
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
      return false;
    }
  }
  
  /**
   * Download as file
   */
  download(filename = 'blog-post.md') {
    const markdown = this.export();
    const blob = new Blob([markdown], { type: 'text/markdown' });
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
window.M2OExporter = M2OExporter;
