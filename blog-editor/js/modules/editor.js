/**
 * Blog Editor Canvas/Editor Module
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};
  const constants = window.BLOG_EDITOR_CONSTANTS || {};
  const resolveMarginValue = constants.resolveMarginValue || (() => 0);
  const components = modules.components || {};

  const createDefaultBlockData = components.getDefaultBlockData || ((component) => ({ type: component.type }));

  const createComponentElement = components.createComponentElement || ((block) => {
    const div = document.createElement('div');
    div.textContent = `Unknown component: ${block.type}`;
    return div;
  });

  const setupCanvas = (app) => {
    const canvas = app.getCanvasBlocks();
    const canvasWrapper = app.getCanvasWrapper();
    const editorCanvas = app.getEditorCanvas();

    // Auto-scroll configuration
    let autoScrollInterval = null;
    const clearAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    };

    // Setup title input
    const titleInput = app.getCanvasTitleInput();
    titleInput.value = app.state.title;
    titleInput.addEventListener('input', (e) => {
      app.state.setTitle(e.target.value);
    });

    // Global dragover prevention to keep drag alive
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      app.setDropEffect(e);
    });

    // Drag over editor canvas - implement continuous auto-scroll based on mouse position
    // Use editorCanvas (the full scrollable area) instead of just canvas (the blocks container)
    const scrollTarget = editorCanvas || canvasWrapper;
    scrollTarget.addEventListener('dragover', (e) => {
      e.preventDefault();
      app.setDropEffect(e);

      // Clear existing interval
      clearAutoScroll();

      // Get viewport bounds (the scrollable area)
      const rect = scrollTarget.getBoundingClientRect();
      const mouseY = e.clientY;
      const relativeY = mouseY - rect.top;
      const centerY = rect.height / 2;
      const offsetFromCenter = relativeY - centerY;

      // Calculate scroll speed based on distance from center
      // Speed increases as you move further from center
      const maxSpeed = 40;
      const distanceFromCenter = Math.abs(offsetFromCenter);
      const maxDistance = rect.height / 2;

      // Normalize distance (0 at center, 1 at edges)
      const normalizedDistance = distanceFromCenter / maxDistance;

      // Calculate speed with smooth acceleration (quadratic easing)
      const speed = normalizedDistance * normalizedDistance * maxSpeed;

      // Scroll if in upper or lower half
      if (offsetFromCenter < 0 && scrollTarget.scrollTop > 0) {
        // Upper half - scroll up
        autoScrollInterval = setInterval(() => {
          const scrollAmount = Math.max(1, speed);
          scrollTarget.scrollTop -= scrollAmount;
          if (scrollTarget.scrollTop <= 0) {
            clearAutoScroll();
          }
        }, 16); // ~60fps
      } else if (offsetFromCenter > 0) {
        // Lower half - scroll down
        const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
        if (scrollTarget.scrollTop < maxScroll) {
          autoScrollInterval = setInterval(() => {
            const scrollAmount = Math.max(1, speed);
            scrollTarget.scrollTop += scrollAmount;
            const currentMaxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
            if (scrollTarget.scrollTop >= currentMaxScroll) {
              clearAutoScroll();
            }
          }, 16); // ~60fps
        }
      }
    });

    // Stop auto-scroll on drag leave
    canvas.addEventListener('dragleave', () => {
      clearAutoScroll();
    });

    // Stop auto-scroll on drop
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();

      // Clear auto-scroll
      clearAutoScroll();

      // If dropping on empty canvas, add at the end
      if (app.state.blocks.length === 0) {
        app.handleDrop(0);
      }
    });

    // Stop auto-scroll on drag end (via palette)
    app.getBody().addEventListener('dragend', () => {
      clearAutoScroll();
    });
  };

  const render = (app) => {
    const canvas = app.getCanvasBlocks();
    const titleInput = app.getCanvasTitleInput();

    // Update title input to match state
    if (titleInput && titleInput.value !== app.state.title) {
      titleInput.value = app.state.title;
    }

    canvas.innerHTML = '';

    // Show empty state if no blocks, but still add a drop zone
    if (app.state.blocks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="icon">📝</div>
        <p>Start by dragging a component from the left panel</p>
        <p style="font-size: 12px; color: #ccc;">Or click a component to add it here</p>
      `;
      canvas.appendChild(emptyState);

      // Add a drop zone for the first item
      const dropZone = app.createDropZone(0);
      canvas.appendChild(dropZone);

      // Update properties panel
      app.updatePropertiesPanel();
      return;
    }

    // Get dragged block index if reordering
    const draggedBlockIndex = app.draggedBlock
      ? app.state.blocks.findIndex(b => b.id === app.draggedBlock.id)
      : -1;

    // Render each block
    app.state.blocks.forEach((block, index) => {
      // Add drop zone before each block
      // Skip drop zone if it's directly before or after the dragged block
      // position === draggedBlockIndex means drop zone right before the dragged block
      // position === draggedBlockIndex + 1 means drop zone right after the dragged block
      const shouldSkipDropZone = draggedBlockIndex !== -1 &&
        (index === draggedBlockIndex || index === draggedBlockIndex + 1);

      if (!shouldSkipDropZone) {
        const dropZoneBefore = app.createDropZone(index);
        canvas.appendChild(dropZoneBefore);
      }

      // Add the block
      const blockElement = app.createBlock(block);

      // Calculate and apply margin collapse
      if (index > 0) {
        const prevBlock = app.state.blocks[index - 1];
        const marginOffset = app.calculateMarginCollapse(prevBlock, block);
        if (marginOffset !== 0) {
          // Don't scale the margin - CSS zoom will handle it naturally
          // The marginOffset is in base pixels matching the theme's rem units (1rem = 10px)
          blockElement.style.marginTop = `${marginOffset}px`;
        } else {
          // Clear any previous margin
          blockElement.style.marginTop = '';
        }
      } else {
        // Clear margin for first block
        blockElement.style.marginTop = '';
      }

      canvas.appendChild(blockElement);
    });

    // Add final drop zone
    // Skip if position (app.state.blocks.length) equals draggedBlockIndex + 1
    const finalPosition = app.state.blocks.length;
    const shouldSkipFinalDropZone = draggedBlockIndex !== -1 &&
      finalPosition === draggedBlockIndex + 1;

    if (!shouldSkipFinalDropZone) {
      const dropZoneAfter = app.createDropZone(finalPosition);
      canvas.appendChild(dropZoneAfter);
    }

    // Update properties panel
    app.updatePropertiesPanel();
  };

  const createDropZone = (app, position) => {
    const zone = document.createElement('div');
    zone.className = 'drop-zone';
    zone.dataset.position = position;

    const label = document.createElement('span');
    label.className = 'drop-zone-label';
    label.textContent = '➕ Drop here';
    zone.appendChild(label);

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('active');
      app.dropPosition = position;
      label.textContent = '➕ Drop component here';
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('active');
      label.textContent = '➕ Drop here';
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Drop on zone at position:', position);
      zone.classList.remove('active');
      label.textContent = '➕ Drop here';
      app.handleDrop(position);
    });

    return zone;
  };

  const clearDropZones = (app) => {
    app.getElementsBySelector('.drop-zone').forEach(zone => {
      zone.classList.remove('active');
    });
  };

  const handleDrop = (app, position) => {
    // Handle block reordering
    if (app.draggedBlock) {
      const currentIndex = app.state.blocks.findIndex(b => b.id === app.draggedBlock.id);

      if (currentIndex !== -1 && currentIndex !== position && currentIndex !== position - 1) {
        const targetPosition = position > currentIndex ? position - 1 : position;
        app.state.moveBlock(app.draggedBlock.id, targetPosition);

        // Force re-render to fix spacing
        setTimeout(() => {
          app.render();
        }, 0);
      }
      app.draggedBlock = null;
      return;
    }

    // Handle new component from palette
    if (app.draggedComponent) {
      const blockData = app.createBlockData(app.draggedComponent);
      const block = app.state.addBlock(blockData, position);

      // Select the newly added block
      app.state.selectBlock(block.id);

      app.draggedComponent = null;
    }
  };

  const createBlockData = (app, component) => {
    return createDefaultBlockData(component, app);
  };

  const createBlock = (app, block) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-block';
    wrapper.dataset.blockId = block.id;

    if (block.id === app.state.selectedBlockId) {
      wrapper.classList.add('selected');
    }

    // Create drag handle (separate from toolbar, on the left)
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.draggable = true; // Set as property
    dragHandle.setAttribute('draggable', 'true'); // Also set as attribute for compatibility
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = 'Drag to reorder';
    wrapper.appendChild(dragHandle);

    // Setup drag handlers on the drag handle
    dragHandle.addEventListener('dragstart', (e) => {
      // Set drag data - MUST be done synchronously
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', block.id);

      const rect = wrapper.getBoundingClientRect();
      const rawWidth = wrapper.offsetWidth || rect.width;
      const rawHeight = wrapper.offsetHeight || rect.height;
      const dragImage = wrapper.cloneNode(true);
      const canvasWrapper = app.getCanvasWrapper();

      // Position off-screen and size to the original block
      dragImage.style.position = 'fixed';
      dragImage.style.top = '-9999px';
      dragImage.style.left = '-9999px';
      dragImage.style.width = `${rawWidth}px`;
      dragImage.style.height = `${rawHeight}px`;
      dragImage.style.boxSizing = 'border-box';
      dragImage.style.opacity = '0.85';
      dragImage.style.pointerEvents = 'none';
      dragImage.style.zIndex = '10000';
      dragImage.style.overflow = 'visible';

      // Remove the drag handle and toolbar from the clone
      const clonedHandle = dragImage.querySelector('.drag-handle');
      const clonedToolbar = dragImage.querySelector('.block-toolbar');
      if (clonedHandle) clonedHandle.remove();
      if (clonedToolbar) clonedToolbar.remove();

      // Add a border for visibility
      dragImage.style.border = '2px solid var(--editor-primary)';
      dragImage.style.borderRadius = '8px';
      dragImage.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      dragImage.style.background = 'white';

      dragImage.classList.add('drag-preview');
      if (canvasWrapper) {
        canvasWrapper.classList.forEach((className) => {
          if (className.startsWith('viewport-')) {
            dragImage.classList.add(className);
          }
        });
      }

      // If this is a list block, suppress list content to avoid default ghost
      if (block.type === 'list') {
        dragImage.innerHTML = '';
        const label = document.createElement('div');
        label.textContent = 'List block';
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.justifyContent = 'center';
        label.style.width = '100%';
        label.style.height = '100%';
        label.style.color = '#666';
        label.style.fontSize = '13px';
        dragImage.appendChild(label);
      }

      // Match canvas zoom without double-scaling or clipping
      let zoomScale = 1;
      if (canvasWrapper) {
        const wrapperStyle = window.getComputedStyle(canvasWrapper);
        const zoomValue = parseFloat(wrapperStyle.zoom);
        if (!Number.isNaN(zoomValue) && zoomValue > 0) {
          zoomScale = zoomValue;
        } else {
          const wrapperRect = canvasWrapper.getBoundingClientRect();
          const wrapperOffsetWidth = canvasWrapper.offsetWidth || wrapperRect.width;
          if (wrapperOffsetWidth) {
            zoomScale = wrapperRect.width / wrapperOffsetWidth;
          }
        }
      }

      if (!Number.isNaN(zoomScale) && zoomScale !== 1) {
        dragImage.style.zoom = zoomScale;
      }

      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 20, 20);

      setTimeout(() => {
        if (dragImage.parentNode) {
          dragImage.parentNode.removeChild(dragImage);
        }
      }, 100);

      // Store dragged block reference - MUST be done synchronously
      app.isDragging = true;
      app.draggedBlock = block;
      app.draggedComponent = null;
      app.getBody().classList.add('dragging');
      document.documentElement.classList.add('dragging');

      // Block native list drag ghosts while dragging a block
      if (!app._listDragBlocker) {
        app._listDragBlocker = (evt) => {
          if (evt.target && evt.target.closest && evt.target.closest('ul, ol, dl')) {
            evt.preventDefault();
            evt.stopPropagation();
          }
        };
        document.addEventListener('dragstart', app._listDragBlocker, true);
      }

      // Defer DOM manipulations to avoid interfering with drag
      setTimeout(() => {
        wrapper.classList.add('dragging-block');

        // Hide adjacent drop zones
        const draggedIndex = app.state.blocks.findIndex(b => b.id === block.id);
        app.getElementsBySelector('.drop-zone').forEach((zone) => {
          const position = parseInt(zone.dataset.position);
          if (position === draggedIndex || position === draggedIndex + 1) {
            zone.style.display = 'none';
          }
        });
      }, 0);
    });

    dragHandle.addEventListener('dragend', () => {
      // Clean up after drag
      app.isDragging = false;
      app.draggedBlock = null;
      wrapper.classList.remove('dragging-block');
      app.getBody().classList.remove('dragging');
      document.documentElement.classList.remove('dragging');
      if (app._listDragBlocker) {
        document.removeEventListener('dragstart', app._listDragBlocker, true);
        app._listDragBlocker = null;
      }
      app.clearDropZones();

      // Re-render to clean up drop zones and fix spacing
      setTimeout(() => {
        app.render();
      }, 0);
    });

    // Create toolbar (on the right, without drag button)
    const toolbar = document.createElement('div');
    toolbar.className = 'block-toolbar';
    toolbar.innerHTML = `
      <button class="btn-delete" title="Delete">🗑️</button>
      <button class="btn-move-up" title="Move Up">⬆️</button>
      <button class="btn-move-down" title="Move Down">⬇️</button>
    `;
    wrapper.appendChild(toolbar);

    // Setup toolbar actions
    toolbar.querySelector('.btn-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = await app.showConfirm('Delete Block', 'Are you sure you want to delete this block?');
      if (confirmed) {
        app.state.deleteBlock(block.id);
      }
    });

    toolbar.querySelector('.btn-move-up').addEventListener('click', (e) => {
      e.stopPropagation();
      const index = app.state.blocks.findIndex(b => b.id === block.id);
      if (index > 0) {
        app.state.moveBlock(block.id, index - 1);
      }
    });

    toolbar.querySelector('.btn-move-down').addEventListener('click', (e) => {
      e.stopPropagation();
      const index = app.state.blocks.findIndex(b => b.id === block.id);
      if (index < app.state.blocks.length - 1) {
        app.state.moveBlock(block.id, index + 1);
      }
    });

    // Create component
    const component = app.createComponent(block);
    wrapper.appendChild(component);

    // Select on click
    wrapper.addEventListener('click', () => {
      app.state.selectBlock(block.id);
    });

    // Handle content changes
    component.addEventListener('content-change', (e) => {
      if (block.type === 'list') {
        // List component sends data object with type and items
        app.state.updateBlock(block.id, {
          listType: e.detail.data.type,
          items: e.detail.data.items
        });
      } else {
        // Other components send content
        app.state.updateBlock(block.id, { content: e.detail.content });
      }
    });

    return wrapper;
  };

  const createComponent = (app, block) => {
    return createComponentElement(block, app);
  };

  const buildMarginLookupTable = (app) => {
    const table = {};
    const viewports = constants.VIEWPORTS || [];

    // Calculate for all combinations
    viewports.forEach(viewport => {
      const isMobile = app.isMobileViewport(viewport);

      (constants.COMPONENT_DEFS || []).forEach(prev => {
        const prevBottom = app.getComponentBottomMargin(prev, isMobile);

        (constants.COMPONENT_DEFS || []).forEach(current => {
          const currentTop = app.getComponentTopMargin(current, isMobile);

          // Calculate collapsed margin
          let collapsedMargin = 0;
          if (prevBottom > 0 && currentTop > 0) {
            // Both have margins - collapse by negating the smaller one
            collapsedMargin = -Math.min(prevBottom, currentTop);
          }

          // Store in lookup table
          const key = `${prev.key}_${current.key}_${viewport}`;
          table[key] = collapsedMargin;
        });
      });
    });

    return table;
  };

  const getComponentBottomMargin = (app, component, isMobile) => {
    const config = constants.MARGIN_CONFIG?.[component.type];
    if (!config) return 0;

    if (component.type === 'header') {
      return resolveMarginValue(config.bottom?.[component.level], isMobile);
    }

    if (component.type === 'list') {
      return resolveMarginValue(config.bottom?.default, isMobile);
    }

    return resolveMarginValue(config.bottom, isMobile);
  };

  const getComponentTopMargin = (app, component, isMobile) => {
    const config = constants.MARGIN_CONFIG?.[component.type];
    if (!config) return 0;

    if (component.type === 'header') {
      return resolveMarginValue(config.top?.[component.level], isMobile);
    }

    if (component.type === 'list') {
      const listKey = app.getListKey(component.listType);
      return resolveMarginValue(config.top?.[listKey], isMobile);
    }

    return resolveMarginValue(config.top, isMobile);
  };

  const getListKey = (app, listType) => listType || 'ul';

  const getBlockLookupKey = (app, block) => {
    if (block.type === 'header') {
      return `h${block.level}`;
    } else if (block.type === 'paragraph') {
      if (block.variant === 'small' || block.variant === 'small-gray') {
        return `p-${block.variant}`;
      }
      return 'p';
    } else if (block.type === 'list') {
      return app.getListKey(block.listType);
    } else if (block.type === 'card') {
      return `card-${block.subtype || '2-col'}`;
    } else if (block.type === 'button') {
      return block.subtype === 'large' ? 'button-large' : 'button';
    } else if (block.type === 'box') {
      return `box-${block.subtype || 'basic'}`;
    } else if (block.type === 'image') {
      return 'image';
    }
    return block.type;
  };

  const calculateMarginCollapse = (app, prevBlock, currentBlock) => {
    // Get lookup keys for both blocks
    const prevKey = app.getBlockLookupKey(prevBlock);
    const currentKey = app.getBlockLookupKey(currentBlock);
    const lookupKey = `${prevKey}_${currentKey}_${app.currentViewport}`;

    // Look up pre-calculated margin
    const margin = app.marginLookup[lookupKey];

    if (margin !== undefined) {
      return margin;
    }

    // Fallback to dynamic calculation if not in lookup table
    const prevBottomMargin = app.getBottomMargin(prevBlock);
    const currentTopMargin = app.getTopMargin(currentBlock);

    if (prevBottomMargin > 0 && currentTopMargin > 0) {
      return -Math.min(prevBottomMargin, currentTopMargin);
    }

    return 0;
  };

  const getBottomMargin = (app, block) => app.getBlockMarginValue(block, 'bottom');

  const getTopMargin = (app, block) => app.getBlockMarginValue(block, 'top');

  const getBlockMarginValue = (app, block, edge) => {
    const viewport = app.currentViewport;
    const isMobile = app.isMobileViewport(viewport);
    const config = constants.MARGIN_CONFIG?.[block.type];

    if (!config) return 0;

    if (block.type === 'header') {
      return resolveMarginValue(config[edge]?.[block.level], isMobile);
    }

    if (block.type === 'paragraph') {
      return resolveMarginValue(config[edge]?.default, isMobile);
    }

    if (block.type === 'list') {
      if (edge === 'top') {
        const listKey = app.getListKey(block.listType);
        return resolveMarginValue(config[edge]?.[listKey], isMobile);
      }
      return resolveMarginValue(config[edge]?.default, isMobile);
    }

    return resolveMarginValue(config[edge], isMobile);
  };

  modules.editor = {
    setupCanvas,
    render,
    createDropZone,
    clearDropZones,
    handleDrop,
    createBlockData,
    createBlock,
    createComponent,
    buildMarginLookupTable,
    getComponentBottomMargin,
    getComponentTopMargin,
    getListKey,
    getBlockLookupKey,
    calculateMarginCollapse,
    getBottomMargin,
    getTopMargin,
    getBlockMarginValue
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
