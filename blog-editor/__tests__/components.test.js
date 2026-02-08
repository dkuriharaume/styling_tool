describe('Blog editor components', () => {
  beforeAll(() => {
    require('../js/components/header-component');
    require('../js/components/paragraph-component');
    require('../js/components/list-component');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    global.requestAnimationFrame = (cb) => cb();
  });

  test('HeaderComponent renders correct level and classes', () => {
    const el = document.createElement('header-component');
    document.body.appendChild(el);

    el.setData({ level: 2, preset: 'red', content: 'Hello' });

    const h2 = el.querySelector('h2');
    expect(h2).toBeTruthy();
    expect(h2.className).toBe('h2 h2--red');
    expect(h2.textContent).toBe('Hello');
  });

  test('HeaderComponent emits content-change on blur', () => {
    const el = document.createElement('header-component');
    document.body.appendChild(el);

    const handler = jest.fn();
    el.addEventListener('content-change', handler);

    el.setData({ level: 3, content: 'Start' });
    const h3 = el.querySelector('h3');
    h3.textContent = 'Updated';
    h3.dispatchEvent(new Event('blur'));

    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].detail.content).toBe('Updated');
  });

  test('ParagraphComponent applies variants and emits content-change', () => {
    const el = document.createElement('paragraph-component');
    document.body.appendChild(el);

    const handler = jest.fn();
    el.addEventListener('content-change', handler);

    el.setData({ variant: 'small-gray', content: 'Text' });

    const p = el.querySelector('p');
    expect(p.className).toBe('small small--gray');
    p.innerHTML = 'Updated <strong>text</strong>';
    p.dispatchEvent(new Event('blur'));

    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].detail.content).toBe('Updated <strong>text</strong>');
  });

  test('ListComponent renders items and addItem dispatches change', () => {
    const el = document.createElement('list-component');
    document.body.appendChild(el);

    const handler = jest.fn();
    el.addEventListener('content-change', handler);

    el.setData({ type: 'ul', items: [{ content: 'A' }, { content: 'B' }] });

    const items = el.querySelectorAll('li');
    expect(items.length).toBe(2);

    el.addItem();
    const updatedItems = el.querySelectorAll('li');
    expect(updatedItems.length).toBe(3);
    expect(handler).toHaveBeenCalled();
  });
});
