import { describe, expect, it } from 'vitest';

import type { IReportNode, ReportSchema } from '@reportforge/shared';

import {
  DEFAULT_LAYOUT_THEME,
  LayoutEngine,
  LayoutError,
  PAGE_DIMENSIONS,
  PT_PER_CM,
  PT_PER_INCH,
  PT_PER_MM,
  PT_PER_PX,
  ZERO_BOX_MODEL,
  ZERO_EDGE_INSETS,
  cmToPt,
  createPageModel,
  edgeInsets,
  estimateNodeHeight,
  estimateParagraphHeight,
  getPageDimensions,
  horizontalExtent,
  inToPt,
  mmToPt,
  ptToCm,
  ptToIn,
  ptToMm,
  ptToPx,
  pxToPt,
  totalHorizontalInsets,
  totalVerticalInsets,
  uniformEdgeInsets,
  verticalExtent,
} from './index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSchema(children: IReportNode[]): ReportSchema {
  return {
    version: '1.0.0',
    metadata: {},
    root: {
      id: 'root',
      type: 'report',
      props: {},
      children,
    },
  };
}

function makeNode(
  id: string,
  type: string,
  props: Record<string, unknown> = {},
  children: IReportNode[] = [],
): IReportNode {
  return { id, type, props, children };
}

function makeTitle(id: string, text = 'Title'): IReportNode {
  return makeNode(id, 'title', { text });
}

function makeParagraph(id: string, text = 'Some text here.'): IReportNode {
  return makeNode(id, 'paragraph', { text });
}

function makeDivider(id: string): IReportNode {
  return makeNode(id, 'divider', {});
}

function makeSection(id: string, children: IReportNode[]): IReportNode {
  return makeNode(id, 'section', { label: 'Section' }, children);
}

function makeHeader(id: string, children: IReportNode[]): IReportNode {
  return makeNode(id, 'header', {}, children);
}

function makeFooter(id: string, children: IReportNode[]): IReportNode {
  return makeNode(id, 'footer', {}, children);
}

// ─── Unit conversions ─────────────────────────────────────────────────────────

describe('unit conversion constants', () => {
  it('PT_PER_INCH is 72', () => {
    expect(PT_PER_INCH).toBe(72);
  });

  it('PT_PER_MM is 72/25.4', () => {
    expect(PT_PER_MM).toBeCloseTo(72 / 25.4, 10);
  });

  it('PT_PER_CM is 72/2.54', () => {
    expect(PT_PER_CM).toBeCloseTo(72 / 2.54, 10);
  });

  it('PT_PER_PX is 0.75', () => {
    expect(PT_PER_PX).toBeCloseTo(0.75, 10);
  });
});

describe('mmToPt', () => {
  it('25.4mm equals 72pt (1 inch)', () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 5);
  });

  it('0mm equals 0pt', () => {
    expect(mmToPt(0)).toBe(0);
  });

  it('210mm equals A4 portrait width', () => {
    expect(mmToPt(210)).toBeCloseTo(PAGE_DIMENSIONS['A4'].width, 2);
  });
});

describe('cmToPt', () => {
  it('2.54cm equals 72pt (1 inch)', () => {
    expect(cmToPt(2.54)).toBeCloseTo(72, 5);
  });

  it('0cm equals 0pt', () => {
    expect(cmToPt(0)).toBe(0);
  });
});

describe('inToPt', () => {
  it('1 inch equals 72pt', () => {
    expect(inToPt(1)).toBe(72);
  });

  it('8.5 inches equals Letter page width', () => {
    expect(inToPt(8.5)).toBeCloseTo(PAGE_DIMENSIONS['Letter'].width, 5);
  });
});

describe('pxToPt', () => {
  it('96px equals 72pt at 96 DPI', () => {
    expect(pxToPt(96)).toBeCloseTo(72, 5);
  });
});

