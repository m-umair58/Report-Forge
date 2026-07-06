import { describe, expect, it } from 'vitest';

import type { LayoutElement, LayoutOutput } from '@reportforge/shared';

import type {
  DisplayCommand,
  DrawBarcodeCommand,
  DrawImageCommand,
  DrawLineCommand,
  DrawQRCodeCommand,
  DrawRectangleCommand,
  DrawTableCommand,
  DrawTextCommand,
} from './commands.js';
import {
  DEFAULT_COLOR,
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_SIZE_TITLE,
  DEFAULT_OPTIMIZER_OPTIONS,
  DisplayCommandValidationError,
  DisplayListError,
  DisplayListGenerator,
  isValidColor,
  optimizeCommands,
  validateCommand,
  validateDisplayList,
} from './index.js';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeElement(
  nodeId: string,
  type: string,
  props: Record<string, unknown> = {},
): LayoutElement {
  return {
    nodeId,
    type,
    x: 72,
    y: 72,
    width: 451,
    height: 30,
    props,
    style: {},
  };
}

function makeLayout(elements: LayoutElement[], pageNumber = 1): LayoutOutput {
  return {
    pages: [
      {
        pageNumber,
        width: 595.28,
        height: 841.89,
        elements,
      },
    ],
    metadata: {},
  };
}

function makeMultiPageLayout(elementsPerPage: LayoutElement[][]): LayoutOutput {
  return {
    pages: elementsPerPage.map((elements, i) => ({
      pageNumber: i + 1,
      width: 595.28,
      height: 841.89,
      elements,
    })),
    metadata: {},
  };
}

// ─── isValidColor ─────────────────────────────────────────────────────────────

describe('isValidColor', () => {
  it('accepts #RGB hex shorthand', () => {
    expect(isValidColor('#fff')).toBe(true);
    expect(isValidColor('#abc')).toBe(true);
  });

  it('accepts #RRGGBB hex', () => {
    expect(isValidColor('#1a1a1a')).toBe(true);
    expect(isValidColor('#ffffff')).toBe(true);
    expect(isValidColor('#CCCCCC')).toBe(true);
  });

  it('accepts #RRGGBBAA hex with alpha', () => {
    expect(isValidColor('#1a1a1aff')).toBe(true);
    expect(isValidColor('#00000080')).toBe(true);
  });

  it('accepts rgb() strings', () => {
    expect(isValidColor('rgb(0, 0, 0)')).toBe(true);
    expect(isValidColor('rgb(255, 128, 0)')).toBe(true);
  });

  it('accepts rgba() strings', () => {
    expect(isValidColor('rgba(0, 0, 0, 0.5)')).toBe(true);
  });

  it('accepts transparent', () => {
    expect(isValidColor('transparent')).toBe(true);
  });

  it('rejects plain color names', () => {
    expect(isValidColor('red')).toBe(false);
    expect(isValidColor('blue')).toBe(false);
  });

  it('rejects malformed hex strings', () => {
    expect(isValidColor('#gg0000')).toBe(false);
    expect(isValidColor('#12345')).toBe(false); // 5 chars — invalid
    expect(isValidColor('1a1a1a')).toBe(false); // missing #
  });

  it('rejects empty string', () => {
    expect(isValidColor('')).toBe(false);
  });
});

// ─── DisplayListGenerator — basic structure ───────────────────────────────────

