import { type PDFPage, rgb } from 'pdf-lib';

import type { DrawImageCommand } from '@reportforge/display-list';

import { rectOriginToPageY } from './coordinates.js';
import type { FontManager } from './fonts.js';
import type { ImageManager } from './images.js';

const PLACEHOLDER_FILL = rgb(0.93, 0.93, 0.93);
const PLACEHOLDER_BORDER = rgb(0.7, 0.7, 0.7);
const PLACEHOLDER_TEXT_COLOR = rgb(0.4, 0.4, 0.4);

/**
 * Renders `draw-image` display commands with PNG/JPEG embedding and scaling.
 */
export class ImageRenderer {
  constructor(
    private readonly _imageManager: ImageManager,
    private readonly _fontManager: FontManager,
  ) {}

  async render(
    page: PDFPage,
    cmd: DrawImageCommand,
    pageHeight: number,
    warnings: string[],
  ): Promise<void> {
    if (
      !isFinite(cmd.x) ||
      !isFinite(cmd.y) ||
      !isFinite(cmd.width) ||
      !isFinite(cmd.height) ||
      cmd.width <= 0 ||
      cmd.height <= 0
    ) {
      warnings.push(`[draw-image] Invalid dimensions for node '${cmd.sourceNodeId}' — skipping`);
      return;
    }

    if (cmd.rotation !== 0) {
      warnings.push(
        `[draw-image] rotation=${cmd.rotation.toString()}° is not yet supported ` +
          `(node '${cmd.sourceNodeId}')`,
      );
    }

    if (cmd.src.length === 0) {
      this.drawPlaceholder(page, cmd, pageHeight, warnings, 'missing image source');
      return;
    }

    const embedded = await this._imageManager.embed(cmd.src, warnings);
    if (embedded === null) {
      this.drawPlaceholder(page, cmd, pageHeight, warnings, `could not load '${cmd.src}'`);
      return;
    }

    const placement = this._imageManager.computePlacement(
      embedded.width,
      embedded.height,
      cmd.x,
      cmd.y,
      cmd.width,
      cmd.height,
    );

    const pdfY = rectOriginToPageY(placement.y, placement.height, pageHeight);

    page.drawImage(embedded.image, {
      x: placement.x,
      y: pdfY,
      width: placement.width,
      height: placement.height,
      opacity: cmd.opacity,
    });
  }

  private drawPlaceholder(
    page: PDFPage,
    cmd: DrawImageCommand,
    pageHeight: number,
    warnings: string[],
    reason: string,
  ): void {
    warnings.push(`[draw-image] ${reason} for node '${cmd.sourceNodeId}' — drawing placeholder`);

    const pdfY = rectOriginToPageY(cmd.y, cmd.height, pageHeight);
    const label = this._imageManager.placeholderLabel(cmd.src, cmd.alt);

    page.drawRectangle({
      x: cmd.x,
      y: pdfY,
      width: cmd.width,
      height: cmd.height,
      color: PLACEHOLDER_FILL,
      borderColor: PLACEHOLDER_BORDER,
      borderWidth: 0.5,
      opacity: cmd.opacity,
    });

    if (cmd.width > 20 && cmd.height > 10) {
      const font = this._fontManager.resolve('Helvetica', 'normal');
      const fontSize = Math.min(10, cmd.height * 0.4);
      page.drawText(label, {
        x: cmd.x + 4,
        y: pdfY + cmd.height / 2 - fontSize * 0.5,
        size: fontSize,
        font,
        color: PLACEHOLDER_TEXT_COLOR,
        maxWidth: cmd.width - 8,
        opacity: cmd.opacity,
      });
    }
  }
}