describe('inverse conversions', () => {
  it('ptToMm round-trips with mmToPt', () => {
    expect(ptToMm(mmToPt(100))).toBeCloseTo(100, 8);
  });

  it('ptToCm round-trips with cmToPt', () => {
    expect(ptToCm(cmToPt(10))).toBeCloseTo(10, 8);
  });

  it('ptToIn round-trips with inToPt', () => {
    expect(ptToIn(inToPt(5))).toBeCloseTo(5, 8);
  });

  it('ptToPx round-trips with pxToPt', () => {
    expect(ptToPx(pxToPt(200))).toBeCloseTo(200, 8);
  });
});

// ─── Box model ────────────────────────────────────────────────────────────────

describe('ZERO_EDGE_INSETS', () => {
  it('has zero on all sides', () => {
    expect(ZERO_EDGE_INSETS.top).toBe(0);
    expect(ZERO_EDGE_INSETS.right).toBe(0);
    expect(ZERO_EDGE_INSETS.bottom).toBe(0);
    expect(ZERO_EDGE_INSETS.left).toBe(0);
  });
});

describe('ZERO_BOX_MODEL', () => {
  it('has zero margin and padding', () => {
    expect(ZERO_BOX_MODEL.margin.top).toBe(0);
    expect(ZERO_BOX_MODEL.padding.top).toBe(0);
  });
});

describe('uniformEdgeInsets', () => {
  it('creates equal values on all sides', () => {
    const inset = uniformEdgeInsets(12);
    expect(inset).toEqual({ top: 12, right: 12, bottom: 12, left: 12 });
  });
});

describe('edgeInsets', () => {
  it('creates distinct values in top-right-bottom-left order', () => {
    const inset = edgeInsets(1, 2, 3, 4);
    expect(inset).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
  });
});

describe('horizontalExtent', () => {
  it('sums left and right', () => {
    const inset = edgeInsets(0, 10, 0, 5);
    expect(horizontalExtent(inset)).toBe(15);
  });
});

describe('verticalExtent', () => {
  it('sums top and bottom', () => {
    const inset = edgeInsets(8, 0, 4, 0);
    expect(verticalExtent(inset)).toBe(12);
  });
});

describe('totalHorizontalInsets', () => {
  it('sums margin and padding horizontal extents', () => {
    const box = {
      margin: edgeInsets(0, 10, 0, 10),
      padding: edgeInsets(0, 5, 0, 5),
    };
    expect(totalHorizontalInsets(box)).toBe(30);
  });
});

describe('totalVerticalInsets', () => {
  it('sums margin and padding vertical extents', () => {
    const box = {
      margin: edgeInsets(8, 0, 8, 0),
      padding: edgeInsets(4, 0, 4, 0),
    };
    expect(totalVerticalInsets(box)).toBe(24);
  });
});

// ─── Page model ───────────────────────────────────────────────────────────────

describe('PAGE_DIMENSIONS', () => {
  it('A4 portrait: 210mm × 297mm', () => {
    const { width, height } = PAGE_DIMENSIONS['A4'];
    expect(width).toBeCloseTo(mmToPt(210), 1);
    expect(height).toBeCloseTo(mmToPt(297), 1);
  });

  it('Letter portrait: 8.5in × 11in', () => {
    const { width, height } = PAGE_DIMENSIONS['Letter'];
    expect(width).toBeCloseTo(inToPt(8.5), 5);
    expect(height).toBeCloseTo(inToPt(11), 5);
  });

  it('Legal portrait: 8.5in × 14in', () => {
    const { width, height } = PAGE_DIMENSIONS['Legal'];
    expect(width).toBeCloseTo(inToPt(8.5), 5);
    expect(height).toBeCloseTo(inToPt(14), 5);
  });

  it('A3 portrait: 297mm × 420mm', () => {
    const { width, height } = PAGE_DIMENSIONS['A3'];
    expect(width).toBeCloseTo(mmToPt(297), 1);
    expect(height).toBeCloseTo(mmToPt(420), 1);
  });
});

