import { describe, expect, it } from 'vitest';

import { computeColumnWidths, buildSizingInput } from './column-sizing.js';
import { paginateTable, estimateTableHeight } from './pagination.js';
import { validateTableData } from './validation.js';
import { DEFAULT_TABLE_THEME } from './constants.js';

const columns = [
  { key: 'name', title: 'Name', width: 'auto' as const },
  { key: 'sales', title: 'Sales', width: 'auto' as const, align: 'right' as const },
];

describe('computeColumnWidths', () => {
  it('distributes fixed and percentage widths deterministically', () => {
    const input = buildSizingInput(
      [
        { key: 'a', title: 'A', width: 100 },
        { key: 'b', title: 'B', width: '50%' },
        { key: 'c', title: 'C', width: 'auto' },
      ],
      [{ a: 'Alpha', b: 'Beta', c: 'Gamma' }],
      400,
      'Helvetica',
      10,
      6,
    );

    const resolved = computeColumnWidths(input);
    expect(resolved[0]?.width).toBe(100);
    expect(resolved[1]?.width).toBe(200);
    expect(resolved[2]?.width).toBeGreaterThan(0);
    expect(resolved.reduce((sum, column) => sum + column.width, 0)).toBeLessThanOrEqual(400.01);
  });

  it('respects min and max width constraints', () => {
    const input = buildSizingInput(
      [{ key: 'x', title: 'X', width: 'auto', minWidth: 80, maxWidth: 120 }],
      [{ x: 'Short' }],
      300,
      'Helvetica',
      10,
      6,
    );

    const resolved = computeColumnWidths(input);
    expect(resolved[0]?.width).toBeGreaterThanOrEqual(80);
    expect(resolved[0]?.width).toBeLessThanOrEqual(120);
  });
});

describe('validateTableData', () => {
  it('rejects duplicate column keys', () => {
    const result = validateTableData({
      columns: [
        { key: 'a', title: 'A' },
        { key: 'a', title: 'B' },
      ],
      rows: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
  });

  it('rejects negative padding via invalid width', () => {
    const result = validateTableData({
      columns: [{ key: 'a', title: 'A', width: -10 }],
      rows: [],
    });
    expect(result.valid).toBe(false);
  });
});

describe('paginateTable', () => {
  it('splits large tables across fragments', () => {
    const rows = Array.from({ length: 40 }, (_, index) => ({
      name: `Employee ${index.toString()}`,
      sales: `$${(index * 1000).toString()}`,
    }));

    const result = paginateTable({
      table: { columns, rows },
      tableWidth: 500,
      pageHeights: [120, 120, 120],
      theme: DEFAULT_TABLE_THEME,
      options: { repeatHeader: true },
    });

    expect(result.fragments.length).toBeGreaterThan(1);
    expect(result.fragments[0]?.rows.some((row) => row.kind === 'header')).toBe(true);
    expect(result.fragments[1]?.rows.some((row) => row.kind === 'header')).toBe(true);
  });

  it('handles single-page tables', () => {
    const result = paginateTable({
      table: {
        columns,
        rows: [
          { name: 'John', sales: '$12,000' },
          { name: 'Jane', sales: '$15,000' },
        ],
      },
      tableWidth: 500,
      pageHeights: [600],
      theme: DEFAULT_TABLE_THEME,
    });

    expect(result.fragments).toHaveLength(1);
    expect(result.fragments[0]?.rows.filter((row) => row.kind === 'body')).toHaveLength(2);
  });

  it('estimates height for large datasets without excessive work', () => {
    const rows = Array.from({ length: 1000 }, (_, index) => ({
      name: `Row ${index.toString()}`,
      sales: '$1',
    }));

    const height = estimateTableHeight({ columns, rows }, 500, DEFAULT_TABLE_THEME);
    expect(height).toBeGreaterThan(0);
  });
});

describe('alignment and borders metadata', () => {
  it('preserves column alignment in layout output', () => {
    const result = paginateTable({
      table: {
        columns: [{ key: 'amount', title: 'Amount', align: 'right' }],
        rows: [{ amount: '$100' }],
      },
      tableWidth: 200,
      pageHeights: [200],
      theme: DEFAULT_TABLE_THEME,
    });

    const bodyCell = result.fragments[0]?.rows.find((row) => row.kind === 'body')?.cells[0];
    expect(bodyCell?.align).toBe('right');
  });
});
