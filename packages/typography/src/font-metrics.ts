/**
 * Font metrics for renderer-independent text measurement.
 *
 * `FontMetrics` stores typographic measurements for a single font family and
 * weight. Character advance widths are expressed as a **fraction of the font
 * size** (em units), so they scale linearly with `fontSize`.
 *
 * ## Terminology
 *
 * | Term       | Description                                              |
 * |------------|----------------------------------------------------------|
 * | **em**     | The font size — 1 em = `fontSize` points                 |
 * | **advance**| Horizontal distance from glyph origin to next origin     |
 * | **ascender**| Height above baseline to tallest letter (e.g. 'h')       |
 * | **descender**| Depth below baseline (e.g. 'g' tail)                  |
 * | **x-height**| Height of lowercase letters without ascenders/descenders |
 * | **cap height**| Height of capital letters                             |
 *
 * Built-in metrics are approximations derived from standard PDF fonts
 * (Helvetica, Times-Roman, Courier). They are accurate enough for layout
 * and pagination; renderers may use exact glyph metrics at draw time.
 */

// ─── FontMetrics interface ────────────────────────────────────────────────────

/**
 * Typographic metrics for a single font family + weight combination.
 */
export interface FontMetricsData {
  /** Canonical font family name. */
  readonly family: string;
  /** Font weight this metrics set applies to. */
  readonly weight: 'normal' | 'bold';
  /** Whether this is a monospace font (all chars same width). */
  readonly monospace: boolean;
  /**
   * Default character advance width as a fraction of font size (em).
   * Used for characters not in the per-char table.
   */
  readonly defaultAdvance: number;
  /**
   * Per-character advance width overrides (fraction of em).
   * Keys are single Unicode code points.
   */
  readonly charAdvances: Readonly<Record<string, number>>;
  /** Ascender height as fraction of em. */
  readonly ascender: number;
  /** Descender depth as fraction of em (positive value). */
  readonly descender: number;
  /** Cap height as fraction of em. */
  readonly capHeight: number;
  /** x-height as fraction of em. */
  readonly xHeight: number;
  /** Multiplier applied to all advances for bold weight. */
  readonly boldWidthMultiplier: number;
}

/**
 * Measures character and word widths using font metrics tables.
 *
 * Does not load font files — uses built-in proportional width ratios.
 * This keeps the typography engine renderer-independent and dependency-free.
 */
export class FontMetrics {
  readonly family: string;
  readonly weight: 'normal' | 'bold';
  readonly monospace: boolean;
  private readonly _defaultAdvance: number;
  private readonly _charAdvances: Readonly<Record<string, number>>;
  private readonly _ascender: number;
  private readonly _descender: number;
  private readonly _capHeight: number;
  private readonly _xHeight: number;
  private readonly _boldMultiplier: number;

  constructor(data: FontMetricsData) {
    this.family = data.family;
    this.weight = data.weight;
    this.monospace = data.monospace;
    this._defaultAdvance = data.defaultAdvance;
    this._charAdvances = data.charAdvances;
    this._ascender = data.ascender;
    this._descender = data.descender;
    this._capHeight = data.capHeight;
    this._xHeight = data.xHeight;
    this._boldMultiplier = data.boldWidthMultiplier;
  }

  /** Ascender height in points for the given font size. */
  ascenderAt(fontSize: number): number {
    return fontSize * this._ascender;
  }

  /** Descender depth in points for the given font size. */
  descenderAt(fontSize: number): number {
    return fontSize * this._descender;
  }

  /** Cap height in points for the given font size. */
  capHeightAt(fontSize: number): number {
    return fontSize * this._capHeight;
  }

  /** x-height in points for the given font size. */
  xHeightAt(fontSize: number): number {
    return fontSize * this._xHeight;
  }

  /**
   * Returns the advance width of a single character in points.
   *
   * @param char - A single character string (length 1).
   * @param fontSize - Font size in points.
   * @param letterSpacing - Additional spacing after the character, in points.
   */
  charWidth(char: string, fontSize: number, letterSpacing = 0): number {
    if (char.length === 0) return 0;

    const advance = this._charAdvances[char] ?? this._defaultAdvance;
    const width = fontSize * advance;

    const boldAdjusted = this.weight === 'bold' ? width * this._boldMultiplier : width;
    return boldAdjusted + letterSpacing;
  }

