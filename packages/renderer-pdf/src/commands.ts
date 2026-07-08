import { type PDFPage, rgb } from 'pdf-lib';

import type {
  DisplayCommand,
  DrawBarcodeCommand,
  DrawCircleCommand,
  DrawEllipseCommand,
  DrawImageCommand,
  DrawLineCommand,
  DrawQRCodeCommand,
  DrawRectangleCommand,
  DrawTableCommand,
  DrawTextCommand,
} from '@reportforge/display-list';

import { parseColorWithNames } from './colors.js';
import { rectOriginToPageY, textBaselineY, toPageY } from './coordinates.js';
import type { FontManager } from './fonts.js';
import type { ImageManager } from './images.js';

// ─── Internal placeholder color ───────────────────────────────────────────────

const PLACEHOLDER_FILL = rgb(0.93, 0.93, 0.93);
const PLACEHOLDER_BORDER = rgb(0.7, 0.7, 0.7);
const PLACEHOLDER_TEXT_COLOR = rgb(0.4, 0.4, 0.4);

// ─── Per-command draw handlers ────────────────────────────────────────────────

/**
 * Draws a text string on a PDF page.
 *
 * The display list provides the bounding box top-left; pdf-lib positions text
 * by baseline. We use `textBaselineY()` for the coordinate conversion.
 *
 * Text wrapping is NOT implemented in this milestone — long lines will overflow
 * the bounding box.
 *
 * TODO (future): Implement word wrapping using `font.widthOfTextAtSize()`.
 * TODO (future): Support italic, underline, and strikethrough text decorations.
 */
