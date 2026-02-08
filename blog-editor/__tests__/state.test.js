const EditorState = require('../js/state');

describe('EditorState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('addBlock adds a block, records history, and auto-saves', () => {
    const state = new EditorState();
    jest.spyOn(state, 'emit');

    const block = state.addBlock({ type: 'paragraph', content: 'Hello' });

    expect(block.id).toMatch(/^block-/);
    expect(state.blocks).toHaveLength(1);
    expect(state.blocks[0].content).toBe('Hello');
    expect(state.history).toHaveLength(1);

    expect(state.emit).toHaveBeenCalledWith('change');
    expect(state.emit).toHaveBeenCalledWith('saving');

    jest.runAllTimers();
    expect(state.emit).toHaveBeenCalledWith('save');
  });

  test('updateBlock updates an existing block', () => {
    const state = new EditorState();
    const block = state.addBlock({ type: 'paragraph', content: 'Before' });

    state.updateBlock(block.id, { content: 'After' });

    expect(state.getBlock(block.id).content).toBe('After');
  });

  test('deleteBlock removes block and clears selection', () => {
    const state = new EditorState();
    const block = state.addBlock({ type: 'paragraph', content: 'Hello' });

    state.selectBlock(block.id);
    state.deleteBlock(block.id);

    expect(state.blocks).toHaveLength(0);
    expect(state.selectedBlockId).toBeNull();
  });

  test('undo and redo restore previous states', () => {
    const state = new EditorState();

    state.setTitle('First');
    state.setTitle('Second');

    expect(state.undo()).toBe(true);
    expect(state.title).toBe('First');

    expect(state.redo()).toBe(true);
    expect(state.title).toBe('Second');
  });

  test('save stores draft and load restores it', () => {
    const state = new EditorState();
    state.setTitle('Draft Title');
    state.addBlock({ type: 'paragraph', content: 'Body' });

    const draftId = state.save('My Draft');
    const drafts = state.getDraftsList();

    expect(drafts[0].id).toBe(draftId);
    expect(drafts[0].name).toBe('My Draft');

    const loaded = new EditorState();
    expect(loaded.title).toBe('Draft Title');
    expect(loaded.blocks).toHaveLength(1);
    expect(loaded.blocks[0].content).toBe('Body');
  });

  test('autoSave updates existing draft', () => {
    const state = new EditorState();
    state.setTitle('Initial');
    const draftId = state.save('Auto Draft');

    state.setTitle('Updated');
    state.autoSave();

    jest.runAllTimers();

    const saved = JSON.parse(localStorage.getItem(`linkey-draft-${draftId}`));
    expect(saved.title).toBe('Updated');
  });
});
