import { describe, expect, it } from 'vitest';

import {
  FontMetrics,
  FontNotFoundError,
  FontRegistry,
  FontResolver,
  HELVETICA_NORMAL,
  LineBreaker,
  TypographyEngine,
  TypographyError,
  createBuiltInMetrics,
  getPackageName,
  normalizeWhitespace,
  PACKAGE_NAME,
  ParagraphLayout,
  TextMeasurer,
  ascenderHeight,
  lineBoxHeight,
  resolveTextStyle,
  tokenizeWords,
} from './index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createEngine(): TypographyEngine {
  return new TypographyEngine();
}

const baseStyle = {
  fontFamily: 'Helvetica',
  fontSize: 12,
} as const;

// ─── Package identity ─────────────────────────────────────────────────────────

describe('package identity', () => {
  it('exports PACKAGE_NAME', () => {
    expect(PACKAGE_NAME).toBe('@reportforge/typography');
    expect(getPackageName()).toBe('@reportforge/typography');
  });
});

// ─── Text style resolution ────────────────────────────────────────────────────

describe('resolveTextStyle', () => {
  it('applies defaults for optional fields', () => {
    const style = resolveTextStyle({ fontFamily: 'Helvetica', fontSize: 16 });
    expect(style.fontFamily).toBe('Helvetica');
    expect(style.fontSize).toBe(16);
    expect(style.fontWeight).toBe('normal');
    expect(style.lineHeight).toBe(1.2);
    expect(style.letterSpacing).toBe(0);
    expect(style.textAlign).toBe('left');
    expect(style.italic).toBe(false);
    expect(style.underline).toBe(false);
  });

  it('preserves explicit overrides', () => {
    const style = resolveTextStyle({
      fontFamily: 'Courier',
      fontSize: 10,
      fontWeight: 'bold',
      lineHeight: 1.5,
      letterSpacing: 2,
      textAlign: 'center',
      italic: true,
      underline: true,
    });
    expect(style.fontWeight).toBe('bold');
    expect(style.lineHeight).toBe(1.5);
    expect(style.letterSpacing).toBe(2);
    expect(style.textAlign).toBe('center');
    expect(style.italic).toBe(true);
    expect(style.underline).toBe(true);
  });
});

describe('lineBoxHeight', () => {
  it('returns fontSize × lineHeight', () => {
    expect(lineBoxHeight({ fontSize: 12, lineHeight: 1.2 })).toBeCloseTo(14.4);
    expect(lineBoxHeight({ fontSize: 16, lineHeight: 1.5 })).toBeCloseTo(24);
  });
});

// ─── Whitespace normalization ───────────────────────────────────────────────────

describe('normalizeWhitespace', () => {
  it('collapses consecutive spaces', () => {
    expect(normalizeWhitespace('  Hello   world  ')).toBe('Hello world');
  });

  it('preserves explicit newlines', () => {
    expect(normalizeWhitespace('Line1\n\nLine2')).toBe('Line1\n\nLine2');
  });

  it('trims each line', () => {
    expect(normalizeWhitespace('  a  \n  b  ')).toBe('a\nb');
  });

  it('handles empty string', () => {
    expect(normalizeWhitespace('')).toBe('');
  });

  it('collapses tabs to spaces', () => {
    expect(normalizeWhitespace('Hello\t\tworld')).toBe('Hello world');
  });
});

describe('tokenizeWords', () => {
  it('splits words on whitespace', () => {
    expect(tokenizeWords('hello world')).toEqual(['hello', 'world']);
  });

  it('collapses multiple spaces', () => {
    expect(tokenizeWords('hello   world')).toEqual(['hello', 'world']);
  });

  it('returns empty array for empty string', () => {
    expect(tokenizeWords('')).toEqual([]);
  });
});

// ─── FontMetrics ──────────────────────────────────────────────────────────────

