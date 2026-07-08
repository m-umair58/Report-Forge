/**
 * @reportforge/table
 *
 * Renderer-independent table engine for ReportForge.
 *
 * Provides column sizing, row measurement, pagination, and layout data
 * consumed by the layout engine and renderers.
 */

export {
  DEFAULT_BORDER_WIDTH,
  DEFAULT_CELL_PADDING,
  DEFAULT_MIN_COLUMN_WIDTH,
  DEFAULT_TABLE_THEME,
  cellText,
  columnTitle,
  normalizeInsets,
} from './constants.js';

export { buildSizingInput, computeColumnWidths } from './column-sizing.js';
export { measureRows, sumRowHeights } from './measurement.js';
export type { MeasuredCell, MeasuredRow } from './measurement.js';
export { estimateTableHeight, paginateTable, buildSections, recordToCells } from './pagination.js';
export { validateTableData } from './validation.js';

export type {
  CellAlign,
  CellVerticalAlign,
  ColumnDefinition,
  ColumnWidth,
  LaidOutCell,
  LaidOutCellText,
  LaidOutRow,
  PaginateTableInput,
  PaginateTableResult,
  ResolvedColumn,
  TableBody,
  TableCell,
  TableCellContent,
  TableDataInput,
  TableFooter,
  TableHeader,
  TableInsets,
  TableLayout,
  TableLayoutOptions,
  TableRow,
  TableStyle,
  TableTheme,
  TableValidationIssue,
  TableValidationResult,
} from './types.js';

export const PACKAGE_NAME = '@reportforge/table' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
