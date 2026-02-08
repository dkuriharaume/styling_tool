# LINKEY Blog Editor - Design Document

**Project Name:** LINKEY Blog Editor  
**Version:** 1.0.0  
**Date:** 2026年2月8日  
**Status:** Planning Phase

---

## Executive Summary

A browser-based WYSIWYG blog post editor that enables non-technical team members to create styled blog posts for the LINKEY WordPress site. The tool provides drag-and-drop component insertion and visual editing, outputting M2O-formatted Markdown or HTML compatible with the existing m2h_om_style converter.

---

## Goals & Objectives

### Primary Goals
1. **Enable non-developers** to create blog posts with proper LINKEY styling
2. **Maintain consistency** with existing WordPress theme design
3. **Zero setup required** - accessible via web browser (GitHub Pages)
4. **Seamless integration** with existing m2h_om_style workflow

### Success Criteria
- Non-technical users can create a complete blog post in < 15 minutes
- Output is 100% compatible with m2h_om_style converter
- No style drift from WordPress theme
- Works on modern browsers (Chrome, Firefox, Safari, Edge)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Static)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Component      │  │   Editor     │  │   Preview      │ │
│  │  Palette        │  │   Canvas     │  │   Panel        │ │
│  │                 │  │              │  │                │ │
│  │  - Headers      │  │  [Drop Zone] │  │  Live Preview  │ │
│  │  - Text Blocks  │  │  [Element 1] │  │  with LINKEY   │ │
│  │  - Cards        │  │  [Element 2] │  │  styles        │ │
│  │  - Buttons      │  │  [Element 3] │  │                │ │
│  │  - Boxes        │  │              │  │                │ │
│  │  - Lists        │  │              │  │                │ │
│  └─────────────────┘  └──────────────┘  └────────────────┘ │
│           │                   │                   │          │
│           └───────────────────┴───────────────────┘          │
│                               │                              │
│                    ┌──────────▼──────────┐                  │
│                    │   Data Store        │                  │
│                    │   (JSON Structure)  │                  │
│                    └──────────┬──────────┘                  │
│                               │                              │
│           ┌───────────────────┼───────────────────┐         │
│           │                   │                   │          │
│    ┌──────▼──────┐   ┌───────▼────────┐   ┌─────▼─────┐   │
│    │  M2O Export │   │  HTML Export   │   │ Local Save│   │
│    │  (Markdown) │   │  (Direct WP)   │   │ (Draft)   │   │
│    └─────────────┘   └────────────────┘   └───────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Vanilla JavaScript | Lightweight, no build step, GitHub Pages friendly |
| **UI Library** | Web Components (Custom Elements) | Native, reusable, encapsulated |
| **Drag & Drop** | HTML5 Drag & Drop API | Native browser support, no dependencies |
| **Text Editing** | ContentEditable + custom toolbar | Simple, inline editing |
| **Styling** | Extracted LINKEY CSS + Editor styles | Exact match to WordPress theme |
| **State Management** | Simple JS class (EditorState) | No framework needed |
| **Storage** | localStorage | Draft saving, no backend required |
| **Deployment** | GitHub Pages | Free, HTTPS, global CDN |

---

## Refactor Status (Current Implementation)

The codebase has been modularized to reduce risk during ongoing refactors. The following architectural changes are now in place:

- **Module-based JS** (no build step): shared modules attach to `window.BLOG_EDITOR_MODULES`.
- **Constants & utilities** extracted to dedicated files for reuse and testability.
- **Editor subsystems** split into modules (palette, editor, properties, UI, drafts, events, selection).
- **Component registry**: components are registered via `js/components/registry.js`, and the editor uses registry lookups to create defaults and elements.
- **Formatting toolbar** refactored into a module with a thin entrypoint wrapper.
- **HTML exporter** supports CommonJS export for unit testing.
- **App init** moved to `js/init.js` to avoid side effects in `app.js`.

### Updated File Structure (Refactor Snapshot)

```
blog-editor/
├── index.html
├── js/
│   ├── app.js
│   ├── init.js
│   ├── constants.js
│   ├── utils.js
│   ├── i18n.js
│   ├── dialogs.js
│   ├── formatting-toolbar.js
│   ├── exporters/
│   │   └── html-exporter.js
│   ├── components/
│   │   ├── header-component.js
│   │   ├── paragraph-component.js
│   │   ├── list-component.js
│   │   ├── card-component.js
│   │   └── registry.js
│   └── modules/
│       ├── palette.js
│       ├── components.js
│       ├── exporters.js
│       ├── editor.js
│       ├── properties.js
│       ├── ui.js
│       ├── drafts.js
│       ├── events.js
│       ├── selection.js
│       └── toolbar.js
└── __tests__/
  ├── state.test.js
  ├── modules.test.js
  ├── html-exporter.test.js
  └── components.test.js
```

