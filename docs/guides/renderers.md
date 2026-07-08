# Renderer SDK Guide

ReportForge rendering is built on a unified **Renderer SDK** that converts display lists into output formats through a shared lifecycle and operation model.

## Packages

| Package | Purpose |
|---------|---------|
| `@reportforge/render` | Renderer SDK — operations, lifecycle, registry |
| `@reportforge/renderer-pdf` | PDF output (pdf-lib) |
| `@reportforge/renderer-html` | Semantic HTML output |
| `@reportforge/renderer-svg` | Valid SVG output |

## Quick start

```typescript
import { Report } from '@reportforge/core';

const report = Report.create({ metadata: { title: 'Sales Report' } })
  .title('Sales Report')
  .paragraph('Generated with the unified pipeline.');

await report.toPDF('report.pdf');
await report.toHTML('report.html');
await report.toSVG('report.svg');
```

All three formats use the same pipeline:

```
ReportBuilder → Validation → Layout → DisplayList → RenderOperations → Renderer → bytes
```

## Renderer lifecycle

Every renderer implements:

| Phase | Purpose |
|-------|---------|
| `initialize()` | Setup resources |
| `beginDocument()` | Start document output |
| `beginPage()` | Start a page |
| `renderOperation()` | Render each operation |
| `endPage()` | Finish page |
| `endDocument()` | Produce output bytes |
| `dispose()` | Cleanup |

## Render operations

Display commands are normalized into unified operations:

| Operation | Description |
|-----------|-------------|
| `text` | Text in a bounding box |
| `rectangle` | Filled/stroked rectangle |
| `line` | Line segment |
| `image` | Positioned image |
| `path` | SVG path data |
| `circle` | Circle |
| `ellipse` | Ellipse |
| `polygon` | Closed polygon |
| `table` | Tabular data |
| `group` | Nested operations |
| `clip` | Clipping region |
| `transform` | Transform group |

## Renderer capabilities

Each renderer declares support:

```typescript
{
  supportsImages: true,
  supportsTransparency: true,
  supportsFonts: true,
  supportsSVG: true,
  supportsLayers: true,
  supportsMetadata: true,
  supportsMultiplePages: true,
}
```

## HTML architecture

The HTML renderer (`@reportforge/renderer-html`):

- Generates standalone semantic HTML with embedded CSS
- Uses absolutely positioned elements per page (`position: relative` page container)
- Converts points to CSS pixels (96 DPI)
- Embeds inline SVG for paths, circles, and ellipses
- Renders tables as semantic `<table>` elements

## SVG architecture

The SVG renderer (`@reportforge/renderer-svg`):

- Generates valid XML SVG with proper namespace
- One `<g>` group per page with vertical stacking
- Native SVG primitives: `<text>`, `<rect>`, `<line>`, `<path>`, `<circle>`, `<ellipse>`, `<polygon>`, `<image>`
- Preserves top-left coordinate system from the display list

## Creating custom renderers

Extend the base `Renderer` class from `@reportforge/render`:

```typescript
import { Renderer, type RenderOperation, type RenderPage, type RenderContext } from '@reportforge/render';

class MyRenderer extends Renderer {
  readonly name = 'my-renderer';
  readonly mimeTypes = ['application/x-my-format'];
  readonly capabilities = { /* ... */ };

  renderOperation(op: RenderOperation, page: RenderPage, ctx: RenderContext): void {
    switch (op.type) {
      case 'text': /* ... */ break;
      case 'rectangle': /* ... */ break;
    }
  }

  endDocument(_ctx: RenderContext): Uint8Array {
    return new TextEncoder().encode('...');
  }
}
```

Register with the renderer registry:

```typescript
import { defaultRendererRegistry } from '@reportforge/render';

defaultRendererRegistry.register('my-format', new MyRenderer());
```

## Examples

```bash
pnpm example html-report
pnpm example svg-report
pnpm example comparison
```

## Out of scope (future milestones)

- Interactive HTML
- React renderer
- Animations
- Canvas renderer
- DOCX export
