import type { PDFPage, PDFFont } from 'pdf-lib';

import type { DrawTextCommand } from '@reportforge/display-list';

import { parseColorWithNames } from './colors.js';
import { textBaselineY } from './coordinates.js';
import type { FontManager } from './fonts.js';

/**
 * Renders `draw-text` display commands onto a PDF page.
 */
export class TextRenderer {
  constructor(private readonly _fontManager: FontManager) {}

  render(page: PDFPage, cmd: DrawTextCommand, pageHeight: number, warnings: string[]): void {
    if (cmd.text.length === 0) return;

    if (!isFinite(cmd.x) || !isFinite(cmd.y) || !isFinite(cmd.width) || cmd.width < 0) {
      warnings.push(
        `[draw-text] Invalid coordinates for node '${cmd.sourceNodeId}' — skipping`,
      );
      return;
    }

    if (cmd.rotation !== 0) {
      warnings.push(
        `[draw-text] rotation=${cmd.rotation.toString()}° is not yet supported ` +
          `(node '${cmd.sourceNodeId}')`,
      );
    }

    const color = parseColorWithNames(cmd.color);
    if (color === null) {
      warnings.push(
        `[draw-text] Cannot parse color '${cmd.color}' for node '${cmd.sourceNodeId}' — skipping`,
      );
      return;
    }

    let font: PDFFont;
    try {
      font = this._fontManager.resolve(cmd.font, cmd.fontWeight);
    } catch {
      warnings.push(
        `[draw-text] Missing font '${cmd.font}' (${cmd.fontWeight}) for node ` +
          `'${cmd.sourceNodeId}' — using Helvetica`,
      );
      font = this._fontManager.resolve('Helvetica', 'normal');
    }

    const pdfY = textBaselineY(cmd.y, cmd.fontSize, pageHeight);
    const x = resolveTextX(cmd, font);

    const drawOptions: Parameters<PDFPage['drawText']>[1] = {
      x,
      y: pdfY,
      size: cmd.fontSize,
      font,
      color,
      lineHeight: cmd.fontSize * cmd.lineHeight,
      opacity: cmd.opacity,
    };

    if (cmd.width > 0) {
      drawOptions.maxWidth = cmd.width;
    }

    page.drawText(cmd.text, drawOptions);
  }
}

function resolveTextX(cmd: DrawTextCommand, font: PDFFont): number {
  if (cmd.textAlign === 'left' || cmd.textAlign === 'justify' || cmd.width <= 0) {
    return cmd.x;
  }

  const textWidth = font.widthOfTextAtSize(cmd.text, cmd.fontSize);

  if (cmd.textAlign === 'center') {
    return cmd.x + Math.max(0, (cmd.width - textWidth) / 2);
  }

  if (cmd.textAlign === 'right') {
    return cmd.x + Math.max(0, cmd.width - textWidth);
  }

  return cmd.x;
}
