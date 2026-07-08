import type { FontMetrics } from './font-metrics.js';
import type { HyphenationCallback } from './types.js';
import { tokenizeWords } from './whitespace.js';

// ─── Line break result ────────────────────────────────────────────────────────

/**
 * A single broken line before baseline/position assignment.
 */
export interface BrokenLine {
  readonly text: string;
  readonly width: number;
  readonly startIndex: number;
  readonly endIndex: number;
}

// ─── LineBreaker ──────────────────────────────────────────────────────────────

/**
 * Breaks text into lines that fit within a maximum width.
 *
 * Implements greedy word-boundary wrapping:
 * 1. Split input on explicit newlines (`\n`).
 * 2. For each segment, tokenize into words.
 * 3. Greedily pack words onto lines without exceeding `maxWidth`.
 * 4. If a single word exceeds `maxWidth`, invoke the hyphenation callback
 *    (or place it on its own line as overflow).
 *
 * ## Hyphenation (future)
 *
 * Pass a `HyphenationCallback` to enable syllable-based word breaking.
 * The default behaviour places overlong words on their own line.
 *
 * @example
 * const breaker = new LineBreaker();
 * const lines = breaker.breakText('Hello world', metrics, 12, 0, 200);
 */
export class LineBreaker {
  /**
   * Breaks a single line segment (no embedded newlines) into wrapped lines.
   */
  breakSegment(
    segment: string,
    metrics: FontMetrics,
    fontSize: number,
    letterSpacing: number,
    maxWidth: number,
    startOffset: number,
    hyphenate?: HyphenationCallback,
  ): BrokenLine[] {
    if (segment.length === 0) {
      return [{ text: '', width: 0, startIndex: startOffset, endIndex: startOffset }];
    }

    const words = tokenizeWords(segment);
    const lines: BrokenLine[] = [];
    let currentLine = '';
    let currentWidth = 0;
    let lineStart = startOffset;
    let charOffset = startOffset;

    const spaceWidth = metrics.charWidth(' ', fontSize, letterSpacing);

    const measureWord = (word: string): number => metrics.wordWidth(word, fontSize, letterSpacing);

    const flushLine = (): void => {
      const width =
        currentLine.length > 0 ? metrics.stringWidth(currentLine, fontSize, letterSpacing) : 0;
      lines.push({
        text: currentLine,
        width,
        startIndex: lineStart,
        endIndex: charOffset,
      });
      currentLine = '';
      currentWidth = 0;
      lineStart = charOffset;
    };

    for (const word of words) {
      const wordWidth = measureWord(word);

      if (wordWidth > maxWidth && currentLine.length === 0) {
        const breakIndex = hyphenate?.(word, maxWidth, (w) => measureWord(w)) ?? null;

        if (breakIndex !== null && breakIndex > 0 && breakIndex < word.length) {
          const first = word.slice(0, breakIndex);
          const rest = word.slice(breakIndex);
          lines.push({
            text: first,
            width: measureWord(first),
            startIndex: charOffset,
            endIndex: charOffset + breakIndex,
          });
          charOffset += breakIndex;
          currentLine = rest;
          currentWidth = measureWord(rest);
          lineStart = charOffset;
        } else {
          lines.push({
            text: word,
            width: wordWidth,
            startIndex: charOffset,
            endIndex: charOffset + word.length,
          });
          charOffset += word.length;
          lineStart = charOffset;
        }
        continue;
      }

      const spaceNeeded = currentLine.length > 0 ? spaceWidth + wordWidth : wordWidth;

      if (currentWidth + spaceNeeded <= maxWidth || currentLine.length === 0) {
        if (currentLine.length > 0) {
          currentLine += ' ';
          currentWidth += spaceWidth;
          charOffset += 1;
        }
        currentLine += word;
        currentWidth += wordWidth;
        charOffset += word.length;
      } else {
        flushLine();
        currentLine = word;
        currentWidth = wordWidth;
        charOffset += word.length;
      }
    }

    if (currentLine.length > 0 || lines.length === 0) {
      flushLine();
    }

    return lines;
  }

  /**
   * Breaks full text (possibly multi-line) into wrapped lines.
   *
   * @param text - Input text (may contain `\n`).
   * @param metrics - Font metrics for width calculation.
   * @param fontSize - Font size in points.
   * @param letterSpacing - Letter spacing in points.
   * @param maxWidth - Maximum line width in points.
   * @param hyphenate - Optional hyphenation callback.
   */
  breakText(
    text: string,
    metrics: FontMetrics,
    fontSize: number,
    letterSpacing: number,
    maxWidth: number,
    hyphenate?: HyphenationCallback,
  ): BrokenLine[] {
    if (text.length === 0) {
      return [{ text: '', width: 0, startIndex: 0, endIndex: 0 }];
    }

    const segments = text.split(/\r?\n/);
    const allLines: BrokenLine[] = [];
    let offset = 0;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i] ?? '';
      const segmentLines = this.breakSegment(
        segment,
        metrics,
        fontSize,
        letterSpacing,
        maxWidth,
        offset,
        hyphenate,
      );
      allLines.push(...segmentLines);

      offset += segment.length;
      if (i < segments.length - 1) {
        offset += 1; // account for the newline character
      }
    }

    return allLines;
  }
}