describe('DisplayListGenerator', () => {
  const generator = new DisplayListGenerator();

  describe('empty layout', () => {
    it('produces a DisplayList with the same number of pages', () => {
      const layout = makeLayout([]);
      const dl = generator.generate(layout);
      expect(dl.pages).toHaveLength(1);
    });

    it('produces zero commands for an empty page', () => {
      const layout = makeLayout([]);
      const dl = generator.generate(layout);
      expect(dl.pages[0]?.commands).toHaveLength(0);
    });

    it('commandCount is 0 for an empty layout', () => {
      const layout = makeLayout([]);
      const dl = generator.generate(layout);
      expect(dl.commandCount).toBe(0);
    });

    it('page dimensions are forwarded', () => {
      const layout = makeLayout([]);
      const dl = generator.generate(layout);
      expect(dl.pages[0]?.width).toBeCloseTo(595.28, 1);
      expect(dl.pages[0]?.height).toBeCloseTo(841.89, 1);
    });

    it('page number is forwarded', () => {
      const layout = makeLayout([], 1);
      const dl = generator.generate(layout);
      expect(dl.pages[0]?.pageNumber).toBe(1);
    });
  });

  describe('metadata forwarding', () => {
    it('passes metadata from layout to display list', () => {
      const layout: LayoutOutput = {
        pages: [{ pageNumber: 1, width: 595, height: 841, elements: [] }],
        metadata: { title: 'My Report', author: 'Alice' },
      };
      const dl = generator.generate(layout);
      expect(dl.metadata['title']).toBe('My Report');
      expect(dl.metadata['author']).toBe('Alice');
    });
  });

  // ─── Command generation per element type ─────────────────────────────────

  describe('command generation', () => {
    it('title → DrawText with large bold font', () => {
      const layout = makeLayout([makeElement('t1', 'title', { text: 'Hello World' })]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawTextCommand | undefined;

      expect(cmd?.kind).toBe('draw-text');
      expect(cmd?.text).toBe('Hello World');
      expect(cmd?.fontSize).toBe(DEFAULT_FONT_SIZE_TITLE);
      expect(cmd?.fontWeight).toBe('bold');
      expect(cmd?.sourceNodeId).toBe('t1');
    });

    it('subtitle → DrawText with medium bold font', () => {
      const layout = makeLayout([makeElement('s1', 'subtitle', { text: 'Sub' })]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawTextCommand | undefined;

      expect(cmd?.kind).toBe('draw-text');
      expect(cmd?.fontWeight).toBe('bold');
      expect(cmd?.fontSize).toBeLessThan(DEFAULT_FONT_SIZE_TITLE);
      expect(cmd?.fontSize).toBeGreaterThan(DEFAULT_FONT_SIZE);
    });

    it('paragraph → DrawText with normal weight and body font size', () => {
      const layout = makeLayout([makeElement('p1', 'paragraph', { text: 'Lorem ipsum' })]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawTextCommand | undefined;

      expect(cmd?.kind).toBe('draw-text');
      expect(cmd?.text).toBe('Lorem ipsum');
      expect(cmd?.fontWeight).toBe('normal');
      expect(cmd?.fontSize).toBe(DEFAULT_FONT_SIZE);
    });

    it('divider → DrawLine spanning the element width', () => {
      const el = makeElement('d1', 'divider', {});
      const layout = makeLayout([el]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawLineCommand | undefined;

      expect(cmd?.kind).toBe('draw-line');
      expect(cmd?.x1).toBe(el.x);
      expect(cmd?.x2).toBe(el.x + el.width);
      expect(cmd?.sourceNodeId).toBe('d1');
    });

    it('section → DrawRectangle (structural, no fill, no border)', () => {
      const layout = makeLayout([makeElement('sec1', 'section', {})]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawRectangleCommand | undefined;

      expect(cmd?.kind).toBe('draw-rectangle');
      expect(cmd?.fillColor).toBeNull();
      expect(cmd?.borderColor).toBeNull();
    });

    it('header → DrawRectangle with a fill color', () => {
      const layout = makeLayout([makeElement('hdr', 'header', {})]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawRectangleCommand | undefined;

      expect(cmd?.kind).toBe('draw-rectangle');
      expect(cmd?.fillColor).not.toBeNull();
    });

    it('footer → DrawRectangle with a fill color', () => {
      const layout = makeLayout([makeElement('ftr', 'footer', {})]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawRectangleCommand | undefined;

      expect(cmd?.kind).toBe('draw-rectangle');
      expect(cmd?.fillColor).not.toBeNull();
    });

    it('table → DrawTable with columns and rows forwarded', () => {
      const columns = [{ key: 'a', label: 'A' }];
      const rows = [{ a: 'value1' }];
      const layout = makeLayout([makeElement('tbl1', 'table', { columns, rows })]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawTableCommand | undefined;

      expect(cmd?.kind).toBe('draw-table');
      expect(cmd?.columns).toEqual(columns);
      expect(cmd?.rows).toEqual(rows);
    });

    it('image → DrawImage with src forwarded', () => {
      const layout = makeLayout([makeElement('img1', 'image', { src: 'logo.png', alt: 'Logo' })]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawImageCommand | undefined;

      expect(cmd?.kind).toBe('draw-image');
      expect(cmd?.src).toBe('logo.png');
      expect(cmd?.alt).toBe('Logo');
    });

    it('chart → [DrawRectangle, DrawText] placeholder', () => {
      const layout = makeLayout([makeElement('ch1', 'chart', { title: 'Revenue' })]);
      const dl = generator.generate(layout);
      const cmds = dl.pages[0]?.commands ?? [];

      expect(cmds).toHaveLength(2);
      expect(cmds[0]?.kind).toBe('draw-rectangle');
      expect(cmds[1]?.kind).toBe('draw-text');
      const text = cmds[1] as DrawTextCommand;
      expect(text.text).toContain('Revenue');
    });

    it('summary-card → [DrawRectangle, DrawText × 2]', () => {
      const layout = makeLayout([
        makeElement('sc1', 'summary-card', { label: 'Revenue', value: '$1M' }),
      ]);
      const dl = generator.generate(layout);
      const cmds = dl.pages[0]?.commands ?? [];

      expect(cmds).toHaveLength(3);
      expect(cmds[0]?.kind).toBe('draw-rectangle');
      expect(cmds[1]?.kind).toBe('draw-text');
      expect(cmds[2]?.kind).toBe('draw-text');

      const labelCmd = cmds[1] as DrawTextCommand;
      const valueCmd = cmds[2] as DrawTextCommand;
      expect(labelCmd.text).toBe('Revenue');
      expect(valueCmd.text).toBe('$1M');
      expect(valueCmd.fontWeight).toBe('bold');
    });

    it('qr-code → DrawQRCode with value forwarded', () => {
      const layout = makeLayout([makeElement('qr1', 'qr-code', { value: 'https://example.com' })]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawQRCodeCommand | undefined;

      expect(cmd?.kind).toBe('draw-qr-code');
      expect(cmd?.value).toBe('https://example.com');
    });

    it('barcode → DrawBarcode with value and format forwarded', () => {
      const layout = makeLayout([
        makeElement('bc1', 'barcode', { value: '123456789', format: 'EAN13' }),
      ]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawBarcodeCommand | undefined;

      expect(cmd?.kind).toBe('draw-barcode');
      expect(cmd?.value).toBe('123456789');
      expect(cmd?.format).toBe('EAN13');
    });

    it('unknown element type generates no commands', () => {
      const layout = makeLayout([makeElement('u1', 'custom-widget', {})]);
      const dl = generator.generate(layout, { validateCommands: false });
      expect(dl.pages[0]?.commands).toHaveLength(0);
    });
  });

  // ─── Element coordinates ──────────────────────────────────────────────────

  describe('coordinate forwarding', () => {
    it('DrawText inherits x, y, width, height from the element', () => {
      const el: LayoutElement = {
        nodeId: 't1',
        type: 'title',
        x: 100,
        y: 200,
        width: 300,
        height: 40,
        props: { text: 'Test' },
        style: {},
      };
      const layout = makeLayout([el]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawTextCommand | undefined;

      expect(cmd?.x).toBe(100);
      expect(cmd?.y).toBe(200);
      expect(cmd?.width).toBe(300);
      expect(cmd?.height).toBe(40);
    });
  });

  // ─── Defaults ─────────────────────────────────────────────────────────────

  describe('generator defaults', () => {
    it('uses DEFAULT_FONT for text commands', () => {
      const layout = makeLayout([makeElement('t1', 'title', { text: 'Test' })]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawTextCommand | undefined;
      expect(cmd?.font).toBe(DEFAULT_FONT);
    });

    it('uses DEFAULT_COLOR for text commands', () => {
      const layout = makeLayout([makeElement('t1', 'paragraph', { text: 'Test' })]);
      const dl = generator.generate(layout);
      const cmd = dl.pages[0]?.commands[0] as DrawTextCommand | undefined;
      expect(cmd?.color).toBe(DEFAULT_COLOR);
    });

    it('custom defaultFont is applied to text commands', () => {
      const layout = makeLayout([makeElement('t1', 'title', { text: 'Test' })]);
      const dl = generator.generate(layout, { defaultFont: 'Times-Roman' });
      const cmd = dl.pages[0]?.commands[0] as DrawTextCommand | undefined;
      expect(cmd?.font).toBe('Times-Roman');
    });
  });

  // ─── Multi-page ───────────────────────────────────────────────────────────

  describe('multi-page layout', () => {
    it('produces one DisplayPage per LayoutPage', () => {
      const layout = makeMultiPageLayout([
        [makeElement('t1', 'title', { text: 'Page 1' })],
        [makeElement('t2', 'title', { text: 'Page 2' })],
        [makeElement('t3', 'paragraph', { text: 'Page 3' })],
      ]);
      const dl = generator.generate(layout);
      expect(dl.pages).toHaveLength(3);
    });

    it('each page has its correct pageNumber', () => {
      const layout = makeMultiPageLayout([
        [makeElement('t1', 'title', { text: 'p1' })],
        [makeElement('t2', 'title', { text: 'p2' })],
      ]);
      const dl = generator.generate(layout);
      expect(dl.pages[0]?.pageNumber).toBe(1);
      expect(dl.pages[1]?.pageNumber).toBe(2);
    });

    it('commandCount is sum across all pages', () => {
      const layout = makeMultiPageLayout([
        [makeElement('t1', 'title', { text: 'p1' }), makeElement('p1', 'paragraph', { text: 'a' })],
        [makeElement('t2', 'title', { text: 'p2' })],
      ]);
      const dl = generator.generate(layout);
      // page1: 2 commands, page2: 1 command → total 3
      expect(dl.commandCount).toBe(3);
    });
  });

  // ─── Optimizer integration ────────────────────────────────────────────────

  describe('optimizer integration', () => {
    it('removes zero-sized elements when optimizeEmptyCommands is true (default)', () => {
      const el: LayoutElement = {
        nodeId: 't1',
        type: 'title',
        x: 72,
        y: 72,
        width: 0, // zero width — will be removed
        height: 0,
        props: { text: 'Invisible' },
        style: {},
      };
      const layout = makeLayout([el]);
      const dl = generator.generate(layout);
      expect(dl.pages[0]?.commands).toHaveLength(0);
    });

    it('keeps zero-sized elements when optimizeEmptyCommands is false', () => {
      const el: LayoutElement = {
        nodeId: 't1',
        type: 'title',
        x: 72,
        y: 72,
        width: 0,
        height: 0,
        props: { text: 'Invisible' },
        style: {},
      };
      const layout = makeLayout([el]);
      const dl = generator.generate(layout, {
        optimizeEmptyCommands: false,
        validateCommands: false,
      });
      // command is kept but then validation would fail — we disabled validation
      expect(dl.pages[0]?.commands.length).toBeGreaterThan(0);
    });

    it('removes invisible (opacity=0) commands by default', () => {
      const layout = makeLayout([makeElement('t1', 'title', { text: 'Ghost' })]);
      // Use opacity=0 via option
      const dl = generator.generate(layout, { defaultOpacity: 0 });
      expect(dl.pages[0]?.commands).toHaveLength(0);
    });
  });
});

// ─── Validator ────────────────────────────────────────────────────────────────

describe('validateCommand', () => {
  describe('DrawText', () => {
    const validDrawText: DrawTextCommand = {
      kind: 'draw-text',
      sourceNodeId: 'n1',
      text: 'Hello',
      font: 'Helvetica',
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 1.2,
      color: '#000000',
      x: 0,
      y: 0,
      width: 100,
      height: 20,
      rotation: 0,
      opacity: 1,
      textAlign: 'left',
    };

    it('valid command produces no issues', () => {
      expect(validateCommand(validDrawText)).toHaveLength(0);
    });

    it('negative width is an error', () => {
      const cmd: DrawTextCommand = { ...validDrawText, width: -1 };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'error' && i.message.includes('width'))).toBe(true);
    });

    it('invalid color is an error', () => {
      const cmd: DrawTextCommand = { ...validDrawText, color: 'notacolor' };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'error' && i.message.includes('color'))).toBe(true);
    });

    it('empty text is a warning', () => {
      const cmd: DrawTextCommand = { ...validDrawText, text: '' };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'warning')).toBe(true);
    });

    it('opacity=0 is a warning', () => {
      const cmd: DrawTextCommand = { ...validDrawText, opacity: 0 };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'warning')).toBe(true);
    });

    it('out-of-range opacity (>1) is an error', () => {
      const cmd: DrawTextCommand = { ...validDrawText, opacity: 1.5 };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'error')).toBe(true);
    });
  });

  describe('DrawRectangle', () => {
    const validRect: DrawRectangleCommand = {
      kind: 'draw-rectangle',
      sourceNodeId: 'r1',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      fillColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 1,
      cornerRadius: 0,
      opacity: 1,
    };

    it('valid rectangle produces no errors', () => {
      expect(validateCommand(validRect)).toHaveLength(0);
    });

    it('negative height is an error', () => {
      const cmd: DrawRectangleCommand = { ...validRect, height: -1 };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'error')).toBe(true);
    });

    it('invalid fillColor is an error', () => {
      const cmd: DrawRectangleCommand = { ...validRect, fillColor: 'bad' };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'error')).toBe(true);
    });

    it('null fillColor and null borderColor is a warning', () => {
      const cmd: DrawRectangleCommand = { ...validRect, fillColor: null, borderColor: null };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'warning')).toBe(true);
    });

    it('null fillColor alone is valid (transparent background)', () => {
      const cmd: DrawRectangleCommand = { ...validRect, fillColor: null };
      const issues = validateCommand(cmd);
      const errors = issues.filter((i) => i.severity === 'error');
      expect(errors).toHaveLength(0);
    });
  });

  describe('DrawLine', () => {
    const validLine: DrawLineCommand = {
      kind: 'draw-line',
      sourceNodeId: 'l1',
      x1: 0,
      y1: 10,
      x2: 100,
      y2: 10,
      color: '#000000',
      width: 1,
      opacity: 1,
    };

    it('valid line produces no issues', () => {
      expect(validateCommand(validLine)).toHaveLength(0);
    });

    it('degenerate line (same start/end) is a warning', () => {
      const cmd: DrawLineCommand = { ...validLine, x2: 0, y2: 10 };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'warning')).toBe(true);
    });

    it('invalid color is an error', () => {
      const cmd: DrawLineCommand = { ...validLine, color: 'notacolor' };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'error')).toBe(true);
    });
  });

  describe('DrawImage', () => {
    it('empty src is an error', () => {
      const cmd: DrawImageCommand = {
        kind: 'draw-image',
        sourceNodeId: 'img1',
        src: '',
        alt: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
      };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'error' && i.message.includes('src'))).toBe(true);
    });
  });

  describe('DrawPolygon', () => {
    it('fewer than 3 points is an error', () => {
      const cmd = {
        kind: 'draw-polygon' as const,
        sourceNodeId: 'poly1',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        fillColor: '#000' as string | null,
        strokeColor: null as string | null,
        strokeWidth: 1,
        opacity: 1,
      };
      const issues = validateCommand(cmd);
      expect(issues.some((i) => i.severity === 'error')).toBe(true);
    });
  });
});

