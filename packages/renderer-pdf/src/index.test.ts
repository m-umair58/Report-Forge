import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import type { DisplayList, DisplayPage } from '@reportforge/display-list';
import type {
  DrawLineCommand,
  DrawRectangleCommand,
  DrawTextCommand,
} from '@reportforge/display-list';

import {
  FontManager,
  NAMED_COLORS,
  PACKAGE_NAME,
  PdfRendererError,
  PdfRenderer,
  getPackageName,
  isValidColor,
  parseColor,
  parseColorWithNames,
  rectOriginToPageY,
  resolveStandardFont,
  textBaselineY,
  toPageY,
} from './index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

function makeTextCmd(overrides: Partial<DrawTextCommand> = {}): DrawTextCommand {
  return {
    kind: 'draw-text',
    sourceNodeId: 'n1',
    text: 'Hello, World!',
    font: 'Helvetica',
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 1.2,
    color: '#000000',
    x: 72,
    y: 72,
    width: 400,
    height: 20,
    rotation: 0,
    opacity: 1,
    textAlign: 'left',
    ...overrides,
  };
}

function makeRectCmd(overrides: Partial<DrawRectangleCommand> = {}): DrawRectangleCommand {
  return {
    kind: 'draw-rectangle',
    sourceNodeId: 'r1',
    x: 72,
    y: 100,
    width: 200,
    height: 50,
    fillColor: '#e0e0e0',
    borderColor: '#888888',
    borderWidth: 1,
    cornerRadius: 0,
    opacity: 1,
    ...overrides,
  };
}

function makeLineCmd(overrides: Partial<DrawLineCommand> = {}): DrawLineCommand {
  return {
    kind: 'draw-line',
    sourceNodeId: 'l1',
    x1: 72,
    y1: 200,
    x2: 523,
    y2: 200,
    color: '#cccccc',
    width: 0.5,
    opacity: 1,
    ...overrides,
  };
}

function makeDisplayList(
  commands: DisplayList['pages'][0]['commands'] = [],
  pages = 1,
): DisplayList {
  const pageList: DisplayPage[] = Array.from({ length: pages }, (_, i) => ({
    pageNumber: i + 1,
    width: A4_WIDTH,
    height: A4_HEIGHT,
    commands: i === 0 ? commands : [],
  }));

  return {
    pages: pageList,
    metadata: {},
    commandCount: commands.length,
  };
}

// ─── Color parsing ────────────────────────────────────────────────────────────

describe('parseColor', () => {
  it('returns null for null input', () => {
    expect(parseColor(null)).toBeNull();
  });

  it('returns null for transparent', () => {
    expect(parseColor('transparent')).toBeNull();
  });

  it('parses #RRGGBB hex correctly', () => {
    const color = parseColor('#ff0000');
    expect(color).not.toBeNull();
  });

  it('parses #RGB shorthand', () => {
    const color = parseColor('#f00');
    expect(color).not.toBeNull();
  });

  it('parses #RRGGBBAA (ignores alpha)', () => {
    const color = parseColor('#ff000080');
    expect(color).not.toBeNull();
  });

  it('parses rgb() strings', () => {
    const color = parseColor('rgb(255, 0, 0)');
    expect(color).not.toBeNull();
  });

  it('parses rgba() strings', () => {
    const color = parseColor('rgba(255, 0, 0, 0.5)');
    expect(color).not.toBeNull();
  });

  it('returns null for unknown formats', () => {
    expect(parseColor('notacolor')).toBeNull();
    expect(parseColor('red')).toBeNull(); // parseColor does not handle named colors
  });

  it('returns null for malformed hex', () => {
    expect(parseColor('#gg0000')).toBeNull();
    expect(parseColor('#12345')).toBeNull();
  });
});

describe('parseColorWithNames', () => {
  it('resolves named colors', () => {
    expect(parseColorWithNames('black')).not.toBeNull();
    expect(parseColorWithNames('white')).not.toBeNull();
    expect(parseColorWithNames('red')).not.toBeNull();
  });

  it('resolves hex colors via fallthrough', () => {
    expect(parseColorWithNames('#ff0000')).not.toBeNull();
  });

  it('returns null for null input', () => {
    expect(parseColorWithNames(null)).toBeNull();
  });

  it('returns null for truly unknown names', () => {
    expect(parseColorWithNames('notacolor123')).toBeNull();
  });
});

describe('isValidColor', () => {
  it('accepts #RRGGBB', () => expect(isValidColor('#aabbcc')).toBe(true));
  it('accepts #RGB', () => expect(isValidColor('#abc')).toBe(true));
  it('accepts rgb()', () => expect(isValidColor('rgb(0,0,0)')).toBe(true));
  it('accepts rgba()', () => expect(isValidColor('rgba(0,0,0,1)')).toBe(true));
  it('accepts transparent', () => expect(isValidColor('transparent')).toBe(true));
  it('rejects unknown names', () => expect(isValidColor('hotpink')).toBe(false));
});