describe('getPageDimensions', () => {
  it('portrait returns the named dimensions directly', () => {
    const dims = getPageDimensions('A4', 'portrait');
    expect(dims).toEqual(PAGE_DIMENSIONS['A4']);
  });

  it('landscape swaps width and height', () => {
    const portrait = PAGE_DIMENSIONS['A4'];
    const landscape = getPageDimensions('A4', 'landscape');
    expect(landscape.width).toBeCloseTo(portrait.height, 5);
    expect(landscape.height).toBeCloseTo(portrait.width, 5);
  });

  it('unknown size falls back to A4', () => {
    const dims = getPageDimensions('Custom1234', 'portrait');
    expect(dims).toEqual(PAGE_DIMENSIONS['A4']);
  });

  it('Letter landscape swaps width and height', () => {
    const portrait = PAGE_DIMENSIONS['Letter'];
    const landscape = getPageDimensions('Letter', 'landscape');
    expect(landscape.width).toBeCloseTo(portrait.height, 5);
    expect(landscape.height).toBeCloseTo(portrait.width, 5);
  });
});

describe('createPageModel', () => {
  it('produces correct content area for A4 with 1-inch margins', () => {
    const model = createPageModel({}, DEFAULT_LAYOUT_THEME);

    const expectedWidth = mmToPt(210) - inToPt(1) - inToPt(1);
    const expectedHeight = mmToPt(297) - inToPt(1) - inToPt(1);

    expect(model.pageWidth).toBeCloseTo(mmToPt(210), 1);
    expect(model.pageHeight).toBeCloseTo(mmToPt(297), 1);
    expect(model.contentWidth).toBeCloseTo(expectedWidth, 1);
    expect(model.contentHeight).toBeCloseTo(expectedHeight, 1);
    expect(model.marginTop).toBe(inToPt(1));
    expect(model.marginBottom).toBe(inToPt(1));
    expect(model.marginLeft).toBe(inToPt(1));
    expect(model.marginRight).toBe(inToPt(1));
  });

  it('respects pageSize override from metadata', () => {
    const model = createPageModel({ pageSize: 'Letter' }, DEFAULT_LAYOUT_THEME);
    expect(model.pageWidth).toBeCloseTo(inToPt(8.5), 5);
    expect(model.pageHeight).toBeCloseTo(inToPt(11), 5);
  });

  it('respects landscape orientation from metadata', () => {
    const portrait = createPageModel({ pageSize: 'A4' }, DEFAULT_LAYOUT_THEME);
    const landscape = createPageModel(
      { pageSize: 'A4', orientation: 'landscape' },
      DEFAULT_LAYOUT_THEME,
    );
    expect(landscape.pageWidth).toBeCloseTo(portrait.pageHeight, 1);
    expect(landscape.pageHeight).toBeCloseTo(portrait.pageWidth, 1);
  });
});

// ─── Height estimators ────────────────────────────────────────────────────────

