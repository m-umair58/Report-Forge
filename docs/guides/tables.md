# Table Engine Guide

The professional table engine lives in `@reportforge/table`. It is **renderer-independent** — it produces layout data consumed by the layout engine and PDF renderer.

## Quick start

```typescript
import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const report = Report.create()
  .add(
    Components.Table({
      columns: [
        { key: 'name', title: 'Employee' },
        { key: 'department', title: 'Department' },
        { key: 'salary', title: 'Salary', align: 'right' },
      ],
      rows: employees,
    }),
  );

await report.toPDF('report.pdf');
```

The fluent API also works: `report.table({ columns, rows })`.

## Column sizing

The sizing algorithm runs in four deterministic passes:

1. **Fixed widths** — absolute point values are reserved first.
2. **Percentage widths** — calculated against the table width.
3. **Auto widths** — measured from header and body content, clamped by `minWidth` / `maxWidth`.
4. **Distribution** — remaining space is allocated proportionally among auto columns.

```typescript
{ key: 'sku', title: 'SKU', width: 90 }           // fixed
{ key: 'name', title: 'Name', width: '40%' }      // percentage
{ key: 'notes', title: 'Notes', width: 'auto' }   // content-based
```

## Pagination strategy

Tables split across pages when body rows exceed available height:

- Header height is reserved on every page when `repeatHeader: true` (default).
- Footer rows render only on the final fragment.
- **Orphan avoidance** keeps at least two body rows together when possible.
- Each fragment carries a precomputed `tableLayout` with absolute cell positions.

## Header repetition

Set `repeatHeader: false` to show column headers on the first page only:

```typescript
Components.Table({ columns, rows, repeatHeader: false })
```

## Styling

```typescript
Components.Table({
  columns,
  rows,
  tableStyle: {
    alternateRowBackground: '#fafafa',
    headerBackground: '#e8eef5',
    headerFontWeight: 'bold',
    cellPadding: 8,
    border: { width: 0.5, color: '#cccccc' },
  },
});
```

## Best practices

- Prefer `title` (or `label`) on every column — empty headers are rejected at validation.
- Use percentage + auto columns for responsive layouts; fixed widths for ID/SKU columns.
- For large datasets (1,000+ rows), pass row arrays directly — the engine avoids redundant copies per fragment.
- Cell merging (`rowSpan` / `colSpan`) is reserved for a future milestone.

## Examples

```bash
pnpm example sales-table
pnpm example inventory-table
pnpm example financial-report
```

## Architecture

```
Components.Table → Layout Engine → @reportforge/table → Display List → PDF Renderer
```

See [packages/table/README.md](../../packages/table/README.md) for the full API reference.
