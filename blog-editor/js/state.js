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
      select: [],
      save: [],
      saving: []
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
   * Save to localStorage (overwrite current draft or create new)
   */
  save(draftName = null, forceNew = false) {
    const name = draftName || this.title || 'Untitled Draft';
    const timestamp = Date.now();
    
    // If we have a current draft and not forcing new, update it
    const id = (this.currentDraftId && !forceNew) ? this.currentDraftId : `draft-${timestamp}`;
    
    const data = {
      id,
      name,
      title: this.title,
      blocks: this.blocks,
      timestamp: this.currentDraftTimestamp || timestamp,
      updatedAt: timestamp
    };
    
    // Save the draft
    localStorage.setItem(`linkey-draft-${id}`, JSON.stringify(data));
    
    // Update drafts list
    const draftsList = this.getDraftsList();
    const existingIndex = draftsList.findIndex(d => d.id === id);
    
    if (existingIndex !== -1) {
      // Update existing entry
      draftsList[existingIndex].name = name;
      draftsList[existingIndex].updatedAt = timestamp;
    } else {
      // Add new entry
      draftsList.unshift({ id, name, timestamp, updatedAt: timestamp });
    }
    
    localStorage.setItem('linkey-drafts-list', JSON.stringify(draftsList));
    
    // Set as current draft
    this.currentDraftId = id;
    this.currentDraftTimestamp = data.timestamp;
    localStorage.setItem('linkey-current-draft-id', id);
    
    return id;
  }
  
  /**
   * Save as new draft (always creates new)
   */
  saveAs(draftName) {
    const result = this.save(draftName, true);
    // Emit save event
    this.emit('save');
    return result;
  }
  
  /**
   * Auto-save with debounce (updates existing draft)
   */
  autoSave() {
    clearTimeout(this.autoSaveTimer);
    
    // Emit saving event immediately
    this.emit('saving');
    
    this.autoSaveTimer = setTimeout(() => {
      if (this.currentDraftId) {
        // Update existing draft
        const data = {
          id: this.currentDraftId,
          name: this.title || 'Untitled Draft',
          title: this.title,
          blocks: this.blocks,
          timestamp: this.currentDraftTimestamp || Date.now(),
          updatedAt: Date.now()
        };
        
        localStorage.setItem(`linkey-draft-${this.currentDraftId}`, JSON.stringify(data));
        
        // Update in list
        const draftsList = this.getDraftsList();
        const index = draftsList.findIndex(d => d.id === this.currentDraftId);
        if (index !== -1) {
          draftsList[index].name = data.name;
          draftsList[index].updatedAt = data.updatedAt;
          localStorage.setItem('linkey-drafts-list', JSON.stringify(draftsList));
        }
        
        // Emit save event
        this.emit('save');
      } else {
        // Create new draft
        this.save();
        // Emit save event
        this.emit('save');
      }
    }, 1000);
  }
  
  /**
   * Load from localStorage
   */
  load(draftId = null) {
    try {
      // If no draftId specified, load the last opened draft
      const id = draftId || localStorage.getItem('linkey-current-draft-id');
      
      if (id) {
        const data = localStorage.getItem(`linkey-draft-${id}`);
        if (data) {
          const parsed = JSON.parse(data);
          this.title = parsed.title || '';
          this.blocks = parsed.blocks || [];
          this.currentDraftId = parsed.id;
          this.currentDraftTimestamp = parsed.timestamp;
          this.saveHistory(); // Initialize history
          this.emit('change'); // Trigger render
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
    return false;
  }
  
  /**
   * Get list of all drafts
   */
  getDraftsList() {
    try {
      const list = localStorage.getItem('linkey-drafts-list');
      return list ? JSON.parse(list) : [];
    } catch (e) {
      return [];
    }
  }
  
  /**
   * Delete a draft
   */
  deleteDraft(draftId) {
    // Remove from storage
    localStorage.removeItem(`linkey-draft-${draftId}`);
    
    // Remove from list
    const draftsList = this.getDraftsList();
    const filtered = draftsList.filter(d => d.id !== draftId);
    localStorage.setItem('linkey-drafts-list', JSON.stringify(filtered));
    
    // If deleting current draft, clear it
    if (this.currentDraftId === draftId) {
      this.currentDraftId = null;
      this.currentDraftTimestamp = null;
      localStorage.removeItem('linkey-current-draft-id');
    }
  }
  
  /**
   * Create new draft
   */
  newDraft() {
    this.title = '';
    this.blocks = [];
    this.selectedBlockId = null;
    this.history = [];
    this.historyIndex = -1;
    this.currentDraftId = null;
    this.currentDraftTimestamp = null;
    localStorage.removeItem('linkey-current-draft-id');
    this.emit('change');
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