---

## Design Policy: Mandatory Pre-Change Review

**All contributors (including AI agents) must read this document before adding new functionality or making substantial modifications.**

Rationale:
- Ensure changes remain aligned with the LINKEY editor goals and constraints.
- Preserve the modular structure and avoid regressions.
- Keep outputs compatible with the existing WordPress theme and the M2O workflow.

---

## Lessons Learned (UI/Layout)

- **Viewport clipping/strip issue**: Fixed by pinning `.app-container` to the viewport (`position: fixed; inset: 0`) instead of relying on `100vh` calculations. On some browsers/zoom combos, `100vh` can be shorter than the actual visible area, causing header clipping and a visible bottom strip.

---

## Component Inventory

### Components from M2O Converter

Based on `/m2h_om_style/converter.py` and `/transformers.py`:

#### 1. Headers
- **H1** → `<h1 class="h1">`
- **H2** → `<h2 class="h2 h2--blue">` (default)
  - Preset: `{red}` → `h2--red`
- **H3** → `<h3 class="h3">`
- **H4** → `<h4 class="h4">`
  - Preset: `{blue}` → `h4--blue`
  - Preset: `{red}` → `h4--red`

#### 2. Text Decorations
- **Bold** → `<strong class="strong">`
  - Preset: `{info}` → `strong--info`
  - Preset: `{warning}` → `strong--warning`
- **Links** → `<a class="txtlink" target="_blank" rel="noopener">`
- **Small Text** → `<p class="small">`
  - Preset: `{gray}` → `small--gray`

#### 3. Lists
- **Unordered List** → `<ul class="ul">`
- **Ordered List** → `<ol class="ol ol--mt">`
  - With H4: `ol--title` + `<h4 class="h4 ol__title">`
- **Dictionary List** → `<dl class="wide-dl">`
  - Format: `Key : Value`

#### 4. Cards
- **2-Column Cards** → `<div>{card-2}...` → `.card-container + .card-2col`
- **3-Column Cards** → `<div>{card-3}...` → `.card-container + .card-3col`
- Auto-generates: `.card + .card__head + .card__img + .card__body`

#### 5. Buttons
- **Regular Button** → `[Text](url){button}` → `.btn-container + .btn--blue`
- **Large Button** → `[Text](url){button-big}` → `.btn-container + .btn--big`

#### 6. Boxes
- **Regular Box** → `<div>{box}...` → `.box`
- **Shadow Box** → `<div>{box-shadow}...` → `.box--shadow`
- **Summary Box** → `<div>{box-summary}...` → `.box--summary`
- **Collapsible Box** → `<div>{box-collapsible}...` → `.box--collapsible`
- **Customer Case** → `<div>{customer-case}...` → `.customer-case`
- **Voice Box** → `<div>{voice}...` → `.voice` (2-column testimonial)

#### 7. WordPress Elements
- **Table of Contents** → `{TOC}` → `[goto]`
- **Related Article** → `{article-0123}` → `[parts template="related-column-card" post_id=0123]`

#### 8. Images
- **Image Block** → `<div>{img}![alt](url)` → `.img-container + .img-container__img`

---

## Data Model

### Internal JSON Structure

```json
{
  "version": "1.0",
  "title": "Blog Post Title",
  "blocks": [
    {
      "id": "block-uuid-1",
      "type": "header",
      "level": 2,
      "preset": "blue",
      "content": "Section Title"
    },
    {
      "id": "block-uuid-2",
      "type": "paragraph",
      "content": "Regular paragraph with <strong class=\"strong\">bold text</strong>."
    },
    {
      "id": "block-uuid-3",
      "type": "card-grid",
      "columns": 2,
      "cards": [
        {
          "title": "Card 1",
          "content": "Card content",
          "image": "https://..."
        },
        {
          "title": "Card 2",
          "content": "Card content",
          "image": "https://..."
        }
      ]
    },
    {
      "id": "block-uuid-4",
      "type": "button",
      "size": "regular",
      "text": "Click Here",
      "url": "https://example.com"
    },
    {
      "id": "block-uuid-5",
      "type": "box",
      "variant": "shadow",
      "content": "Box content here"
    }
  ]
}
```