describe('estimateNodeHeight', () => {
  const theme = DEFAULT_LAYOUT_THEME;
  const contentWidth = inToPt(6); // ~432pt, narrower content width for tests

  it('title: fontSizeTitle × lineHeight', () => {
    const node = makeTitle('t1');
    const expected = theme.tokens.typography.fontSizeTitle * theme.tokens.typography.lineHeight;
    expect(estimateNodeHeight(node, contentWidth, theme)).toBeCloseTo(expected, 5);
  });

  it('subtitle: fontSizeSubtitle × lineHeight', () => {
    const node = makeNode('s1', 'subtitle', { text: 'Sub' });
    const expected = theme.tokens.typography.fontSizeSubtitle * theme.tokens.typography.lineHeight;
    expect(estimateNodeHeight(node, contentWidth, theme)).toBeCloseTo(expected, 5);
  });

  it('divider: 2pt', () => {
    const node = makeDivider('d1');
    expect(estimateNodeHeight(node, contentWidth, theme)).toBe(2);
  });

  it('empty paragraph: one line height', () => {
    const node = makeNode('p1', 'paragraph', { text: '' });
    const expected = theme.tokens.typography.fontSize * theme.tokens.typography.lineHeight;
    expect(estimateNodeHeight(node, contentWidth, theme)).toBeCloseTo(expected, 5);
  });

  it('long paragraph: multiple lines', () => {
    const text = 'A'.repeat(500);
    const node = makeNode('p2', 'paragraph', { text });
    const singleLine = theme.tokens.typography.fontSize * theme.tokens.typography.lineHeight;
    const height = estimateNodeHeight(node, contentWidth, theme);
    expect(height).toBeGreaterThan(singleLine);
  });

  it('table with 0 rows: header row only', () => {
    const node = makeNode('tbl1', 'table', {
      columns: [{ key: 'col', title: 'Column' }],
      rows: [],
    });
    const height = estimateNodeHeight(node, contentWidth, theme);
    expect(height).toBeGreaterThan(0);
  });

  it('table with 5 rows: header + 5 data rows', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ col: String(i) }));
    const node = makeNode('tbl2', 'table', {
      columns: [{ key: 'col', title: 'Column' }],
      rows,
    });
    const height = estimateNodeHeight(node, contentWidth, theme);
    expect(height).toBeGreaterThan(estimateNodeHeight(
      makeNode('tbl0', 'table', { columns: [{ key: 'col', title: 'Column' }], rows: [] }),
      contentWidth,
      theme,
    ));
  });

  it('image: 100pt placeholder', () => {
    const node = makeNode('img1', 'image', { src: 'logo.png' });
    expect(estimateNodeHeight(node, contentWidth, theme)).toBe(100);
  });

  it('chart: default height from chart engine', () => {
    const node = makeNode('ch1', 'chart', { type: 'bar', data: [{ month: 'Jan', value: 1 }], legend: 'hidden' });
    expect(estimateNodeHeight(node, contentWidth, theme)).toBe(240);
  });

  it('summary-card: 60pt placeholder', () => {
    const node = makeNode('sc1', 'summary-card', { label: 'Revenue', value: '$1M' });
    expect(estimateNodeHeight(node, contentWidth, theme)).toBe(60);
  });

  it('qr-code: 72pt placeholder', () => {
    const node = makeNode('qr1', 'qr-code', { value: 'https://example.com' });
    expect(estimateNodeHeight(node, contentWidth, theme)).toBe(72);
  });

  it('barcode: 48pt placeholder', () => {
    const node = makeNode('bc1', 'barcode', { value: '123456789012' });
    expect(estimateNodeHeight(node, contentWidth, theme)).toBe(48);
  });

  it('section: at least spacing.section pt', () => {
    const node = makeSection('sec1', []);
    const height = estimateNodeHeight(node, contentWidth, theme);
    expect(height).toBeGreaterThanOrEqual(theme.tokens.spacing.section);
  });

  it('section with children: taller than section alone', () => {
    const section = makeSection('sec2', [makeTitle('t1'), makeParagraph('p1')]);
    const empty = makeSection('sec3', []);
    const heightWithChildren = estimateNodeHeight(section, contentWidth, theme);
    const heightEmpty = estimateNodeHeight(empty, contentWidth, theme);
    expect(heightWithChildren).toBeGreaterThan(heightEmpty);
  });

  it('unknown type: falls back to one text line', () => {
    const node = makeNode('u1', 'custom-widget', {});
    const expected = theme.tokens.typography.fontSize * theme.tokens.typography.lineHeight;
    expect(estimateNodeHeight(node, contentWidth, theme)).toBeCloseTo(expected, 5);
  });
});

