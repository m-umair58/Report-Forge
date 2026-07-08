import { cellText, columnTitle, DEFAULT_MIN_ORPHAN_ROWS } from './constants.js';
import type {
  ColumnDefinition,
  LaidOutCell,
  LaidOutRow,
  PaginateTableInput,
  PaginateTableResult,
  ResolvedColumn,
  TableDataInput,
  TableLayout,
  TableLayoutOptions,
  TableRow,
  TableStyle,
  TableTheme,
} from './types.js';
import { buildSizingInput, computeColumnWidths } from './column-sizing.js';
import { measureRows, type MeasuredRow } from './measurement.js';

interface TableSections {
  readonly headerRows: readonly TableRow[];
  readonly bodyRows: readonly TableRow[];
  readonly footerRows: readonly TableRow[];
}

function resolveStyle(theme: TableTheme, options?: TableLayoutOptions): TableStyle {
  const style = options?.style ?? {};
  return {
    ...style,
    border: style.border ?? { width: theme.borderWidth, color: theme.borderColor },
    headerBackground: style.headerBackground ?? theme.headerBackground,
    headerColor: style.headerColor ?? theme.headerColor,
    footerBackground: style.footerBackground ?? theme.footerBackground,
    alternateRowBackground: style.alternateRowBackground ?? theme.alternateRowBackground,
    cellPadding: style.cellPadding ?? theme.cellPadding,
    fontSize: style.fontSize ?? theme.fontSize,
    fontFamily: style.fontFamily ?? theme.fontFamily,
    lineHeight: style.lineHeight ?? theme.lineHeight,
  };
}

function recordToCells(
  record: Readonly<Record<string, unknown>>,
  columns: readonly ColumnDefinition[],
  kind: 'header' | 'body' | 'footer',
  sourceIndex?: number,
): TableRow {
  return {
    kind,
    ...(sourceIndex !== undefined ? { sourceIndex } : {}),
    cells: columns.map((column) => ({
      columnKey: column.key,
      content: { type: 'text' as const, value: cellText(record[column.key]) },
      ...(column.align !== undefined ? { align: column.align } : {}),
    })),
  };
}

function buildSections(input: TableDataInput): TableSections {
  const columns = input.columns;
  const headerRows =
    input.headerRows !== undefined && input.headerRows.length > 0
      ? input.headerRows.map((row, index) => recordToCells(row, columns, 'header', index))
      : [
          {
            kind: 'header' as const,
            cells: columns.map((column) => ({
              columnKey: column.key,
              content: { type: 'text' as const, value: columnTitle(column) },
              ...(column.align !== undefined ? { align: column.align } : {}),
            })),
          },
        ];

  const bodyRows = input.rows.map((row, index) => recordToCells(row, columns, 'body', index));
  const footerRows =
    input.footerRows?.map((row, index) => recordToCells(row, columns, 'footer', index)) ?? [];

  return { headerRows, bodyRows, footerRows };
}

function layoutFragmentRows(
  measuredRows: readonly MeasuredRow[],
  columns: readonly ResolvedColumn[],
  style: TableStyle,
  startY = 0,
): { rows: readonly LaidOutRow[]; height: number } {
  const laidOut: LaidOutRow[] = [];
  let y = startY;
  let bodyIndex = 0;

  for (const row of measuredRows) {
    let x = 0;
    const cells: LaidOutCell[] = [];

    for (const measuredCell of row.cells) {
      const column = columns.find((c) => c.key === measuredCell.columnKey);
      const width = column?.width ?? 0;
      const padding = measuredCell.padding;

      let backgroundColor = measuredCell.backgroundColor;
      if (row.kind === 'header') {
        backgroundColor = style.headerBackground;
      } else if (row.kind === 'footer') {
        backgroundColor = style.footerBackground;
      } else if (bodyIndex % 2 === 1 && style.alternateRowBackground !== undefined) {
        backgroundColor = style.alternateRowBackground;
      }

      cells.push({
        columnKey: measuredCell.columnKey,
        x,
        y,
        width,
        height: row.height,
        align: measuredCell.align,
        verticalAlign: measuredCell.verticalAlign,
        padding,
        ...(backgroundColor !== undefined ? { backgroundColor } : {}),
        text: {
          lines: measuredCell.lines,
          lineHeight: measuredCell.lineHeight,
        },
      });

      x += width;
    }

    if (row.kind === 'body') {
      bodyIndex += 1;
    }

    laidOut.push({
      kind: row.kind,
      y,
      height: row.height,
      cells,
      ...(row.sourceIndex !== undefined ? { sourceIndex: row.sourceIndex } : {}),
      alternateShaded: row.kind === 'body' && bodyIndex % 2 === 0,
    });

    y += row.height;
  }

  return { rows: laidOut, height: y - startY };
}

interface PageChunk {
  readonly bodyStart: number;
  readonly bodyEnd: number;
  readonly includeFooter: boolean;
  readonly repeatHeader: boolean;
}