### M2O Markdown Export Format

Each block type maps to M2O syntax:

```markdown
M2O:
# Blog Post Title

## Section Title

Regular paragraph with **bold text**.

<div>{card-2}
## Card 1
Card content
![Image](https://...)

## Card 2
Card content
![Image](https://...)
</div>

[Click Here](https://example.com){button}

<div>{box-shadow}
Box content here
</div>
```

---

## User Interface Design

### Layout Structure

```
┌────────────────────────────────────────────────────────────────┐
│  Header: [LINKEY Blog Editor] [Save] [Export ▾] [Help]         │
├──────────────┬─────────────────────────────────┬───────────────┤
│              │                                 │               │
│  Component   │      Editor Canvas              │   Properties  │
│  Palette     │                                 │   Panel       │
│              │  ┌─────────────────────────┐   │               │
│  🔤 Headers  │  │ # Blog Post Title       │   │  📝 Element   │
│  📄 Text     │  │ [Edit title...]         │   │   Settings    │
│  📋 Lists    │  └─────────────────────────┘   │               │
│  🃏 Cards    │                                 │  Type: Header │
│  🔘 Buttons  │  [+ Add Component]              │  Level: H1    │
│  📦 Boxes    │                                 │  Preset: --   │
│  🖼️  Images   │  ┌─────────────────────────┐   │               │
│  🔗 Links    │  │ ## Section Title        │   │  Content:     │
│              │  │ [Edit...]               │   │  ┌──────────┐ │
│  ────────    │  └─────────────────────────┘   │  │          │ │
│              │                                 │  └──────────┘ │
│  📱 Preview  │  ┌─────────────────────────┐   │               │
│  💾 Export   │  │ Paragraph text here...  │   │  [Delete]     │
│              │  │ [Edit...]               │   │               │
│              │  └─────────────────────────┘   │               │
│              │                                 │               │
│              │  [+ Add Component]              │               │
│              │                                 │               │
└──────────────┴─────────────────────────────────┴───────────────┘
```

### Interaction Flow

#### Adding a Component
1. User drags component from palette OR clicks component button
2. Drop zone highlights appear in canvas
3. User drops/places component
4. Component renders with default content
5. Properties panel shows component settings
6. User edits content inline or via properties panel

#### Editing Content
1. **Inline Editing**: Click element → contentEditable activates
2. **Properties Panel**: Select element → edit in panel
3. **Toolbar**: Text selection shows formatting toolbar (bold, link, etc.)

#### Reordering
1. Hover over component → drag handle appears
2. Drag to new position
3. Drop zones highlight between elements
4. Component moves to new position

#### Exporting
1. Click "Export" dropdown
2. Options:
   - **Copy M2O Markdown** → Clipboard
   - **Copy HTML** → Clipboard
   - **Download M2O (.md)**
   - **Download HTML (.html)**
   - **Preview in New Tab**

---

## File Structure

