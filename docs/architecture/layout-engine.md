# Layout Engine

The layout engine is responsible for computing the physical arrangement of report content. It transforms a validated report schema and theme into a laid-out document model with resolved positions, dimensions, and page breaks.

The layout engine lives in `@reportforge/layout` and implements `ILayoutEngine`.

## Responsibilities

| Responsibility    | Description                                                       |
| ----------------- | ----------------------------------------------------------------- |
| Page setup        | Apply page size, orientation, and margins from metadata and theme |
| Positioning       | Compute x/y coordinates and dimensions for every element          |
| Pagination        | Break content across pages when it exceeds available space        |
| Spacing           | Apply vertical and horizontal spacing between elements            |
| Alignment         | Resolve text and block alignment within containers                |
| Text wrapping     | Break text lines to fit within available width                    |
| Table splitting   | Split large tables across pages with header repetition            |
| Header repetition | Render header content at the top of every page                    |
| Footer placement  | Anchor footer content at the bottom of every page                 |
| Theme resolution  | Resolve style tokens and typography from the active theme         |

## Input

```typescript
interface LayoutInput {
  readonly schema: ReportSchema;
  readonly theme: ITheme;
}
```

- **schema** — validated report schema JSON (post-validation stage).
- **theme** — resolved theme tokens for typography, colors, and spacing.

## Output

```typescript
interface LayoutOutput {
  readonly pages: readonly LayoutPage[];
  readonly metadata: Readonly<Record<string, unknown>>;
}
```

Each `LayoutPage` contains positioned elements with resolved coordinates:

```typescript
interface LayoutPage {
  readonly pageNumber: number;
  readonly width: number;
  readonly height: number;
  readonly elements: readonly LayoutElement[];
}

interface LayoutElement {
  readonly nodeId: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly props: Readonly<Record<string, unknown>>;
  readonly style: Readonly<Record<string, unknown>>;
}
```

The layout output is format-agnostic. It describes _where_ things are, not _how_ to draw them.

## Pagination

When content exceeds the available page height, the layout engine creates new pages:

1. Calculate the remaining vertical space on the current page.
2. If the next element does not fit, start a new page.
3. Respect `layoutHints.keepTogether` — if set, move the entire node to the next page.
4. Apply `layoutHints.pageBreakBefore` and `layoutHints.pageBreakAfter` when possible.

```
Page 1                          Page 2
┌──────────────────────┐       ┌──────────────────────┐
│ Header (repeated)      │       │ Header (repeated)      │
│ Section: Overview      │       │ Table (continued)      │
│   Title                │       │   Row 15               │
│   Paragraph            │       │   Row 16               │
│   Table                │       │ Footer (repeated)      │
│     Row 1 – Row 14     │       └──────────────────────┘
│ Footer (repeated)      │
└──────────────────────┘
```

## Spacing

Spacing is resolved from theme tokens:

| Token               | Applied between                |
| ------------------- | ------------------------------ |
| `spacing.section`   | Sections                       |
| `spacing.paragraph` | Paragraphs                     |
| `spacing.title`     | Titles and following content   |
| `spacing.table`     | Tables and surrounding content |
| `spacing.component` | Generic component gap          |

Inline `style` overrides on schema nodes take precedence over theme defaults.

## Margins

Page margins come from theme page settings, overridable by report metadata:

```
┌─────────────────────────────────┐
│         top margin              │
│  ┌───────────────────────────┐  │
│  │                           │  │
│l │      content area         │r │
│e │                           │i │
│f │                           │g │
│t │                           │h │
│  │                           │t │
│  └───────────────────────────┘  │
│        bottom margin            │
└─────────────────────────────────┘
```

## Alignment

| Alignment       | Scope                                                          |
| --------------- | -------------------------------------------------------------- |
| `textAlign`     | Text within a block (`left`, `center`, `right`, `justify`)     |
| `verticalAlign` | Content within a cell or container (`top`, `middle`, `bottom`) |
| `blockAlign`    | Block-level positioning within a section                       |

## Text Wrapping

The layout engine measures text using theme typography settings and wraps lines to fit the content area width. Wrapped lines increase the element height, which may trigger pagination.

## Table Splitting

Large tables split across pages:

1. Render the table header on the first page.
2. Fill rows until the page boundary.
3. If `layoutHints.repeatHeader` is true, repeat the header on subsequent pages.
4. Continue rows on the next page.
5. Preserve column widths across pages.

## Header and Footer Repetition

- **Header** nodes are extracted and rendered at the top of every page within the content margins.
- **Footer** nodes are anchored to the bottom of every page.
- Header and footer heights reduce the available content area on each page.

## What the Layout Engine Must Never Do

| Forbidden                | Reason                                 |
| ------------------------ | -------------------------------------- |
| Generate PDF bytes       | Renderer responsibility                |
| Parse Builder API        | Core responsibility                    |
| Emit HTML tags           | Renderer responsibility                |
| Modify the report schema | Validation stage owns schema integrity |
| Import renderer packages | Violates layer separation              |

## Relationship to Other Layers

```
Report Schema + Theme
        ↓
  ILayoutEngine.layout()
        ↓
  LayoutOutput (positioned pages)
        ↓
  IRenderer.render()
```

The layout engine depends on `@reportforge/shared` interfaces and types only. It never imports `@reportforge/core` or `@reportforge/renderer-pdf`.
