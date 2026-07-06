/**
 * @reportforge/layout
 *
 * The ReportForge layout engine — converts a report schema into a positioned
 * layout tree without producing any renderer-specific output.
 *
 * ## Pipeline position
 *
 * ```
 * @reportforge/core (Builder → Schema)
 *       ↓
 * @reportforge/layout (Schema → LayoutResult)
 *       ↓
 * @reportforge/renderer-pdf (LayoutResult → PDF bytes)
 * ```
 *
 * ## Quick start
 *
 * ```typescript
 * import { LayoutEngine, DEFAULT_LAYOUT_THEME } from '@reportforge/layout';
 * import { Report } from '@reportforge/core';
 *
 * const report = Report.create()
 *   .title('Monthly Sales')
 *   .paragraph('Lorem ipsum...')
 *   .section(s => s.title('Details').paragraph('More info'));
 *
 * const engine = new LayoutEngine();
 *
 * // Convenience: layout with default theme
 * const result = engine.layout(report);
 * console.log(result.pages); // Array of LayoutPage with positioned elements
 *
 * // With an explicit theme
 * const result2 = engine.layout({ schema: report.toJSON(), theme: DEFAULT_LAYOUT_THEME });
 * ```
 *
 * ## Renderer independence
 *
 * The layout engine produces format-agnostic output. It knows nothing about
 * PDF operators, HTML tags, or pixel coordinates. All positions are in points (pt).
 */

// ─── Engine ───────────────────────────────────────────────────────────────────

export { LayoutEngine } from './engine.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type { LayoutNode, LayoutResult } from './types.js';

// ─── Box model ────────────────────────────────────────────────────────────────

export type { BoxModel, EdgeInsets } from './box.js';
export {
  ZERO_BOX_MODEL,
  ZERO_EDGE_INSETS,
  edgeInsets,
  horizontalExtent,
  totalHorizontalInsets,
  totalVerticalInsets,
  uniformEdgeInsets,
  verticalExtent,
} from './box.js';

// ─── Page model ───────────────────────────────────────────────────────────────

export type { PageDimensions, PageModel, PageOrientation, PageSizeName } from './page.js';
export { PAGE_DIMENSIONS, createPageModel, getPageDimensions } from './page.js';

// ─── Measurement utilities ────────────────────────────────────────────────────

export {
  PT_PER_CM,
  PT_PER_INCH,
  PT_PER_MM,
  PT_PER_PX,
  cmToPt,
  inToPt,
  mmToPt,
  ptToCm,
  ptToIn,
  ptToMm,
  ptToPx,
  pxToPt,
} from './units.js';

// ─── Theme ────────────────────────────────────────────────────────────────────

export { DEFAULT_LAYOUT_THEME } from './default-theme.js';

// ─── Estimators ───────────────────────────────────────────────────────────────

export { estimateNodeHeight, estimateParagraphHeight } from './estimators.js';

// ─── Errors ───────────────────────────────────────────────────────────────────

export { LayoutConstraintError, LayoutError } from './errors.js';

// ─── Package identity ─────────────────────────────────────────────────────────

/** Package identifier for @reportforge/layout. */
export const PACKAGE_NAME = '@reportforge/layout' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