describe('FontMetrics', () => {
  const metrics = new FontMetrics(HELVETICA_NORMAL);

  it('measures character width proportional to fontSize', () => {
    const w12 = metrics.charWidth('m', 12);
    const w24 = metrics.charWidth('m', 24);
    expect(w24).toBeCloseTo(w12 * 2, 1);
  });

  it('narrow characters are narrower than default', () => {
    const narrow = metrics.charWidth('i', 12);
    const wide = metrics.charWidth('m', 12);
    expect(narrow).toBeLessThan(wide);
  });

  it('measures string width as sum of char widths', () => {
    const width = metrics.stringWidth('Hi', 12);
    expect(width).toBeGreaterThan(0);
  });

  it('empty string has zero width', () => {
    expect(metrics.stringWidth('', 12)).toBe(0);
  });

  it('monospace Courier has equal char widths', () => {
    const courier = createBuiltInMetrics('Courier', 'normal');
    const wI = courier.charWidth('i', 12);
    const wM = courier.charWidth('m', 12);
    expect(wI).toBeCloseTo(wM, 5);
  });

  it('bold metrics are wider than normal', () => {
    const normal = createBuiltInMetrics('Helvetica', 'normal');
    const bold = createBuiltInMetrics('Helvetica', 'bold');
    const wNormal = normal.stringWidth('Hello', 12);
    const wBold = bold.stringWidth('Hello', 12);
    expect(wBold).toBeGreaterThan(wNormal);
  });

  it('ascender and descender scale with fontSize', () => {
    expect(metrics.ascenderAt(12)).toBeCloseTo(12 * 0.718, 1);
    expect(metrics.descenderAt(12)).toBeCloseTo(12 * 0.207, 1);
  });
});

// ─── FontRegistry ─────────────────────────────────────────────────────────────

describe('FontRegistry', () => {
  it('preloads built-in fonts', () => {
    const registry = new FontRegistry();
    expect(registry.size).toBeGreaterThanOrEqual(6);
    expect(registry.has('Helvetica', 'normal')).toBe(true);
    expect(registry.has('Times-Roman', 'bold')).toBe(true);
    expect(registry.has('Courier', 'normal')).toBe(true);
  });

  it('registers custom font metrics', () => {
    const registry = new FontRegistry();
    registry.register({
      ...HELVETICA_NORMAL,
      family: 'CustomFont',
      defaultAdvance: 0.6,
    });
    expect(registry.has('CustomFont', 'normal')).toBe(true);
    const metrics = registry.get('CustomFont', 'normal');
    expect(metrics.stringWidth('a', 10)).toBeCloseTo(6, 1);
  });

  it('unregisters font metrics', () => {
    const registry = new FontRegistry();
    registry.register({ ...HELVETICA_NORMAL, family: 'Temp' });
    expect(registry.unregister('Temp', 'normal')).toBe(true);
    expect(registry.has('Temp', 'normal')).toBe(false);
  });
});

// ─── FontResolver ─────────────────────────────────────────────────────────────

describe('FontResolver', () => {
  it('resolves Helvetica aliases', () => {
    const registry = new FontRegistry();
    const resolver = new FontResolver(registry);
    expect(resolver.canonicalFamily('Arial')).toBe('Helvetica');
    expect(resolver.canonicalFamily('sans-serif')).toBe('Helvetica');
  });

  it('resolves Courier aliases', () => {
    const registry = new FontRegistry();
    const resolver = new FontResolver(registry);
    expect(resolver.canonicalFamily('monospace')).toBe('Courier');
    expect(resolver.canonicalFamily('Consolas')).toBe('Courier');
  });

  it('throws in strict mode for unknown fonts', () => {
    const registry = new FontRegistry();
    const resolver = new FontResolver(registry, true);
    expect(() => resolver.resolve('NonExistentFont123', 'normal')).toThrow(FontNotFoundError);
  });
});

// ─── TextMeasurer — single line ───────────────────────────────────────────────

describe('TypographyEngine.measure — single line', () => {
  const typography = createEngine();

  it('measures single line text', () => {
    const metrics = typography.measure('Hello ReportForge', {
      fontFamily: 'Helvetica',
      fontSize: 16,
    });
    expect(metrics.width).toBeGreaterThan(0);
    expect(metrics.height).toBeCloseTo(16 * 1.2, 1);
    expect(metrics.lineCount).toBe(1);
    expect(metrics.lines).toHaveLength(1);
    expect(metrics.lines[0]?.text).toBe('Hello ReportForge');
  });

  it('empty string produces one empty line', () => {
    const metrics = typography.measure('', baseStyle);
    expect(metrics.lineCount).toBe(1);
    expect(metrics.width).toBe(0);
    expect(metrics.height).toBeGreaterThan(0);
  });

  it('wider text produces larger width', () => {
    const short = typography.measure('Hi', baseStyle);
    const long = typography.measure('Hello World!', baseStyle);
    expect(long.width).toBeGreaterThan(short.width);
  });
});

