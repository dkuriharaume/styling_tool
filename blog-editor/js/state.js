/**
 * EditorState - State Management for Blog Editor
 */

class EditorState {
  constructor() {
    this.title = '';
    this.blocks = [];
    this.selectedBlockId = null;
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    
    // Event listeners
    this.listeners = {
      change: [],
      select: []
    };
    
    // Initialize with saved state if available
    this.load();
  }
  
  /**
   * Generate unique ID for blocks
   */
  generateId() {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Add a new block
   */
  addBlock(blockData, position = -1) {
    const block = {
      id: this.generateId(),
      ...blockData
    };
    
    if (position === -1) {
      this.blocks.push(block);
    } else {
      this.blocks.splice(position, 0, block);
    }
    
    this.saveHistory();
    this.emit('change');
    this.autoSave();
    
    return block;
  }
  
  /**
   * Update an existing block
   */
  updateBlock(id, changes) {
    const index = this.blocks.findIndex(b => b.id === id);
    if (index !== -1) {
      this.blocks[index] = {
        ...this.blocks[index],
        ...changes
      };
      this.saveHistory();
      this.emit('change');
      this.autoSave();
    }
  }
  
  /**
   * Delete a block
   */
  deleteBlock(id) {
    const index = this.blocks.findIndex(b => b.id === id);
    if (index !== -1) {
      this.blocks.splice(index, 1);
      if (this.selectedBlockId === id) {
        this.selectedBlockId = null;
      }
      this.saveHistory();
      this.emit('change');
      this.autoSave();
    }
  }
  
  /**
   * Move a block to a new position
   */
  moveBlock(id, newPosition) {
    const index = this.blocks.findIndex(b => b.id === id);
    if (index !== -1) {
      const [block] = this.blocks.splice(index, 1);
      this.blocks.splice(newPosition, 0, block);
      this.saveHistory();
      this.emit('change');
      this.autoSave();
    }
  }
  
  /**
   * Get a block by ID
   */
  getBlock(id) {
    return this.blocks.find(b => b.id === id);
  }
  
  /**
   * Select a block
   */
  selectBlock(id) {
    this.selectedBlockId = id;
    this.emit('select', id);
  }
  
  /**
   * Get selected block
   */
  getSelectedBlock() {
    return this.selectedBlockId ? this.getBlock(this.selectedBlockId) : null;
  }
  
  /**
   * Set title
   */
  setTitle(title) {
    this.title = title;
    this.saveHistory();
    this.emit('change');
    this.autoSave();
  }
  
  /**
   * Save current state to history
   */
  saveHistory() {
    // Remove any history after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add current state
    this.history.push({
      title: this.title,
      blocks: JSON.parse(JSON.stringify(this.blocks))
    });
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }
  
  /**
   * Undo last action
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.history[this.historyIndex];
      this.title = state.title;
      this.blocks = JSON.parse(JSON.stringify(state.blocks));
      this.emit('change');
      this.autoSave();
      return true;
    }
    return false;
  }
  
  /**
   * Redo last undone action
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const state = this.history[this.historyIndex];
      this.title = state.title;
      this.blocks = JSON.parse(JSON.stringify(state.blocks));
      this.emit('change');
      this.autoSave();
      return true;
    }
    return false;
  }
  
  /**
   * Save to localStorage
   */
  save() {
    const data = {
      title: this.title,
      blocks: this.blocks,
      timestamp: Date.now()
    };
    localStorage.setItem('linkey-blog-editor-draft', JSON.stringify(data));
  }
  
  /**
   * Auto-save with debounce
   */
  autoSave() {
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.save();
    }, 1000);
  }
  
  /**
   * Load from localStorage
   */
  load() {
    try {
      const data = localStorage.getItem('linkey-blog-editor-draft');
      if (data) {
        const parsed = JSON.parse(data);
        this.title = parsed.title || '';
        this.blocks = parsed.blocks || [];
        this.saveHistory(); // Initialize history
      }
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
  }
  
  /**
   * Clear all data
   */
  clear() {
    this.title = '';
    this.blocks = [];
    this.selectedBlockId = null;
    this.history = [];
    this.historyIndex = -1;
    localStorage.removeItem('linkey-blog-editor-draft');
    this.emit('change');
  }
  
  /**
   * Export to JSON
   */
  toJSON() {
    return {
      version: '1.0',
      title: this.title,
      blocks: this.blocks
    };
  }
  
  /**
   * Import from JSON
   */
  fromJSON(data) {
    if (data.version === '1.0') {
      this.title = data.title || '';
      this.blocks = data.blocks || [];
      this.saveHistory();
      this.emit('change');
      this.autoSave();
    }
  }
  
  /**
   * Event emitter
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

// Export for use in other modules
window.EditorState = EditorState;
