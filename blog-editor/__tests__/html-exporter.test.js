const HTMLExporter = require('../js/exporters/html-exporter');

describe('HTMLExporter', () => {
  test('exports headers with correct classes and cleanup', () => {
    const state = {
      blocks: [
        { type: 'header', level: 2, preset: 'red', content: '<span>Title</span>' },
        { type: 'header', level: 4, preset: 'blue', content: '<div>Sub</div>' }
      ]
    };

    const exporter = new HTMLExporter(state);
    const html = exporter.export();

    expect(html).toContain('<h2 class="h2 h2--red">Title</h2>');
    expect(html).toContain('<h4 class="h4 h4--blue">Sub</h4>');
  });

  test('exports paragraphs with variants', () => {
    const state = {
      blocks: [
        { type: 'paragraph', variant: 'normal', content: 'A' },
        { type: 'paragraph', variant: 'small', content: 'B' },
        { type: 'paragraph', variant: 'small-gray', content: 'C' }
      ]
    };

    const exporter = new HTMLExporter(state);
    const html = exporter.export();

    expect(html).toContain('<p>A</p>');
    expect(html).toContain('<p class="small">B</p>');
    expect(html).toContain('<p class="small small--gray">C</p>');
  });

  test('exports lists in all supported formats', () => {
    const state = {
      blocks: [
        { type: 'list', listType: 'ul', items: [{ content: 'U1' }] },
        { type: 'list', listType: 'ol', items: [{ content: 'O1' }] },
        { type: 'list', listType: 'ol-title', items: [{ title: 'T1', content: 'C1' }] },
        { type: 'list', listType: 'dl', items: [{ term: 'Key', definition: 'Value' }] }
      ]
    };

    const exporter = new HTMLExporter(state);
    const html = exporter.export();

    expect(html).toContain('<ul class="ul">');
    expect(html).toContain('<li>U1</li>');
    expect(html).toContain('<ol class="ol ol--mt">');
    expect(html).toContain('<li>O1</li>');
    expect(html).toContain('<ol class="ol ol--title ol--mt">');
    expect(html).toContain('<h4 class="h4 ol__title">T1</h4>');
    expect(html).toContain('<p>C1</p>');
    expect(html).toContain('<dl class="wide-dl">');
    expect(html).toContain('<dt>Key</dt>');
    expect(html).toContain('<dd>Value</dd>');
  });

  test('cleanupHTML removes spans and divs', () => {
    const state = { blocks: [] };
    const exporter = new HTMLExporter(state);

    const cleaned = exporter.cleanupHTML('<div>Hello <span>World</span></div>');
    expect(cleaned).toBe('Hello World');
  });
});
