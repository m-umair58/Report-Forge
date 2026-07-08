# Table Engine (`@reportforge/table`)

Renderer-independent table layout for ReportForge.

## Components

| Type | Description |
|------|-------------|
| `ColumnDefinition` | Column key, title, width, alignment |
| `TableRow` | Header, body, or footer row |
| `TableCell` | Cell content and styling |
| `TableLayout` | Precomputed positions for one page fragment |

## API

```typescript
import { paginateTable, computeColumnWidths, validateTableData } from '@reportforge/table';
```

### Paginate a table

```typescript
const result = paginateTable({
  table: { columns, rows },
  tableWidth: 500,
  pageHeights: [600, 600],
  theme: DEFAULT_TABLE_THEME,
  options: { repeatHeader: true },
});

result.fragments.forEach((fragment) => {
  console.log(fragment.height, fragment.rows.length);
});
```

## Validation

`validateTableData()` detects duplicate columns, invalid widths, empty headers, and missing row keys.

## Performance

The engine uses index-based pagination and avoids copying row data into each fragment. Architected for future streaming of very large datasets.

## Not yet implemented

- Full `rowSpan` / `colSpan` cell merging
- Editable or interactive tables
- Spreadsheet formulas
