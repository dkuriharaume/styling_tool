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
    const content = block.content || '';
    return `${content}\n\n`;
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
