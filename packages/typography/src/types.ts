/**
 * Typography types for the ReportForge measurement subsystem.
 *
 * All spatial values are in **points (pt)** — the same unit used by the
 * layout engine and display list. Coordinates use a **top-left origin**
 * with Y increasing downward (consistent with CSS and the display list).
 */

// ─── Font & style ─────────────────────────────────────────────────────────────

/** Font weight for text measurement. */
export type FontWeight = 'normal' | 'bold';

/** Horizontal text alignment. */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * Complete typographic style for a text run.
 *
 * Describes how text should be measured — not how it should be drawn.
 * Renderers use these values to select fonts and apply visual effects.
 */
export interface TextStyle {
  /** Font family name (e.g. 'Helvetica', 'Times-Roman', 'Courier'). */
  readonly fontFamily: string;
  /** Font size in points. */
  readonly fontSize: number;
  /** Font weight. @default 'normal' */
  readonly fontWeight?: FontWeight;
  /**
   * Italic style (placeholder — does not affect metrics in this milestone).
   * @default false
   */
  readonly italic?: boolean;
  /**
   * Underline decoration (placeholder — does not affect metrics).
   * @default false
   */
  readonly underline?: boolean;
  /** Additional spacing between characters, in points. @default 0 */
  readonly letterSpacing?: number;
  /** Line height multiplier (e.g. 1.2). @default 1.2 */
  readonly lineHeight?: number;
  /** Horizontal alignment within the layout box. @default 'left' */
  readonly textAlign?: TextAlign;
}

/** Partial style overrides merged onto defaults. */
export type TextStyleInput = Partial<TextStyle> & Pick<TextStyle, 'fontFamily' | 'fontSize'>;

// ─── Geometry ─────────────────────────────────────────────────────────────────

/**
 * An axis-aligned bounding box in points.
 *
 * `(x, y)` is the top-left corner. `width` and `height` are non-negative.
 */
export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * A single laid-out line of text within a paragraph.
 *
 * `baseline` is the Y coordinate of the text baseline (from the top of the
 * paragraph bounding box). `width` is the advance width of the line content.
 */
export interface TextLine {
  /** The text content of this line (after wrapping). */
  readonly text: string;
  /** Advance width of the line in points. */
  readonly width: number;
  /** Y coordinate of the baseline relative to the paragraph top. */
  readonly baseline: number;
  /** Index of the first character in the original source string. */
  readonly startIndex: number;
  /** Index after the last character in this line (exclusive). */
  readonly endIndex: number;
}

// ─── Measurement results ──────────────────────────────────────────────────────

/**
 * Result of measuring a text string (single or multi-line).
 *
 * For single-line text, `lines` contains one entry and `lineCount` is 1.
 */
export interface TextMetrics {
  /** Advance width of the widest line, in points. */
  readonly width: number;
  /** Total height including line spacing, in points. */
  readonly height: number;
  /** Y coordinate of the first line's baseline (from top). */
  readonly baseline: number;
  /** Axis-aligned bounding box enclosing all lines. */
  readonly boundingBox: BoundingBox;
  /** Number of lines. */
  readonly lineCount: number;
  /** Individual line measurements. */
  readonly lines: readonly TextLine[];
}

/**
 * Result of laying out a paragraph with word wrapping.
 *
 * Extends `TextMetrics` with the resolved style and content width constraint.
 */
export interface ParagraphLayoutResult extends TextMetrics {
  /** The original (possibly normalized) source text. */
  readonly text: string;
  /** Maximum width constraint used for wrapping, in points. */
  readonly maxWidth: number;
  /** Resolved typographic style used for measurement. */
  readonly style: Readonly<ResolvedTextStyle>;
}

/** A fully resolved `TextStyle` with all optional fields filled in. */
export interface ResolvedTextStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: FontWeight;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly letterSpacing: number;
  readonly lineHeight: number;
  readonly textAlign: TextAlign;
}

// ─── Options ──────────────────────────────────────────────────────────────────

/** Options for `TypographyEngine.measure()`. */
export type MeasureOptions = TextStyleInput;

/** Options for `TypographyEngine.layoutParagraph()`. */
export interface LayoutParagraphOptions extends TextStyleInput {
  /** Maximum line width before wrapping, in points. */
  readonly maxWidth: number;
  /**
   * When true, collapses consecutive whitespace and trims line edges.
   * Explicit newlines (`\n`) are always preserved.
   * @default true
   */
  readonly normalizeWhitespace?: boolean;
}

/**
 * Optional hyphenation callback for future word-breaking extensions.
 *
 * Called when a word exceeds `maxWidth` and the line breaker considers
 * splitting it. Return the index at which to break, or `null` to move the
 * whole word to the next line.
 *
 * TODO (future): Integrate a hyphenation dictionary (e.g. en-us patterns).
 */
export type HyphenationCallback = (
  word: string,
  maxWidth: number,
  measureWord: (word: string) => number,
) => number | null;
