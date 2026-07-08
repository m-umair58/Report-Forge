/**
 * @reportforge/renderer-pdf
 *
 * Production PDF renderer for ReportForge.
 *
 * Converts a renderer-independent `DisplayList` into PDF bytes via a dedicated
 * rendering pipeline: PdfRenderer → PageRenderer → Text/Shape/Image renderers.
 *
 * ## Quick start (via Builder API)
 *
 * ```typescript
 * import { Report } from '@reportforge/core';
 *
 * const report = Report.create()
 *   .title('Monthly Sales')
 *   .paragraph('Sales increased by 18% this month.')
 *   .image({ src: './assets/logo.png' })
 *   .divider();
 *
 * await report.toPDF('report.pdf');
 * ```
 *
 * ## Quick start (manual pipeline)
 *
 * ```typescript
 * import { DisplayListGenerator } from '@reportforge/display-list';
 * import { LayoutEngine } from '@reportforge/layout';
 * import { PdfRenderer } from '@reportforge/renderer-pdf';
 *
 * const layout = new LayoutEngine().layout(report);
 * const displayList = new DisplayListGenerator().generate(layout);
 * const pdfBytes = await new PdfRenderer().render(displayList);
 * ```
 */

// ─── Renderer ─────────────────────────────────────────────────────────────────

export { PdfRenderer } from './renderer.js';
export type { PdfRenderOptions, PdfRenderResult } from './renderer.js';

// ─── Rendering pipeline ───────────────────────────────────────────────────────

export { PageRenderer } from './page-renderer.js';
export { TextRenderer } from './text-renderer.js';
export { ShapeRenderer } from './shape-renderer.js';
export { ImageRenderer } from './image-renderer.js';

// ─── Document model ───────────────────────────────────────────────────────────

export { PdfDocument } from './pdf-document.js';
export type { PdfDocumentMetadata } from './pdf-document.js';
export { PdfPage } from './pdf-page.js';

// ─── Resource managers ──────────────────────────────────────────────────────────

export { FontManager, resolveStandardFont } from './fonts.js';
export type { CustomFontRegistration } from './fonts.js';
export { ImageManager } from './images.js';
export type { EmbeddedImage, ImagePlacement } from './images.js';

// ─── Utilities (public) ───────────────────────────────────────────────────────

export { isValidColor, parseColor, parseColorWithNames, NAMED_COLORS } from './colors.js';
export { rectOriginToPageY, textBaselineY, toPageY } from './coordinates.js';

// ─── Errors ───────────────────────────────────────────────────────────────────

export { PdfRendererError } from './errors.js';

// ─── Package identity ─────────────────────────────────────────────────────────

/** Package identifier for @reportforge/renderer-pdf. */
export const PACKAGE_NAME = '@reportforge/renderer-pdf' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
