/**
 * Blog Editor Properties Panel Module
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  const setupProperties = (app) => {
    const panel = app.getPropertiesPanel();
    if (!panel || panel.dataset.bound === 'true') return;
    panel.dataset.bound = 'true';

    panel.addEventListener('click', async (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      switch (target.id) {
        case 'btn-properties-edit':
          app.showEditView();
          break;
        case 'btn-properties-ai':
          app.showAiChatView();
          break;
        case 'btn-new': {
          const title = await app.showPrompt('Create New Draft', 'Enter a title for your new draft:', 'Untitled Draft');
          if (title) {
            app.state.newDraft();
            app.state.setTitle(title);
            app.showStatus('New draft created', 'success');
          }
          break;
        }
        case 'btn-open':
          app.showDraftsBrowser();
          break;
        case 'btn-save-as':
          app.saveAsNewDraft();
          break;
        case 'btn-export-current-draft':
          app.exportCurrentDraftToFile();
          break;
        case 'btn-export-drafts':
          app.exportDraftsToFile();
          break;
        case 'btn-import-drafts':
          app.openDraftsImportDialog();
          break;
        case 'btn-import-markdown':
          app.openMarkdownImportDialog();
          break;
        case 'btn-ai-help':
          if (app.openAiHelpModal) {
            app.openAiHelpModal();
          }
          break;
        default:
          break;
      }
    });
  };

  const formatSelectionLabel = (block) => {
    if (!block) return '';
    switch (block.type) {
      case 'header':
        return `Header (H${block.level || 2})`;
      case 'list':
        return `List (${block.listType || 'ul'})`;
      case 'card':
        return `Card (${block.subtype || '2-col'})`;
      case 'paragraph':
        return `Paragraph (${block.variant || 'normal'})`;
      default:
        return block.type ? String(block.type) : 'Block';
    }
  };

  const updateSelectionStatus = (app, selectedBlock) => {
    const panel = app.getPropertiesPanel();
    if (!panel) return;
    let status = panel.querySelector('.selection-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'selection-status';
      panel.prepend(status);
    }

    if (!selectedBlock) {
      status.dataset.state = 'empty';
      status.textContent = 'No block selected';
      return;
    }

    status.dataset.state = 'selected';
    status.textContent = `Selected: ${formatSelectionLabel(selectedBlock)}`;
  };

  const updatePropertiesPanel = (app) => {
    const panel = app.getPropertiesPanel();
    const selectedBlock = app.state.getSelectedBlock();

    updateSelectionStatus(app, selectedBlock);

    if (app.isInAiChatView) {
      showAiChatView(app);
      return;
    }

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

    // Remove drafts backup controls in editing context
    const draftsBackup = panel.querySelector('.drafts-backup');
    if (draftsBackup) {
      draftsBackup.remove();
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
      case 'card':
        app.renderCardProperties(selectedBlock, propsContainer);
        break;
      default:
        propsContainer.innerHTML = '<p>No properties available</p>';
    }
    ensurePropertiesTabs(app, panel);
  };

  const ensurePropertiesTabs = (app, panel) => {
    if (!panel) return;
    let tabs = panel.querySelector('.properties-tabs');
    if (tabs) return;
    tabs = document.createElement('div');
    tabs.className = 'properties-tabs';
    tabs.innerHTML = `
      <button class="properties-tab" id="btn-properties-edit">${app.t('ai.viewEdit')}</button>
      <button class="properties-tab" id="btn-properties-ai">${app.t('ai.viewChat')}</button>
    `;
    panel.prepend(tabs);
    updateTabState(app, panel);
  };

  const updateTabState = (app, panel) => {
    const editBtn = panel.querySelector('#btn-properties-edit');
    const aiBtn = panel.querySelector('#btn-properties-ai');
    if (editBtn) editBtn.classList.toggle('active', !app.isInAiChatView);
    if (aiBtn) aiBtn.classList.toggle('active', !!app.isInAiChatView);
  };

  const renderAiPanel = (app, panel) => {
    if (!panel) return;
    let aiPanel = panel.querySelector('.ai-panel');
    if (aiPanel) return;

    aiPanel = document.createElement('div');
    aiPanel.className = 'ai-panel';
    aiPanel.innerHTML = `
      <div class="ai-chat">
        <div class="ai-chat-header">
          <span>${app.t('ai.chatTitle')}</span>
        </div>
        <div class="ai-chat-messages" id="ai-chat-messages"></div>
        <div class="ai-chat-input">
          <textarea id="ai-chat-input" rows="2" placeholder="${app.t('ai.chatPlaceholder')}"></textarea>
          <button class="btn btn-primary" id="btn-ai-chat-send">${app.t('ai.chatSend')}</button>
        </div>
      </div>
      <div class="ai-debug" id="ai-debug">
        <div class="ai-debug-header">
          <span>${app.t('ai.debugTitle')}</span>
          <div class="ai-debug-actions">
            <button class="btn btn-secondary" id="btn-ai-debug-copy">${app.t('ai.debugCopy')}</button>
            <button class="btn btn-secondary" id="btn-ai-debug-clear">${app.t('ai.debugClear')}</button>
          </div>
        </div>
        <textarea id="ai-debug-log" rows="6" readonly></textarea>
      </div>
    `;

    panel.appendChild(aiPanel);
  };

  const showAiChatView = (app) => {
    const panel = app.getPropertiesPanel();
    if (!panel) return;
    app.isInAiChatView = true;
    panel.classList.add('ai-chat-mode');
    panel.innerHTML = `
      <div class="selection-status" data-state="empty"></div>
      <div class="properties-tabs">
        <button class="properties-tab" id="btn-properties-edit">${app.t('ai.viewEdit')}</button>
        <button class="properties-tab" id="btn-properties-ai">${app.t('ai.viewChat')}</button>
        <button class="properties-tab properties-tab--icon" id="btn-ai-help" title="${app.t('ai.helpButton')}" aria-label="${app.t('ai.helpButton')}">?</button>
      </div>
    `;
    renderAiPanel(app, panel);
    updateTabState(app, panel);
    updateSelectionStatus(app, app.state.getSelectedBlock());
    if (app.setupAiPanel) {
      app.setupAiPanel();
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

  const renderCardProperties = (app, block, container) => {
    const cards = Array.isArray(block.cards) ? block.cards : (Array.isArray(block.data?.cards) ? block.data.cards : []);
    const subtype = block.subtype || block.data?.subtype || '2-col';
    const updateCardBlock = (nextCards, nextSubtype = subtype) => {
      app.state.updateBlock(block.id, {
        subtype: nextSubtype,
        cards: nextCards,
        data: {
          ...(block.data || {}),
          subtype: nextSubtype,
          cards: nextCards
        }
      });
    };

    const cardsHtml = cards.map((card, index) => {
      return `
        <div class="property-card-item" data-card-index="${index}">
          <div class="property-group">
            <label>Title</label>
            <input type="text" class="prop-card-title" value="${app.escapeHtml(card.title || '')}" />
          </div>
          <div class="property-group">
            <label>Content</label>
            <textarea class="prop-card-content">${app.escapeHtml(card.content || '')}</textarea>
          </div>
          <div class="property-group">
            <label>Image URL</label>
            <input type="text" class="prop-card-image" value="${app.escapeHtml(card.image || '')}" />
          </div>
          <button class="btn btn-secondary btn-small prop-remove-card">Remove Card</button>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <h3>${app.t('properties.card')}</h3>

      <div class="property-group">
        <label>${app.t('properties.columns')}</label>
        <select id="prop-card-columns">
          <option value="2-col" ${subtype === '2-col' ? 'selected' : ''}>2 Columns</option>
          <option value="3-col" ${subtype === '3-col' ? 'selected' : ''}>3 Columns</option>
        </select>
      </div>

      <div class="property-group">
        <label>${app.t('properties.cards')}</label>
        <div class="property-note">${app.t('properties.cardsNote')}</div>
      </div>

      <div class="property-card-list">
        ${cardsHtml}
      </div>

      <button class="btn btn-secondary btn-small" id="prop-add-card">${app.t('properties.addCard')}</button>
      <button class="btn btn-danger btn-small" id="prop-delete">${app.t('properties.deleteBlock')}</button>
    `;

    app.getPropertiesControl('prop-card-columns').addEventListener('change', (e) => {
      const nextSubtype = e.target.value;
      updateCardBlock(cards, nextSubtype);
    });

    const cardItems = app.getPanelElements('.property-card-item');
    cardItems.forEach((item) => {
      const index = parseInt(item.dataset.cardIndex, 10);
      const titleInput = item.querySelector('.prop-card-title');
      const contentInput = item.querySelector('.prop-card-content');
      const imageInput = item.querySelector('.prop-card-image');
      const removeBtn = item.querySelector('.prop-remove-card');

      if (titleInput) {
        titleInput.addEventListener('input', () => {
          const updated = cards.map((card, cardIndex) =>
            cardIndex === index ? { ...card, title: titleInput.value } : card
          );
          updateCardBlock(updated);
        });
      }

      if (contentInput) {
        contentInput.addEventListener('input', () => {
          const updated = cards.map((card, cardIndex) =>
            cardIndex === index ? { ...card, content: contentInput.value } : card
          );
          updateCardBlock(updated);
        });
      }

      if (imageInput) {
        imageInput.addEventListener('input', () => {
          const updated = cards.map((card, cardIndex) =>
            cardIndex === index ? { ...card, image: imageInput.value } : card
          );
          updateCardBlock(updated);
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', async () => {
          if (cards.length <= 1) {
            const confirmed = await app.showConfirm('Delete Block', 'Remove the last card by deleting this block?');
            if (confirmed) {
              app.state.deleteBlock(block.id);
            }
            return;
          }
          const updated = cards.filter((_, cardIndex) => cardIndex !== index);
          updateCardBlock(updated);
        });
      }
    });

    app.getPropertiesControl('prop-add-card').addEventListener('click', () => {
      const count = cards.length + 1;
      const placeholder = 'https://www.linkey-lock.com/wp-content/uploads/2025/05/2634fefd9b745aa48f169e9a26c89cf8-1.png';
      const updated = cards.concat({
        title: `Card ${count}`,
        content: 'Card content',
        image: placeholder,
        alt: ''
      });
      updateCardBlock(updated);
    });

    app.getPropertiesControl('prop-delete').addEventListener('click', async () => {
      const confirmed = await app.showConfirm('Delete Block', 'Are you sure you want to delete this block?');
      if (confirmed) {
        app.state.deleteBlock(block.id);
      }
    });
  };

  const showFileOperations = async (app) => {
    app.isInDraftsBrowser = false;
    const panel = app.getPropertiesPanel();

    // Get recent drafts
    const localDrafts = app.state.getDraftsList();
    let drafts = localDrafts;
    if (app.isServerEnabled()) {
      try {
        const serverDrafts = await app.fetchServerDrafts();
        if (app.state.useLocalStorage === false) {
          drafts = serverDrafts;
        } else if (serverDrafts.length > 0) {
          drafts = serverDrafts.map(draft => {
            const localMatch = localDrafts.find(local => local.id === draft.id);
            return {
              ...draft,
              lastOpenedAt: localMatch?.lastOpenedAt
            };
          });
        }
      } catch (e) {
        console.warn('Failed to load server drafts, using local list.', e);
        if (app.state.useLocalStorage === false) {
          drafts = [];
        }
      }
    }
    const recentDrafts = drafts
      .sort((a, b) => {
        const timeA = a.lastOpenedAt || a.updatedAt || a.timestamp || 0;
        const timeB = b.lastOpenedAt || b.updatedAt || b.timestamp || 0;
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
      <div class="properties-tabs">
        <button class="properties-tab" id="btn-properties-edit">${app.t('ai.viewEdit')}</button>
        <button class="properties-tab" id="btn-properties-ai">${app.t('ai.viewChat')}</button>
        <button class="properties-tab properties-tab--icon" id="btn-ai-help" title="${app.t('ai.helpButton')}" aria-label="${app.t('ai.helpButton')}">?</button>
      </div>
      <div class="file-operations">
        ${recentFilesHtml}
        
        <details class="props-collapsible" open>
          <summary>${app.t('fileOps.document')}</summary>
          <div class="props-content">
            <div class="props-content-inner">
              <div class="file-section">
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
          </div>
        </details>

        <details class="props-collapsible" open>
          <summary>${app.t('fileOps.drafts')}</summary>
          <div class="props-content">
            <div class="props-content-inner">
              <div class="drafts-backup">
                <button class="file-btn" id="btn-export-current-draft">
                  <span class="file-btn-icon">⬇️</span>
                  <div class="file-btn-content">
                    <span class="file-btn-label">${app.t('fileOps.exportCurrentDraft')}</span>
                    <span class="file-btn-desc">${app.t('fileOps.exportCurrentDraftDesc')}</span>
                  </div>
                </button>
                <button class="file-btn" id="btn-export-drafts">
                  <span class="file-btn-icon">⬇️</span>
                  <div class="file-btn-content">
                    <span class="file-btn-label">${app.t('fileOps.exportDrafts')}</span>
                    <span class="file-btn-desc">${app.t('fileOps.exportDraftsDesc')}</span>
                  </div>
                </button>
                <button class="file-btn" id="btn-import-drafts">
                  <span class="file-btn-icon">⬆️</span>
                  <div class="file-btn-content">
                    <span class="file-btn-label">${app.t('fileOps.importDrafts')}</span>
                    <span class="file-btn-desc">${app.t('fileOps.importDraftsDesc')}</span>
                  </div>
                </button>
                <button class="file-btn" id="btn-import-markdown">
                  <span class="file-btn-icon">📝</span>
                  <div class="file-btn-content">
                    <span class="file-btn-label">${app.t('fileOps.importMarkdown')}</span>
                    <span class="file-btn-desc">${app.t('fileOps.importMarkdownDesc')}</span>
                  </div>
                </button>
                <input type="file" id="drafts-file-input" accept="application/json" style="display:none" />
                <input type="file" id="markdown-file-input" accept="text/markdown,.md" style="display:none" />
              </div>
            </div>
          </div>
        </details>
      </div>
    `;

    panel.classList.remove('ai-chat-mode');
    updateTabState(app, panel);

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

    const fileInput = app.getElement('drafts-file-input');
    if (fileInput && fileInput.dataset.bound !== 'true') {
      fileInput.dataset.bound = 'true';
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          app.importDraftsFromFile(file);
        }
      });
    }

    const markdownInput = app.getElement('markdown-file-input');
    if (markdownInput && markdownInput.dataset.bound !== 'true') {
      markdownInput.dataset.bound = 'true';
      markdownInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          app.importMarkdownFromFile(file);
        }
      });
    }
  };

  const showDraftsBrowser = async (app) => {
    app.isInDraftsBrowser = true;
    const panel = app.getPropertiesPanel();
    let drafts = app.state.getDraftsList();
    if (app.isServerEnabled()) {
      try {
        drafts = await app.fetchServerDrafts();
      } catch (e) {
        console.warn('Failed to load server drafts, using local list.', e);
        if (app.state.useLocalStorage === false) {
          drafts = [];
        }
      }
    }

    const currentId = app.state.currentDraftId;
    if (currentId && !drafts.some(draft => draft && draft.id === currentId)) {
      const currentDraft = app.state.exportCurrentDraft ? app.state.exportCurrentDraft() : null;
      const fallbackName = app.state.title || 'Untitled Draft';
      drafts.unshift({
        id: currentId,
        name: currentDraft?.name || currentDraft?.title || fallbackName,
        title: currentDraft?.title || fallbackName,
        timestamp: currentDraft?.timestamp || Date.now(),
        updatedAt: currentDraft?.updatedAt || Date.now()
      });
    }

    const backupControls = `
      <div class="drafts-backup">
        <h4>${app.t('fileOps.drafts')}</h4>
        <button class="file-btn" id="btn-export-current-draft">
          <span class="file-btn-icon">⬇️</span>
          <div class="file-btn-content">
            <span class="file-btn-label">${app.t('fileOps.exportCurrentDraft')}</span>
            <span class="file-btn-desc">${app.t('fileOps.exportCurrentDraftDesc')}</span>
          </div>
        </button>
        <button class="file-btn" id="btn-export-drafts">
          <span class="file-btn-icon">⬇️</span>
          <div class="file-btn-content">
            <span class="file-btn-label">${app.t('fileOps.exportDrafts')}</span>
            <span class="file-btn-desc">${app.t('fileOps.exportDraftsDesc')}</span>
          </div>
        </button>
        <button class="file-btn" id="btn-import-drafts">
          <span class="file-btn-icon">⬆️</span>
          <div class="file-btn-content">
            <span class="file-btn-label">${app.t('fileOps.importDrafts')}</span>
            <span class="file-btn-desc">${app.t('fileOps.importDraftsDesc')}</span>
          </div>
        </button>
        <button class="file-btn" id="btn-import-markdown">
          <span class="file-btn-icon">📝</span>
          <div class="file-btn-content">
            <span class="file-btn-label">${app.t('fileOps.importMarkdown')}</span>
            <span class="file-btn-desc">${app.t('fileOps.importMarkdownDesc')}</span>
          </div>
        </button>
        <input type="file" id="drafts-file-input" accept="application/json" style="display:none" />
        <input type="file" id="markdown-file-input" accept="text/markdown,.md" style="display:none" />
      </div>
    `;

    if (drafts.length === 0) {
      panel.innerHTML = `
        <div class="drafts-browser">
          <div class="properties-tabs">
            <button class="properties-tab" id="btn-properties-edit">${app.t('ai.viewEdit')}</button>
            <button class="properties-tab" id="btn-properties-ai">${app.t('ai.viewChat')}</button>
            <button class="properties-tab properties-tab--icon" id="btn-ai-help" title="${app.t('ai.helpButton')}" aria-label="${app.t('ai.helpButton')}">?</button>
          </div>
          <div class="drafts-header">
            <h3>Open Draft</h3>
            <button class="btn-back" id="btn-back-to-files">← Back</button>
          </div>
          <div class="empty-state">
            <p>No saved drafts found</p>
            <p style="font-size: 12px; color: #999;">Create a new draft to get started</p>
          </div>
          ${backupControls}
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
          <div class="properties-tabs">
            <button class="properties-tab" id="btn-properties-edit">${app.t('ai.viewEdit')}</button>
            <button class="properties-tab" id="btn-properties-ai">${app.t('ai.viewChat')}</button>
            <button class="properties-tab properties-tab--icon" id="btn-ai-help" title="${app.t('ai.helpButton')}" aria-label="${app.t('ai.helpButton')}">?</button>
          </div>
          <div class="drafts-header">
            <h3>Open Draft</h3>
            <button class="btn-back" id="btn-back-to-files">← Back</button>
          </div>
          <div class="drafts-list">
            ${draftsHtml}
          </div>
          ${backupControls}
        </div>
      `;
    }

    panel.classList.remove('ai-chat-mode');
    updateTabState(app, panel);

    // Add event listeners
    const backBtn = app.getDraftsBackButton();
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        app.showFileOperations();
      });
    }

    const fileInput = app.getElement('drafts-file-input');
    if (fileInput && fileInput.dataset.bound !== 'true') {
      fileInput.dataset.bound = 'true';
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          app.importDraftsFromFile(file);
        }
      });
    }

    const markdownInput = app.getElement('markdown-file-input');
    if (markdownInput && markdownInput.dataset.bound !== 'true') {
      markdownInput.dataset.bound = 'true';
      markdownInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          app.importMarkdownFromFile(file);
        }
      });
    }

    // Add listeners for clicking on draft cards (open draft)
    app.getDraftItemElements().forEach(item => {
      item.addEventListener('click', async (e) => {
        // Don't trigger if clicking on delete button
        if (e.target.closest('.btn-delete-draft')) {
          return;
        }
        const draftId = item.dataset.id;
        await app.loadDraft(draftId);
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
          if (app.isServerEnabled()) {
            await app.deleteServerDraft(draftId);
          }
          app.state.deleteDraft(draftId);
          app.showStatus('Draft deleted', 'success');
          const item = btn.closest('.draft-item');
          if (item) {
            item.remove();
          }
          await app.showDraftsBrowser(); // Refresh list
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
    renderCardProperties,
    showFileOperations,
    showDraftsBrowser,
    showAiChatView
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
