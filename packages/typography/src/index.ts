/**
 * @reportforge/typography
 *
 * Renderer-independent text measurement and paragraph layout for ReportForge.
 *
 * ## Responsibilities
 *
 * - Measure single-line and multi-line text dimensions
 * - Break paragraphs into wrapped lines
 * - Compute bounding boxes, baselines, and line counts
 * - Resolve font metrics for built-in families (Helvetica, Times-Roman, Courier)
 *
 * ## What this package does NOT do
 *
 * - Draw or render text (that's the renderer's job)
 * - Generate PDFs or any output bytes
 * - Position elements on pages (that's the layout engine's job)
 * - Load font files (uses built-in metrics tables)
 *
 * ## Quick start
 *
 * ```typescript
 * import { TypographyEngine } from '@reportforge/typography';
 *
 * const typography = new TypographyEngine();
 *
 * const metrics = typography.measure('Hello ReportForge', {
 *   fontFamily: 'Helvetica',
 *   fontSize: 16,
 * });
 *
 * const paragraph = typography.layoutParagraph(longText, {
 *   fontFamily: 'Helvetica',
 *   fontSize: 12,
 *   maxWidth: 500,
 * });
 * ```
 */

// ─── Engine ───────────────────────────────────────────────────────────────────

export { TypographyEngine } from './typography.js';

// ─── Core classes ─────────────────────────────────────────────────────────────

export {
  FontMetrics,
  BUILT_IN_FONT_METRICS,
  HELVETICA_NORMAL,
  createBuiltInMetrics,
} from './font-metrics.js';
export type { FontMetricsData } from './font-metrics.js';
export { FontRegistry } from './font-registry.js';
export { FontResolver } from './font-resolver.js';
export { LineBreaker } from './line-breaker.js';
export type { BrokenLine } from './line-breaker.js';
export { TextMeasurer } from './text-measurer.js';
export { ParagraphLayout } from './paragraph-layout.js';

// ─── Text style ─────────────────────────────────────────────────────────────

export {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_LETTER_SPACING,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_TEXT_ALIGN,
  ascenderHeight,
  createTextStyle,
  lineBoxHeight,
  resolveTextStyle,
} from './text-style.js';
export type { TextStyle } from './text-style.js';

// ─── Whitespace ─────────────────────────────────────────────────────────────

export { normalizeWhitespace, splitOnNewlines, tokenizeWords } from './whitespace.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type {
  BoundingBox,
  FontWeight,
  HyphenationCallback,
  LayoutParagraphOptions,
  MeasureOptions,
  ParagraphLayoutResult,
  ResolvedTextStyle,
  TextAlign,
  TextLine,
  TextMetrics,
  TextStyleInput,
} from './types.js';

// ─── Errors ───────────────────────────────────────────────────────────────────

export { FontNotFoundError, TypographyError } from './errors.js';

// ─── Package identity ─────────────────────────────────────────────────────────

/** Package identifier for @reportforge/typography. */
export const PACKAGE_NAME = '@reportforge/typography' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
