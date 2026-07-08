import type { FontResolver } from './font-resolver.js';
import { ascenderHeight, lineBoxHeight, resolveTextStyle } from './text-style.js';
import type { BoundingBox, TextLine, TextMetrics, TextStyleInput } from './types.js';

/**
 * Measures text dimensions without performing line breaking.
 *
 * For multi-line text (containing `\n`), each line is measured independently
 * and stacked vertically using the style's line height.
 *
 * @example
 * const measurer = new TextMeasurer(resolver);
 * const metrics = measurer.measure('Hello', { fontFamily: 'Helvetica', fontSize: 16 });
 * console.log(metrics.width, metrics.height);
 */
export class TextMeasurer {
  private readonly _resolver: FontResolver;

  constructor(resolver: FontResolver) {
    this._resolver = resolver;
  }

  /**
   * Measures a text string and returns full metrics.
   *
   * @param text - Text to measure (may contain explicit `\n`).
   * @param styleInput - Typographic style (partial — defaults applied).
   */
  measure(text: string, styleInput: TextStyleInput): TextMetrics {
    const style = resolveTextStyle(styleInput);
    const metrics = this._resolver.resolveFromStyle(style);

    const rawLines = text.length === 0 ? [''] : text.split(/\r?\n/);
    const lineHeight = lineBoxHeight(style);
    const ascender = ascenderHeight(style);

    const lines: TextLine[] = [];
    let maxWidth = 0;
    let offset = 0;

    for (let i = 0; i < rawLines.length; i++) {
      const lineText = rawLines[i] ?? '';
      const lineWidth = metrics.stringWidth(lineText, style.fontSize, style.letterSpacing);
      const baseline = ascender + i * lineHeight;

      lines.push({
        text: lineText,
        width: lineWidth,
        baseline,
        startIndex: offset,
        endIndex: offset + lineText.length,
      });

      maxWidth = Math.max(maxWidth, lineWidth);
      offset += lineText.length + (i < rawLines.length - 1 ? 1 : 0);
    }

    const lineCount = Math.max(lines.length, 1);
    const height = lineCount * lineHeight;
    const boundingBox: BoundingBox = {
      x: 0,
      y: 0,
      width: maxWidth,
      height,
    };

    return {
      width: maxWidth,
      height,
      baseline: ascender,
      boundingBox,
      lineCount,
      lines,
    };
  }

  /**
   * Returns the advance width of a single character in points.
   */
  charWidth(char: string, styleInput: TextStyleInput): number {
    const style = resolveTextStyle(styleInput);
    const metrics = this._resolver.resolveFromStyle(style);
    return metrics.charWidth(char, style.fontSize, style.letterSpacing);
  }

  /**
   * Returns the advance width of a word in points.
   */
  wordWidth(word: string, styleInput: TextStyleInput): number {
    const style = resolveTextStyle(styleInput);
    const metrics = this._resolver.resolveFromStyle(style);
    return metrics.wordWidth(word, style.fontSize, style.letterSpacing);
  }

  /**
   * Returns the line box height for a style (fontSize × lineHeight).
   */
  lineHeight(styleInput: TextStyleInput): number {
    const style = resolveTextStyle(styleInput);
    return lineBoxHeight(style);
  }

  /**
   * Computes a bounding box for text at a given origin.
   */
  boundingBox(text: string, styleInput: TextStyleInput, originX = 0, originY = 0): BoundingBox {
    const m = this.measure(text, styleInput);
    return {
      x: originX,
      y: originY,
      width: m.width,
      height: m.height,
    };
  }
}