// ─── Multiple font sizes ──────────────────────────────────────────────────────

describe('TypographyEngine — multiple font sizes', () => {
  const typography = createEngine();

  it('larger fontSize produces proportionally larger dimensions', () => {
    const small = typography.measure('Hello', { fontFamily: 'Helvetica', fontSize: 10 });
    const large = typography.measure('Hello', { fontFamily: 'Helvetica', fontSize: 20 });
    expect(large.width).toBeCloseTo(small.width * 2, 0);
    expect(large.height).toBeCloseTo(small.height * 2, 0);
  });

  it('different font families produce different widths', () => {
    const helvetica = typography.measure('Hello', { fontFamily: 'Helvetica', fontSize: 12 });
    const courier = typography.measure('Hello', { fontFamily: 'Courier', fontSize: 12 });
    // Courier is monospace with wider default advance
    expect(courier.width).not.toBe(helvetica.width);
  });
});

// ─── Newlines ─────────────────────────────────────────────────────────────────

describe('TypographyEngine — explicit newlines', () => {
  const typography = createEngine();

  it('counts lines separated by newlines', () => {
    const metrics = typography.measure('Line1\nLine2\nLine3', baseStyle);
    expect(metrics.lineCount).toBe(3);
    expect(metrics.lines).toHaveLength(3);
    expect(metrics.lines[0]?.text).toBe('Line1');
    expect(metrics.lines[1]?.text).toBe('Line2');
    expect(metrics.lines[2]?.text).toBe('Line3');
  });

  it('multi-line height is lineCount × lineBoxHeight', () => {
    const metrics = typography.measure('A\nB\nC', { ...baseStyle, lineHeight: 1.5 });
    const expectedHeight = 3 * 12 * 1.5;
    expect(metrics.height).toBeCloseTo(expectedHeight, 1);
  });

  it('handles Windows-style newlines', () => {
    const metrics = typography.measure('A\r\nB', baseStyle);
    expect(metrics.lineCount).toBe(2);
  });
});

// ─── Line height ──────────────────────────────────────────────────────────────

describe('TypographyEngine — line height', () => {
  const typography = createEngine();

  it('line height multiplier affects total height', () => {
    const tight = typography.measure('A\nB', { ...baseStyle, lineHeight: 1.0 });
    const loose = typography.measure('A\nB', { ...baseStyle, lineHeight: 2.0 });
    expect(loose.height).toBeCloseTo(tight.height * 2, 1);
  });

  it('baseline of second line accounts for line height', () => {
    const metrics = typography.measure('A\nB', { ...baseStyle, lineHeight: 1.5 });
    const lineBox = 12 * 1.5;
    expect(metrics.lines[1]?.baseline).toBeCloseTo(ascenderHeight({ fontSize: 12 }) + lineBox, 1);
  });
});

// ─── Bounding boxes ───────────────────────────────────────────────────────────

describe('TypographyEngine — bounding boxes', () => {
  const typography = createEngine();

  it('bounding box encloses all lines', () => {
    const metrics = typography.measure('Hello\nWorld', baseStyle);
    expect(metrics.boundingBox.width).toBe(metrics.width);
    expect(metrics.boundingBox.height).toBe(metrics.height);
    expect(metrics.boundingBox.x).toBe(0);
    expect(metrics.boundingBox.y).toBe(0);
  });

  it('bounding box width equals widest line', () => {
    const metrics = typography.measure('Short\nA much longer line here', baseStyle);
    expect(metrics.boundingBox.width).toBe(metrics.width);
    const maxLineWidth = Math.max(...metrics.lines.map((l) => l.width));
    expect(metrics.boundingBox.width).toBe(maxLineWidth);
  });

  it('charWidth and wordWidth helpers work', () => {
    const engine = createEngine();
    const charW = engine.charWidth('m', baseStyle);
    const wordW = engine.wordWidth('hello', baseStyle);
    expect(charW).toBeGreaterThan(0);
    expect(wordW).toBeGreaterThan(charW);
  });
});

// ─── Word wrapping ────────────────────────────────────────────────────────────

