# First Working PDF — Vertical Slice

This document describes the **minimal end-to-end pipeline** that generates the first real PDF from ReportForge.

This is **not** the final PDF renderer. It exists solely to validate the architecture.

## Pipeline

```
Report.create()
      ↓
ReportBuilder (fluent API)
      ↓
Report DOM (InternalNode tree)
      ↓
Validation
      ↓
LayoutEngine.layout()
      ↓
DisplayListGenerator.generate()
      ↓
PdfRenderer.render()
      ↓
hello.pdf
```

Each layer communicates only through typed interfaces — no layer skips ahead or reaches backward.

## Supported components (this milestone)

| Component | Layout output       | Display command | PDF output   |
| --------- | ------------------- | --------------- | ------------ |
| Title     | Positioned text box | `draw-text`     | Text string  |
| Paragraph | Positioned text box | `draw-text`     | Text string  |
| Divider   | Horizontal rule     | `draw-line`     | Line segment |

Everything else (tables, images, charts, headers, footers, themes, plugins) is **out of scope** for this milestone.

## Usage

```typescript
import { Report } from '@reportforge/core';

const report = Report.create()
  .title('Hello ReportForge')
  .paragraph('This is our first PDF.')
  .divider();

await report.toPDF('hello.pdf');
```

Or run the example:

```bash
pnpm example hello-world
```

This writes `examples/hello.pdf`.

## Package responsibilities in this slice

| Package                     | Role                                             |
| --------------------------- | ------------------------------------------------ |
| `@reportforge/core`         | Builder API, validation, `toPDF()` orchestration |
| `@reportforge/layout`       | Positions elements on pages                      |
| `@reportforge/display-list` | Converts layout to draw commands                 |
| `@reportforge/renderer-pdf` | Converts draw commands to PDF bytes              |

## Renderer limitations

The `@reportforge/renderer-pdf` package in this milestone:

- Only renders `draw-text` and `draw-line` commands
- Ignores all other commands with a warning
- Uses built-in PDF standard fonts (Helvetica) via pdf-lib
- Does not embed custom fonts, images, or vector graphics
- Does not support forms, annotations, or compression options beyond pdf-lib defaults

## What comes next

Future milestones will expand the renderer to support additional display commands (rectangles, images, tables) and integrate the typography engine for accurate text measurement during layout.

## Coordinate system

The display list uses a **top-left origin** (Y increases downward). pdf-lib uses a **bottom-left origin**. The renderer converts coordinates transparently in `PdfPage`.

```
Display list          pdf-lib
┌──────────┐          ┌──────────┐
│ (0,0)    │          │          │ (0, H)
│   y ↓    │          │   y ↑    │
│          │          │ (0,0)    │
└──────────┘          └──────────┘
```
