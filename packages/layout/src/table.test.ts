import { describe, expect, it } from 'vitest';

import type { IReportNode, ReportSchema } from '@reportforge/shared';

import { LayoutEngine } from './engine.js';

function makeSchema(children: IReportNode[]): ReportSchema {
  return {
    version: '1.0.0',
    metadata: {},
    root: { id: 'root', type: 'report', props: {}, children },
  };
}

function makeTable(id: string, rowCount: number): IReportNode {
  const rows = Array.from({ length: rowCount }, (_, index) => ({
    name: `Item ${index.toString()}`,
    qty: String(index),
  }));

  return {
    id,
    type: 'table',
    props: {
      columns: [
        { key: 'name', title: 'Name' },
        { key: 'qty', title: 'Qty', align: 'right' },
      ],
      rows,
    },
    children: [],
  };
}

describe('table pagination', () => {
  const engine = new LayoutEngine();

  it('splits large tables across multiple pages', () => {
    const result = engine.layout(makeSchema([makeTable('tbl1', 60)]));
    const tableElements = result.pages.flatMap((page) =>
      page.elements.filter((element) => element.type === 'table'),
    );

    expect(tableElements.length).toBeGreaterThan(1);
    expect(tableElements.every((element) => element.props['tableLayout'] !== undefined)).toBe(true);
  });

  it('keeps consistent column widths across fragments', () => {
    const rows = Array.from({ length: 50 }, (_, index) => ({
      a: `A${index.toString()}`,
      b: `B${index.toString()}`,
    }));

    const result = engine.layout(
      makeSchema([
        {
          id: 'tbl2',
          type: 'table',
          props: {
            columns: [
              { key: 'a', title: 'Column A', width: 120 },
              { key: 'b', title: 'Column B', width: 'auto' },
            ],
            rows,
          },
          children: [],
        },
      ]),
    );

    const layouts = result.pages
      .flatMap((page) => page.elements.filter((element) => element.type === 'table'))
      .map((element) => element.props['tableLayout'] as { columns: { width: number }[] });

    const firstWidth = layouts[0]?.columns[0]?.width;
    expect(layouts.every((layout) => layout.columns[0]?.width === firstWidth)).toBe(true);
  });
});
