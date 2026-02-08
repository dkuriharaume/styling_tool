/**
 * List Component - Supports UL, OL, OL with titles, and DL
 */

class ListComponent extends HTMLElement {
  constructor() {
    super();
    this.data = {
      type: 'ul', // ul, ol, ol-title, dl
      items: [
        { content: 'List item 1' },
        { content: 'List item 2' },
        { content: 'List item 3' }
      ]
    };
  }
  
  connectedCallback() {
    this.render();
  }
  
  setData(data) {
    this.data = { ...this.data, ...data };
    this.render();
  }
  
  getData() {
    return this.data;
  }
  
  render() {
    let listElement;
    
    switch (this.data.type) {
      case 'ul':
        listElement = this.renderUnorderedList();
        break;
      case 'ol':
        listElement = this.renderOrderedList();
        break;
      case 'ol-title':
        listElement = this.renderOrderedListWithTitles();
        break;
      case 'dl':
        listElement = this.renderDictionaryList();
        break;
      default:
        listElement = this.renderUnorderedList();
    }
    
    this.innerHTML = '';
    this.appendChild(listElement);
  }
  
  renderUnorderedList() {
    const ul = document.createElement('ul');
    ul.className = 'ul';
    
    // Add drop handler to the list container
    ul.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.reorderItems(ul);
    });
    
    ul.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    this.data.items.forEach((item, index) => {
      const li = document.createElement('li');
      li.style.position = 'relative';
      li.draggable = true;
      li.dataset.index = index;
      
      // Wrap content in a span
      const contentSpan = document.createElement('span');
      contentSpan.contentEditable = true;
      contentSpan.textContent = item.content || '';
      contentSpan.style.display = 'inline';
      
      contentSpan.addEventListener('blur', () => {
        this.data.items[index].content = contentSpan.textContent;
        this.dispatchContentChange();
      });
      
      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'list-item-delete';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Remove item';
      deleteBtn.contentEditable = false;
      deleteBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeItem(index);
      });
      
      // Drag and drop handlers
      li.addEventListener('dragstart', (e) => {
        e.stopPropagation(); // Prevent block drag
        li.classList.add('dragging-list-item');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
      });
      
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging-list-item');
      });
      
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        const draggingItem = ul.querySelector('.dragging-list-item');
        if (draggingItem && draggingItem !== li) {
          const rect = li.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          if (e.clientY < midpoint) {
            li.parentNode.insertBefore(draggingItem, li);
          } else {
            li.parentNode.insertBefore(draggingItem, li.nextSibling);
          }
        }
      });
      
      li.appendChild(contentSpan);
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    });
    
    return ul;
  }
  
  renderOrderedList() {
    const ol = document.createElement('ol');
    ol.className = 'ol ol--mt';
    
    // Add drop handler to the list container
    ol.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.reorderItems(ol);
    });
    
    ol.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    this.data.items.forEach((item, index) => {
      const li = document.createElement('li');
      li.style.position = 'relative';
      li.draggable = true;
      li.dataset.index = index;
      
      // Wrap content in a span
      const contentSpan = document.createElement('span');
      contentSpan.contentEditable = true;
      contentSpan.textContent = item.content || '';
      contentSpan.style.display = 'inline';
      
      contentSpan.addEventListener('blur', () => {
        this.data.items[index].content = contentSpan.textContent;
        this.dispatchContentChange();
      });
      
      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'list-item-delete';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Remove item';
      deleteBtn.contentEditable = false;
      deleteBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeItem(index);
      });
      
      // Drag and drop handlers
      li.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        li.classList.add('dragging-list-item');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
      });
      
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging-list-item');
      });
      
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        const draggingItem = ol.querySelector('.dragging-list-item');
        if (draggingItem && draggingItem !== li) {
          const rect = li.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          if (e.clientY < midpoint) {
            li.parentNode.insertBefore(draggingItem, li);
          } else {
            li.parentNode.insertBefore(draggingItem, li.nextSibling);
          }
        }
      });
      
      li.appendChild(contentSpan);
      li.appendChild(deleteBtn);
      ol.appendChild(li);
    });
    
    return ol;
  }
  
  renderOrderedListWithTitles() {
    const ol = document.createElement('ol');
    ol.className = 'ol ol--title ol--mt';
    
    // Add drop handler to the list container
    ol.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.reorderItems(ol);
    });
    
    ol.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    this.data.items.forEach((item, index) => {
      const li = document.createElement('li');
      li.style.position = 'relative';
      li.draggable = true;
      li.dataset.index = index;
      
      // Title (H4)
      const h4 = document.createElement('h4');
      h4.className = 'h4 ol__title';
      h4.contentEditable = true;
      h4.textContent = item.title || 'List item title';
      
      h4.addEventListener('blur', () => {
        this.data.items[index].title = h4.textContent;
        this.dispatchContentChange();
      });
      
      // Content (P)
      const p = document.createElement('p');
      p.contentEditable = true;
      p.textContent = item.content || 'List item content';
      
      p.addEventListener('blur', () => {
        this.data.items[index].content = p.textContent;
        this.dispatchContentChange();
      });
      
      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'list-item-delete';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Remove item';
      deleteBtn.contentEditable = false;
      deleteBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeItem(index);
      });
      
      // Drag and drop handlers
      li.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        li.classList.add('dragging-list-item');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
      });
      
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging-list-item');
      });
      
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        const draggingItem = ol.querySelector('.dragging-list-item');
        if (draggingItem && draggingItem !== li) {
          const rect = li.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          if (e.clientY < midpoint) {
            li.parentNode.insertBefore(draggingItem, li);
          } else {
            li.parentNode.insertBefore(draggingItem, li.nextSibling);
          }
        }
      });
      
      li.appendChild(h4);
      li.appendChild(p);
      li.appendChild(deleteBtn);
      ol.appendChild(li);
    });
    
    return ol;
  }
  
  renderDictionaryList() {
    const dl = document.createElement('dl');
    dl.className = 'wide-dl';
    
    // Add drop handler to the list container
    dl.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.reorderDictionaryItems(dl);
    });
    
    dl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    this.data.items.forEach((item, index) => {
      // Term (DT)
      const dt = document.createElement('dt');
      dt.style.position = 'relative';
      dt.draggable = true;
      dt.dataset.index = index;
      dt.dataset.pairType = 'dt';
      
      // Wrap term content in a span
      const termSpan = document.createElement('span');
      termSpan.contentEditable = true;
      termSpan.textContent = item.term || '';
      termSpan.style.display = 'inline';
      
      termSpan.addEventListener('blur', () => {
        this.data.items[index].term = termSpan.textContent;
        this.dispatchContentChange();
      });
      
      // Add delete button to dt
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'list-item-delete';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Remove item';
      deleteBtn.contentEditable = false;
      deleteBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeItem(index);
      });
      
      dt.appendChild(termSpan);
      dt.appendChild(deleteBtn);
      
      // Definition (DD)
      const dd = document.createElement('dd');
      dd.contentEditable = true;
      dd.textContent = item.definition || '';
      dd.dataset.index = index;
      dd.dataset.pairType = 'dd';
      
      dd.addEventListener('blur', () => {
        this.data.items[index].definition = dd.textContent;
        this.dispatchContentChange();
      });
      
      // Drag and drop handlers for dt (which controls the pair)
      dt.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        dt.classList.add('dragging-list-item');
        dd.classList.add('dragging-list-item');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
      });
      
      dt.addEventListener('dragend', () => {
        dt.classList.remove('dragging-list-item');
        dd.classList.remove('dragging-list-item');
      });
      
      dt.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        // Find the dragging dt element
        const draggingDt = dl.querySelector('dt.dragging-list-item');
        if (draggingDt && draggingDt !== dt) {
          const draggingIndex = parseInt(draggingDt.dataset.index);
          const draggingDd = dl.querySelector(`dd[data-index="${draggingIndex}"]`);
          
          const rect = dt.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          
          // Move both dt and dd together
          if (e.clientY < midpoint) {
            dl.insertBefore(draggingDt, dt);
            dl.insertBefore(draggingDd, dt);
          } else {
            // Insert after the current dd
            const currentDd = dl.querySelector(`dd[data-index="${index}"]`);
            if (currentDd.nextSibling) {
              dl.insertBefore(draggingDt, currentDd.nextSibling);
              dl.insertBefore(draggingDd, currentDd.nextSibling);
            } else {
              dl.appendChild(draggingDt);
              dl.appendChild(draggingDd);
            }
          }
        }
      });
      
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    
    return dl;
  }
  
  dispatchContentChange() {
    this.dispatchEvent(new CustomEvent('content-change', {
      detail: { data: this.data },
      bubbles: true
    }));
  }
  
  addItem() {
    if (this.data.type === 'dl') {
      this.data.items.push({ term: 'New key', definition: 'New value' });
    } else if (this.data.type === 'ol-title') {
      this.data.items.push({ title: 'New title', content: 'New content' });
    } else {
      this.data.items.push({ content: 'New item' });
    }
    // Use requestAnimationFrame to ensure render happens after any pending blur events
    requestAnimationFrame(() => {
      this.render();
      this.dispatchContentChange();
    });
  }
  
  reorderItems(listElement) {
    // Get current order from DOM by reading dataset.index in current DOM order
    const listItems = Array.from(listElement.children);
    const newOrder = [];
    
    listItems.forEach(li => {
      const oldIndex = parseInt(li.dataset.index);
      if (!isNaN(oldIndex) && this.data.items[oldIndex]) {
        // Deep copy to preserve the data
        if (typeof this.data.items[oldIndex] === 'string') {
          newOrder.push(this.data.items[oldIndex]);
        } else {
          // For ol-title type
          newOrder.push({
            title: this.data.items[oldIndex].title,
            content: this.data.items[oldIndex].content
          });
        }
      }
    });
    
    // Update the data
    this.data.items = newOrder;
    
    // Re-render to update indices and sync everything
    this.render();
    this.dispatchContentChange();
  }
  
  reorderDictionaryItems(dlElement) {
    // Get current order from DOM by reading dt elements (which represent each pair)
    const dtElements = Array.from(dlElement.querySelectorAll('dt'));
    const newOrder = [];
    
    dtElements.forEach(dt => {
      const oldIndex = parseInt(dt.dataset.index);
      if (!isNaN(oldIndex) && this.data.items[oldIndex]) {
        // Deep copy to preserve the data
        newOrder.push({
          term: this.data.items[oldIndex].term,
          definition: this.data.items[oldIndex].definition
        });
      }
    });
    
    // Update the data
    this.data.items = newOrder;
    
    // Re-render to update indices and sync everything
    this.render();
    this.dispatchContentChange();
  }
  
  removeItem(index) {
    if (this.data.items.length > 1) {
      this.data.items.splice(index, 1);
      // Use requestAnimationFrame to ensure render happens after any pending blur events
      requestAnimationFrame(() => {
        this.render();
        this.dispatchContentChange();
      });
    }
  }
}

// Register the custom element
customElements.define('list-component', ListComponent);

// Export for use in other modules
window.ListComponent = ListComponent;
