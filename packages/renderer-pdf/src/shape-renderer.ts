import type { PDFPage } from 'pdf-lib';

import type {
  DrawCircleCommand,
  DrawEllipseCommand,
  DrawLineCommand,
  DrawRectangleCommand,
} from '@reportforge/display-list';

import { parseColorWithNames } from './colors.js';
import { rectOriginToPageY, toPageY } from './coordinates.js';

/**
 * Renders shape display commands: rectangles, lines, circles, and ellipses.
 */
export class ShapeRenderer {
  renderRectangle(
    page: PDFPage,
    cmd: DrawRectangleCommand,
    pageHeight: number,
    warnings: string[],
  ): void {
    if (
      !isFinite(cmd.x) ||
      !isFinite(cmd.y) ||
      !isFinite(cmd.width) ||
      !isFinite(cmd.height) ||
      cmd.width <= 0 ||
      cmd.height <= 0
    ) {
      warnings.push(
        `[draw-rectangle] Invalid dimensions for node '${cmd.sourceNodeId}' — skipping`,
      );
      return;
    }

    const fillColor = parseColorWithNames(cmd.fillColor);
    const borderColor = parseColorWithNames(cmd.borderColor);

    if (fillColor === null && borderColor === null) return;

    const pdfY = rectOriginToPageY(cmd.y, cmd.height, pageHeight);

    if (cmd.cornerRadius > 0) {
      this.drawRoundedRectangle(page, cmd, pdfY, fillColor, borderColor);
      return;
    }

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

  renderLine(page: PDFPage, cmd: DrawLineCommand, pageHeight: number, warnings: string[]): void {
    if (
      !isFinite(cmd.x1) ||
      !isFinite(cmd.y1) ||
      !isFinite(cmd.x2) ||
      !isFinite(cmd.y2)
    ) {
      warnings.push(`[draw-line] Invalid coordinates for node '${cmd.sourceNodeId}' — skipping`);
      return;
    }

    const color = parseColorWithNames(cmd.color);
    if (color === null) {
      warnings.push(
        `[draw-line] Cannot parse color '${cmd.color}' for node '${cmd.sourceNodeId}' — skipping`,
      );
      return;
    }

    page.drawLine({
      start: { x: cmd.x1, y: toPageY(cmd.y1, pageHeight) },
      end: { x: cmd.x2, y: toPageY(cmd.y2, pageHeight) },
      thickness: cmd.width > 0 ? cmd.width : 0.5,
      color,
      opacity: cmd.opacity,
    });
  }

  renderCircle(page: PDFPage, cmd: DrawCircleCommand, pageHeight: number, warnings: string[]): void {
    if (!isFinite(cmd.cx) || !isFinite(cmd.cy) || !isFinite(cmd.radius) || cmd.radius <= 0) {
      warnings.push(`[draw-circle] Invalid dimensions for node '${cmd.sourceNodeId}' — skipping`);
      return;
    }

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

  renderEllipse(
    page: PDFPage,
    cmd: DrawEllipseCommand,
    pageHeight: number,
    warnings: string[],
  ): void {
    if (
      !isFinite(cmd.cx) ||
      !isFinite(cmd.cy) ||
      !isFinite(cmd.rx) ||
      !isFinite(cmd.ry) ||
      cmd.rx <= 0 ||
      cmd.ry <= 0
    ) {
      warnings.push(`[draw-ellipse] Invalid dimensions for node '${cmd.sourceNodeId}' — skipping`);
      return;
    }

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

  private drawRoundedRectangle(
    page: PDFPage,
    cmd: DrawRectangleCommand,
    pdfY: number,
    fillColor: ReturnType<typeof parseColorWithNames>,
    borderColor: ReturnType<typeof parseColorWithNames>,
  ): void {
    const r = Math.min(cmd.cornerRadius, cmd.width / 2, cmd.height / 2);
    const x = cmd.x;
    const y = pdfY;
    const w = cmd.width;
    const h = cmd.height;

    const path = [
      `M ${(x + r).toFixed(2)} ${y.toFixed(2)}`,
      `L ${(x + w - r).toFixed(2)} ${y.toFixed(2)}`,
      `Q ${(x + w).toFixed(2)} ${y.toFixed(2)} ${(x + w).toFixed(2)} ${(y + r).toFixed(2)}`,
      `L ${(x + w).toFixed(2)} ${(y + h - r).toFixed(2)}`,
      `Q ${(x + w).toFixed(2)} ${(y + h).toFixed(2)} ${(x + w - r).toFixed(2)} ${(y + h).toFixed(2)}`,
      `L ${(x + r).toFixed(2)} ${(y + h).toFixed(2)}`,
      `Q ${x.toFixed(2)} ${(y + h).toFixed(2)} ${x.toFixed(2)} ${(y + h - r).toFixed(2)}`,
      `L ${x.toFixed(2)} ${(y + r).toFixed(2)}`,
      `Q ${x.toFixed(2)} ${y.toFixed(2)} ${(x + r).toFixed(2)} ${y.toFixed(2)}`,
      'Z',
    ].join(' ');

    page.drawSvgPath(path, {
      ...(fillColor !== null ? { color: fillColor } : {}),
      ...(borderColor !== null
        ? { borderColor, borderWidth: cmd.borderWidth > 0 ? cmd.borderWidth : 0.5 }
        : {}),
      opacity: cmd.opacity,
    });
  }
}
