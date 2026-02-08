describe('Blog editor modules', () => {
  beforeAll(() => {
    require('../js/constants.js');
    require('../js/utils.js');
    require('../js/dialogs.js');
    require('../js/i18n.js');
    require('../js/modules/palette.js');
    require('../js/modules/components.js');
    require('../js/modules/exporters.js');
    require('../js/modules/editor.js');
    require('../js/modules/properties.js');
    require('../js/modules/ui.js');
    require('../js/modules/drafts.js');
    require('../js/modules/events.js');
    require('../js/modules/selection.js');
    require('../js/modules/toolbar.js');
    require('../js/components/registry.js');
  });

  test('modules are registered on window', () => {
    expect(window.BLOG_EDITOR_CONSTANTS).toBeTruthy();
    expect(window.BLOG_EDITOR_UTILS).toBeTruthy();
    expect(window.BLOG_EDITOR_DIALOGS).toBeTruthy();
    expect(window.BLOG_EDITOR_I18N).toBeTruthy();
    expect(window.BLOG_EDITOR_MODULES).toBeTruthy();

    const modules = window.BLOG_EDITOR_MODULES;
    expect(modules.palette).toBeTruthy();
    expect(modules.components).toBeTruthy();
    expect(modules.exporters).toBeTruthy();
    expect(modules.editor).toBeTruthy();
    expect(modules.properties).toBeTruthy();
    expect(modules.ui).toBeTruthy();
    expect(modules.drafts).toBeTruthy();
    expect(modules.events).toBeTruthy();
    expect(modules.selection).toBeTruthy();
    expect(modules.toolbar).toBeTruthy();
  });
});
