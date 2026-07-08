import type { TableInsets, TableTheme } from './types.js';

/** Default horizontal padding inside cells (points). */
export const DEFAULT_CELL_PADDING = 6;

/** Minimum column width when unspecified (points). */
export const DEFAULT_MIN_COLUMN_WIDTH = 24;

/** Maximum auto column width cap (points). */
export const DEFAULT_MAX_COLUMN_WIDTH = 480;

/** Minimum rows to keep together when avoiding orphans. */
export const DEFAULT_MIN_ORPHAN_ROWS = 2;

/** Border width used when drawing table grid lines. */
export const DEFAULT_BORDER_WIDTH = 0.5;

export const DEFAULT_TABLE_THEME: TableTheme = {
  fontFamily: 'Helvetica',
  fontSize: 10,
  lineHeight: 1.2,
  borderWidth: DEFAULT_BORDER_WIDTH,
  borderColor: '#cccccc',
  textColor: '#1a1a1a',
  headerBackground: '#f0f0f0',
  headerColor: '#1a1a1a',
  footerBackground: '#f5f5f5',
  alternateRowBackground: '#fafafa',
  cellPadding: DEFAULT_CELL_PADDING,
};

export function normalizeInsets(value: number | TableInsets | undefined, fallback: number): TableInsets {
  if (value === undefined) {
    return { top: fallback, right: fallback, bottom: fallback, left: fallback };
  }
  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value };
  }
  return value;
}

export function columnTitle(column: { readonly title?: string; readonly label?: string; readonly key: string }): string {
  const title = column.title ?? column.label;
  return title !== undefined && title.length > 0 ? title : column.key;
}

export function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}
