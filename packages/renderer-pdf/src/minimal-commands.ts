import type { DisplayCommand } from '@reportforge/display-list';

import type { PdfPage } from './pdf-page.js';

/**
 * Supported render commands in the minimal vertical-slice renderer.
 *
 * | Component  | Display command | PdfPage method |
 * |------------|-----------------|----------------|
 * | Title      | draw-text       | drawText()     |
 * | Paragraph  | draw-text       | drawText()     |
 * | Divider    | draw-line       | drawLine()     |
 *
 * All other command types are ignored with a warning.
 */
const SUPPORTED_COMMANDS = new Set<DisplayCommand['kind']>(['draw-text', 'draw-line']);

/**
 * Dispatches a display command to the appropriate `PdfPage` method.
 *
 * Only `draw-text` and `draw-line` are rendered in this milestone.
 * Unsupported commands produce a warning and are skipped.
 */
export function renderCommand(page: PdfPage, command: DisplayCommand, warnings: string[]): void {
  if (!SUPPORTED_COMMANDS.has(command.kind)) {
    warnings.push(
      `[${command.kind}] Unsupported in minimal PDF renderer — ` +
        `skipping node '${command.sourceNodeId}'`,
    );
    return;
  }

  switch (command.kind) {
    case 'draw-text':
      page.drawText(command, warnings);
      break;
    case 'draw-line':
      page.drawLine(command, warnings);
      break;
  }
}
