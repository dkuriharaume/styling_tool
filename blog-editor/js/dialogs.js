/**
 * Blog Editor Dialog Helpers
 */

(() => {
  const utils = window.BLOG_EDITOR_UTILS || {};
  const getById = utils.getById || ((id) => document.getElementById(id));

  const getConfirmDialogElements = () => ({
    dialog: getById('confirm-dialog'),
    titleEl: getById('confirm-title'),
    messageEl: getById('confirm-message'),
    okBtn: getById('confirm-ok'),
    cancelBtn: getById('confirm-cancel')
  });

  const getPromptDialogElements = () => ({
    dialog: getById('prompt-dialog'),
    titleEl: getById('prompt-title'),
    messageEl: getById('prompt-message'),
    inputEl: getById('prompt-input'),
    okBtn: getById('prompt-ok'),
    cancelBtn: getById('prompt-cancel')
  });

  const showConfirm = (title, message) => new Promise((resolve) => {
    const { dialog, titleEl, messageEl, okBtn, cancelBtn } = getConfirmDialogElements();

    titleEl.textContent = title;
    messageEl.textContent = message;
    dialog.classList.add('show');

    const cleanup = () => {
      dialog.classList.remove('show');
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      dialog.removeEventListener('click', handleBackdrop);
    };

    const handleOk = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const handleBackdrop = (e) => {
      if (e.target === dialog) {
        handleCancel();
      }
    };

    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    dialog.addEventListener('click', handleBackdrop);
  });

  const showPrompt = (title, message, defaultValue = '') => new Promise((resolve) => {
    const { dialog, titleEl, messageEl, inputEl, okBtn, cancelBtn } = getPromptDialogElements();

    titleEl.textContent = title;
    messageEl.textContent = message;
    inputEl.value = defaultValue;
    dialog.classList.add('show');

    // Track IME composition state
    let isComposing = false;

    // Focus and select input
    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 100);

    const cleanup = () => {
      dialog.classList.remove('show');
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      inputEl.removeEventListener('keydown', handleKeydown);
      inputEl.removeEventListener('compositionstart', handleCompositionStart);
      inputEl.removeEventListener('compositionend', handleCompositionEnd);
      dialog.removeEventListener('click', handleBackdrop);
    };

    const handleOk = () => {
      const value = inputEl.value.trim();
      cleanup();
      resolve(value || null);
    };

    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    const handleCompositionStart = () => {
      isComposing = true;
    };

    const handleCompositionEnd = () => {
      isComposing = false;
    };

    const handleKeydown = (e) => {
      // Don't process Enter/Escape during IME composition
      if (isComposing) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleOk();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    const handleBackdrop = (e) => {
      if (e.target === dialog) {
        handleCancel();
      }
    };

    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    inputEl.addEventListener('keydown', handleKeydown);
    inputEl.addEventListener('compositionstart', handleCompositionStart);
    inputEl.addEventListener('compositionend', handleCompositionEnd);
    dialog.addEventListener('click', handleBackdrop);
  });

  window.BLOG_EDITOR_DIALOGS = {
    showConfirm,
    showPrompt
  };
})();