```
linkey-blog-editor/
├── index.html                  # Main application page
├── README.md                   # User documentation
├── DESIGN_DOC.md              # This file
│
├── css/
│   ├── editor.css             # Editor UI styles
│   ├── linkey-theme.css       # Extracted WordPress theme styles
│   └── components.css         # Component-specific styles
│
├── js/
│   ├── app.js                 # Main application controller
│   ├── state.js               # State management
│   ├── editor.js              # Editor canvas logic
│   ├── palette.js             # Component palette
│   ├── properties.js          # Properties panel
│   ├── components/            # Web Components
│   │   ├── base-component.js
│   │   ├── header-component.js
│   │   ├── text-component.js
│   │   ├── card-component.js
│   │   ├── button-component.js
│   │   ├── box-component.js
│   │   ├── list-component.js
│   │   └── image-component.js
│   ├── exporters/
│   │   ├── m2o-exporter.js    # M2O Markdown export
│   │   └── html-exporter.js   # HTML export
│   └── utils.js               # Helper functions
│
├── assets/
│   ├── icons/                 # UI icons
│   └── images/                # Default placeholder images
│
└── docs/
    ├── user-guide.md          # End-user documentation
    └── component-reference.md # Component usage reference
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Basic editor structure and one working component

- [ ] Setup GitHub repository
- [ ] Create basic HTML structure
- [ ] Implement EditorState class
- [ ] Build editor canvas with drop zones
- [ ] Implement one component (Header) end-to-end
- [ ] Basic M2O export for header

**Deliverable:** Can add/edit/export a header component

---

### Phase 2: Core Components (Week 2)
**Goal:** All basic text components working

- [ ] Paragraph/Text component
- [ ] Bold, info, warning variants
- [ ] Link component
- [ ] Small text variants
- [ ] List components (UL, OL, DL)
- [ ] Export logic for all components

**Deliverable:** Can create text-heavy blog posts

---

### Phase 3: Advanced Components (Week 3)
**Goal:** Cards, boxes, and buttons

- [ ] Card grid (2-col, 3-col)
- [ ] Button components (regular, large)
- [ ] Box components (all variants)
- [ ] Image handling
- [ ] WordPress elements (TOC, article links)

**Deliverable:** Complete component library

---

### Phase 4: UX Polish (Week 4)
**Goal:** Professional, user-friendly interface

- [ ] Drag & drop refinement
- [ ] Inline editing polish
- [ ] Properties panel UX
- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts
- [ ] Mobile responsive (view-only)

**Deliverable:** Production-ready UX

---

### Phase 5: Export & Integration (Week 5)
**Goal:** Seamless workflow integration

- [ ] M2O export validation
- [ ] HTML export with proper formatting
- [ ] Copy to clipboard
- [ ] Download files
- [ ] localStorage draft saving
- [ ] Import from M2O markdown (bonus)

**Deliverable:** Full export/import cycle

---

### Phase 6: Testing & Documentation (Week 6)
**Goal:** Ready for team rollout

- [ ] Cross-browser testing
- [ ] User guide documentation
- [ ] Component reference guide
- [ ] Video tutorial
- [ ] Bug fixes
- [ ] GitHub Pages deployment

**Deliverable:** Deployed and documented tool

---

## Technical Specifications

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Performance Targets
- Initial load: < 2 seconds
- Component render: < 100ms
- Export generation: < 500ms (for 50 components)

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Focus management
- Color contrast compliance (WCAG AA)

---

## CSS Extraction Strategy

### From WordPress Theme (`linkey_service/scss/`)

**Files to extract:**
- `_config.scss` - Variables, colors, breakpoints
- `_layout.scss` - Container, spacing
- `_section.scss` - Section styles
- `_card.scss` - Card components
- `_news.scss` - Article/post styles
- `_subpage.scss` - Content styles

**Classes needed:**
```scss
// Headers
.h1, .h2, .h2--blue, .h2--red, .h3, .h4, .h4--blue, .h4--red

// Text
.strong, .strong--info, .strong--warning
.small, .small--gray
.txtlink

// Lists
.ul, .ol, .ol--mt, .ol--title, .ol__title
.wide-dl

// Cards
.card-container, .card, .card-2col, .card-3col
.card__head, .card__img, .card__body

// Buttons
.btn-container, .btn--blue, .btn--big

// Boxes
.box, .box--shadow, .box--summary, .box--collapsible
.customer-case, .voice

// Images
.img-container, .img-container__img
```

**Extraction process:**
1. Compile SCSS to CSS (if needed)
2. Extract only used classes
3. Create standalone `linkey-theme.css`
4. Remove WordPress-specific dependencies

---

## Export Logic

### M2O Markdown Export

**Algorithm:**
```javascript
function exportToM2O(blocks) {
  let markdown = "M2O:\n";
  
  for (const block of blocks) {
    switch (block.type) {
      case 'header':
        markdown += `${'#'.repeat(block.level)} ${block.content}`;
        if (block.preset) markdown += ` {${block.preset}}`;
        markdown += '\n\n';
        break;
        
      case 'paragraph':
        markdown += `${block.content}\n\n`;
        break;
        
      case 'card-grid':
        markdown += `<div>{card-${block.columns}}\n`;
        for (const card of block.cards) {
          markdown += `## ${card.title}\n`;
          markdown += `${card.content}\n`;
          if (card.image) markdown += `![](${card.image})\n`;
          markdown += '\n';
        }
        markdown += `</div>\n\n`;
        break;
        
      case 'button':
        markdown += `[${block.text}](${block.url})`;
        markdown += `{button${block.size === 'large' ? '-big' : ''}}`;
        markdown += '\n\n';
        break;
        
      case 'box':
        markdown += `<div>{box${block.variant ? '-' + block.variant : ''}}\n`;
        markdown += `${block.content}\n`;
        markdown += `</div>\n\n`;
        break;
    }
  }
  
  return markdown;
}
```

### HTML Export

**Algorithm:**
```javascript
function exportToHTML(blocks) {
  let html = '';
  
  for (const block of blocks) {
    switch (block.type) {
      case 'header':
        const classes = getHeaderClasses(block.level, block.preset);
        html += `<h${block.level} class="${classes}">${block.content}</h${block.level}>\n`;
        break;
        
      case 'paragraph':
        html += `<p>${block.content}</p>\n`;
        break;
        
      case 'card-grid':
        html += generateCardGridHTML(block);
        break;
        
      case 'button':
        html += generateButtonHTML(block);
        break;
        
      case 'box':
        html += generateBoxHTML(block);
        break;
    }
  }
  
  return html;
}
```

---

## State Management

### EditorState Class

```javascript
class EditorState {
  constructor() {
    this.blocks = [];
    this.selectedBlockId = null;
    this.history = [];
    this.historyIndex = -1;
  }
  
