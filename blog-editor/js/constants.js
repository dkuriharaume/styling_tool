/**
 * Blog Editor Constants
 */

(() => {
  const VIEWPORT_CONFIG = {
    desktop: { label: 'Desktop 4K - 3840px' },
    laptop: { label: 'Laptop Full HD - 1920px' },
    tablet: { label: 'Tablet - 1024px' },
    mobile: { label: 'Mobile - 414px' }
  };

  const VIEWPORTS = Object.keys(VIEWPORT_CONFIG);

  const STORAGE_KEYS = {
    language: 'linkey-lang',
    viewport: 'linkey-editor-viewport',
    scrollPosition: 'blog-editor-scroll-position',
    serverUrl: 'linkey-server-url'
  };

  const SERVER_CONFIG = {
    enabled: true,
    baseUrl: 'https://styling-tool-server.onrender.com'
  };

  const COMPONENT_DEFS = [
    // Headers
    { type: 'header', level: 2, key: 'h2' },
    { type: 'header', level: 3, key: 'h3' },
    { type: 'header', level: 4, key: 'h4' },
    // Paragraphs
    { type: 'paragraph', variant: 'normal', key: 'p' },
    { type: 'paragraph', variant: 'small', key: 'p-small' },
    { type: 'paragraph', variant: 'small-gray', key: 'p-small-gray' },
    // Lists
    { type: 'list', listType: 'ul', key: 'ul' },
    { type: 'list', listType: 'ol', key: 'ol' },
    { type: 'list', listType: 'ol-title', key: 'ol-title' },
    { type: 'list', listType: 'dl', key: 'dl' },
    // Future components (cards, buttons, boxes, images)
    { type: 'card', subtype: '2-col', key: 'card-2col' },
    { type: 'card', subtype: '3-col', key: 'card-3col' },
    { type: 'button', subtype: 'regular', key: 'button' },
    { type: 'button', subtype: 'large', key: 'button-large' },
    { type: 'box', subtype: 'basic', key: 'box-basic' },
    { type: 'box', subtype: 'shadow', key: 'box-shadow' },
    { type: 'box', subtype: 'summary', key: 'box-summary' },
    { type: 'box', subtype: 'qa', key: 'box-qa' },
    { type: 'image', key: 'image' }
  ];

  const MARGIN_CONFIG = {
    header: {
      top: {
        2: { mobile: 30, desktop: 50 },
        3: { mobile: 0, desktop: 50 },
        4: { mobile: 30, desktop: 30 }
      },
      bottom: {
        2: { mobile: 20, desktop: 30 },
        3: { mobile: 30, desktop: 40 },
        4: { mobile: 20, desktop: 20 }
      }
    },
    paragraph: {
      top: { default: 10 },
      bottom: { default: 0 }
    },
    list: {
      top: { ul: 0, ol: 60, 'ol-title': 60, dl: 50 },
      bottom: { default: 0 }
    },
    card: {
      top: { mobile: 30, desktop: 50 },
      bottom: { mobile: 20, desktop: 40 }
    },
    button: {
      top: { mobile: 20, desktop: 30 },
      bottom: { default: 0 }
    },
    box: {
      top: { mobile: 30, desktop: 40 },
      bottom: { mobile: 20, desktop: 30 }
    },
    image: {
      top: { mobile: 20, desktop: 30 },
      bottom: { mobile: 15, desktop: 20 }
    }
  };

  const resolveMarginValue = (values, isMobile) => {
    if (!values) return 0;
    if (typeof values === 'number') return values;
    if (isMobile) return values.mobile ?? values.desktop ?? values.default ?? 0;
    return values.desktop ?? values.mobile ?? values.default ?? 0;
  };

  window.BLOG_EDITOR_CONSTANTS = {
    VIEWPORT_CONFIG,
    VIEWPORTS,
    STORAGE_KEYS,
    SERVER_CONFIG,
    COMPONENT_DEFS,
    MARGIN_CONFIG,
    resolveMarginValue
  };
})();
