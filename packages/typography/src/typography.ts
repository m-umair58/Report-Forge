import { FontRegistry } from './font-registry.js';
import { FontResolver } from './font-resolver.js';
import { LineBreaker } from './line-breaker.js';
import { ParagraphLayout } from './paragraph-layout.js';
import { TextMeasurer } from './text-measurer.js';
import type {
  HyphenationCallback,
  LayoutParagraphOptions,
  MeasureOptions,
  ParagraphLayoutResult,
  TextMetrics,
} from './types.js';

/**
 * The ReportForge Typography Engine.
 *
 * Provides renderer-independent text measurement and paragraph layout.
 * This package computes dimensions only — it never draws or generates output.
 *
 * ## Pipeline position
 *
 * ```
 * @reportforge/typography  (text → measurements)
 *        ↓
 * @reportforge/layout     (uses measurements for positioning)
 *        ↓
 * @reportforge/display-list
 *        ↓
 * @reportforge/renderer-pdf
 * ```
 *
 * ## Terminology
 *
 * | Term            | Meaning                                                |
 * |-----------------|--------------------------------------------------------|
 * | **Measure**     | Compute width/height of text without wrapping          |
 * | **Layout**      | Break text into lines and compute paragraph dimensions |
 * | **Advance width**| Horizontal distance a string occupies                 |
 * | **Line box**    | Vertical space allocated per line (fontSize × lineHeight)|
 * | **Baseline**    | The invisible line on which characters sit              |
 *
 * ## Quick start
 *
 * ```typescript
 * import { TypographyEngine } from '@reportforge/typography';
 *
 * const typography = new TypographyEngine();
 *
 * // Measure a single line
 * const metrics = typography.measure('Hello ReportForge', {
 *   fontFamily: 'Helvetica',
 *   fontSize: 16,
 * });
 * console.log(metrics.width, metrics.height);
 *
 * // Layout a wrapped paragraph
 * const paragraph = typography.layoutParagraph(longText, {
 *   fontFamily: 'Helvetica',
 *   fontSize: 12,
 *   maxWidth: 500,
 * });
 * console.log(paragraph.lines.length, paragraph.height);
 * ```
 *
 * ## Renderer independence
 *
 * The typography engine uses built-in font metrics tables — no font files,
 * no PDF libraries, no Canvas APIs. Renderers may use exact glyph metrics
 * at draw time; the layout engine uses these measurements for positioning.
 */
export class TypographyEngine {
  /** Unique identifier for this engine implementation. */
  readonly name = 'reportforge-typography-engine' as const;

  /** Font metrics registry. */
  readonly fontRegistry: FontRegistry;

  /** Font family resolver. */
  readonly fontResolver: FontResolver;

  /** Text measurement utility. */
  readonly textMeasurer: TextMeasurer;

  /** Line breaking utility. */
  readonly lineBreaker: LineBreaker;

  /** Paragraph layout utility. */
  readonly paragraphLayout: ParagraphLayout;

  /**
   * Creates a new TypographyEngine with built-in font metrics.
   *
   * @param strictFonts - When true, unknown font families throw instead of
   *                      falling back to Helvetica.
   */
  constructor(strictFonts = false) {
    this.fontRegistry = new FontRegistry();
    this.fontResolver = new FontResolver(this.fontRegistry, strictFonts);
    this.textMeasurer = new TextMeasurer(this.fontResolver);
    this.lineBreaker = new LineBreaker();
    this.paragraphLayout = new ParagraphLayout(this.fontResolver, this.lineBreaker);
  }

  /**
   * Measures a text string and returns width, height, baseline, and lines.
   *
   * Does not perform word wrapping — use `layoutParagraph()` for that.
   * Explicit newlines (`\n`) produce multiple lines.
   *
   * @param text - Text to measure.
   * @param options - Typographic style (fontFamily and fontSize required).
   *
   * @example
   * const metrics = typography.measure('Hello ReportForge', {
   *   fontFamily: 'Helvetica',
   *   fontSize: 16,
   * });
   */
  measure(text: string, options: MeasureOptions): TextMetrics {
    return this.textMeasurer.measure(text, options);
  }

  /**
   * Lays out a paragraph with word wrapping to fit `maxWidth`.
   *
   * Returns positioned lines with baselines, total height, and bounding box.
   *
   * @param text - Paragraph text content.
   * @param options - Style and `maxWidth` constraint.
   * @param hyphenate - Optional hyphenation callback for overlong words.
   *
   * @example
   * const paragraph = typography.layoutParagraph(text, {
   *   fontFamily: 'Helvetica',
   *   fontSize: 12,
   *   maxWidth: 500,
   * });
   */
  layoutParagraph(
    text: string,
    options: LayoutParagraphOptions,
    hyphenate?: HyphenationCallback,
  ): ParagraphLayoutResult {
    return this.paragraphLayout.layout(text, options, hyphenate);
  }

  /**
   * Returns the advance width of a single character in points.
   */
  charWidth(char: string, options: MeasureOptions): number {
    return this.textMeasurer.charWidth(char, options);
  }

  /**
   * Returns the advance width of a word in points.
   */
  wordWidth(word: string, options: MeasureOptions): number {
    return this.textMeasurer.wordWidth(word, options);
  }
}
