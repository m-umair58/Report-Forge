/**
 * @reportforge/display-list
 *
 * Converts the ReportForge layout tree into a renderer-independent Display List
 * of atomic drawing commands. This is the **final pipeline stage before rendering**.
 *
 * ## Pipeline position
 *
 * ```
 * @reportforge/core   (Builder → ReportSchema)
 *        ↓
 * @reportforge/layout (ReportSchema → LayoutOutput)
 *        ↓
 * @reportforge/display-list (LayoutOutput → DisplayList)
 *        ↓
 * @reportforge/renderer-* (DisplayList → bytes)
 * ```
 *
 * ## Quick start
 *
 * ```typescript
 * import { DisplayListGenerator } from '@reportforge/display-list';
 * import { LayoutEngine } from '@reportforge/layout';
 * import { Report } from '@reportforge/core';
 *
 * const report = Report.create()
 *   .title('Sales')
 *   .paragraph('Summary');
 *
 * const layoutEngine = new LayoutEngine();
 * const layout = layoutEngine.layout(report);
 *
 * const generator = new DisplayListGenerator();
 * const displayList = generator.generate(layout);
 *
 * console.log(displayList);
 * // {
 * //   pages: [{ pageNumber: 1, width: 595.28, height: 841.89, commands: [...] }],
 * //   metadata: {},
 * //   commandCount: 2
 * // }
 * ```
 *
 * ## Renderer independence
 *
 * The Display List contains only drawing primitives. Renderers translate each
 * `DisplayCommand` into their own drawing APIs without knowing anything about
 * the report structure, component tree, or layout algorithm.
 *
 * ## Command iteration
 *
 * ```typescript
 * for (const page of displayList.pages) {
 *   for (const cmd of page.commands) {
 *     switch (cmd.kind) {
 *       case 'draw-text':      renderer.drawText(cmd); break;
 *       case 'draw-rectangle': renderer.drawRect(cmd); break;
 *       case 'draw-line':      renderer.drawLine(cmd); break;
 *       // ...
 *     }
 *   }
 * }
 * ```
 */

// ─── Generator ────────────────────────────────────────────────────────────────

export {
  DEFAULT_COLOR,
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_SIZE_SUBTITLE,
  DEFAULT_FONT_SIZE_TITLE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_OPACITY,
  DisplayListGenerator,
} from './generator.js';

// ─── Commands ────────────────────────────────────────────────────────────────

export type {
  DisplayCommand,
  DisplayCommandKind,
  DrawBarcodeCommand,
  DrawCircleCommand,
  DrawEllipseCommand,
  DrawImageCommand,
  DrawLineCommand,
  DrawPathCommand,
  DrawPolygonCommand,
  DrawQRCodeCommand,
  DrawRectangleCommand,
  DrawTableCommand,
  DrawTextCommand,
  FontWeight,
  Point2D,
  TextAlign,
} from './commands.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type {
  DisplayContext,
  DisplayList,
  DisplayListOptions,
  DisplayListValidationIssue,
  DisplayListValidationResult,
  DisplayPage,
  ValidationSeverity,
} from './types.js';

// ─── Validator ────────────────────────────────────────────────────────────────

export { isValidColor, validateCommand, validateDisplayList } from './validator.js';

// ─── Optimizer ────────────────────────────────────────────────────────────────

export { DEFAULT_OPTIMIZER_OPTIONS, optimizeCommands, optimizePages } from './optimizer.js';
export type { OptimizerOptions } from './optimizer.js';

// ─── Errors ───────────────────────────────────────────────────────────────────

export { DisplayCommandValidationError, DisplayListError } from './errors.js';

// ─── Package identity ─────────────────────────────────────────────────────────

/** Package identifier for @reportforge/display-list. */
export const PACKAGE_NAME = '@reportforge/display-list' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