function paginateBodyRows(
  headerHeight: number,
  bodyRows: readonly MeasuredRow[],
  footerHeight: number,
  pageHeights: readonly number[],
  repeatHeader: boolean,
  minOrphanRows: number,
): readonly PageChunk[] {
  if (bodyRows.length === 0) {
    return [{ bodyStart: 0, bodyEnd: 0, includeFooter: true, repeatHeader: false }];
  }

  const chunks: PageChunk[] = [];
  let pageIndex = 0;
  let bodyIndex = 0;

  while (bodyIndex < bodyRows.length) {
    const pageHeight = pageHeights[pageIndex] ?? pageHeights[pageHeights.length - 1] ?? 0;
    const headerCost = repeatHeader && (pageIndex > 0 || chunks.length > 0) ? headerHeight : headerHeight;
    let available = pageHeight - headerCost;
    let end = bodyIndex;

    while (end < bodyRows.length) {
      const row = bodyRows[end];
      if (row === undefined) break;

      const remainingRows = bodyRows.length - end;
      const isLastPageCandidate = end + 1 >= bodyRows.length;
      const footerCost = isLastPageCandidate ? footerHeight : 0;

      if (available - row.height - footerCost < 0 && end > bodyIndex) {
        break;
      }

      if (available - row.height - footerCost < 0 && end === bodyIndex) {
        // Single row taller than page — place anyway.
        end += 1;
        available -= row.height;
        break;
      }

      available -= row.height;
      end += 1;

      if (remainingRows === 1) {
        break;
      }
    }

    // Avoid orphan row on next page when possible.
    if (
      end < bodyRows.length &&
      bodyRows.length - end === 1 &&
      end - bodyIndex >= minOrphanRows
    ) {
      end -= 1;
    }

    if (end <= bodyIndex) {
      end = bodyIndex + 1;
    }

    const includeFooter = end >= bodyRows.length;
    chunks.push({
      bodyStart: bodyIndex,
      bodyEnd: end,
      includeFooter,
      repeatHeader: repeatHeader && pageIndex > 0,
    });

    bodyIndex = end;
    pageIndex += 1;
  }

  return chunks;
}

/**
 * Paginates and lays out a table across one or more page segments.
 */
export function paginateTable(input: PaginateTableInput): PaginateTableResult {
  const { table, tableWidth, pageHeights, theme, options } = input;
  const style = resolveStyle(theme, options);
  const repeatHeader = options?.repeatHeader ?? true;
  const minOrphanRows = options?.minOrphanRows ?? DEFAULT_MIN_ORPHAN_ROWS;

  const sections = buildSections(table);
  const sizingInput = buildSizingInput(
    table.columns,
    table.rows,
    tableWidth,
    style.fontFamily ?? theme.fontFamily,
    style.fontSize ?? theme.fontSize,
    typeof style.cellPadding === 'number' ? style.cellPadding : theme.cellPadding,
  );
  const columns = computeColumnWidths(sizingInput);

  const measuredHeader = measureRows(sections.headerRows, columns, theme, style);
  const measuredBody = measureRows(sections.bodyRows, columns, theme, style);
  const measuredFooter = measureRows(sections.footerRows, columns, theme, style);

  const headerHeight = measuredHeader.reduce((sum, row) => sum + row.height, 0);
  const footerHeight = measuredFooter.reduce((sum, row) => sum + row.height, 0);

  const chunks = paginateBodyRows(
    headerHeight,
    measuredBody,
    footerHeight,
    pageHeights,
    repeatHeader,
    minOrphanRows,
  );

  const fragments: TableLayout[] = [];
  let totalHeight = 0;

  for (let fragmentIndex = 0; fragmentIndex < chunks.length; fragmentIndex++) {
    const chunk = chunks[fragmentIndex];
    if (chunk === undefined) continue;

    const fragmentRows: MeasuredRow[] = [];
    if (fragmentIndex === 0 || (repeatHeader && chunk.repeatHeader)) {
      fragmentRows.push(...measuredHeader);
    }
    fragmentRows.push(...measuredBody.slice(chunk.bodyStart, chunk.bodyEnd));
    if (chunk.includeFooter) {
      fragmentRows.push(...measuredFooter);
    }

    const { rows, height } = layoutFragmentRows(fragmentRows, columns, style);
    totalHeight += height;

    fragments.push({
      columns,
      rows,
      width: tableWidth,
      height,
      style: {
        ...style,
        border: style.border ?? { width: theme.borderWidth, color: theme.borderColor },
      },
      fragmentIndex,
      totalFragments: chunks.length,
      repeatHeader: chunk.repeatHeader,
      bodyStartIndex: chunk.bodyStart,
      bodyEndIndex: chunk.bodyEnd,
    });
  }

  return { fragments, totalHeight };
}

/** Estimates total table height for a single page (no splitting). */
export function estimateTableHeight(
  input: TableDataInput,
  tableWidth: number,
  theme: TableTheme,
  options?: TableLayoutOptions,
): number {
  const style = resolveStyle(theme, options);
  const sections = buildSections(input);
  const sizingInput = buildSizingInput(
    input.columns,
    input.rows,
    tableWidth,
    style.fontFamily ?? theme.fontFamily,
    style.fontSize ?? theme.fontSize,
    typeof style.cellPadding === 'number' ? style.cellPadding : theme.cellPadding,
  );
  const columns = computeColumnWidths(sizingInput);
  const header = measureRows(sections.headerRows, columns, theme, style);
  const body = measureRows(sections.bodyRows, columns, theme, style);
  const footer = measureRows(sections.footerRows, columns, theme, style);
  return (
    header.reduce((sum, row) => sum + row.height, 0) +
    body.reduce((sum, row) => sum + row.height, 0) +
    footer.reduce((sum, row) => sum + row.height, 0)
  );
}

export { buildSections, recordToCells };
