/**
 * LINKEY Blog Editor - Main Application
 */

class BlogEditorApp {
  constructor() {
    this.state = new EditorState();
    this.m2oExporter = new M2OExporter(this.state);
    this.htmlExporter = new HTMLExporter(this.state);
    this.draggedComponent = null;
    this.dropPosition = -1;
    this.currentViewport = 'desktop';
    
    this.init();
  }
  
  init() {
    // Setup event listeners
    this.setupPalette();
    this.setupCanvas();
    this.setupProperties();
    this.setupHeader();
    this.setupViewportToggle();
    this.setupKeyboard();
    
    // Listen to state changes
    this.state.on('change', () => this.render());
    this.state.on('select', (id) => this.handleBlockSelect(id));
    
    // Initial render
    this.render();
    this.applyViewport();
  }
  
  /**
   * Setup component palette
   */
  setupPalette() {
    const paletteItems = document.querySelectorAll('.component-item');
    
    paletteItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this.draggedComponent = {
          type: item.dataset.type,
          subtype: item.dataset.subtype
        };
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', ''); // Required for Firefox
        
        // Add visual feedback
        document.body.classList.add('dragging');
      });
      
      item.addEventListener('dragend', () => {
        this.draggedComponent = null;
        document.body.classList.remove('dragging');
        this.clearDropZones();
      });
    });
  }
  
  /**
   * Setup editor canvas
   */
  setupCanvas() {
    const canvas = document.getElementById('canvas-blocks');
    
    // Setup title input
    const titleInput = document.getElementById('canvas-title-input');
    titleInput.value = this.state.title;
    titleInput.addEventListener('input', (e) => {
      this.state.setTitle(e.target.value);
    });
    
    // Drag over canvas
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    
    // Drop on canvas (for empty state)
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      // If dropping on empty canvas, add at the end
      if (this.state.blocks.length === 0) {
        this.handleDrop(0);
      }
    });
  }
  
  /**
   * Setup properties panel
   */
  setupProperties() {
    // Will be populated when a block is selected
  }
  
  /**
   * Setup header actions
   */
  setupHeader() {
    // Export M2O button
    document.getElementById('btn-export-m2o').addEventListener('click', async () => {
      const success = await this.m2oExporter.copyToClipboard();
      if (success) {
        alert('M2O Markdown copied to clipboard!');
      }
    });
    
    // Export HTML button
    document.getElementById('btn-export-html').addEventListener('click', async () => {
      const success = await this.htmlExporter.copyToClipboard();
      if (success) {
        alert('HTML copied to clipboard!');
      }
    });
    
    // Save button
    document.getElementById('btn-save').addEventListener('click', () => {
      this.state.save();
      alert('Draft saved!');
    });
  }
  
  /**
   * Setup viewport toggle
   */
  setupViewportToggle() {
    const viewportButtons = document.querySelectorAll('.viewport-btn');
    
    viewportButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        viewportButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update viewport
        this.currentViewport = btn.dataset.viewport;
        this.applyViewport();
      });
    });
  }
  
  /**
   * Apply viewport size to canvas
   */
  applyViewport() {
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    const viewportInfo = document.getElementById('viewport-info');
    
    // Remove all viewport classes
    canvasWrapper.classList.remove('viewport-desktop', 'viewport-laptop', 'viewport-tablet', 'viewport-mobile');
    
    // Add current viewport class
    canvasWrapper.classList.add(`viewport-${this.currentViewport}`);
    
    // Update info text
    const viewportSizes = {
      desktop: 'Desktop 4K - 3840px',
      laptop: 'Laptop Full HD - 1920px',
      tablet: 'Tablet - 1024px',
      mobile: 'Mobile - 414px'
    };
    
    viewportInfo.textContent = viewportSizes[this.currentViewport];
  }
  
  /**
   * Setup keyboard shortcuts
   */
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.state.undo();
      }
      
      // Cmd/Ctrl + Shift + Z = Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        this.state.redo();
      }
      
      // Delete/Backspace on selected block
      if ((e.key === 'Delete' || e.key === 'Backspace') && 
          this.state.selectedBlockId && 
          !e.target.isContentEditable) {
        e.preventDefault();
        this.state.deleteBlock(this.state.selectedBlockId);
      }
    });
  }
  
  /**
   * Render all blocks
   */
  render() {
    const canvas = document.getElementById('canvas-blocks');
    canvas.innerHTML = '';
    
    // Show empty state if no blocks, but still add a drop zone
    if (this.state.blocks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="icon">📝</div>
        <p>Start by dragging a component from the left panel</p>
        <p style="font-size: 12px; color: #ccc;">Or click a component to add it here</p>
      `;
      canvas.appendChild(emptyState);
      
      // Add a drop zone for the first item
      const dropZone = this.createDropZone(0);
      canvas.appendChild(dropZone);
      
      // Update properties panel
      this.updatePropertiesPanel();
      return;
    }
    
    // Render each block
    this.state.blocks.forEach((block, index) => {
      // Add drop zone before each block
      const dropZoneBefore = this.createDropZone(index);
      canvas.appendChild(dropZoneBefore);
      
      // Add the block
      const blockElement = this.createBlock(block);
      canvas.appendChild(blockElement);
    });
    
    // Add final drop zone
    const dropZoneAfter = this.createDropZone(this.state.blocks.length);
    canvas.appendChild(dropZoneAfter);
    
    // Update properties panel
    this.updatePropertiesPanel();
  }
  
  /**
   * Create a drop zone element
   */
  createDropZone(position) {
    const zone = document.createElement('div');
    zone.className = 'drop-zone';
    zone.dataset.position = position;
    
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('active');
      this.dropPosition = position;
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('active');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('active');
      this.handleDrop(position);
    });
    
    return zone;
  }
  
  /**
   * Clear all drop zone highlights
   */
  clearDropZones() {
    document.querySelectorAll('.drop-zone').forEach(zone => {
      zone.classList.remove('active');
    });
  }
  
  /**
   * Handle component drop
   */
  handleDrop(position) {
    if (!this.draggedComponent) return;
    
    const blockData = this.createBlockData(this.draggedComponent);
    const block = this.state.addBlock(blockData, position);
    
    // Select the newly added block
    this.state.selectBlock(block.id);
    
    this.draggedComponent = null;
  }
  
  /**
   * Create block data from component type
   */
  createBlockData(component) {
    switch (component.type) {
      case 'header':
        return {
          type: 'header',
          level: parseInt(component.subtype) || 2,
          preset: component.subtype === '2' ? 'blue' : 'default',
          content: 'New Heading'
        };
      default:
        return { type: component.type };
    }
  }
  
  /**
   * Create a block element
   */
  createBlock(block) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-block';
    wrapper.dataset.blockId = block.id;
    
    if (block.id === this.state.selectedBlockId) {
      wrapper.classList.add('selected');
    }
    
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'block-toolbar';
    toolbar.innerHTML = `
      <button class="btn-delete" title="Delete">🗑️</button>
      <button class="btn-move-up" title="Move Up">⬆️</button>
      <button class="btn-move-down" title="Move Down">⬇️</button>
    `;
    wrapper.appendChild(toolbar);
    
    // Setup toolbar actions
    toolbar.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Delete this block?')) {
        this.state.deleteBlock(block.id);
      }
    });
    
    toolbar.querySelector('.btn-move-up').addEventListener('click', (e) => {
      e.stopPropagation();
      const index = this.state.blocks.findIndex(b => b.id === block.id);
      if (index > 0) {
        this.state.moveBlock(block.id, index - 1);
      }
    });
    
    toolbar.querySelector('.btn-move-down').addEventListener('click', (e) => {
      e.stopPropagation();
      const index = this.state.blocks.findIndex(b => b.id === block.id);
      if (index < this.state.blocks.length - 1) {
        this.state.moveBlock(block.id, index + 1);
      }
    });
    
    // Create component
    const component = this.createComponent(block);
    wrapper.appendChild(component);
    
    // Select on click
    wrapper.addEventListener('click', () => {
      this.state.selectBlock(block.id);
    });
    
    // Handle content changes
    component.addEventListener('content-change', (e) => {
      this.state.updateBlock(block.id, { content: e.detail.content });
    });
    
    return wrapper;
  }
  
  /**
   * Create component element based on type
   */
  createComponent(block) {
    switch (block.type) {
      case 'header':
        const header = document.createElement('header-component');
        header.setData(block);
        return header;
      default:
        const div = document.createElement('div');
        div.textContent = `Unknown component: ${block.type}`;
        return div;
    }
  }
  
  /**
   * Handle block selection
   */
  handleBlockSelect(id) {
    // Update visual selection
    document.querySelectorAll('.editor-block').forEach(el => {
      if (el.dataset.blockId === id) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
    
    // Update properties panel
    this.updatePropertiesPanel();
  }
  
  /**
   * Update properties panel
   */
  updatePropertiesPanel() {
    const panel = document.getElementById('properties-content');
    const selectedBlock = this.state.getSelectedBlock();
    
    if (!selectedBlock) {
      panel.innerHTML = `
        <div class="empty-state">
          <p>Select a block to edit its properties</p>
        </div>
      `;
      return;
    }
    
    // Render properties based on block type
    switch (selectedBlock.type) {
      case 'header':
        this.renderHeaderProperties(selectedBlock);
        break;
      default:
        panel.innerHTML = '<p>No properties available</p>';
    }
  }
  
  /**
   * Render header properties
   */
  renderHeaderProperties(block) {
    const panel = document.getElementById('properties-content');
    
    panel.innerHTML = `
      <h3>Header Settings</h3>
      
      <div class="property-group">
        <label>Level</label>
        <select id="prop-level">
          <option value="1" ${block.level === 1 ? 'selected' : ''}>H1</option>
          <option value="2" ${block.level === 2 ? 'selected' : ''}>H2</option>
          <option value="3" ${block.level === 3 ? 'selected' : ''}>H3</option>
          <option value="4" ${block.level === 4 ? 'selected' : ''}>H4</option>
        </select>
      </div>
      
      <div class="property-group">
        <label>Style Preset</label>
        <select id="prop-preset">
          <option value="default" ${block.preset === 'default' ? 'selected' : ''}>Default</option>
          ${block.level === 2 || block.level === 4 ? '<option value="blue" ' + (block.preset === 'blue' ? 'selected' : '') + '>Blue</option>' : ''}
          ${block.level === 2 || block.level === 4 ? '<option value="red" ' + (block.preset === 'red' ? 'selected' : '') + '>Red</option>' : ''}
        </select>
      </div>
      
      <div class="property-group">
        <label>Content</label>
        <textarea id="prop-content">${block.content || ''}</textarea>
      </div>
      
      <button class="btn btn-danger btn-small" id="prop-delete">Delete Block</button>
    `;
    
    // Setup property change listeners
    document.getElementById('prop-level').addEventListener('change', (e) => {
      this.state.updateBlock(block.id, { level: parseInt(e.target.value) });
    });
    
    document.getElementById('prop-preset').addEventListener('change', (e) => {
      this.state.updateBlock(block.id, { preset: e.target.value });
    });
    
    document.getElementById('prop-content').addEventListener('input', (e) => {
      this.state.updateBlock(block.id, { content: e.target.value });
    });
    
    document.getElementById('prop-delete').addEventListener('click', () => {
      if (confirm('Delete this block?')) {
        this.state.deleteBlock(block.id);
      }
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BlogEditorApp();
});
