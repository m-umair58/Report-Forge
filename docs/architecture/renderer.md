# Renderer

Renderers convert the **Display List** into a specific output format. Each renderer implements `IRenderer` and handles all format-specific details internally.

Renderers live in dedicated packages (e.g., `@reportforge/renderer-pdf`). They depend on the display list, not on the Builder API or component tree.

## Renderer Contract

```typescript
interface IRenderer {
  readonly name: string;
  readonly mimeTypes: readonly string[];
  render(displayList: DisplayList, options?: RenderOptions): Promise<Uint8Array>;
}
```

## Pipeline Position

```
LayoutEngine.layout() → LayoutOutput
                              ↓
DisplayListGenerator.generate() → DisplayList
                              ↓
PdfRenderer.render() → Uint8Array (PDF bytes)
```

The PDF renderer consumes **display commands only** — it never sees report components or layout nodes.

## PDF Renderer (`@reportforge/renderer-pdf`)

**Status: Implemented**

### Rendering Pipeline

```
PdfRenderer
    ↓
PageRenderer (per page)
    ↓
├── TextRenderer      → draw-text
├── ShapeRenderer     → draw-rectangle, draw-line, draw-circle, draw-ellipse
├── ImageRenderer     → draw-image
├── FontManager       → font resolution and caching
└── ImageManager      → PNG/JPEG embedding and caching
```

Each class has a single responsibility. `PdfRenderer` orchestrates document creation, metadata, and page iteration. `PageRenderer` dispatches commands to the specialised renderers.

### Supported Commands

| Command          | Status        | Notes                                      |
| ---------------- | ------------- | ------------------------------------------ |
| `draw-text`      | ✅ Full       | Font, size, weight, colour, alignment      |
| `draw-rectangle` | ✅ Full       | Fill, border, rounded corners              |
| `draw-line`      | ✅ Full       | Horizontal and vertical dividers           |
| `draw-image`     | ✅ Full       | PNG, JPEG, data URIs, aspect-ratio fit     |
| `draw-circle`    | ✅ Full       | Filled and stroked                         |
| `draw-ellipse`   | ✅ Full       | Filled and stroked                         |
| `draw-table`     | ⚠️ Placeholder | Out of scope for this milestone           |
| `draw-qr-code`   | ⚠️ Placeholder | Out of scope for this milestone           |
| `draw-barcode`   | ⚠️ Placeholder | Out of scope for this milestone           |
| `draw-path`      | ❌ Skipped    | Warning emitted                            |
| `draw-polygon`   | ❌ Skipped    | Warning emitted                            |

### Coordinate System

The display list uses a **top-left origin** (y increases downward). pdf-lib uses a **bottom-left origin** (y increases upward).

Conversion utilities in `@reportforge/renderer-pdf`:

| Function            | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `toPageY()`         | Flip a single point                               |
| `rectOriginToPageY()` | Convert rectangle top-left to pdf-lib bottom-left |
| `textBaselineY()`   | Convert text box top to baseline position         |

### Font Handling

Six standard fonts are preloaded per document:

- Helvetica / Helvetica Bold
- Times Roman / Times Roman Bold
- Courier / Courier Bold

Unknown font names fall back to Helvetica. Register aliases via:

```typescript
import { PdfRenderer } from '@reportforge/renderer-pdf';
import { StandardFonts } from 'pdf-lib';

const renderer = new PdfRenderer();
renderer.registerFont({
  name: 'Brand Sans',
  standardFont: StandardFonts.Helvetica,
  weight: 'bold',
});
```

Custom TTF/OTF embedding via `registerFont({ bytes })` is reserved for a future release.

### Image Handling

`ImageManager` supports:

- PNG and JPEG file paths (relative to `basePath` or absolute)
- Base64 data URIs (`data:image/png;base64,...`)
- Aspect-ratio preservation with centred placement inside the bounding box
- Graceful placeholder rendering for missing or unsupported images

```typescript
await renderer.render(displayList, { basePath: '/path/to/assets' });
```

### Page Backgrounds

Set a full-page background colour via render options or display list metadata:

```typescript
await renderer.render(displayList, { pageBackground: '#fafafa' });
// or metadata: { pageBackground: '#fafafa' }
```

### Document Metadata

Embedded automatically from render options or `displayList.metadata`:

- Title, Author, Subject, Keywords, Creator
- Creation Date and Modification Date (set at render time)

### Error Handling

- Fatal errors throw `PdfRendererError` with renderer name and optional `nodeId`
- Non-fatal issues (missing images, unsupported commands, invalid colours) emit warnings via `renderWithDiagnostics()`
- Invalid coordinates are skipped with a warning — the renderer does not crash

### Performance

- Font instances are loaded once per document and reused
- Embedded images are cached by source path/URI
- Object stream compression is enabled by default (`compress: true`)

## Adding Future Render Commands

1. Define the command interface in `@reportforge/display-list`
2. Emit the command from `DisplayListGenerator.elementToCommands()`
3. Add a handler in the appropriate renderer class (`TextRenderer`, `ShapeRenderer`, etc.)
4. Register the case in `PageRenderer.renderCommand()`
5. Add snapshot tests in `@reportforge/renderer-pdf`

Renderers must never import `@reportforge/core` or traverse the component tree.

## Built-in and Future Renderers

| Renderer | Package                      | Output            | Status      |
| -------- | ---------------------------- | ----------------- | ----------- |
| PDF      | `@reportforge/renderer-pdf`  | `application/pdf` | Implemented |
| HTML     | `@reportforge/renderer-html` | `text/html`       | Future      |
| DOCX     | `@reportforge/renderer-docx` | Word document     | Future      |
| PNG      | `@reportforge/renderer-png`  | `image/png`       | Future      |

## What Renderers Must Never Do

| Forbidden                       | Reason                       |
| ------------------------------- | ---------------------------- |
| Parse the Builder API           | Core responsibility          |
| Traverse the component tree     | Core responsibility          |
| Compute pagination or positions | Layout engine responsibility |
| Validate the report schema      | Core responsibility          |
| Import `@reportforge/core`      | Violates layer separation    |
