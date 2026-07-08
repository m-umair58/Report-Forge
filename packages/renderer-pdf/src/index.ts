/**
 * @reportforge/renderer-pdf
 *
 * **Minimal PDF renderer** for the ReportForge vertical slice.
 *
 * This package validates the complete rendering pipeline:
 * Builder → Layout → Display List → PDF bytes.
 *
 * It is intentionally limited — only Title, Paragraph, and Divider components
 * are supported via `draw-text` and `draw-line` commands.
 *
 * ## Quick start (via Builder API)
 *
 * ```typescript
 * import { Report } from '@reportforge/core';
 *
 * const report = Report.create()
 *   .title('Hello ReportForge')
 *   .paragraph('This is our first PDF.')
 *   .divider();
 *
 * await report.toPDF('hello.pdf');
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

// ─── Document model ───────────────────────────────────────────────────────────

export { PdfDocument } from './pdf-document.js';
export type { PdfDocumentMetadata } from './pdf-document.js';
export { PdfPage } from './pdf-page.js';

// ─── Utilities (public) ───────────────────────────────────────────────────────

export { isValidColor, parseColor, parseColorWithNames, NAMED_COLORS } from './colors.js';
export { rectOriginToPageY, textBaselineY, toPageY } from './coordinates.js';
export { resolveStandardFont, FontManager } from './fonts.js';

// ─── Errors ───────────────────────────────────────────────────────────────────

export { PdfRendererError } from './errors.js';

// ─── Package identity ─────────────────────────────────────────────────────────

/** Package identifier for @reportforge/renderer-pdf. */
export const PACKAGE_NAME = '@reportforge/renderer-pdf' as const;

/** Returns the package identifier. */
export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