describe('NAMED_COLORS', () => {
  it('contains standard color names', () => {
    expect(NAMED_COLORS['black']).toBe('#000000');
    expect(NAMED_COLORS['white']).toBe('#ffffff');
    expect(NAMED_COLORS['red']).toBe('#ff0000');
  });
});

// ─── Coordinate utilities ─────────────────────────────────────────────────────

describe('toPageY', () => {
  it('flips Y axis (top-left → bottom-left)', () => {
    expect(toPageY(0, 841.89)).toBeCloseTo(841.89);
    expect(toPageY(841.89, 841.89)).toBeCloseTo(0);
    expect(toPageY(100, 841.89)).toBeCloseTo(741.89);
  });
});

describe('rectOriginToPageY', () => {
  it('converts top-left rectangle Y to pdf-lib bottom-left Y', () => {
    // displayY=100, height=50, pageHeight=841 → pdfY = 841 - 100 - 50 = 691
    expect(rectOriginToPageY(100, 50, 841.89)).toBeCloseTo(691.89);
  });

  it('rectangle at top of page maps near page height', () => {
    expect(rectOriginToPageY(0, 20, 841.89)).toBeCloseTo(821.89);
  });
});

describe('textBaselineY', () => {
  it('returns a Y below the top of the bounding box', () => {
    const result = textBaselineY(100, 12, 841.89);
    // Should be approx 841.89 - 100 - 12*0.85 = 731.69
    expect(result).toBeCloseTo(841.89 - 100 - 12 * 0.85, 1);
  });
});

// ─── FontManager ─────────────────────────────────────────────────────────────

describe('resolveStandardFont', () => {
  it('maps Helvetica to StandardFonts.Helvetica', () => {
    expect(resolveStandardFont('Helvetica', 'normal')).toBe(StandardFonts.Helvetica);
    expect(resolveStandardFont('Helvetica', 'bold')).toBe(StandardFonts.HelveticaBold);
  });

  it('maps Times-Roman to StandardFonts.TimesRoman', () => {
    expect(resolveStandardFont('Times-Roman', 'normal')).toBe(StandardFonts.TimesRoman);
    expect(resolveStandardFont('Times-Roman', 'bold')).toBe(StandardFonts.TimesRomanBold);
  });

  it('maps Courier to StandardFonts.Courier', () => {
    expect(resolveStandardFont('Courier', 'normal')).toBe(StandardFonts.Courier);
    expect(resolveStandardFont('Courier', 'bold')).toBe(StandardFonts.CourierBold);
  });

  it('falls back to Helvetica for unknown fonts', () => {
    expect(resolveStandardFont('Inter', 'normal')).toBe(StandardFonts.Helvetica);
    expect(resolveStandardFont('UnknownFont', 'bold')).toBe(StandardFonts.HelveticaBold);
  });

  it('maps mono/consolas to Courier', () => {
    expect(resolveStandardFont('monospace', 'normal')).toBe(StandardFonts.Courier);
    expect(resolveStandardFont('Consolas', 'bold')).toBe(StandardFonts.CourierBold);
  });
});

describe('FontManager', () => {
  it('loads 6 standard fonts after preload()', async () => {
    const pdfDoc = await PDFDocument.create();
    const manager = new FontManager();
    await manager.preload(pdfDoc);
    expect(manager.size).toBe(6);
  });

  it('resolves Helvetica normal', async () => {
    const pdfDoc = await PDFDocument.create();
    const manager = new FontManager();
    await manager.preload(pdfDoc);
    const font = manager.resolve('Helvetica', 'normal');
    expect(font).toBeDefined();
  });

  it('resolves Courier bold', async () => {
    const pdfDoc = await PDFDocument.create();
    const manager = new FontManager();
    await manager.preload(pdfDoc);
    const font = manager.resolve('Courier', 'bold');
    expect(font).toBeDefined();
  });

  it('falls back to Helvetica for unknown font names', async () => {
    const pdfDoc = await PDFDocument.create();
    const manager = new FontManager();
    await manager.preload(pdfDoc);
    const font = manager.resolve('Papyrus', 'normal');
    expect(font).toBeDefined();
  });

  it('throws if resolve() is called before preload()', () => {
    const manager = new FontManager();
    expect(() => manager.resolve('Helvetica', 'normal')).toThrow();
  });
});

// ─── PdfRenderer ──────────────────────────────────────────────────────────────