describe('TypographyEngine.layoutParagraph — word wrapping', () => {
  const typography = createEngine();

  it('wraps text to fit maxWidth', () => {
    const result = typography.layoutParagraph('The quick brown fox jumps over the lazy dog', {
      ...baseStyle,
      maxWidth: 80,
    });
    expect(result.lineCount).toBeGreaterThan(1);
    for (const line of result.lines) {
      expect(line.width).toBeLessThanOrEqual(80 + 1); // small tolerance
    }
  });

  it('single word within maxWidth stays on one line', () => {
    const result = typography.layoutParagraph('Hello', { ...baseStyle, maxWidth: 500 });
    expect(result.lineCount).toBe(1);
    expect(result.lines[0]?.text).toBe('Hello');
  });

  it('respects explicit newlines within wrapped paragraph', () => {
    const result = typography.layoutParagraph('Line one\nLine two', {
      ...baseStyle,
      maxWidth: 500,
    });
    expect(result.lineCount).toBe(2);
    expect(result.lines[0]?.text).toBe('Line one');
    expect(result.lines[1]?.text).toBe('Line two');
  });

  it('normalizes whitespace by default', () => {
    const result = typography.layoutParagraph('  Hello   world  ', {
      ...baseStyle,
      maxWidth: 500,
    });
    expect(result.text).toBe('Hello world');
    expect(result.lines[0]?.text).toBe('Hello world');
  });

  it('skips normalization when disabled', () => {
    const result = typography.layoutParagraph('  Hello   world  ', {
      ...baseStyle,
      maxWidth: 500,
      normalizeWhitespace: false,
    });
    expect(result.text).toBe('  Hello   world  ');
  });

  it('returns height, width, baseline, and bounding box', () => {
    const result = typography.layoutParagraph('Hello world', {
      ...baseStyle,
      maxWidth: 500,
    });
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.baseline).toBeGreaterThan(0);
    expect(result.boundingBox.height).toBe(result.height);
    expect(result.maxWidth).toBe(500);
    expect(result.style.fontFamily).toBe('Helvetica');
  });

  it('empty paragraph produces one empty line', () => {
    const result = typography.layoutParagraph('', { ...baseStyle, maxWidth: 200 });
    expect(result.lineCount).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThan(0);
  });

  it('letter spacing increases line width', () => {
    const normal = typography.layoutParagraph('Hello', {
      ...baseStyle,
      maxWidth: 500,
      letterSpacing: 0,
    });
    const spaced = typography.layoutParagraph('Hello', {
      ...baseStyle,
      maxWidth: 500,
      letterSpacing: 2,
    });
    expect(spaced.width).toBeGreaterThan(normal.width);
  });
});

// ─── LineBreaker directly ─────────────────────────────────────────────────────

describe('LineBreaker', () => {
  const breaker = new LineBreaker();
  const metrics = createBuiltInMetrics('Helvetica', 'normal');

  it('breaks long text into multiple lines', () => {
    const lines = breaker.breakText('one two three four five six seven eight', metrics, 12, 0, 60);
    expect(lines.length).toBeGreaterThan(1);
  });

  it('invokes hyphenation callback for overlong words', () => {
    const lines = breaker.breakSegment(
      'supercalifragilistic',
      metrics,
      12,
      0,
      30,
      0,
      (word, _max, measure) => {
        // Break after 5 chars if word is too long
        if (measure(word) > 30) return 5;
        return null;
      },
    );
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Errors ───────────────────────────────────────────────────────────────────

describe('TypographyError', () => {
  it('has phase = typography', () => {
    const err = new TypographyError('test');
    expect(err.phase).toBe('typography');
    expect(err.name).toBe('TypographyError');
  });
});

describe('FontNotFoundError', () => {
  it('includes font family name', () => {
    const err = new FontNotFoundError('MissingFont');
    expect(err.fontFamily).toBe('MissingFont');
    expect(err.phase).toBe('typography');
  });
});

// ─── Component integration ────────────────────────────────────────────────────

describe('component wiring', () => {
  it('TypographyEngine exposes all sub-components', () => {
    const engine = createEngine();
    expect(engine.fontRegistry).toBeInstanceOf(FontRegistry);
    expect(engine.fontResolver).toBeInstanceOf(FontResolver);
    expect(engine.textMeasurer).toBeInstanceOf(TextMeasurer);
    expect(engine.lineBreaker).toBeInstanceOf(LineBreaker);
    expect(engine.paragraphLayout).toBeInstanceOf(ParagraphLayout);
  });

  it('has correct engine name', () => {
    expect(createEngine().name).toBe('reportforge-typography-engine');
  });
});
