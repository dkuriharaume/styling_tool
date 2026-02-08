# LINKEY Blog Editor

A WYSIWYG blog post editor for creating styled content compatible with the LINKEY WordPress theme.

## Phase 1 - MVP (Current)

### ✅ Completed Features
- Basic editor structure with 3-panel layout
- State management with undo/redo
- Header component (H1-H4) with blue/red presets
- Drag & drop component insertion
- M2O Markdown export
- HTML export
- Auto-save to localStorage
- Properties panel for editing
- Keyboard shortcuts (Cmd/Ctrl+Z, Delete)

### 🎯 How to Use

1. **Open the editor**: Open `index.html` in a web browser
2. **Add a header**: Drag a header component from the left panel and drop it in the canvas
3. **Edit content**: Click on the header text to edit it inline, or use the properties panel
4. **Change style**: Select a block and use the properties panel to change level (H1-H4) or preset (blue/red)
5. **Export**: Click "Copy M2O" to copy the M2O markdown format, or "Copy HTML" for direct HTML

### 🎨 Available Components (Phase 1)
- **Headers**: H1, H2, H3, H4 with blue/red presets

### 💾 Auto-Save
Your work is automatically saved to browser localStorage every second. Close and reopen the editor to continue where you left off.

### ⌨️ Keyboard Shortcuts
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Delete/Backspace` - Delete selected block

### 🧪 Testing

1. Open `index.html` in a browser
2. Drag a "Heading 2" component to the canvas
3. Edit the text
4. Click "Copy M2O"
5. Paste the result into your m2h_om_style converter to verify

### 📋 Coming Soon (Phase 2+)
- Paragraph component with text formatting
- Lists (UL, OL, Dictionary)
- Cards (2-col, 3-col)
- Buttons
- Boxes (regular, shadow, summary, etc.)
- Images
- WordPress elements (TOC, article links)

## Project Structure

```
blog-editor/
├── index.html              # Main application
├── css/
│   ├── editor.css         # Editor UI styles
│   └── linkey-theme.css   # WordPress theme styles
├── js/
│   ├── app.js             # Main application controller
│   ├── state.js           # State management
│   ├── components/
│   │   └── header-component.js
│   └── exporters/
│       ├── m2o-exporter.js
│       └── html-exporter.js
└── README.md              # This file
```

## Development

To add a new component:

1. Create component file in `js/components/`
2. Define the component class extending `HTMLElement`
3. Register with `customElements.define()`
4. Add to palette in `index.html`
5. Add case in `app.js` `createComponent()` method
6. Add export logic in exporters

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Internal tool for LINKEY team use.
