/**
 * Blog Editor Component Registry Setup
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};
  const registerComponent = modules.components?.registerComponent;

  if (typeof registerComponent !== 'function') {
    console.warn('Component registry not available. Ensure js/modules/components.js is loaded before components/registry.js.');
    return;
  }

  registerComponent('header', {
    createDefault(component) {
      return {
        type: 'header',
        level: parseInt(component.subtype, 10) || 2,
        preset: component.subtype === '2' ? 'blue' : 'default',
        content: 'New Heading'
      };
    },
    createElement(block) {
      const header = document.createElement('header-component');
      header.setData(block);
      return header;
    }
  });

  registerComponent('paragraph', {
    createDefault(component) {
      return {
        type: 'paragraph',
        variant: component.variant || 'normal',
        content: 'Click to start typing...'
      };
    },
    createElement(block) {
      const paragraph = document.createElement('paragraph-component');
      paragraph.setData(block);
      return paragraph;
    }
  });

  registerComponent('list', {
    createDefault(component) {
      return {
        type: 'list',
        listType: component.listType || 'ul',
        items: component.listType === 'dl'
          ? [
              { term: 'Key 1', definition: 'Value 1' },
              { term: 'Key 2', definition: 'Value 2' },
              { term: 'Key 3', definition: 'Value 3' }
            ]
          : component.listType === 'ol-title'
          ? [
              { title: 'First point', content: 'Description here' },
              { title: 'Second point', content: 'Description here' },
              { title: 'Third point', content: 'Description here' }
            ]
          : [
              { content: 'List item 1' },
              { content: 'List item 2' },
              { content: 'List item 3' }
            ]
      };
    },
    createElement(block) {
      const list = document.createElement('list-component');
      list.setData({ type: block.listType, items: block.items });
      return list;
    }
  });
})();