  addBlock(block, position = -1) {
    // Add block and update history
  }
  
  updateBlock(id, changes) {
    // Update block and update history
  }
  
  deleteBlock(id) {
    // Delete block and update history
  }
  
  moveBlock(id, newPosition) {
    // Reorder blocks and update history
  }
  
  undo() {
    // Restore previous state
  }
  
  redo() {
    // Restore next state
  }
  
  save() {
    // Save to localStorage
  }
  
  load() {
    // Load from localStorage
  }
  
  export(format) {
    // Export to M2O or HTML
  }
}
```

---

## Security Considerations

### XSS Prevention
- Sanitize all user input
- Use textContent for plain text
- Validate URLs before creating links
- Escape HTML in user content

### Data Storage
- localStorage only (no server)
- No sensitive data stored
- Clear data on export option

---

## Future Enhancements (v2.0)

1. **Templates**: Pre-built blog post templates
2. **Image Upload**: Direct upload to WordPress media library (via API)
3. **Collaborative Editing**: Multi-user editing with WebRTC
4. **Version History**: Cloud-based version history
5. **AI Assistant**: Content suggestions and auto-formatting
6. **Import from WordPress**: Pull existing posts for editing
7. **Custom Components**: User-defined component library
8. **Theme Customization**: Adjust colors/styles per post

---

## Success Metrics

### Adoption Metrics
- Number of active users
- Blog posts created per week
- Time to create a post (target: < 15 min)

### Quality Metrics
- Posts exported without errors (target: > 95%)
- User satisfaction score (target: > 4.5/5)
- Support requests per month (target: < 5)

### Technical Metrics
- Page load time (target: < 2s)
- Browser compatibility (target: > 98% users)
- Uptime (target: 99.9%)

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| CSS drift from WordPress theme | High | Medium | Automated CSS extraction, regular sync |
| Browser compatibility issues | Medium | Low | Progressive enhancement, polyfills |
| Complex components difficult to edit | Medium | Medium | Extensive user testing, iterative UX |
| Performance with many components | Medium | Low | Virtual scrolling, lazy rendering |
| User adoption resistance | High | Low | Training videos, clear documentation |

---

## Glossary

- **M2O**: Markdown to Output (custom format for m2h_om_style converter)
- **Component**: Reusable UI element (header, card, button, etc.)
- **Block**: Instance of a component in the editor
- **Preset**: Predefined styling variant (e.g., red, blue, info, warning)
- **Canvas**: Main editing area where components are placed
- **Palette**: Component library/selector
- **Properties Panel**: Settings panel for selected component

---

## References

### Internal Documentation
- `/m2h_om_style/README.md` - M2O converter documentation
- `/m2h_om_style/converter.py` - Converter implementation
- `/m2h_om_style/transformers.py` - Transformation logic
- `/linkey_service/scss/` - WordPress theme styles

### External Resources
- [HTML5 Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [ContentEditable](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable)
- [GitHub Pages](https://pages.github.com/)

---

## Contact & Ownership

**Project Owner:** Kurihara Daisuke  
**Team:** Marketing / Owned Media  
**Repository:** (TBD)  
**Deployment:** (TBD)

---

**Last Updated:** 2026年2月8日  
**Document Version:** 1.0