  /**
   * Returns the advance width of a string in points.
   * Letter spacing is applied between characters (not after the last char).
   */
  stringWidth(text: string, fontSize: number, letterSpacing = 0): number {
    if (text.length === 0) return 0;

    let total = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === undefined) continue;
      const isLast = i === text.length - 1;
      total += this.charWidth(char, fontSize, isLast ? 0 : letterSpacing);
    }
    return total;
  }

  /**
   * Returns the advance width of a word (no trailing letter spacing).
   */
  wordWidth(word: string, fontSize: number, letterSpacing = 0): number {
    return this.stringWidth(word, fontSize, letterSpacing);
  }
}

// ─── Per-character width tables ───────────────────────────────────────────────

/** Narrow characters common in proportional fonts. */
const NARROW_CHARS: Readonly<Record<string, number>> = {
  i: 0.278,
  l: 0.278,
  j: 0.278,
  f: 0.278,
  r: 0.333,
  t: 0.333,
  I: 0.278,
  '.': 0.278,
  ',': 0.278,
  ':': 0.278,
  ';': 0.278,
  '!': 0.278,
  '|': 0.26,
  ' ': 0.25,
};

/** Wide characters common in proportional fonts. */
const WIDE_CHARS: Readonly<Record<string, number>> = {
  m: 0.833,
  w: 0.833,
  M: 0.833,
  W: 0.944,
  '@': 1.0,
  '%': 0.889,
};

function buildProportionalAdvances(
  overrides: Readonly<Record<string, number>> = {},
): Readonly<Record<string, number>> {
  return { ...NARROW_CHARS, ...WIDE_CHARS, ...overrides, ' ': overrides[' '] ?? 0.25 };
}

// ─── Built-in font metrics ────────────────────────────────────────────────────

/** Helvetica normal metrics (proportional sans-serif). */
export const HELVETICA_NORMAL: FontMetricsData = {
  family: 'Helvetica',
  weight: 'normal',
  monospace: false,
  defaultAdvance: 0.52,
  charAdvances: buildProportionalAdvances(),
  ascender: 0.718,
  descender: 0.207,
  capHeight: 0.718,
  xHeight: 0.523,
  boldWidthMultiplier: 1.08,
};

/** Helvetica bold metrics. */
export const HELVETICA_BOLD: FontMetricsData = {
  ...HELVETICA_NORMAL,
  weight: 'bold',
};

/** Times-Roman normal metrics (proportional serif). */
export const TIMES_NORMAL: FontMetricsData = {
  family: 'Times-Roman',
  weight: 'normal',
  monospace: false,
  defaultAdvance: 0.45,
  charAdvances: buildProportionalAdvances({ ' ': 0.25 }),
  ascender: 0.683,
  descender: 0.217,
  capHeight: 0.662,
  xHeight: 0.45,
  boldWidthMultiplier: 1.1,
};

/** Times-Roman bold metrics. */
export const TIMES_BOLD: FontMetricsData = {
  ...TIMES_NORMAL,
  weight: 'bold',
};

/** Courier normal metrics (monospace). */
export const COURIER_NORMAL: FontMetricsData = {
  family: 'Courier',
  weight: 'normal',
  monospace: true,
  defaultAdvance: 0.6,
  charAdvances: {},
  ascender: 0.718,
  descender: 0.207,
  capHeight: 0.718,
  xHeight: 0.523,
  boldWidthMultiplier: 1.0,
};

/** Courier bold metrics. */
export const COURIER_BOLD: FontMetricsData = {
  ...COURIER_NORMAL,
  weight: 'bold',
};

/** All built-in font metrics data entries. */
export const BUILT_IN_FONT_METRICS: readonly FontMetricsData[] = [
  HELVETICA_NORMAL,
  HELVETICA_BOLD,
  TIMES_NORMAL,
  TIMES_BOLD,
  COURIER_NORMAL,
  COURIER_BOLD,
];

/**
 * Creates a `FontMetrics` instance from built-in data for the given family.
 * Falls back to Helvetica if the family is unknown.
 */
export function createBuiltInMetrics(family: string, weight: 'normal' | 'bold'): FontMetrics {
  const normalized = family.toLowerCase();

  let data: FontMetricsData | undefined;

  if (
    normalized.includes('courier') ||
    normalized.includes('mono') ||
    normalized.includes('consolas')
  ) {
    data = weight === 'bold' ? COURIER_BOLD : COURIER_NORMAL;
  } else if (
    normalized.includes('times') ||
    normalized.includes('serif') ||
    normalized.includes('georgia')
  ) {
    data = weight === 'bold' ? TIMES_BOLD : TIMES_NORMAL;
  } else {
    data = weight === 'bold' ? HELVETICA_BOLD : HELVETICA_NORMAL;
  }

  return new FontMetrics(data);
}
