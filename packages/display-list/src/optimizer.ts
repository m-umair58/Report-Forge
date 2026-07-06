import type { DisplayCommand } from './commands.js';
import type { DisplayPage } from './types.js';

/**
 * Options controlling which optimization passes run.
 */
export interface OptimizerOptions {
  /** Remove commands with zero or negative width/height. @default true */
  readonly skipEmptyCommands: boolean;
  /** Remove commands with opacity ≤ 0. @default true */
  readonly skipInvisibleCommands: boolean;
}

/** Default optimizer options. */
export const DEFAULT_OPTIMIZER_OPTIONS: OptimizerOptions = {
  skipEmptyCommands: true,
  skipInvisibleCommands: true,
};

// ─── Individual optimization passes ───────────────────────────────────────────

/**
 * **Pass: Skip empty commands**
 *
 * Removes drawing commands that have zero or negative size and would produce
 * no visible output. Applies to commands with width/height fields.
 *
 * This avoids sending degenerate drawing calls to the renderer, which can
 * cause unexpected behavior in some PDF libraries.
 *
 * TODO (future): Extend to remove DrawPath commands with empty bounding boxes.
 */
function skipEmptyCommandsPass(commands: readonly DisplayCommand[]): DisplayCommand[] {
  return commands.filter((cmd) => {
    switch (cmd.kind) {
      case 'draw-text':
      case 'draw-rectangle':
      case 'draw-image':
      case 'draw-table':
      case 'draw-qr-code':
      case 'draw-barcode':
        return cmd.width > 0 && cmd.height > 0;
      case 'draw-circle':
        return cmd.radius > 0;
      case 'draw-ellipse':
        return cmd.rx > 0 && cmd.ry > 0;
      case 'draw-line':
        // A line is degenerate if both endpoints are identical.
        return !(cmd.x1 === cmd.x2 && cmd.y1 === cmd.y2);
      case 'draw-polygon':
        return cmd.points.length >= 3;
      case 'draw-path':
        return cmd.pathData.length > 0;
    }
  });
}

/**
 * **Pass: Skip invisible commands**
 *
 * Removes commands with opacity ≤ 0, which would produce no visible pixels.
 *
 * TODO (future): Also remove commands fully covered by an opaque sibling
 * that renders on top (occlusion culling).
 */
function skipInvisibleCommandsPass(commands: readonly DisplayCommand[]): DisplayCommand[] {
  return commands.filter((cmd) => cmd.opacity > 0);
}

/**
 * **Pass: Remove empty DrawText commands**
 *
 * DrawText commands with empty text produce no visible output and may cause
 * renderer warnings. Remove them after other passes.
 */
function skipEmptyTextPass(commands: readonly DisplayCommand[]): DisplayCommand[] {
  return commands.filter((cmd) => {
    if (cmd.kind === 'draw-text') {
      return cmd.text.length > 0;
    }
    return true;
  });
}

// ─── TODO: Future optimization passes ─────────────────────────────────────────
//
// TODO: Merge adjacent DrawLine commands on the same Y axis into a single line.
//       Useful when a divider or table border is built from multiple segments.
//
// TODO: Batch contiguous DrawRectangle commands with identical fill colors into
//       a single clipping region call (PDF optimization).
//
// TODO: Deduplicate adjacent DrawText commands for the same font/size/color
//       that could be merged into a single text run (PDF BT/ET block optimization).
//
// TODO: Occlusion culling — skip commands whose bounding box is entirely
//       covered by an opaque command that renders on top.
//
// TODO: Render-target-specific passes (e.g. PDF glyph subsetting hints).

// ─── Main optimizer ───────────────────────────────────────────────────────────

/**
 * Optimizes a list of display commands by running enabled passes.
 *
 * Passes are run in order. Each pass receives the output of the previous one.
 * The order is:
 * 1. Skip invisible (opacity ≤ 0)
 * 2. Skip empty (zero-size or degenerate)
 * 3. Skip empty text strings
 *
 * @param commands - The raw command list from the generator.
 * @param options - Which passes to enable.
 * @returns A new array of optimized commands.
 */
export function optimizeCommands(
  commands: readonly DisplayCommand[],
  options: OptimizerOptions = DEFAULT_OPTIMIZER_OPTIONS,
): DisplayCommand[] {
  let result: DisplayCommand[] = [...commands];

  if (options.skipInvisibleCommands) {
    result = skipInvisibleCommandsPass(result);
  }

  if (options.skipEmptyCommands) {
    result = skipEmptyCommandsPass(result);
    result = skipEmptyTextPass(result);
  }

  return result;
}

/**
 * Optimizes all pages in a display list.
 * Returns new `DisplayPage` objects with optimized command arrays.
 */
export function optimizePages(
  pages: readonly DisplayPage[],
  options: OptimizerOptions = DEFAULT_OPTIMIZER_OPTIONS,
): DisplayPage[] {
  return pages.map((page) => ({
    pageNumber: page.pageNumber,
    width: page.width,
    height: page.height,
    commands: optimizeCommands(page.commands, options),
  }));
}
