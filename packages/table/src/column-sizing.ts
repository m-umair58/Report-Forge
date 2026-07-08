import { createBuiltInMetrics } from '@reportforge/typography';

import { columnTitle, DEFAULT_MAX_COLUMN_WIDTH, DEFAULT_MIN_COLUMN_WIDTH } from './constants.js';
import type { ColumnDefinition, ResolvedColumn } from './types.js';

interface ColumnSizingInput {
  readonly columns: readonly ColumnDefinition[];
  readonly headerTitles: readonly string[];
  readonly bodyValues: readonly (readonly string[])[];
  readonly tableWidth: number;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly cellPadding: number;
}

function measureTextWidth(text: string, fontFamily: string, fontSize: number, bold = false): number {
  const metrics = createBuiltInMetrics(fontFamily, bold ? 'bold' : 'normal');
  return metrics.stringWidth(text, fontSize);
}

function contentWidthForColumn(
  columnIndex: number,
  input: ColumnSizingInput,
): number {
  let maxWidth = measureTextWidth(input.headerTitles[columnIndex] ?? '', input.fontFamily, input.fontSize, true);

  for (const row of input.bodyValues) {
    const value = row[columnIndex] ?? '';
    maxWidth = Math.max(maxWidth, measureTextWidth(value, input.fontFamily, input.fontSize));
  }

  return maxWidth + input.cellPadding * 2;
}

function parsePercent(value: string): number {
  return Number.parseFloat(value.replace('%', ''));
}

/**
 * Deterministic column sizing algorithm.
 *
 * 1. Apply fixed point widths.
 * 2. Apply percentage widths against the table width.
 * 3. Measure auto columns from content (header + body), clamped by min/max.
 * 4. Distribute remaining width proportionally among auto columns.
 * 5. If total exceeds table width, scale auto columns down (respecting minWidth).
 */
export function computeColumnWidths(input: ColumnSizingInput): readonly ResolvedColumn[] {
  const count = input.columns.length;
  if (count === 0) return [];

  const minWidths = input.columns.map((c) => c.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH);
  const maxWidths = input.columns.map((c) => c.maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH);
  const naturalWidths = input.columns.map((_, index) =>
    Math.min(
      maxWidths[index] ?? DEFAULT_MAX_COLUMN_WIDTH,
      Math.max(minWidths[index] ?? DEFAULT_MIN_COLUMN_WIDTH, contentWidthForColumn(index, input)),
    ),
  );

  const resolved = new Array<number>(count).fill(0);
  let remaining = input.tableWidth;
  const autoIndices: number[] = [];

  for (let i = 0; i < count; i++) {
    const column = input.columns[i];
    if (column === undefined) continue;
    const widthSpec = column.width;

    if (typeof widthSpec === 'number') {
      const fixed = Math.min(widthSpec, remaining);
      resolved[i] = fixed;
      remaining -= fixed;
    } else if (typeof widthSpec === 'string' && widthSpec.endsWith('%')) {
      const pct = parsePercent(widthSpec);
      const width = Math.min((input.tableWidth * pct) / 100, remaining);
      resolved[i] = width;
      remaining -= width;
    } else {
      autoIndices.push(i);
    }
  }

  if (autoIndices.length > 0) {
    const autoNaturalSum = autoIndices.reduce((sum, index) => sum + (naturalWidths[index] ?? 0), 0);
    const autoBudget = Math.max(remaining, 0);

    if (autoNaturalSum <= autoBudget) {
      for (const index of autoIndices) {
        resolved[index] = naturalWidths[index] ?? DEFAULT_MIN_COLUMN_WIDTH;
      }
      remaining = autoBudget - autoIndices.reduce((sum, index) => sum + (resolved[index] ?? 0), 0);
    } else {
      for (const index of autoIndices) {
        const share = (naturalWidths[index] ?? 0) / autoNaturalSum;
        const width = Math.max(minWidths[index] ?? DEFAULT_MIN_COLUMN_WIDTH, autoBudget * share);
        resolved[index] = Math.min(width, maxWidths[index] ?? DEFAULT_MAX_COLUMN_WIDTH);
      }
      remaining = autoBudget - autoIndices.reduce((sum, index) => sum + (resolved[index] ?? 0), 0);
    }
  }

  const total = resolved.reduce((sum, width) => sum + width, 0);
  if (total > input.tableWidth && autoIndices.length > 0) {
    const overflow = total - input.tableWidth;
    const autoTotal = autoIndices.reduce((sum, index) => sum + (resolved[index] ?? 0), 0);
    for (const index of autoIndices) {
      const current = resolved[index] ?? 0;
      const reduction = autoTotal > 0 ? (current / autoTotal) * overflow : 0;
      resolved[index] = Math.max(minWidths[index] ?? DEFAULT_MIN_COLUMN_WIDTH, current - reduction);
    }
  } else if (remaining > 0 && autoIndices.length > 0) {
    const autoTotal = autoIndices.reduce((sum, index) => sum + (resolved[index] ?? 0), 0);
    for (const index of autoIndices) {
      const current = resolved[index] ?? 0;
      const bonus = autoTotal > 0 ? (current / autoTotal) * remaining : remaining / autoIndices.length;
      resolved[index] = Math.min((maxWidths[index] ?? DEFAULT_MAX_COLUMN_WIDTH), current + bonus);
    }
  }

  return input.columns.map((column, index) => ({
    key: column.key,
    title: columnTitle(column),
    width: resolved[index] ?? DEFAULT_MIN_COLUMN_WIDTH,
    align: column.align ?? 'left',
    minWidth: minWidths[index] ?? DEFAULT_MIN_COLUMN_WIDTH,
    maxWidth: maxWidths[index] ?? DEFAULT_MAX_COLUMN_WIDTH,
  }));
}

export function buildSizingInput(
  columns: readonly ColumnDefinition[],
  rows: readonly Readonly<Record<string, unknown>>[],
  tableWidth: number,
  fontFamily: string,
  fontSize: number,
  cellPadding: number,
): ColumnSizingInput {
  return {
    columns,
    headerTitles: columns.map((column) => columnTitle(column)),
    bodyValues: rows.map((row) => columns.map((column) => String(row[column.key] ?? ''))),
    tableWidth,
    fontFamily,
    fontSize,
    cellPadding,
  };
}
