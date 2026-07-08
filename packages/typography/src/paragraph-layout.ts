import type { FontResolver } from './font-resolver.js';
import { LineBreaker } from './line-breaker.js';
import { ascenderHeight, lineBoxHeight, resolveTextStyle } from './text-style.js';
import type {
  BoundingBox,
  HyphenationCallback,
  LayoutParagraphOptions,
  ParagraphLayoutResult,
  TextLine,
} from './types.js';
import { normalizeWhitespace } from './whitespace.js';

/**
 * Lays out a paragraph with word wrapping and returns positioned lines.
 *
 * Combines `LineBreaker` output with baseline positioning to produce a
 * complete `ParagraphLayoutResult` suitable for the layout engine.
 *
 * @example
 * const layout = new ParagraphLayout(resolver);
 * const result = layout.layout('Hello ReportForge', {
 *   fontFamily: 'Helvetica',
 *   fontSize: 16,
 *   maxWidth: 500,
 * });
 * console.log(result.lines.length, result.height);
 */
export class ParagraphLayout {
  private readonly _resolver: FontResolver;
  private readonly _lineBreaker: LineBreaker;

  constructor(resolver: FontResolver, lineBreaker?: LineBreaker) {
    this._resolver = resolver;
    this._lineBreaker = lineBreaker ?? new LineBreaker();
  }

  /**
   * Lays out a paragraph with word wrapping to `maxWidth`.
   *
   * @param text - Paragraph text content.
   * @param options - Style and layout constraints.
   * @param hyphenate - Optional hyphenation callback for overlong words.
   */
  layout(
    text: string,
    options: LayoutParagraphOptions,
    hyphenate?: HyphenationCallback,
  ): ParagraphLayoutResult {
    const style = resolveTextStyle(options);
    const metrics = this._resolver.resolveFromStyle(style);

    const shouldNormalize = options.normalizeWhitespace ?? true;
    const normalizedText = shouldNormalize ? normalizeWhitespace(text) : text;

    const maxWidth = options.maxWidth;
    const lineBox = lineBoxHeight(style);
    const ascender = ascenderHeight(style);

    const brokenLines = this._lineBreaker.breakText(
      normalizedText,
      metrics,
      style.fontSize,
      style.letterSpacing,
      maxWidth,
      hyphenate,
    );

    const lines: TextLine[] = brokenLines.map((broken, index) => ({
      text: broken.text,
      width: broken.width,
      baseline: ascender + index * lineBox,
      startIndex: broken.startIndex,
      endIndex: broken.endIndex,
    }));

    const lineCount = Math.max(lines.length, 1);
    const contentWidth = lines.reduce((max, line) => Math.max(max, line.width), 0);
    const height = lineCount * lineBox;

    const boundingBox: BoundingBox = {
      x: 0,
      y: 0,
      width: Math.min(contentWidth, maxWidth),
      height,
    };

    return {
      text: normalizedText,
      maxWidth,
      style,
      width: contentWidth,
      height,
      baseline: ascender,
      boundingBox,
      lineCount,
      lines,
    };
  }
}
