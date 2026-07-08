import type { DisplayCommand, DisplayList } from '@reportforge/display-list';

import type { RenderDocument, RenderPage } from './context.js';
import type { RenderOperation } from './operations.js';

/** Converts a display command into one or more unified render operations. */
export function displayCommandToOperations(command: DisplayCommand): readonly RenderOperation[] {
  switch (command.kind) {
    case 'draw-text':
      return [{
        type: 'text',
        sourceNodeId: command.sourceNodeId,
        text: command.text,
        font: command.font,
        fontSize: command.fontSize,
        fontWeight: command.fontWeight,
        lineHeight: command.lineHeight,
        color: command.color,
        x: command.x,
        y: command.y,
        width: command.width,
        height: command.height,
        rotation: command.rotation,
        opacity: command.opacity,
        textAlign: command.textAlign,
      }];

    case 'draw-rectangle':
      return [{
        type: 'rectangle',
        sourceNodeId: command.sourceNodeId,
        x: command.x,
        y: command.y,
        width: command.width,
        height: command.height,
        fillColor: command.fillColor,
        borderColor: command.borderColor,
        borderWidth: command.borderWidth,
        cornerRadius: command.cornerRadius,
        opacity: command.opacity,
      }];

    case 'draw-line':
      return [{
        type: 'line',
        sourceNodeId: command.sourceNodeId,
        x1: command.x1,
        y1: command.y1,
        x2: command.x2,
        y2: command.y2,
        color: command.color,
        width: command.width,
        opacity: command.opacity,
      }];

    case 'draw-image':
      return [{
        type: 'image',
        sourceNodeId: command.sourceNodeId,
        src: command.src,
        alt: command.alt,
        x: command.x,
        y: command.y,
        width: command.width,
        height: command.height,
        rotation: command.rotation,
        opacity: command.opacity,
      }];

    case 'draw-path':
      return [{
        type: 'path',
        sourceNodeId: command.sourceNodeId,
        pathData: command.pathData,
        fillColor: command.fillColor,
        strokeColor: command.strokeColor,
        strokeWidth: command.strokeWidth,
        opacity: command.opacity,
      }];

    case 'draw-circle':
      return [{
        type: 'circle',
        sourceNodeId: command.sourceNodeId,
        cx: command.cx,
        cy: command.cy,
        radius: command.radius,
        fillColor: command.fillColor,
        strokeColor: command.strokeColor,
        strokeWidth: command.strokeWidth,
        opacity: command.opacity,
      }];

    case 'draw-ellipse':
      return [{
        type: 'ellipse',
        sourceNodeId: command.sourceNodeId,
        cx: command.cx,
        cy: command.cy,
        rx: command.rx,
        ry: command.ry,
        fillColor: command.fillColor,
        strokeColor: command.strokeColor,
        strokeWidth: command.strokeWidth,
        opacity: command.opacity,
      }];

    case 'draw-polygon':
      return [{
        type: 'polygon',
        sourceNodeId: command.sourceNodeId,
        points: command.points,
        fillColor: command.fillColor,
        strokeColor: command.strokeColor,
        strokeWidth: command.strokeWidth,
        opacity: command.opacity,
      }];

    case 'draw-table':
      return [{
        type: 'table',
        sourceNodeId: command.sourceNodeId,
        x: command.x,
        y: command.y,
        width: command.width,
        height: command.height,
        columns: command.columns,
        rows: command.rows,
        ...(command.tableLayout !== undefined ? { tableLayout: command.tableLayout } : {}),
        opacity: command.opacity,
      }];

    case 'draw-qr-code':
      return [{
        type: 'rectangle',
        sourceNodeId: command.sourceNodeId,
        x: command.x,
        y: command.y,
        width: command.width,
        height: command.height,
        fillColor: '#eeeeee',
        borderColor: '#999999',
        borderWidth: 0.5,
        cornerRadius: 0,
        opacity: command.opacity,
      }, {
        type: 'text',
        sourceNodeId: command.sourceNodeId,
        text: 'QR Code',
        font: 'Helvetica',
        fontSize: 8,
        fontWeight: 'normal',
        lineHeight: 1.2,
        color: '#666666',
        x: command.x + 4,
        y: command.y + command.height / 2 - 4,
        width: command.width - 8,
        height: 8,
        rotation: 0,
        opacity: command.opacity,
        textAlign: 'left',
      }];

    case 'draw-barcode':
      return [{
        type: 'rectangle',
        sourceNodeId: command.sourceNodeId,
        x: command.x,
        y: command.y,
        width: command.width,
        height: command.height,
        fillColor: '#eeeeee',
        borderColor: '#999999',
        borderWidth: 0.5,
        cornerRadius: 0,
        opacity: command.opacity,
      }, {
        type: 'text',
        sourceNodeId: command.sourceNodeId,
        text: `Barcode (${command.format})`,
        font: 'Helvetica',
        fontSize: 8,
        fontWeight: 'normal',
        lineHeight: 1.2,
        color: '#666666',
        x: command.x + 4,
        y: command.y + command.height / 2 - 4,
        width: command.width - 8,
        height: 8,
        rotation: 0,
        opacity: command.opacity,
        textAlign: 'left',
      }];

    default:
      return [];
  }
}

/** Converts a display list into a render document with unified operations. */
export function displayListToRenderDocument(displayList: DisplayList): RenderDocument {
  const pages: RenderPage[] = displayList.pages.map((page) => ({
    pageNumber: page.pageNumber,
    width: page.width,
    height: page.height,
    operations: page.commands.flatMap((command) => displayCommandToOperations(command)),
  }));

  return {
    pages,
    metadata: displayList.metadata,
    operationCount: displayList.commandCount,
  };
}

/** Converts points to CSS pixels (96 DPI convention). */
export function ptToPx(value: number): number {
  return (value * 96) / 72;
}

/** Escapes text for HTML output. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Encodes a string as UTF-8 bytes. */
export function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}
