import type { IReportNode, ITheme } from '@reportforge/shared';
import { estimateTableHeight, paginateTable, type TableDataInput, type TableLayout } from '@reportforge/table';

import { ZERO_BOX_MODEL } from './box.js';
import type { LayoutNode } from './types.js';
import type { PageModel } from './page.js';
import { themeToTableTheme } from './table-theme.js';

interface TableLayoutState {
  readonly cursor: { pageNumber: number; y: number };
  readonly pageElements: Map<number, LayoutNode[]>;
  readonly pageModel: PageModel;
  readonly availableContentHeight: number;
  readonly headerHeight: number;
  readonly interElementSpacing: number;
  readonly theme: ITheme;
}

function parseTableProps(props: Readonly<Record<string, unknown>>): TableDataInput {
  const columns = Array.isArray(props['columns']) ? (props['columns'] as TableDataInput['columns']) : [];
  const rows = Array.isArray(props['rows']) ? (props['rows'] as TableDataInput['rows']) : [];
  const headerRows = Array.isArray(props['headerRows'])
    ? (props['headerRows'] as TableDataInput['headerRows'])
    : undefined;
  const footerRows = Array.isArray(props['footerRows'])
    ? (props['footerRows'] as TableDataInput['footerRows'])
    : undefined;

  return { columns, rows, headerRows, footerRows };
}

function serializeLayout(layout: TableLayout): Record<string, unknown> {
  return JSON.parse(JSON.stringify(layout)) as Record<string, unknown>;
}

function absoluteY(state: TableLayoutState): number {
  return state.pageModel.marginTop + state.headerHeight + state.cursor.y;
}

function advancePage(state: TableLayoutState): void {
  state.cursor.pageNumber += 1;
  state.cursor.y = 0;
  if (!state.pageElements.has(state.cursor.pageNumber)) {
    state.pageElements.set(state.cursor.pageNumber, []);
  }
}

function addToPage(state: TableLayoutState, node: LayoutNode): void {
  if (!state.pageElements.has(node.pageNumber)) {
    state.pageElements.set(node.pageNumber, []);
  }
  state.pageElements.get(node.pageNumber)?.push(node);
}

/**
 * Lays out a table with pagination and repeated headers.
 * Returns one layout node per page fragment.
 */
export function layoutTableNode(node: IReportNode, state: TableLayoutState): LayoutNode[] {
  const { pageModel, cursor, interElementSpacing, theme, availableContentHeight } = state;
  const tableData = parseTableProps(node.props);
  const tableTheme = themeToTableTheme(theme);
  const tableWidth = pageModel.contentWidth;
  const repeatHeader = node.props['repeatHeader'] !== false;

  const remainingOnPage = availableContentHeight - cursor.y;
  const firstPageHeight = remainingOnPage > 0 ? remainingOnPage : availableContentHeight;

  const pageHeights: number[] = [firstPageHeight];
  const totalEstimate = estimateTableHeight(tableData, tableWidth, tableTheme, {
    repeatHeader,
    style: node.props['tableStyle'] as never,
  });

  if (totalEstimate > firstPageHeight) {
    const extraPages = Math.ceil((totalEstimate - firstPageHeight) / availableContentHeight);
    for (let i = 0; i < extraPages; i++) {
      pageHeights.push(availableContentHeight);
    }
  }

  const { fragments } = paginateTable({
    table: tableData,
    tableWidth,
    pageHeights,
    theme: tableTheme,
    options: {
      repeatHeader,
      style: node.props['tableStyle'] as never,
    },
  });

  const nodes: LayoutNode[] = [];

  for (let index = 0; index < fragments.length; index++) {
    const fragment = fragments[index];
    if (fragment === undefined) continue;

    if (index > 0) {
      advancePage(state);
    } else if (cursor.y + fragment.height > availableContentHeight && cursor.y > 0) {
      advancePage(state);
    }

    const layoutNode: LayoutNode = {
      id: fragments.length > 1 ? `${node.id}-frag-${index.toString()}` : node.id,
      type: 'table',
      pageNumber: cursor.pageNumber,
      x: pageModel.marginLeft,
      y: absoluteY(state),
      width: tableWidth,
      height: fragment.height,
      box: ZERO_BOX_MODEL,
      props: {
        columns: node.props['columns'],
        tableLayout: serializeLayout(fragment),
        fragmentIndex: fragment.fragmentIndex,
        totalFragments: fragment.totalFragments,
        repeatHeader,
      },
      style: node.style ?? {},
      children: [],
    };

    addToPage(state, layoutNode);
    cursor.y += fragment.height + interElementSpacing;
    nodes.push(layoutNode);
  }

  return nodes;
}

export type { TableLayoutState };
