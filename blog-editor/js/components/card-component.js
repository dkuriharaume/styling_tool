// LINKEY Blog Editor - Card Component
// Supports 2 or 3 columns (configurable via properties panel)

class CardComponent extends HTMLElement {
  constructor() {
    super();
    // Do not use Shadow DOM so global styles apply
    this.data = {
      subtype: '2-col',
      cards: []
    };
  }

  connectedCallback() {
    this.render();
  }

  setData(data) {
    this.data = { ...this.data, ...data };
    if (!Array.isArray(this.data.cards)) {
      this.data.cards = [];
    }
    this.render();
  }

  getColumnCount() {
    return this.data.subtype === '3-col' ? 3 : 2;
  }

  getPlaceholderImage() {
    return 'https://www.linkey-lock.com/wp-content/uploads/2025/05/2634fefd9b745aa48f169e9a26c89cf8-1.png';
  }

  formatInlineContent(content) {
    const safe = String(content ?? '');
    return safe
      .replace(/\{red\}([\s\S]+?)\{\/red\}/g, '<strong class="strong strong--warning">$1</strong>')
      .replace(/\{blue\}([\s\S]+?)\{\/blue\}/g, '<strong class="strong strong--info">$1</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>');
  }

  normalizeInlineContent(html) {
    const raw = String(html ?? '');
    return raw
      .replace(/<\s*strong[^>]*class="[^"]*strong--warning[^"]*"[^>]*>([\s\S]*?)<\s*\/\s*strong>/gi, '{red}$1{/red}')
      .replace(/<\s*strong[^>]*class="[^"]*strong--info[^"]*"[^>]*>([\s\S]*?)<\s*\/\s*strong>/gi, '{blue}$1{/blue}')
      .replace(/<\s*b[^>]*>([\s\S]*?)<\s*\/\s*b>/gi, '**$1**')
      .replace(/<\s*strong[^>]*>([\s\S]*?)<\s*\/\s*strong>/gi, '**$1**');
  }

  render() {
    if (!this.data) return;

    const colCount = this.getColumnCount();
    const row = document.createElement('div');
    row.className = 'row row--std';
    const itemClass = colCount === 3
      ? 'row__item row__item--tablet-6 row__item--desktop-4'
      : 'row__item row__item--tablet-6 row__item--desktop-6';

    const cards = this.data.cards.length ? this.data.cards : [];
    cards.forEach((card, index) => {
      const item = document.createElement('div');
      item.className = itemClass;
      item.dataset.index = index;

      const article = document.createElement('article');
      article.className = 'thmb-card thmb-card--simple';
      item.draggable = true;

      const head = document.createElement('h3');
      head.className = 'thmb-card__title';
      head.contentEditable = 'true';
      head.innerHTML = this.formatInlineContent(card.title || `Card ${index + 1}`);

      const img = document.createElement('img');
      img.className = 'thmb-card__img img-responsive';
      img.alt = card.alt || '';
      img.src = card.image || this.getPlaceholderImage();

      const body = document.createElement('div');
      body.className = 'thmb-card__body';
      body.contentEditable = 'true';
      body.innerHTML = this.formatInlineContent(card.content || '');

      head.addEventListener('blur', () => {
        const normalizedTitle = this.normalizeInlineContent(head.innerHTML);
        this.data.cards[index] = { ...this.data.cards[index], title: normalizedTitle };
        this.dispatchContentChange();
      });

      body.addEventListener('blur', () => {
        const normalizedContent = this.normalizeInlineContent(body.innerHTML);
        this.data.cards[index] = { ...this.data.cards[index], content: normalizedContent };
        this.dispatchContentChange();
      });

      head.addEventListener('dragstart', (e) => {
        e.stopPropagation();
      });

      body.addEventListener('dragstart', (e) => {
        e.stopPropagation();
      });

      item.addEventListener('dragstart', (e) => {
        if (document.body.classList.contains('dragging')) {
          e.preventDefault();
          return;
        }
        e.stopPropagation();
        item.classList.add('dragging-card');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        const dragImage = article.cloneNode(true);
        dragImage.style.position = 'fixed';
        dragImage.style.top = '-9999px';
        dragImage.style.left = '-9999px';
        dragImage.style.width = `${article.offsetWidth}px`;
        dragImage.style.height = `${article.offsetHeight}px`;
        dragImage.style.pointerEvents = 'none';
        dragImage.style.zIndex = '10000';

        const canvasWrapper = this.closest('.canvas-wrapper');
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
        setTimeout(() => dragImage.remove(), 0);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging-card');
        this.reorderCards(row);
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        const dragging = row.querySelector('.dragging-card');
        if (!dragging || dragging === item) return;

        const rect = item.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (e.clientY < midpoint) {
          item.classList.add('drag-over');
          item.classList.add('drag-over-before');
          item.classList.remove('drag-over-after');
          item.parentNode.insertBefore(dragging.closest('.row__item'), item);
        } else {
          item.classList.add('drag-over');
          item.classList.add('drag-over-after');
          item.classList.remove('drag-over-before');
          item.parentNode.insertBefore(dragging.closest('.row__item'), item.nextSibling);
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over', 'drag-over-before', 'drag-over-after');
      });

      article.appendChild(head);
      article.appendChild(img);
      article.appendChild(body);
      item.appendChild(article);
      row.appendChild(item);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'card-row-wrapper';
    wrapper.appendChild(row);

    this.innerHTML = '';
    this.appendChild(wrapper);
  }

  reorderCards(row) {
    const items = Array.from(row.querySelectorAll('.row__item'));
    const newOrder = [];

    items.forEach(item => {
      const oldIndex = parseInt(item.dataset.index, 10);
      if (!Number.isNaN(oldIndex) && this.data.cards[oldIndex]) {
        newOrder.push({ ...this.data.cards[oldIndex] });
      }
    });

    if (newOrder.length) {
      this.data.cards = newOrder;
      this.render();
      this.dispatchContentChange();
    }
  }

  addCard() {
    const count = this.data.cards.length + 1;
    this.data.cards.push({
      title: `Card ${count}`,
      content: 'Card content',
      image: this.getPlaceholderImage()
    });
    requestAnimationFrame(() => {
      this.render();
      this.dispatchContentChange();
    });
  }

  removeCard(index) {
    if (this.data.cards.length <= 1) return;
    if (typeof index === 'number') {
      this.data.cards.splice(index, 1);
    } else {
      this.data.cards.pop();
    }
    requestAnimationFrame(() => {
      this.render();
      this.dispatchContentChange();
    });
  }

  dispatchContentChange() {
    this.dispatchEvent(new CustomEvent('content-change', {
      detail: { data: { subtype: this.data.subtype, cards: this.data.cards } },
      bubbles: true
    }));
  }
}

customElements.define('card-component', CardComponent);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CardComponent;
} else if (typeof window !== 'undefined') {
  window.CardComponent = CardComponent;
}
