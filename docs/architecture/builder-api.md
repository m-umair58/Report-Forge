# Builder API

The Builder API is the primary developer-facing interface of ReportForge. It provides a fluent, chainable API for describing reports using business language — not drawing primitives.

The Builder lives in `@reportforge/core` and implements `IBuilder`.

## Design Principles

1. **Fluent** — every method returns `this` (or a scoped sub-builder) for chaining.
2. **Descriptive** — methods name report concepts (`title`, `table`, `footer`), not graphics operations.
3. **Type-safe** — all methods are fully typed with autocomplete support.
4. **Renderer-agnostic** — no PDF, HTML, or pixel concepts appear in the API.
5. **Progressive** — simple reports require few calls; complex reports compose naturally.

## Why Fluent?

A fluent API mirrors how developers think about reports:

```typescript
report
  .title('Quarterly Sales')
  .section('Overview')
  .paragraph('Revenue grew 12% year over year.')
  .table({ columns, rows })
  .endSection()
  .footer('Confidential');
```

Benefits:

- **Readability** — the code reads top-to-bottom like the report itself.
- **Discoverability** — IDE autocomplete reveals available components at each step.
- **Composability** — sections, headers, and footers nest naturally.
- **Immutability-friendly** — each call returns a new builder state or `this` with appended content.

## Entry Point

```typescript
import { Report } from '@reportforge/core';

const report = Report.create({
  metadata: {
    title: 'Quarterly Sales Report',
    author: 'Finance Team',
    pageSize: 'A4',
    orientation: 'portrait',
    theme: 'default',
  },
});
```

`Report.create()` returns an `IBuilder` instance. No rendering occurs at this stage.

## Core Methods

### Document Structure

```typescript
report
  .header() // Begin header block
  .title('Acme Corp')
  .endHeader()

  .section('Sales Overview')
  .title('Q1 Results')
  .endSection()

  .footer()
  .paragraph('Page {pageNumber} of {totalPages}')
  .endFooter();
```

### Content Components

```typescript
report
  .title('Annual Report')
  .subtitle('Fiscal Year 2026')
  .paragraph('This report summarizes performance across all divisions.')
  .divider()
  .image({ src: './assets/logo.png', alt: 'Company Logo' })
  .summaryCard({ label: 'Total Revenue', value: '$1.2M', trend: '+12%' });
```

### Tables

```typescript
report.table({
  columns: [
    { key: 'product', label: 'Product', align: 'left' },
    { key: 'revenue', label: 'Revenue', align: 'right' },
    { key: 'units', label: 'Units', align: 'right' },
  ],
  rows: [
    { product: 'Widget A', revenue: '$12,000', units: 400 },
    { product: 'Widget B', revenue: '$8,500', units: 275 },
  ],
});
```

### Charts

```typescript
report.chart({
  type: 'bar',
  title: 'Revenue by Quarter',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{ label: 'Revenue', values: [120000, 145000, 138000, 162000] }],
  },
});
```

### Codes

```typescript
report.qrCode({ value: 'https://acme.com/report/2026-q1' });
report.barcode({ value: '123456789012', format: 'EAN13' });
```

## Scoped Builders

Container components (`header`, `footer`, `section`) open a scoped builder. Content methods inside the scope attach to that container:

```typescript
report
  .section('Details')
  .title('Product Breakdown')
  .table({ columns, rows })
  .paragraph('See appendix for full data.')
  .endSection();
```

`endSection()`, `endHeader()`, and `endFooter()` close the scope and return to the parent builder.

## Rendering

```typescript
// Render to PDF (default renderer)
const pdf = await report.render({ format: 'pdf' });

// Render with options
const pdf = await report.render({
  format: 'pdf',
  output: './reports/quarterly-sales.pdf',
});

// Access schema without rendering
const schema = report.toSchema();
```

`render()` orchestrates the full pipeline: serialize → validate → layout → render → output.

## Configuration

```typescript
const report = Report.create({
  metadata: {
    title: 'My Report',
    locale: 'en-US',
    pageSize: 'Letter',
    orientation: 'landscape',
    theme: 'corporate',
  },
  plugins: [customComponentsPlugin, customThemePlugin],
});
```

## What the Builder Must Never Expose

| Forbidden                | Reason                              |
| ------------------------ | ----------------------------------- |
| `drawText(x, y, text)`   | Exposes drawing primitives          |
| `setFont('Helvetica')`   | PDF-specific concept                |
| `addPage()`              | Layout concern, not builder concern |
| `strokeRect(x, y, w, h)` | Graphics operation                  |
| `getPdfBuffer()`         | Couples API to a specific format    |

## Type Safety

The Builder API uses discriminated unions and generic constraints so that:

- Table `rows` must match declared `columns`.
- Chart `data` must match the selected `type`.
- Scoped builders only expose methods valid for the current container.

## Relationship to Other Layers

```
IBuilder (Builder API)
    ↓ builds
IComponent tree
    ↓ serializes to
IReportNode schema
    ↓ consumed by
ILayoutEngine → IRenderer
```

The Builder is the only layer developers interact with directly. Everything below is internal.
