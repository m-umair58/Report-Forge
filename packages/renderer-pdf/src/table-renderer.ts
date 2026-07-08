import { rgb, type PDFPage } from 'pdf-lib';

import type { DrawTableCommand } from '@reportforge/display-list';

import { parseColorWithNames } from './colors.js';
import { rectOriginToPageY, textBaselineY } from './coordinates.js';
import type { FontManager } from './fonts.js';

interface LayoutCell {
  readonly columnKey: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly align: 'left' | 'center' | 'right';
  readonly padding: { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number };
  readonly backgroundColor?: string;
  readonly text: { readonly lines: readonly string[]; readonly lineHeight: number };
}

interface LayoutRow {
  readonly kind: 'header' | 'body' | 'footer';
  readonly y: number;
  readonly height: number;
  readonly cells: readonly LayoutCell[];
}

interface TableLayoutPayload {
  readonly columns: readonly { readonly key: string; readonly width: number }[];
  readonly rows: readonly LayoutRow[];
  readonly width: number;
  readonly height: number;
  readonly style?: {
    readonly border?: { readonly width?: number; readonly color?: string };
    readonly headerColor?: string;
    readonly fontSize?: number;
    readonly fontFamily?: string;
    readonly headerFontWeight?: 'normal' | 'bold';
  };
}

/**
 * Renders `draw-table` commands using precomputed layout from `@reportforge/table`.
 */
export class TableRenderer {
  constructor(private readonly _fontManager: FontManager) {}

  render(
    page: PDFPage,
    command: DrawTableCommand,
    pageHeight: number,
    warnings: string[],
  ): void {
    const layout = command.tableLayout as TableLayoutPayload | undefined;
    if (layout === undefined || !Array.isArray(layout.rows)) {
      warnings.push(
        `[draw-table] Missing table layout for node '${command.sourceNodeId}' — skipping`,
      );
      return;
    }

    const borderWidth = layout.style?.border?.width ?? 0.5;
    const borderColor = parseColorWithNames(layout.style?.border?.color ?? '#cccccc') ?? rgb(0.8, 0.8, 0.8);
    const fontFamily = layout.style?.fontFamily ?? 'Helvetica';
    const fontSize = layout.style?.fontSize ?? 10;
    const fontWeight = layout.style?.headerFontWeight ?? 'normal';

    for (const row of layout.rows) {
      const rowTop = command.y + row.y;
      const rowPdfY = rectOriginToPageY(rowTop, row.height, pageHeight);

      for (const cell of row.cells) {
        const cellX = command.x + cell.x;
        const cellTop = command.y + cell.y;
        const cellPdfY = rectOriginToPageY(cellTop, cell.height, pageHeight);

        if (cell.backgroundColor !== undefined) {
          const fill = parseColorWithNames(cell.backgroundColor);
          if (fill !== null) {
            page.drawRectangle({
              x: cellX,
              y: cellPdfY,
              width: cell.width,
              height: cell.height,
              color: fill,
              opacity: command.opacity,
            });
          }
        }

        const weight = row.kind === 'header' ? 'bold' : fontWeight;
        const font = this._fontManager.resolve(fontFamily, weight === 'bold' ? 'bold' : 'normal');
        const textColor =
          parseColorWithNames(
            row.kind === 'header' ? (layout.style?.headerColor ?? '#1a1a1a') : '#1a1a1a',
          ) ?? rgb(0.1, 0.1, 0.1);

        let textX = cellX + cell.padding.left;
        const innerWidth = cell.width - cell.padding.left - cell.padding.right;
        let lineY = cellTop + cell.padding.top;

        for (const line of cell.text.lines) {
          if (line.length === 0) {
            lineY += cell.text.lineHeight;
            continue;
          }

          const textWidth = font.widthOfTextAtSize(line, fontSize);
          if (cell.align === 'center') {
            textX = cellX + cell.padding.left + Math.max(0, (innerWidth - textWidth) / 2);
          } else if (cell.align === 'right') {
            textX = cellX + cell.width - cell.padding.right - textWidth;
          } else {
            textX = cellX + cell.padding.left;
          }

          page.drawText(line, {
            x: textX,
            y: textBaselineY(lineY, fontSize, pageHeight),
            size: fontSize,
            font,
            color: textColor,
            opacity: command.opacity,
          });

          lineY += cell.text.lineHeight;
        }

        page.drawRectangle({
          x: cellX,
          y: cellPdfY,
          width: cell.width,
          height: cell.height,
          borderColor,
          borderWidth,
          opacity: command.opacity,
        });
      }

      page.drawLine({
        start: { x: command.x, y: rowPdfY + row.height },
        end: { x: command.x + command.width, y: rowPdfY + row.height },
        thickness: borderWidth,
        color: borderColor,
        opacity: command.opacity,
      });
    }

    const tablePdfY = rectOriginToPageY(command.y, command.height, pageHeight);
    page.drawRectangle({
      x: command.x,
      y: tablePdfY,
      width: command.width,
      height: command.height,
      borderColor,
      borderWidth,
      opacity: command.opacity,
    });
  }
}