describe('validateDisplayList', () => {
  it('returns valid=true for an empty display list', () => {
    const layout = makeLayout([]);
    const generator = new DisplayListGenerator();
    const dl = generator.generate(layout);
    const result = validateDisplayList(dl);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('returns valid=true for a valid display list', () => {
    const layout = makeLayout([
      makeElement('t1', 'title', { text: 'Hello' }),
      makeElement('p1', 'paragraph', { text: 'World' }),
    ]);
    const generator = new DisplayListGenerator();
    const dl = generator.generate(layout);
    const result = validateDisplayList(dl);
    expect(result.valid).toBe(true);
  });
});

// ─── Optimizer ────────────────────────────────────────────────────────────────

describe('optimizeCommands', () => {
  const textCmd: DrawTextCommand = {
    kind: 'draw-text',
    sourceNodeId: 'n1',
    text: 'Hello',
    font: 'Helvetica',
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 1.2,
    color: '#000000',
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    rotation: 0,
    opacity: 1,
    textAlign: 'left',
  };

  it('preserves valid commands unchanged', () => {
    const result = optimizeCommands([textCmd], DEFAULT_OPTIMIZER_OPTIONS);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(textCmd);
  });

  it('removes commands with opacity=0 when skipInvisibleCommands=true', () => {
    const invisible: DrawTextCommand = { ...textCmd, opacity: 0 };
    const result = optimizeCommands([invisible], {
      ...DEFAULT_OPTIMIZER_OPTIONS,
      skipInvisibleCommands: true,
    });
    expect(result).toHaveLength(0);
  });

  it('keeps commands with opacity=0 when skipInvisibleCommands=false', () => {
    const invisible: DrawTextCommand = { ...textCmd, opacity: 0 };
    const result = optimizeCommands([invisible], {
      skipEmptyCommands: true,
      skipInvisibleCommands: false,
    });
    expect(result).toHaveLength(1);
  });

  it('removes zero-width text commands when skipEmptyCommands=true', () => {
    const empty: DrawTextCommand = { ...textCmd, width: 0 };
    const result = optimizeCommands([empty], DEFAULT_OPTIMIZER_OPTIONS);
    expect(result).toHaveLength(0);
  });

  it('removes empty text string when skipEmptyCommands=true', () => {
    const emptyText: DrawTextCommand = { ...textCmd, text: '' };
    const result = optimizeCommands([emptyText], DEFAULT_OPTIMIZER_OPTIONS);
    expect(result).toHaveLength(0);
  });

  it('removes degenerate lines (same start/end)', () => {
    const line: DrawLineCommand = {
      kind: 'draw-line',
      sourceNodeId: 'l1',
      x1: 10,
      y1: 10,
      x2: 10,
      y2: 10,
      color: '#000',
      width: 1,
      opacity: 1,
    };
    const result = optimizeCommands([line], DEFAULT_OPTIMIZER_OPTIONS);
    expect(result).toHaveLength(0);
  });

  it('keeps valid lines', () => {
    const line: DrawLineCommand = {
      kind: 'draw-line',
      sourceNodeId: 'l1',
      x1: 0,
      y1: 10,
      x2: 100,
      y2: 10,
      color: '#000',
      width: 1,
      opacity: 1,
    };
    const result = optimizeCommands([line], DEFAULT_OPTIMIZER_OPTIONS);
    expect(result).toHaveLength(1);
  });

  it('removes zero-radius circles', () => {
    const circle = {
      kind: 'draw-circle' as const,
      sourceNodeId: 'c1',
      cx: 10,
      cy: 10,
      radius: 0,
      fillColor: '#000' as string | null,
      strokeColor: null as string | null,
      strokeWidth: 1,
      opacity: 1,
    };
    const result = optimizeCommands([circle], DEFAULT_OPTIMIZER_OPTIONS);
    expect(result).toHaveLength(0);
  });

  it('preserves commands with all passes disabled', () => {
    const empty: DrawTextCommand = { ...textCmd, width: 0, text: '', opacity: 0 };
    const result = optimizeCommands([empty], {
      skipEmptyCommands: false,
      skipInvisibleCommands: false,
    });
    expect(result).toHaveLength(1);
  });
});

// ─── Error classes ────────────────────────────────────────────────────────────

describe('DisplayListError', () => {
  it('has phase = display-list', () => {
    const err = new DisplayListError('something went wrong');
    expect(err.phase).toBe('display-list');
    expect(err.name).toBe('DisplayListError');
  });
});

describe('DisplayCommandValidationError', () => {
  it('includes nodeId and commandKind', () => {
    const err = new DisplayCommandValidationError('node-1', 'draw-text', 'bad color');
    expect(err.nodeId).toBe('node-1');
    expect(err.commandKind).toBe('draw-text');
    expect(err.message).toContain('bad color');
    expect(err.phase).toBe('display-list');
  });
});

// ─── Validation errors thrown by generator ────────────────────────────────────

describe('DisplayListGenerator validation errors', () => {
  it('generator throws DisplayListError when a command fails validation', () => {
    // Force generation of an invalid command by disabling the optimizer
    // so a zero-width title is kept, then validation catches it.
    const el: LayoutElement = {
      nodeId: 't-bad',
      type: 'title',
      x: 72,
      y: 72,
      width: -10, // negative — validation error
      height: 20,
      props: { text: 'Test' },
      style: {},
    };
    const layout = makeLayout([el]);
    const generator = new DisplayListGenerator();

    expect(() =>
      generator.generate(layout, { optimizeEmptyCommands: false, validateCommands: true }),
    ).toThrow(DisplayListError);
  });
});

// ─── Package identity ─────────────────────────────────────────────────────────

describe('package identity', () => {
  it('exports PACKAGE_NAME', async () => {
    const mod = await import('./index.js');
    expect(mod.PACKAGE_NAME).toBe('@reportforge/display-list');
  });

  it('getPackageName returns the package name', async () => {
    const mod = await import('./index.js');
    expect(mod.getPackageName()).toBe('@reportforge/display-list');
  });
});

// ─── DisplayCommand union ─────────────────────────────────────────────────────

describe('DisplayCommand kind values', () => {
  it('each command kind is a valid string discriminant', () => {
    const layout = makeLayout([
      makeElement('t1', 'title', { text: 'T' }),
      makeElement('p1', 'paragraph', { text: 'P' }),
      makeElement('d1', 'divider', {}),
      makeElement('sec1', 'section', {}),
      makeElement('hdr', 'header', {}),
      makeElement('ftr', 'footer', {}),
    ]);
    const generator = new DisplayListGenerator();
    const dl = generator.generate(layout);
    const kinds = (dl.pages[0]?.commands ?? []).map((c: DisplayCommand) => c.kind);

    expect(kinds).toContain('draw-text');
    expect(kinds).toContain('draw-line');
    expect(kinds).toContain('draw-rectangle');
  });
});