describe('PdfRenderer', () => {
  const renderer = new PdfRenderer();

  it('has the correct name and mimeTypes', () => {
    expect(renderer.name).toBe('reportforge-pdf-renderer');
    expect(renderer.mimeTypes).toContain('application/pdf');
  });

  describe('render() — output structure', () => {
    it('returns a Uint8Array', async () => {
      const dl = makeDisplayList();
      const result = await renderer.render(dl);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('output starts with %PDF (valid PDF header)', async () => {
      const dl = makeDisplayList();
      const result = await renderer.render(dl);
      const header = String.fromCharCode(...result.slice(0, 4));
      expect(header).toBe('%PDF');
    });

    it('produces non-zero byte output', async () => {
      const dl = makeDisplayList([makeTextCmd()]);
      const result = await renderer.render(dl);
      expect(result.length).toBeGreaterThan(0);
    });

    it('empty display list still produces a valid PDF', async () => {
      const dl = makeDisplayList();
      const result = await renderer.render(dl);
      const header = String.fromCharCode(...result.slice(0, 4));
      expect(header).toBe('%PDF');
    });
  });

  describe('render() — page count', () => {
    it('single-page display list produces a valid PDF', async () => {
      const dl = makeDisplayList([makeTextCmd()]);
      const result = await renderer.render(dl);
      expect(result.length).toBeGreaterThan(100);
    });

    it('multi-page display list renders all pages', async () => {
      const dl = makeDisplayList([], 3);
      const result = await renderer.render(dl);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('render() — command types', () => {
    it('renders DrawText command without throwing', async () => {
      const dl = makeDisplayList([makeTextCmd({ text: 'Hello PDF' })]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('renders DrawRectangle command without throwing', async () => {
      const dl = makeDisplayList([makeRectCmd()]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('renders DrawLine command without throwing', async () => {
      const dl = makeDisplayList([makeLineCmd()]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('renders DrawRectangle with null fillColor (border only)', async () => {
      const dl = makeDisplayList([makeRectCmd({ fillColor: null })]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('renders DrawRectangle with null borderColor (fill only)', async () => {
      const dl = makeDisplayList([makeRectCmd({ borderColor: null })]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('renders mixed command types on the same page', async () => {
      const dl = makeDisplayList([
        makeTextCmd({ text: 'Title', fontSize: 24, fontWeight: 'bold' }),
        makeRectCmd(),
        makeLineCmd(),
        makeTextCmd({ text: 'Body text', y: 250 }),
      ]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('skips transparent rectangles (no fill, no border)', async () => {
      const dl = makeDisplayList([makeRectCmd({ fillColor: null, borderColor: null })]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('skips empty text commands', async () => {
      const dl = makeDisplayList([makeTextCmd({ text: '' })]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('handles draw-image as placeholder rectangle', async () => {
      const cmd = {
        kind: 'draw-image' as const,
        sourceNodeId: 'img1',
        src: 'photo.jpg',
        alt: 'A photo',
        x: 72,
        y: 200,
        width: 200,
        height: 150,
        rotation: 0,
        opacity: 1,
      };
      const dl = makeDisplayList([cmd]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('handles draw-table as placeholder rectangle', async () => {
      const cmd = {
        kind: 'draw-table' as const,
        sourceNodeId: 'tbl1',
        x: 72,
        y: 200,
        width: 400,
        height: 200,
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Alice' }],
        opacity: 1,
      };
      const dl = makeDisplayList([cmd]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('handles draw-qr-code as placeholder rectangle', async () => {
      const cmd = {
        kind: 'draw-qr-code' as const,
        sourceNodeId: 'qr1',
        value: 'https://example.com',
        x: 72,
        y: 200,
        width: 100,
        height: 100,
        opacity: 1,
      };
      const dl = makeDisplayList([cmd]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('handles draw-barcode as placeholder rectangle', async () => {
      const cmd = {
        kind: 'draw-barcode' as const,
        sourceNodeId: 'bc1',
        value: '1234567890',
        format: 'CODE128',
        x: 72,
        y: 200,
        width: 200,
        height: 60,
        opacity: 1,
      };
      const dl = makeDisplayList([cmd]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('handles draw-circle without throwing', async () => {
      const cmd = {
        kind: 'draw-circle' as const,
        sourceNodeId: 'c1',
        cx: 200,
        cy: 300,
        radius: 50,
        fillColor: '#ff0000' as string | null,
        strokeColor: null as string | null,
        strokeWidth: 0,
        opacity: 1,
      };
      const dl = makeDisplayList([cmd]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('handles draw-ellipse without throwing', async () => {
      const cmd = {
        kind: 'draw-ellipse' as const,
        sourceNodeId: 'e1',
        cx: 200,
        cy: 300,
        rx: 80,
        ry: 40,
        fillColor: '#0000ff' as string | null,
        strokeColor: '#000000' as string | null,
        strokeWidth: 1,
        opacity: 1,
      };
      const dl = makeDisplayList([cmd]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('handles draw-path gracefully (warning, no crash)', async () => {
      const cmd = {
        kind: 'draw-path' as const,
        sourceNodeId: 'p1',
        pathData: 'M 0 0 L 100 100',
        fillColor: null as string | null,
        strokeColor: '#000000' as string | null,
        strokeWidth: 1,
        opacity: 1,
      };
      const dl = makeDisplayList([cmd]);
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });
  });

  describe('render() — metadata', () => {
    it('accepts title via options', async () => {
      const dl = makeDisplayList([makeTextCmd()]);
      await expect(
        renderer.render(dl, { title: 'My Report', author: 'Alice' }),
      ).resolves.toBeInstanceOf(Uint8Array);
    });

    it('reads title from displayList.metadata', async () => {
      const dl: DisplayList = {
        pages: [{ pageNumber: 1, width: A4_WIDTH, height: A4_HEIGHT, commands: [] }],
        metadata: { title: 'Report from Metadata', author: 'Bob' },
        commandCount: 0,
      };
      await expect(renderer.render(dl)).resolves.toBeInstanceOf(Uint8Array);
    });

    it('accepts compress=false option', async () => {
      const dl = makeDisplayList([makeTextCmd()]);
      const result = await renderer.render(dl, { compress: false });
      expect(result).toBeInstanceOf(Uint8Array);
      // Uncompressed PDF is generally larger
      const compressedResult = await renderer.render(dl, { compress: true });
      // Both should be valid PDFs
      expect(String.fromCharCode(...result.slice(0, 4))).toBe('%PDF');
      expect(String.fromCharCode(...compressedResult.slice(0, 4))).toBe('%PDF');
    });
  });

  describe('renderWithDiagnostics()', () => {
    it('returns bytes, pageCount, commandCount, warnings', async () => {
      const dl = makeDisplayList([makeTextCmd(), makeRectCmd()]);
      const result = await renderer.renderWithDiagnostics(dl);
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.pageCount).toBe(1);
      expect(result.commandCount).toBe(2);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('emits warnings for placeholder commands', async () => {
      const cmd = {
        kind: 'draw-image' as const,
        sourceNodeId: 'img1',
        src: 'test.jpg',
        alt: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
      };
      const dl = makeDisplayList([cmd]);
      const result = await renderer.renderWithDiagnostics(dl);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('draw-image');
    });

    it('emits warnings for draw-path (unsupported)', async () => {
      const cmd = {
        kind: 'draw-path' as const,
        sourceNodeId: 'path1',
        pathData: 'M0 0L100 100',
        fillColor: null as string | null,
        strokeColor: '#000' as string | null,
        strokeWidth: 1,
        opacity: 1,
      };
      const dl = makeDisplayList([cmd]);
      const result = await renderer.renderWithDiagnostics(dl);
      expect(result.warnings.some((w) => w.includes('draw-path'))).toBe(true);
    });

    it('emits warnings for unsupported draw-rectangle commands', async () => {
      const dl = makeDisplayList([makeRectCmd({ cornerRadius: 8 })]);
      const result = await renderer.renderWithDiagnostics(dl);
      expect(result.warnings.some((w) => w.includes('draw-rectangle'))).toBe(true);
    });

    it('multi-page document has correct pageCount', async () => {
      const dl = makeDisplayList([], 4);
      const result = await renderer.renderWithDiagnostics(dl);
      expect(result.pageCount).toBe(4);
    });
  });
});

// ─── PdfRendererError ─────────────────────────────────────────────────────────

describe('PdfRendererError', () => {
  it('has renderer = pdf', () => {
    const err = new PdfRendererError('something went wrong');
    expect(err.renderer).toBe('pdf');
    expect(err.name).toBe('PdfRendererError');
  });

  it('carries nodeId when provided', () => {
    const err = new PdfRendererError('node error', { nodeId: 'title-1' });
    expect(err.nodeId).toBe('title-1');
  });

  it('carries cause when provided', () => {
    const cause = new Error('pdf-lib failure');
    const err = new PdfRendererError('wrapped', { cause });
    expect(err.cause).toBe(cause);
  });

  it('nodeId is undefined when not provided', () => {
    const err = new PdfRendererError('no node');
    expect(err.nodeId).toBeUndefined();
  });
});

// ─── Package identity ─────────────────────────────────────────────────────────

describe('package identity', () => {
  it('exports PACKAGE_NAME', () => {
    expect(PACKAGE_NAME).toBe('@reportforge/renderer-pdf');
  });

  it('getPackageName returns the package name', () => {
    expect(getPackageName()).toBe('@reportforge/renderer-pdf');
  });
});
