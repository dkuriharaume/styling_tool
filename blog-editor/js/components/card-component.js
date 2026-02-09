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

      const head = document.createElement('h3');
      head.className = 'thmb-card__title';
      head.contentEditable = 'true';
      head.textContent = card.title || `Card ${index + 1}`;

      const img = document.createElement('img');
      img.className = 'thmb-card__img img-responsive';
      img.alt = card.alt || '';
      img.src = card.image || this.getPlaceholderImage();

      const body = document.createElement('div');
      body.className = 'thmb-card__body';
      body.contentEditable = 'true';
      body.innerHTML = card.content || '';

      head.addEventListener('blur', () => {
        this.data.cards[index] = { ...this.data.cards[index], title: head.textContent };
        this.dispatchContentChange();
      });

      body.addEventListener('blur', () => {
        this.data.cards[index] = { ...this.data.cards[index], content: body.innerHTML };
        this.dispatchContentChange();
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
