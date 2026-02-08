/**
 * Blog Editor Drafts Module
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  const openDraftsModal = (app) => {
    // Redirect to new browser
    app.showDraftsBrowser();
  };

  const openDraftsModalOld = (app) => {
    const modal = app.getDraftsModal();
    const { draftsList, emptyState } = app.getDraftsListElements();

    // Get all drafts
    const drafts = app.state.getDraftsList();

    // Clear list
    draftsList.innerHTML = '';

    if (drafts.length === 0) {
      emptyState.style.display = 'block';
      draftsList.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      draftsList.style.display = 'flex';

      // Populate drafts
      drafts.forEach(draft => {
        const item = document.createElement('div');
        item.className = 'draft-item';

        const date = new Date(draft.updatedAt || draft.timestamp);
        const dateStr = date.toLocaleString();

        item.innerHTML = `
          <div class="draft-info">
            <div class="draft-name">${app.escapeHtml(draft.name)}</div>
            <div class="draft-meta">Last modified: ${dateStr}</div>
          </div>
          <div class="draft-actions">
            <button class="btn-open-draft" data-id="${draft.id}">Open</button>
            <button class="btn-delete-draft" data-id="${draft.id}">Delete</button>
          </div>
        `;

        draftsList.appendChild(item);

        // Add event listeners
        item.querySelector('.btn-open-draft').addEventListener('click', (e) => {
          e.stopPropagation();
          app.loadDraft(draft.id);
        });

        item.querySelector('.btn-delete-draft').addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = await app.showConfirm('Delete Draft', `Are you sure you want to delete "${draft.name}"?`);
          if (confirmed) {
            app.state.deleteDraft(draft.id);
            app.openDraftsModal(); // Refresh list
            app.showToast('Draft deleted', 'success');
          }
        });

        // Click on item to open
        item.addEventListener('click', () => {
          app.loadDraft(draft.id);
        });
      });
    }

    modal.classList.add('show');
  };

  const saveAsNewDraft = async (app) => {
    const name = await app.showPrompt('Save As', 'Enter draft name:', app.state.title || 'Untitled Draft');
    if (name !== null && name.trim() !== '') {
      app.state.saveAs(name);
      app.showStatus('Draft saved as new!', 'success');
    }
  };

  const closeDraftsModal = (app) => {
    const modal = app.getDraftsModal();
    modal.classList.remove('show');
  };

  const loadDraft = (app, draftId) => {
    if (app.state.load(draftId)) {
      app.closeDraftsModal();
      app.showStatus('Draft loaded', 'success');
    } else {
      app.showStatus('Failed to load draft', 'error');
    }
  };

  const loadLastEditedDraft = (app) => {
    const drafts = app.state.getDraftsList();

    // Prefer the last opened draft if available
    if (app.state.load()) {
      const currentId = app.state.currentDraftId;
      const currentDraft = drafts.find(d => d.id === currentId);
      if (currentDraft) {
        app.showStatus(`✓ ${app.t('status.loaded')}: ${currentDraft.name}`, 'success', 2000);
        console.log(`Loaded last opened draft: ${currentDraft.name}`);
      } else {
        app.showStatus(`✓ ${app.t('status.loaded')}`, 'success', 2000);
        console.log('Loaded last opened draft.');
      }
      return;
    }

    if (drafts.length === 0) {
      // No drafts exist, stay with new draft
      app.showStatus(`✓ ${app.t('status.pageLoaded')}`, 'success', 2000);
      return;
    }

    // Sort drafts by updatedAt timestamp (most recent first)
    const sortedDrafts = drafts.sort((a, b) => {
      const timeA = a.updatedAt || a.timestamp || 0;
      const timeB = b.updatedAt || b.timestamp || 0;
      return timeB - timeA;
    });

    // Load the most recently edited available draft
    for (const draft of sortedDrafts) {
      if (draft && draft.id && app.state.load(draft.id)) {
        app.showStatus(`✓ ${app.t('status.loaded')}: ${draft.name}`, 'success', 2000);
        console.log(`Loaded last edited draft: ${draft.name}`);
        return;
      }
    }

    app.showStatus(`✓ ${app.t('status.pageLoaded')}`, 'success', 2000);
  };

  modules.drafts = {
    openDraftsModal,
    openDraftsModalOld,
    saveAsNewDraft,
    closeDraftsModal,
    loadDraft,
    loadLastEditedDraft
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
