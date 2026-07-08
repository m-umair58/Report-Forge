import { createBuiltInMetrics, LineBreaker } from '@reportforge/typography';

import { normalizeInsets } from './constants.js';
import type {
  ResolvedColumn,
  TableCell,
  TableInsets,
  TableRow,
  TableStyle,
  TableTheme,
} from './types.js';

const lineBreaker = new LineBreaker();

export interface MeasuredRow {
  readonly kind: 'header' | 'body' | 'footer';
  readonly height: number;
  readonly cells: readonly MeasuredCell[];
  readonly sourceIndex?: number;
}

export interface MeasuredCell {
  readonly columnKey: string;
  readonly lines: readonly string[];
  readonly lineHeight: number;
  readonly align: 'left' | 'center' | 'right';
  readonly verticalAlign: 'top' | 'middle' | 'bottom';
  readonly padding: TableInsets;
  readonly backgroundColor?: string;
}

function wrapText(
  text: string,
  maxWidth: number,
  fontFamily: string,
  fontSize: number,
  bold: boolean,
): readonly string[] {
  if (maxWidth <= 0) return [text];
  const metrics = createBuiltInMetrics(fontFamily, bold ? 'bold' : 'normal');
  const lines = lineBreaker.breakText(text, metrics, fontSize, 0, maxWidth);
  return lines.map((line) => line.text);
}

function measureCell(
  cell: TableCell,
  column: ResolvedColumn,
  theme: TableTheme,
  style: TableStyle,
  bold: boolean,
): MeasuredCell {
  const padding = normalizeInsets(cell.padding ?? style.cellPadding, theme.cellPadding);
  const innerWidth = Math.max(1, column.width - padding.left - padding.right);
  const fontSize = style.fontSize ?? theme.fontSize;
  const fontFamily = style.fontFamily ?? theme.fontFamily;
  const lineHeightMultiplier = style.lineHeight ?? theme.lineHeight;
  const lineHeight = fontSize * lineHeightMultiplier;
  const lines = wrapText(cell.content.value, innerWidth, fontFamily, fontSize, bold);

  return {
    columnKey: cell.columnKey,
    lines,
    lineHeight,
    align: cell.align ?? column.align,
    verticalAlign: cell.verticalAlign ?? 'middle',
    padding,
    ...(cell.backgroundColor !== undefined ? { backgroundColor: cell.backgroundColor } : {}),
  };
}

function computeRowHeight(cells: readonly MeasuredCell[]): number {
  let maxInner = 0;
  for (const cell of cells) {
    const innerHeight = cell.lines.length * cell.lineHeight;
    maxInner = Math.max(maxInner, innerHeight + cell.padding.top + cell.padding.bottom);
  }
  return maxInner;
}

/**
 * Measures row heights from resolved columns and cell content.
 */
export function measureRows(
  rows: readonly TableRow[],
  columns: readonly ResolvedColumn[],
  theme: TableTheme,
  style: TableStyle = {},
): readonly MeasuredRow[] {
  const columnMap = new Map(columns.map((column) => [column.key, column]));

  return rows.map((row) => {
    const bold = row.kind === 'header' || style.headerFontWeight === 'bold';
    const cells = row.cells.map((cell) => {
      const column = columnMap.get(cell.columnKey);
      if (column === undefined) {
        return {
          columnKey: cell.columnKey,
          lines: [''],
          lineHeight: (style.fontSize ?? theme.fontSize) * (style.lineHeight ?? theme.lineHeight),
          align: 'left' as const,
          verticalAlign: 'middle' as const,
          padding: normalizeInsets(style.cellPadding, theme.cellPadding),
        };
      }
      return measureCell(cell, column, theme, style, bold);
    });

    return {
      kind: row.kind,
      height: computeRowHeight(cells),
      cells,
      ...(row.sourceIndex !== undefined ? { sourceIndex: row.sourceIndex } : {}),
    };
  });
}

export function sumRowHeights(rows: readonly MeasuredRow[]): number {
  return rows.reduce((sum, row) => sum + row.height, 0);
}
