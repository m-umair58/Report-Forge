import { rgb, type PDFPage } from 'pdf-lib';

import type { DisplayCommand, DisplayPage } from '@reportforge/display-list';

import { parseColorWithNames } from './colors.js';
import { rectOriginToPageY } from './coordinates.js';
import type { FontManager } from './fonts.js';
import { ImageRenderer } from './image-renderer.js';
import type { ImageManager } from './images.js';
import { ShapeRenderer } from './shape-renderer.js';
import { TextRenderer } from './text-renderer.js';

const PLACEHOLDER_FILL = rgb(0.93, 0.93, 0.93);
const PLACEHOLDER_BORDER = rgb(0.7, 0.7, 0.7);
const PLACEHOLDER_TEXT = rgb(0.4, 0.4, 0.4);

/**
 * Renders all display commands for a single PDF page.
 */
export class PageRenderer {
  private readonly _textRenderer: TextRenderer;
  private readonly _shapeRenderer: ShapeRenderer;
  private readonly _imageRenderer: ImageRenderer;
  private readonly _fontManager: FontManager;

  constructor(fontManager: FontManager, imageManager: ImageManager) {
    this._fontManager = fontManager;
    this._textRenderer = new TextRenderer(fontManager);
    this._shapeRenderer = new ShapeRenderer();
    this._imageRenderer = new ImageRenderer(imageManager, fontManager);
  }

  /** Draws a full-page background colour before any commands are rendered. */
  drawBackground(page: PDFPage, displayPage: DisplayPage, backgroundColor: string | null): void {
    if (backgroundColor === null) return;

    const color = parseColorWithNames(backgroundColor);
    if (color === null) return;

    const pdfY = rectOriginToPageY(0, displayPage.height, displayPage.height);

    page.drawRectangle({
      x: 0,
      y: pdfY,
      width: displayPage.width,
      height: displayPage.height,
      color,
    });
  }

  async renderCommands(
    page: PDFPage,
    displayPage: DisplayPage,
    warnings: string[],
  ): Promise<void> {
    for (const command of displayPage.commands) {
      await this.renderCommand(page, command, displayPage.height, warnings);
    }
  }

  private async renderCommand(
    page: PDFPage,
    command: DisplayCommand,
    pageHeight: number,
    warnings: string[],
  ): Promise<void> {
    switch (command.kind) {
      case 'draw-text':
        this._textRenderer.render(page, command, pageHeight, warnings);
        break;

      case 'draw-rectangle':
        this._shapeRenderer.renderRectangle(page, command, pageHeight, warnings);
        break;

      case 'draw-line':
        this._shapeRenderer.renderLine(page, command, pageHeight, warnings);
        break;

      case 'draw-circle':
        this._shapeRenderer.renderCircle(page, command, pageHeight, warnings);
        break;

      case 'draw-ellipse':
        this._shapeRenderer.renderEllipse(page, command, pageHeight, warnings);
        break;

      case 'draw-image':
        await this._imageRenderer.render(page, command, pageHeight, warnings);
        break;

      case 'draw-table':
        this.renderTablePlaceholder(page, command, pageHeight, warnings);
        break;

      case 'draw-qr-code':
        this.renderSimplePlaceholder(page, command, pageHeight, warnings, 'draw-qr-code', 'QR Code');
        break;

      case 'draw-barcode':
        this.renderSimplePlaceholder(
          page,
          command,
          pageHeight,
          warnings,
          'draw-barcode',
          `Barcode (${command.format})`,
        );
        break;

      case 'draw-path':
        warnings.push(
          `[draw-path] SVG path rendering is not yet implemented — ` +
            `skipping node '${command.sourceNodeId}'`,
        );
        break;

      case 'draw-polygon':
        warnings.push(
          `[draw-polygon] Polygon rendering is not yet implemented — ` +
            `skipping node '${command.sourceNodeId}'`,
        );
        break;

      default: {
        const unknown = command as { kind: string; sourceNodeId: string };
        warnings.push(
          `[${unknown.kind}] Unsupported command — skipping node '${unknown.sourceNodeId}'`,
        );
      }
    }
  }

  private renderTablePlaceholder(
    page: PDFPage,
    command: Extract<DisplayCommand, { kind: 'draw-table' }>,
    pageHeight: number,
    warnings: string[],
  ): void {
    warnings.push(
      `[draw-table] Full table rendering is not yet implemented — ` +
        `drawing placeholder for node '${command.sourceNodeId}'`,
    );

    const pdfY = rectOriginToPageY(command.y, command.height, pageHeight);
    page.drawRectangle({
      x: command.x,
      y: pdfY,
      width: command.width,
      height: command.height,
      color: PLACEHOLDER_FILL,
      borderColor: PLACEHOLDER_BORDER,
      borderWidth: 0.5,
      opacity: command.opacity,
    });

    if (command.width > 20 && command.height > 10) {
      const font = this._fontManager.resolve('Helvetica', 'normal');
      const fontSize = Math.min(9, command.height * 0.35);
      const label =
        command.columns.length > 0
          ? `Table (${command.columns.length.toString()} cols × ${command.rows.length.toString()} rows)`
          : 'Table (placeholder)';

      page.drawText(label, {
        x: command.x + 4,
        y: pdfY + command.height / 2 - fontSize * 0.5,
        size: fontSize,
        font,
        color: PLACEHOLDER_TEXT,
        maxWidth: command.width - 8,
        opacity: command.opacity,
      });
    }
  }

  private renderSimplePlaceholder(
    page: PDFPage,
    command: {
      x: number;
      y: number;
      width: number;
      height: number;
      opacity: number;
      sourceNodeId: string;
    },
    pageHeight: number,
    warnings: string[],
    kind: string,
    label: string,
  ): void {
    warnings.push(
      `[${kind}] Rendering is not yet implemented — ` +
        `drawing placeholder for node '${command.sourceNodeId}'`,
    );

    const pdfY = rectOriginToPageY(command.y, command.height, pageHeight);
    page.drawRectangle({
      x: command.x,
      y: pdfY,
      width: command.width,
      height: command.height,
      color: PLACEHOLDER_FILL,
      borderColor: PLACEHOLDER_BORDER,
      borderWidth: 0.5,
      opacity: command.opacity,
    });

    if (command.width > 20 && command.height > 10) {
      const font = this._fontManager.resolve('Helvetica', 'normal');
      const fontSize = Math.min(8, command.height * 0.3);
      page.drawText(label, {
        x: command.x + 4,
        y: pdfY + command.height / 2 - fontSize * 0.5,
        size: fontSize,
        font,
        color: PLACEHOLDER_TEXT,
        maxWidth: command.width - 8,
        opacity: command.opacity,
      });
    }
  }
}