describe('estimateParagraphHeight', () => {
  it('empty text returns one line', () => {
    expect(estimateParagraphHeight('', 400, 12, 1.2)).toBeCloseTo(12 * 1.2, 5);
  });

  it('very wide content puts all chars on one line', () => {
    // 100 chars, 10000pt width → 1 line
    const text = 'A'.repeat(100);
    expect(estimateParagraphHeight(text, 10000, 12, 1.2)).toBeCloseTo(12 * 1.2, 5);
  });

  it('narrow width causes more lines', () => {
    const text = 'A'.repeat(100);
    const wide = estimateParagraphHeight(text, 1000, 12, 1.2);
    const narrow = estimateParagraphHeight(text, 100, 12, 1.2);
    expect(narrow).toBeGreaterThan(wide);
  });
});

// ─── LayoutEngine ─────────────────────────────────────────────────────────────

describe('LayoutEngine', () => {
  const engine = new LayoutEngine();

  describe('single page — basic structure', () => {
    it('an empty report produces one page with no content elements', () => {
      const schema = makeSchema([]);
      const result = engine.layout(schema);

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0]?.pageNumber).toBe(1);
      expect(result.pages[0]?.elements).toHaveLength(0);
    });

    it('page dimensions match A4 portrait by default', () => {
      const schema = makeSchema([]);
      const result = engine.layout(schema);

      expect(result.pages[0]?.width).toBeCloseTo(mmToPt(210), 1);
      expect(result.pages[0]?.height).toBeCloseTo(mmToPt(297), 1);
    });

    it('page dimensions match Letter when specified in metadata', () => {
      const schema = { ...makeSchema([]), metadata: { pageSize: 'Letter' } };
      const result = engine.layout(schema);

      expect(result.pages[0]?.width).toBeCloseTo(inToPt(8.5), 5);
      expect(result.pages[0]?.height).toBeCloseTo(inToPt(11), 5);
    });

    it('landscape orientation swaps page width and height', () => {
      const schema = {
        ...makeSchema([]),
        metadata: { pageSize: 'A4', orientation: 'landscape' as const },
      };
      const result = engine.layout(schema);
      const page = result.pages[0];

      // Landscape A4: width > height
      expect(page?.width).toBeGreaterThan(page?.height ?? 0);
    });

    it('single title node produces one element', () => {
      const schema = makeSchema([makeTitle('t1', 'Hello')]);
      const result = engine.layout(schema);

      expect(result.pages[0]?.elements).toHaveLength(1);
      const element = result.pages[0]?.elements[0];
      expect(element?.type).toBe('title');
      expect(element?.nodeId).toBe('t1');
    });

    it('result.nodes contains top-level layout nodes', () => {
      const schema = makeSchema([makeTitle('t1'), makeParagraph('p1')]);
      const result = engine.layout(schema);
      expect(result.nodes).toHaveLength(2);
    });
  });

  describe('element positioning', () => {
    it('title x-coordinate equals left margin', () => {
      const schema = makeSchema([makeTitle('t1')]);
      const result = engine.layout(schema);
      const element = result.pages[0]?.elements[0];

      expect(element?.x).toBeCloseTo(inToPt(1), 5); // 72pt left margin
    });

    it('title y-coordinate equals top margin (no header)', () => {
      const schema = makeSchema([makeTitle('t1')]);
      const result = engine.layout(schema);
      const element = result.pages[0]?.elements[0];

      expect(element?.y).toBeCloseTo(inToPt(1), 5); // 72pt top margin
    });

    it('second element is positioned below first', () => {
      const schema = makeSchema([makeTitle('t1'), makeParagraph('p1')]);
      const result = engine.layout(schema);

      const title = result.pages[0]?.elements[0];
      const para = result.pages[0]?.elements[1];

      expect(para?.y).toBeGreaterThan(title?.y ?? 0);
    });

    it('element width equals content width', () => {
      const schema = makeSchema([makeTitle('t1')]);
      const model = createPageModel({}, DEFAULT_LAYOUT_THEME);
      const result = engine.layout(schema);

      expect(result.pages[0]?.elements[0]?.width).toBeCloseTo(model.contentWidth, 1);
    });

    it('element has positive height', () => {
      const schema = makeSchema([makeDivider('d1')]);
      const result = engine.layout(schema);

      expect(result.pages[0]?.elements[0]?.height).toBeGreaterThan(0);
    });

    it('elements stack vertically in document order', () => {
      const schema = makeSchema([makeTitle('t1'), makeParagraph('p1'), makeDivider('d1')]);
      const result = engine.layout(schema);
      const elems = result.pages[0]?.elements ?? [];

      expect(elems).toHaveLength(3);
      expect(elems[0]?.y).toBeLessThan(elems[1]?.y ?? Infinity);
      expect(elems[1]?.y).toBeLessThan(elems[2]?.y ?? Infinity);
    });
  });

  describe('pagination', () => {
    it('many titles overflow to a second page', () => {
      // A4 content height ≈ 697pt, title height ≈ 28.8pt + 10pt spacing = 38.8pt
      // 697 / 38.8 ≈ 18 per page — use 25 to guarantee page 2
      const titles = Array.from({ length: 25 }, (_, i) =>
        makeTitle(`t${i.toString()}`, `Title ${i.toString()}`),
      );
      const schema = makeSchema(titles);
      const result = engine.layout(schema);

      expect(result.pages.length).toBeGreaterThan(1);
    });

    it('page 2 elements have pageNumber 2', () => {
      const titles = Array.from({ length: 25 }, (_, i) =>
        makeTitle(`t${i.toString()}`, `Title ${i.toString()}`),
      );
      const schema = makeSchema(titles);
      const result = engine.layout(schema);
      const page2 = result.pages[1];

      expect(page2?.pageNumber).toBe(2);
      expect(page2?.elements.length).toBeGreaterThan(0);
    });

    it('all pages have the same page dimensions', () => {
      const titles = Array.from({ length: 30 }, (_, i) => makeTitle(`t${i.toString()}`));
      const schema = makeSchema(titles);
      const result = engine.layout(schema);

      const firstPage = result.pages[0];
      for (const page of result.pages) {
        expect(page.width).toBeCloseTo(firstPage?.width ?? 0, 1);
        expect(page.height).toBeCloseTo(firstPage?.height ?? 0, 1);
      }
    });

    it('first element on page 2 has y near the top margin', () => {
      const titles = Array.from({ length: 25 }, (_, i) => makeTitle(`t${i.toString()}`));
      const schema = makeSchema(titles);
      const result = engine.layout(schema);

      const firstOnPage2 = result.pages[1]?.elements[0];
      // y should be close to marginTop (72pt), not a huge offset
      expect(firstOnPage2?.y).toBeCloseTo(inToPt(1), 5);
    });
  });

  describe('header and footer repetition', () => {
    it('header appears on every page', () => {
      const header = makeHeader('hdr', [makeTitle('hdr-t', 'Acme Corp')]);
      const titles = Array.from({ length: 25 }, (_, i) => makeTitle(`t${i.toString()}`));
      const schema = makeSchema([header, ...titles]);
      const result = engine.layout(schema);

      expect(result.pages.length).toBeGreaterThan(1);
      for (const page of result.pages) {
        const headerElement = page.elements.find((e) => e.type === 'header');
        expect(headerElement).toBeDefined();
      }
    });

    it('footer appears on every page', () => {
      const footer = makeFooter('ftr', [makeParagraph('ftr-p', 'Page 1')]);
      const titles = Array.from({ length: 25 }, (_, i) => makeTitle(`t${i.toString()}`));
      const schema = makeSchema([...titles, footer]);
      const result = engine.layout(schema);

      expect(result.pages.length).toBeGreaterThan(1);
      for (const page of result.pages) {
        const footerElement = page.elements.find((e) => e.type === 'footer');
        expect(footerElement).toBeDefined();
      }
    });

    it('header y position equals top margin', () => {
      const header = makeHeader('hdr', [makeTitle('hdr-t')]);
      const schema = makeSchema([header, makeTitle('t1')]);
      const result = engine.layout(schema);

      const headerElem = result.pages[0]?.elements.find((e) => e.type === 'header');
      expect(headerElem?.y).toBeCloseTo(inToPt(1), 5);
    });

    it('footer y position is near the bottom of the page', () => {
      const footer = makeFooter('ftr', [makeParagraph('ftr-p', 'Footer text')]);
      const schema = makeSchema([makeTitle('t1'), footer]);
      const result = engine.layout(schema);

      const page = result.pages[0];
      const footerElem = page?.elements.find((e) => e.type === 'footer');
      // Footer y should be in the lower portion of the page
      expect(footerElem?.y).toBeGreaterThan(page?.height ? page.height * 0.5 : 0);
    });

    it('content elements on page 1 are below the header', () => {
      const header = makeHeader('hdr', [makeTitle('hdr-t', 'Acme Corp')]);
      const schema = makeSchema([header, makeTitle('t1', 'Content Title')]);
      const result = engine.layout(schema);

      const headerElem = result.pages[0]?.elements.find((e) => e.type === 'header');
      const contentElem = result.pages[0]?.elements.find((e) => e.type === 'title');

      const headerBottom = (headerElem?.y ?? 0) + (headerElem?.height ?? 0);
      expect(contentElem?.y).toBeGreaterThanOrEqual(headerBottom);
    });
  });

  describe('sections', () => {
    it('section children appear in pages.elements', () => {
      const section = makeSection('sec1', [makeTitle('t1'), makeParagraph('p1')]);
      const schema = makeSchema([section]);
      const result = engine.layout(schema);

      const elems = result.pages[0]?.elements ?? [];
      const titleElem = elems.find((e) => e.nodeId === 't1');
      const paraElem = elems.find((e) => e.nodeId === 'p1');

      expect(titleElem).toBeDefined();
      expect(paraElem).toBeDefined();
    });

    it('section node appears in result.nodes with children', () => {
      const section = makeSection('sec1', [makeTitle('t1')]);
      const schema = makeSchema([section]);
      const result = engine.layout(schema);

      const sectionNode = result.nodes.find((n) => n.id === 'sec1');
      expect(sectionNode).toBeDefined();
      expect(sectionNode?.children).toHaveLength(1);
      expect(sectionNode?.children[0]?.id).toBe('t1');
    });

    it('nested section children are positioned below parent section start', () => {
      const section = makeSection('sec1', [makeTitle('t1'), makeParagraph('p1')]);
      const schema = makeSchema([section]);
      const result = engine.layout(schema);

      const elems = result.pages[0]?.elements ?? [];
      const titleY = elems.find((e) => e.nodeId === 't1')?.y ?? 0;
      const paraY = elems.find((e) => e.nodeId === 'p1')?.y ?? 0;

      expect(paraY).toBeGreaterThan(titleY);
    });

    it('sections after direct content appear below it', () => {
      const schema = makeSchema([makeTitle('t1'), makeSection('sec1', [makeParagraph('p1')])]);
      const result = engine.layout(schema);

      const elems = result.pages[0]?.elements ?? [];
      const titleY = elems.find((e) => e.nodeId === 't1')?.y ?? 0;
      const paraY = elems.find((e) => e.nodeId === 'p1')?.y ?? 0;

      expect(paraY).toBeGreaterThan(titleY);
    });
  });

  describe('box model', () => {
    it('layout nodes have ZERO_BOX_MODEL', () => {
      const schema = makeSchema([makeTitle('t1')]);
      const result = engine.layout(schema);
      const node = result.nodes[0];

      expect(node?.box.margin.top).toBe(0);
      expect(node?.box.padding.top).toBe(0);
    });
  });

  describe('validation', () => {
    it('throws LayoutError when header + footer exceed content area', () => {
      // Create an artificially tall header by stuffing many titles inside it
      const headerChildren = Array.from({ length: 50 }, (_, i) => makeTitle(`ht${i.toString()}`));
      const footerChildren = Array.from({ length: 50 }, (_, i) => makeTitle(`ft${i.toString()}`));

      const header = makeHeader('hdr', headerChildren);
      const footer = makeFooter('ftr', footerChildren);
      const schema = makeSchema([header, footer]);

      expect(() => engine.layout(schema)).toThrow(LayoutError);
    });

    it('throws LayoutError for zero-width page (impossible margins)', () => {
      // Override the theme to use extreme margins
      const tinyTheme = {
        ...DEFAULT_LAYOUT_THEME,
        tokens: {
          ...DEFAULT_LAYOUT_THEME.tokens,
          page: {
            ...DEFAULT_LAYOUT_THEME.tokens.page,
            marginLeft: inToPt(10),
            marginRight: inToPt(10),
          },
        },
      };
      const schema = makeSchema([makeTitle('t1')]);

      expect(() => engine.layout({ schema, theme: tinyTheme })).toThrow(LayoutError);
    });
  });

  describe('metadata in result', () => {
    it('passes schema metadata through to result', () => {
      const schema = {
        version: '1.0.0',
        metadata: { title: 'My Report', author: 'Test' },
        root: { id: 'root', type: 'report', props: {}, children: [] },
      };
      const result = engine.layout(schema);
      expect(result.metadata['title']).toBe('My Report');
      expect(result.metadata['author']).toBe('Test');
    });
  });

  describe('convenience overloads', () => {
    it('accepts a raw ReportSchema directly (uses default theme)', () => {
      const schema = makeSchema([makeTitle('t1')]);
      const result = engine.layout(schema);
      expect(result.pages).toHaveLength(1);
    });

    it('accepts a builder-like object with toJSON()', () => {
      const schema = makeSchema([makeTitle('t1')]);
      const builderLike = { toJSON: () => schema };
      const result = engine.layout(builderLike);
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0]?.elements[0]?.type).toBe('title');
    });

    it('accepts LayoutInput with explicit theme', () => {
      const schema = makeSchema([makeTitle('t1')]);
      const result = engine.layout({ schema, theme: DEFAULT_LAYOUT_THEME });
      expect(result.pages).toHaveLength(1);
    });
  });

  describe('result structure', () => {
    it('LayoutResult satisfies LayoutOutput contract', () => {
      const schema = makeSchema([makeTitle('t1')]);
      const result = engine.layout(schema);
      // LayoutOutput requires pages and metadata
      expect(Array.isArray(result.pages)).toBe(true);
      expect(typeof result.metadata).toBe('object');
    });

    it('nodes array length matches top-level schema content node count', () => {
      const schema = makeSchema([
        makeTitle('t1'),
        makeParagraph('p1'),
        makeSection('sec1', [makeParagraph('p2')]),
      ]);
      const result = engine.layout(schema);
      // 3 top-level nodes: title, paragraph, section
      expect(result.nodes).toHaveLength(3);
    });

    it('section node children match schema section children', () => {
      const section = makeSection('sec1', [makeTitle('t1'), makeTitle('t2')]);
      const schema = makeSchema([section]);
      const result = engine.layout(schema);

      const sectionNode = result.nodes[0];
      expect(sectionNode?.children).toHaveLength(2);
    });
  });

  describe('props forwarding', () => {
    it('forwards node props to layout element', () => {
      const schema = makeSchema([makeTitle('t1', 'Hello World')]);
      const result = engine.layout(schema);
      const element = result.pages[0]?.elements[0];
      expect(element?.props['text']).toBe('Hello World');
    });

    it('forwards empty style as empty object', () => {
      const schema = makeSchema([makeTitle('t1')]);
      const result = engine.layout(schema);
      const element = result.pages[0]?.elements[0];
      expect(element?.style).toEqual({});
    });
  });
});
