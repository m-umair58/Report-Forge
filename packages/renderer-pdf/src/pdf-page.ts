import type { PDFPage as PdfLibPage } from 'pdf-lib';

import type { DrawLineCommand, DrawTextCommand } from '@reportforge/display-list';

import { parseColorWithNames } from './colors.js';
import { textBaselineY, toPageY } from './coordinates.js';
import type { FontManager } from './fonts.js';

/**
 * A single page in a PDF document.
 *
 * Wraps a pdf-lib page and exposes only the drawing operations supported by
 * the minimal vertical-slice renderer: text and lines.
 *
 * Coordinate conversion from the display-list top-left origin to pdf-lib's
 * bottom-left origin is handled internally.
 */
export class PdfPage {
  /** Page width in points. */
  readonly width: number;

  /** Page height in points. */
  readonly height: number;

  constructor(
    private readonly _page: PdfLibPage,
    width: number,
    height: number,
    private readonly _fontManager: FontManager,
  ) {
    this.width = width;
    this.height = height;
  }

  /**
   * Renders a `draw-text` display command onto this page.
   */
  drawText(cmd: DrawTextCommand, warnings: string[]): void {
    if (cmd.text.length === 0) return;

    const color = parseColorWithNames(cmd.color);
    if (color === null) {
      warnings.push(
        `[draw-text] Cannot parse color '${cmd.color}' for node '${cmd.sourceNodeId}' — skipping`,
      );
      return;
    }

    const font = this._fontManager.resolve(cmd.font, cmd.fontWeight);
    const pdfY = textBaselineY(cmd.y, cmd.fontSize, this.height);

    this._page.drawText(cmd.text, {
      x: cmd.x,
      y: pdfY,
      size: cmd.fontSize,
      font,
      color,
      maxWidth: cmd.width,
      lineHeight: cmd.fontSize * cmd.lineHeight,
      opacity: cmd.opacity,
    });
  }

  /**
   * Renders a `draw-line` display command onto this page.
   */
  drawLine(cmd: DrawLineCommand, warnings: string[]): void {
    const color = parseColorWithNames(cmd.color);
    if (color === null) {
      warnings.push(
        `[draw-line] Cannot parse color '${cmd.color}' for node '${cmd.sourceNodeId}' — skipping`,
      );
      return;
    }

    this._page.drawLine({
      start: { x: cmd.x1, y: toPageY(cmd.y1, this.height) },
      end: { x: cmd.x2, y: toPageY(cmd.y2, this.height) },
      thickness: cmd.width > 0 ? cmd.width : 0.5,
      color,
      opacity: cmd.opacity,
    });
  }
}