function handleDrawText(
  page: PDFPage,
  cmd: DrawTextCommand,
  pageHeight: number,
  fontManager: FontManager,
  warnings: string[],
): void {
  if (cmd.text.length === 0) return;

  const color = parseColorWithNames(cmd.color);
  if (color === null) {
    warnings.push(
      `[draw-text] Cannot parse color '${cmd.color}' for node '${cmd.sourceNodeId}' — skipping`,
    );
    return;
  }

  const font = fontManager.resolve(cmd.font, cmd.fontWeight);
  const pdfY = textBaselineY(cmd.y, cmd.fontSize, pageHeight);

  page.drawText(cmd.text, {
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
 * Draws a filled/stroked rectangle on a PDF page.
 *
 * Corner radius is not yet supported by pdf-lib's `drawRectangle`.
 *
 * TODO (future): Implement rounded rectangles using `page.drawSvgPath()` with
 *                an SVG arc path when `cmd.cornerRadius > 0`.
 */
function handleDrawRectangle(
  page: PDFPage,
  cmd: DrawRectangleCommand,
  pageHeight: number,
  warnings: string[],
): void {
  const fillColor = parseColorWithNames(cmd.fillColor);
  const borderColor = parseColorWithNames(cmd.borderColor);

  if (fillColor === null && borderColor === null) return; // nothing to draw

  if (cmd.cornerRadius > 0) {
    warnings.push(
      `[draw-rectangle] cornerRadius=${cmd.cornerRadius.toFixed(1)} is not yet ` +
        `supported — rectangle will have sharp corners (node '${cmd.sourceNodeId}')`,
    );
  }

  const pdfY = rectOriginToPageY(cmd.y, cmd.height, pageHeight);

  page.drawRectangle({
    x: cmd.x,
    y: pdfY,
    width: cmd.width,
    height: cmd.height,
    ...(fillColor !== null ? { color: fillColor } : {}),
    ...(borderColor !== null
      ? { borderColor, borderWidth: cmd.borderWidth > 0 ? cmd.borderWidth : 0.5 }
      : {}),
    opacity: cmd.opacity,
  });
}

/**
 * Draws a straight line between two points.
 */
function handleDrawLine(
  page: PDFPage,
  cmd: DrawLineCommand,
  pageHeight: number,
  warnings: string[],
): void {
  const color = parseColorWithNames(cmd.color);
  if (color === null) {
    warnings.push(
      `[draw-line] Cannot parse color '${cmd.color}' for node '${cmd.sourceNodeId}' — skipping`,
    );
    return;
  }

  const pdfY1 = toPageY(cmd.y1, pageHeight);
  const pdfY2 = toPageY(cmd.y2, pageHeight);

  page.drawLine({
    start: { x: cmd.x1, y: pdfY1 },
    end: { x: cmd.x2, y: pdfY2 },
    thickness: cmd.width > 0 ? cmd.width : 0.5,
    color,
    opacity: cmd.opacity,
  });
}

/**
 * Draws a circle using pdf-lib's `drawEllipse` with equal radii.
 */
function handleDrawCircle(page: PDFPage, cmd: DrawCircleCommand, pageHeight: number): void {
  const fillColor = parseColorWithNames(cmd.fillColor);
  const strokeColor = parseColorWithNames(cmd.strokeColor);

  const pdfY = toPageY(cmd.cy, pageHeight);

  page.drawEllipse({
    x: cmd.cx,
    y: pdfY,
    xScale: cmd.radius,
    yScale: cmd.radius,
    ...(fillColor !== null ? { color: fillColor } : {}),
    ...(strokeColor !== null ? { borderColor: strokeColor, borderWidth: cmd.strokeWidth } : {}),
    opacity: cmd.opacity,
  });
}

/**
 * Draws an ellipse using pdf-lib's `drawEllipse`.
 */
function handleDrawEllipse(page: PDFPage, cmd: DrawEllipseCommand, pageHeight: number): void {
  const fillColor = parseColorWithNames(cmd.fillColor);
  const strokeColor = parseColorWithNames(cmd.strokeColor);

  const pdfY = toPageY(cmd.cy, pageHeight);

  page.drawEllipse({
    x: cmd.cx,
    y: pdfY,
    xScale: cmd.rx,
    yScale: cmd.ry,
    ...(fillColor !== null ? { color: fillColor } : {}),
    ...(strokeColor !== null ? { borderColor: strokeColor, borderWidth: cmd.strokeWidth } : {}),
    opacity: cmd.opacity,
  });
}

/**
 * Draws a placeholder rectangle for an image element.
 * Image embedding is not yet implemented.
 *
 * TODO (future): Implement via ImageManager.embedImage() → PDFImage → page.drawImage().
 */
function handleDrawImage(
  page: PDFPage,
  cmd: DrawImageCommand,
  pageHeight: number,
  imageManager: ImageManager,
  fontManager: FontManager,
  warnings: string[],
): void {
  warnings.push(
    `[draw-image] Image embedding is not yet implemented — ` +
      `drawing placeholder for node '${cmd.sourceNodeId}' (src: '${cmd.src}')`,
  );

  const pdfY = rectOriginToPageY(cmd.y, cmd.height, pageHeight);
  const label = imageManager.placeholderLabel(cmd.src, cmd.alt);

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
    const font = fontManager.resolve('Helvetica', 'normal');
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

/**
 * Draws a placeholder rectangle for a table element.
 *
 * TODO (future): Decompose DrawTableCommand into individual cell rectangles and
 *                text commands using the column/row data from props.
 */
function handleDrawTable(
  page: PDFPage,
  cmd: DrawTableCommand,
  pageHeight: number,
  fontManager: FontManager,
  warnings: string[],
): void {
  warnings.push(
    `[draw-table] Full table rendering is not yet implemented — ` +
      `drawing placeholder for node '${cmd.sourceNodeId}'`,
  );

  const pdfY = rectOriginToPageY(cmd.y, cmd.height, pageHeight);

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
    const font = fontManager.resolve('Helvetica', 'normal');
    const fontSize = Math.min(9, cmd.height * 0.35);
    const rowCount = cmd.rows.length;
    const colCount = cmd.columns.length;
    const label =
      colCount > 0
        ? `Table (${colCount.toString()} cols × ${rowCount.toString()} rows)`
        : 'Table (placeholder)';

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

/**
 * Draws a placeholder for a QR code.
 *
 * TODO (future): Use a QR encoding library to generate the QR matrix,
 *                then render each module as a small DrawRectangle.
 */
function handleDrawQRCode(
  page: PDFPage,
  cmd: DrawQRCodeCommand,
  pageHeight: number,
  fontManager: FontManager,
  warnings: string[],
): void {
  warnings.push(
    `[draw-qr-code] QR code rendering is not yet implemented — ` +
      `drawing placeholder for node '${cmd.sourceNodeId}'`,
  );

  const pdfY = rectOriginToPageY(cmd.y, cmd.height, pageHeight);

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
    const font = fontManager.resolve('Helvetica', 'normal');
    const fontSize = Math.min(8, cmd.height * 0.3);
    page.drawText('QR Code', {
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

/**
 * Draws a placeholder for a barcode.
 *
 * TODO (future): Use a barcode generation library to render the barcode
 *                as a series of narrow/wide black rectangles.
 */
function handleDrawBarcode(
  page: PDFPage,
  cmd: DrawBarcodeCommand,
  pageHeight: number,
  fontManager: FontManager,
  warnings: string[],
): void {
  warnings.push(
    `[draw-barcode] Barcode rendering is not yet implemented — ` +
      `drawing placeholder for node '${cmd.sourceNodeId}'`,
  );

  const pdfY = rectOriginToPageY(cmd.y, cmd.height, pageHeight);

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
    const font = fontManager.resolve('Helvetica', 'normal');
    const fontSize = Math.min(8, cmd.height * 0.35);
    const label = `Barcode (${cmd.format})`;
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

// ─── Main command dispatcher ──────────────────────────────────────────────────

/**
 * Dispatches a single `DisplayCommand` to its pdf-lib draw handler.
 *
 * Supported commands (fully rendered):
 * - `draw-text` → `page.drawText()`
 * - `draw-rectangle` → `page.drawRectangle()`
 * - `draw-line` → `page.drawLine()`
 * - `draw-circle` → `page.drawEllipse()` with equal radii
 * - `draw-ellipse` → `page.drawEllipse()`
 *
 * Supported commands (placeholder rectangles drawn, warning emitted):
 * - `draw-image`
 * - `draw-table`
 * - `draw-qr-code`
 * - `draw-barcode`
 *
 * Unsupported commands (warning emitted, no output):
 * - `draw-path` — TODO: use page.drawSvgPath()
 * - `draw-polygon` — TODO: convert to SVG path and use page.drawSvgPath()
 *
 * @param page - The pdf-lib page to draw onto.
 * @param command - The display command to process.
 * @param pageHeight - Height of the current page in points (for coordinate conversion).
 * @param fontManager - Loaded font cache for the current document.
 * @param imageManager - Image embedding helper (currently a placeholder).
 * @param warnings - Mutable array that receives non-fatal warning messages.
 */
export function handleCommand(
  page: PDFPage,
  command: DisplayCommand,
  pageHeight: number,
  fontManager: FontManager,
  imageManager: ImageManager,
  warnings: string[],
): void {
  switch (command.kind) {
    case 'draw-text':
      handleDrawText(page, command, pageHeight, fontManager, warnings);
      break;

    case 'draw-rectangle':
      handleDrawRectangle(page, command, pageHeight, warnings);
      break;

    case 'draw-line':
      handleDrawLine(page, command, pageHeight, warnings);
      break;

    case 'draw-circle':
      handleDrawCircle(page, command, pageHeight);
      break;

    case 'draw-ellipse':
      handleDrawEllipse(page, command, pageHeight);
      break;

    case 'draw-image':
      handleDrawImage(page, command, pageHeight, imageManager, fontManager, warnings);
      break;

    case 'draw-table':
      handleDrawTable(page, command, pageHeight, fontManager, warnings);
      break;

    case 'draw-qr-code':
      handleDrawQRCode(page, command, pageHeight, fontManager, warnings);
      break;

    case 'draw-barcode':
      handleDrawBarcode(page, command, pageHeight, fontManager, warnings);
      break;

    case 'draw-path':
      // TODO (future): Implement via page.drawSvgPath(cmd.pathData, ...)
      warnings.push(
        `[draw-path] SVG path rendering is not yet implemented — ` +
          `skipping node '${command.sourceNodeId}'`,
      );
      break;

    case 'draw-polygon':
      // TODO (future): Convert points[] to SVG path string, then use page.drawSvgPath()
      warnings.push(
        `[draw-polygon] Polygon rendering is not yet implemented — ` +
          `skipping node '${command.sourceNodeId}'`,
      );
      break;
  }
}
