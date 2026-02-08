/**
 * Blog Editor Properties Panel Module
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  const setupProperties = () => {
    // Will be populated when a block is selected
  };

  const updatePropertiesPanel = (app) => {
    const panel = app.getPropertiesPanel();
    const selectedBlock = app.state.getSelectedBlock();

    if (!selectedBlock) {
      // If draft browser is showing and no block selected, keep it
      if (app.isInDraftsBrowser) {
        return;
      }

      // Show file operations when no block selected
      app.showFileOperations();

      // Clear block properties when nothing is selected
      const propsContainer = app.getBlockPropertiesContainer();
      if (propsContainer) {
        propsContainer.remove();
      }

      return;
    }

    // Close draft browser if it's open when a block is selected
    if (app.isInDraftsBrowser) {
      app.isInDraftsBrowser = false;
    }

    // Hide file operations when block is selected
    const fileOps = app.getFileOperationsElement();
    if (fileOps) {
      fileOps.style.display = 'none';
    }

    // Remove draft browser if it's showing
    const draftsBrowser = app.getDraftsBrowserElement();
    if (draftsBrowser) {
      draftsBrowser.remove();
    }

    // Create properties container if not exists
    let propsContainer = app.getBlockPropertiesContainer();
    if (!propsContainer) {
      propsContainer = document.createElement('div');
      propsContainer.className = 'block-properties';
      panel.appendChild(propsContainer);
    }

    // Render properties based on block type
    switch (selectedBlock.type) {
      case 'header':
        app.renderHeaderProperties(selectedBlock, propsContainer);
        break;
      case 'paragraph':
        app.renderParagraphProperties(selectedBlock, propsContainer);
        break;
      case 'list':
        app.renderListProperties(selectedBlock, propsContainer);
        break;
      default:
        propsContainer.innerHTML = '<p>No properties available</p>';
    }
  };

  const renderHeaderProperties = (app, block, container) => {
    container.innerHTML = `
      <h3>${app.t('properties.header')}</h3>
      
      <div class="property-group">
        <label>${app.t('properties.level')}</label>
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
      
      <button class="btn btn-danger btn-small" id="prop-delete">${app.t('properties.deleteBlock')}</button>
    `;

    // Setup property change listeners
    app.getPropertiesControl('prop-level').addEventListener('change', (e) => {
      app.state.updateBlock(block.id, { level: parseInt(e.target.value) });
    });

    app.getPropertiesControl('prop-preset').addEventListener('change', (e) => {
      app.state.updateBlock(block.id, { preset: e.target.value });
    });

    app.getPropertiesControl('prop-content').addEventListener('input', (e) => {
      app.state.updateBlock(block.id, { content: e.target.value });
    });

    app.getPropertiesControl('prop-delete').addEventListener('click', async () => {
      const confirmed = await app.showConfirm('Delete Block', 'Are you sure you want to delete this block?');
      if (confirmed) {
        app.state.deleteBlock(block.id);
      }
    });
  };

  const renderParagraphProperties = (app, block, container) => {
    container.innerHTML = `
      <h3>${app.t('properties.paragraph')}</h3>
      
      <div class="property-group">
        <label>Text Variant</label>
        <select id="prop-variant">
          <option value="normal" ${block.variant === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="small" ${block.variant === 'small' ? 'selected' : ''}>Small (Highlighted)</option>
          <option value="small-gray" ${block.variant === 'small-gray' ? 'selected' : ''}>Small (Gray)</option>
        </select>
      </div>
      
      <div class="property-group">
        <label>Content</label>
        <div class="property-note">Select text in the editor to format it (bold, info, warning, link).</div>
      </div>
      
      <button class="btn btn-danger btn-small" id="prop-delete">${app.t('properties.deleteBlock')}</button>
    `;

    // Setup property change listeners
    app.getPropertiesControl('prop-variant').addEventListener('change', (e) => {
      app.state.updateBlock(block.id, { variant: e.target.value });
    });

    app.getPropertiesControl('prop-delete').addEventListener('click', async () => {
      const confirmed = await app.showConfirm('Delete Block', 'Are you sure you want to delete this block?');
      if (confirmed) {
        app.state.deleteBlock(block.id);
      }
    });
  };

  const renderListProperties = (app, block, container) => {
    const listTypeLabels = {
      'ul': app.t('palette.unordered'),
      'ol': app.t('palette.ordered'),
      'ol-title': app.t('palette.orderedTitle'),
      'dl': app.t('palette.dictionary')
    };

    container.innerHTML = `
      <h3>${app.t('properties.list')}</h3>
      
      <div class="property-group">
        <label>${app.t('properties.type')}</label>
        <select id="prop-list-type">
          <option value="ul" ${block.listType === 'ul' ? 'selected' : ''}>${listTypeLabels['ul']}</option>
          <option value="ol" ${block.listType === 'ol' ? 'selected' : ''}>${listTypeLabels['ol']}</option>
          <option value="ol-title" ${block.listType === 'ol-title' ? 'selected' : ''}>${listTypeLabels['ol-title']}</option>
          <option value="dl" ${block.listType === 'dl' ? 'selected' : ''}>${listTypeLabels['dl']}</option>
        </select>
      </div>
      
      <div class="property-group">
        <label>${app.t('properties.items')}</label>
        <div class="property-note">${app.t('properties.itemsNote')}</div>
        <button class="btn btn-secondary btn-small" id="prop-add-item" style="margin-top: 1rem;">${app.t('properties.addItem')}</button>
      </div>
      
      <button class="btn btn-danger btn-small" id="prop-delete">${app.t('properties.deleteBlock')}</button>
    `;

    // Setup property change listeners
    app.getPropertiesControl('prop-list-type').addEventListener('change', (e) => {
      const newType = e.target.value;
      const oldType = block.listType;

      // Convert items format when changing type, preserving existing content
      let newItems;

      if (newType === 'dl') {
        // Converting to dictionary list
        newItems = block.items.map((item, index) => {
          if (item.term !== undefined) {
            // Already a dictionary item
            return item;
          } else if (item.title !== undefined) {
            // From ol-title
            return { term: item.title, definition: item.content || '' };
          } else {
            // From ul or ol - ALWAYS parse content looking for " : " separator
            const content = item.content || '';
            const separatorIndex = content.indexOf(' : ');
            if (separatorIndex > 0) {
              // Split by " : " separator
              return {
                term: content.substring(0, separatorIndex).trim(),
                definition: content.substring(separatorIndex + 3).trim()
              };
            } else {
              // No separator found - use content as term, leave definition BLANK
              return { term: content || `Term ${index + 1}`, definition: '' };
            }
          }
        });
      } else if (newType === 'ol-title') {
        // Converting to ordered list with titles
        newItems = block.items.map((item, index) => {
          if (item.title !== undefined) {
            // Already has title
            return item;
          } else if (item.term !== undefined) {
            // From dictionary
            return { title: item.term, content: item.definition || '' };
          } else {
            // From ul or ol - parse content looking for " : " separator
            const content = item.content || '';
            const separatorIndex = content.indexOf(' : ');
            if (separatorIndex > 0) {
              // Split by " : " separator
              return {
                title: content.substring(0, separatorIndex).trim(),
                content: content.substring(separatorIndex + 3).trim()
              };
            } else {
              // No separator found - use content as title, leave content BLANK
              return { title: content || `Title ${index + 1}`, content: '' };
            }
          }
        });
      } else {
        // Converting to ul or ol (simple list)
        newItems = block.items.map((item) => {
          if (item.content !== undefined && item.title === undefined && item.term === undefined) {
            // Already a simple item
            return item;
          } else if (item.title !== undefined) {
            // From ol-title
            if (item.content && item.content.trim()) {
              // Has content - combine with separator
              return { content: item.title + ' : ' + item.content };
            } else {
              // No content - just use title
              return { content: item.title };
            }
          } else if (item.term !== undefined) {
            // From dictionary
            if (item.definition && item.definition.trim()) {
              // Has definition - combine with separator
              return { content: item.term + ' : ' + item.definition };
            } else {
              // No definition - just use term
              return { content: item.term };
            }
          } else {
            return { content: item.content || '' };
          }
        });
      }

      app.state.updateBlock(block.id, { listType: newType, items: newItems });
    });

    app.getPropertiesControl('prop-add-item').addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent focus changes
      const component = app.getElementBySelector(`[data-block-id="${block.id}"] list-component`);
      if (component) {
        component.addItem();
      }
    });

    app.getPropertiesControl('prop-delete').addEventListener('click', async () => {
      const confirmed = await app.showConfirm('Delete Block', 'Are you sure you want to delete this block?');
      if (confirmed) {
        app.state.deleteBlock(block.id);
      }
    });
  };

  const showFileOperations = (app) => {
    app.isInDraftsBrowser = false;
    const panel = app.getPropertiesPanel();

    // Get recent drafts
    const drafts = app.state.getDraftsList();
    const recentDrafts = drafts
      .sort((a, b) => {
        const timeA = a.updatedAt || a.timestamp || 0;
        const timeB = b.updatedAt || b.timestamp || 0;
        return timeB - timeA;
      })
      .slice(0, 3);

    let recentFilesHtml = '';
    if (recentDrafts.length > 0) {
      const recentItems = recentDrafts.map(draft => {
        const isCurrent = draft.id === app.state.currentDraftId;
        return `
          <button class="recent-file-item ${isCurrent ? 'current' : ''}" data-draft-id="${draft.id}">
            <span class="recent-file-icon">📄</span>
            <span class="recent-file-name">${app.escapeHtml(draft.name)}</span>
            ${isCurrent ? `<span class="recent-file-badge">${app.t('fileOps.current')}</span>` : ''}
          </button>
        `;
      }).join('');

      recentFilesHtml = `
        <div class="recent-files-section">
          <h4>${app.t('fileOps.recent')}</h4>
          <div class="recent-files-list">
            ${recentItems}
          </div>
        </div>
      `;
    }

    panel.innerHTML = `
      <!-- File Operations (shown when no block selected) -->
      <div class="file-operations">
        ${recentFilesHtml}
        
        <div class="file-section">
          <h4>${app.t('fileOps.document')}</h4>
          <button class="file-btn" id="btn-new">
            <span class="file-btn-icon">📄</span>
            <div class="file-btn-content">
              <span class="file-btn-label">${app.t('fileOps.newDraft')}</span>
              <span class="file-btn-desc">${app.t('fileOps.newDraftDesc')}</span>
            </div>
          </button>
          <button class="file-btn" id="btn-open">
            <span class="file-btn-icon">📂</span>
            <div class="file-btn-content">
              <span class="file-btn-label">${app.t('fileOps.openDraft')}</span>
              <span class="file-btn-desc">${app.t('fileOps.openDraftDesc')}</span>
            </div>
          </button>
          <button class="file-btn" id="btn-save-as">
            <span class="file-btn-icon">💾</span>
            <div class="file-btn-content">
              <span class="file-btn-label">${app.t('fileOps.saveAs')}</span>
              <span class="file-btn-desc">${app.t('fileOps.saveAsDesc')}</span>
            </div>
          </button>
        </div>
      </div>
    `;

    // Attach event listeners for recent files
    recentDrafts.forEach(draft => {
      const btn = app.getPanelElement(`[data-draft-id="${draft.id}"]`);
      if (btn && draft.id !== app.state.currentDraftId) {
        btn.addEventListener('click', () => {
          app.loadDraft(draft.id);
        });
      }
    });

    // Re-attach event listeners
    app.setupHeader();
  };

  const showDraftsBrowser = (app) => {
    app.isInDraftsBrowser = true;
    const panel = app.getPropertiesPanel();
    const drafts = app.state.getDraftsList();

    if (drafts.length === 0) {
      panel.innerHTML = `
        <div class="drafts-browser">
          <div class="drafts-header">
            <h3>Open Draft</h3>
            <button class="btn-back" id="btn-back-to-files">← Back</button>
          </div>
          <div class="empty-state">
            <p>No saved drafts found</p>
            <p style="font-size: 12px; color: #999;">Create a new draft to get started</p>
          </div>
        </div>
      `;
    } else {
      const draftsHtml = drafts.map(draft => {
        const date = new Date(draft.updatedAt || draft.timestamp);
        const dateStr = date.toLocaleString();
        const isCurrent = draft.id === app.state.currentDraftId;

        return `
          <div class="draft-item ${isCurrent ? 'current' : ''}" data-id="${draft.id}">
            <div class="draft-info">
              <div class="draft-name">${app.escapeHtml(draft.name)}</div>
              <div class="draft-meta">${dateStr}</div>
              ${isCurrent ? '<div class="draft-badge">Current</div>' : ''}
            </div>
            <div class="draft-actions">
              <button class="btn-delete-draft" data-id="${draft.id}">Delete</button>
            </div>
          </div>
        `;
      }).join('');

      panel.innerHTML = `
        <div class="drafts-browser">
          <div class="drafts-header">
            <h3>Open Draft</h3>
            <button class="btn-back" id="btn-back-to-files">← Back</button>
          </div>
          <div class="drafts-list">
            ${draftsHtml}
          </div>
        </div>
      `;
    }

    // Add event listeners
    const backBtn = app.getDraftsBackButton();
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        app.showFileOperations();
      });
    }

    // Add listeners for clicking on draft cards (open draft)
    app.getDraftItemElements().forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on delete button
        if (e.target.closest('.btn-delete-draft')) {
          return;
        }
        const draftId = item.dataset.id;
        app.loadDraft(draftId);
        // Stay in the browser - don't close it
        // Refresh the list to update the "Current" badge
        app.showDraftsBrowser();
      });
    });

    // Add listeners for delete button
    app.getDraftDeleteButtons().forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const draftId = btn.dataset.id;
        const draft = drafts.find(d => d.id === draftId);
        const confirmed = await app.showConfirm('Delete Draft', `Are you sure you want to delete "${draft.name}"?`);
        if (confirmed) {
          app.state.deleteDraft(draftId);
          app.showStatus('Draft deleted', 'success');
          app.showDraftsBrowser(); // Refresh list
        }
      });
    });
  };

  modules.properties = {
    setupProperties,
    updatePropertiesPanel,
    renderHeaderProperties,
    renderParagraphProperties,
    renderListProperties,
    showFileOperations,
    showDraftsBrowser
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
