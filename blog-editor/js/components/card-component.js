// LINKEY Blog Editor - Card Grid Component
// Supports 2 or 3 columns (configurable via properties panel)

class CardGridComponent extends HTMLElement {
  static get observedAttributes() {
    return ['columns'];
  }

  constructor() {
    super();
    // Do not use Shadow DOM so global styles apply
    this.columns = 2;
    this.cards = [
      { title: 'Card 1', content: 'Card content 1' },
      { title: 'Card 2', content: 'Card content 2' },
      { title: 'Card 3', content: 'Card content 3' },
    ];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'columns') {
      this.columns = parseInt(newValue, 10) || 2;
      this.render();
    }
  }

  setColumns(count) {
    this.setAttribute('columns', count);
  }

  render() {
    const colCount = this.columns;
    const visibleCards = this.cards.slice(0, colCount);
    const rowClass = 'row row--std';
    const itemClass = colCount === 3 ? 'row__item row__item--tablet-6 row__item--desktop-4' : 'row__item row__item--tablet-6';
    const imgUrl = 'https://www.linkey-lock.com/wp-content/uploads/2025/05/2634fefd9b745aa48f169e9a26c89cf8-1.png';
    // No custom styles, rely on global CSS
    this.innerHTML = `
      <div class="${rowClass}">
        ${visibleCards.map(card => `
          <div class="${itemClass}">
            <article class="thmb-card thmb-card--simple">
              <h2 class="thmb-card__title" contenteditable="true">${card.title}</h2>
              <img src="${imgUrl}" class="img-responsive kadomaru thmb-card__img" alt="プレースホルダー" />
              <div class="card-content" contenteditable="true">${card.content}</div>
            </article>
          </div>
        `).join('')}
      </div>
    `;
  }
}

customElements.define('card-grid', CardGridComponent);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CardGridComponent;
} else if (typeof window !== 'undefined') {
  window.CardGridComponent = CardGridComponent;
}
