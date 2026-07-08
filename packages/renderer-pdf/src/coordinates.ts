/**
 * Coordinate conversion utilities for the PDF renderer.
 *
 * ## Coordinate systems
 *
 * The **Display List** uses a **top-left origin** coordinate system:
 * - `x` increases rightward
 * - `y` increases downward
 * - `(0, 0)` is the top-left corner of the page
 *
 * **pdf-lib** uses a **bottom-left origin** coordinate system:
 * - `x` increases rightward  ← same direction
 * - `y` increases upward     ← opposite direction
 * - `(0, 0)` is the bottom-left corner of the page
 *
 * All conversion functions take `pageHeight` to perform the flip.
 *
 * ## Diagram
 *
 * ```
 * Display List              pdf-lib
 * ┌─────────────┐           ┌─────────────┐
 * │(0,0)        │           │             │(0,H)
 * │  y↓         │           │  y↑         │
 * │             │           │             │
 * │             │           │(0,0)        │
 * └─────────────┘           └─────────────┘
 * ```
 */

// ─── Point conversion ─────────────────────────────────────────────────────────

/**
 * Converts a display-list Y coordinate (top-down) to a pdf-lib Y coordinate
 * (bottom-up) for a single point (line endpoint, ellipse center, etc.).
 *
 * @param displayY - Y from the top of the page (display-list).
 * @param pageHeight - Total page height in points.
 */
export function toPageY(displayY: number, pageHeight: number): number {
  return pageHeight - displayY;
}

// ─── Rectangle conversion ─────────────────────────────────────────────────────

/**
 * Converts a display-list bounding box (top-left origin) to pdf-lib
 * rectangle coordinates (bottom-left origin).
 *
 * In the display list, `(x, y)` is the **top-left** corner of the box.
 * In pdf-lib, `(x, y)` is the **bottom-left** corner.
 *
 * @param displayX - Left edge of the element.
 * @param displayY - Top edge of the element (from page top).
 * @param height - Element height in points.
 * @param pageHeight - Total page height in points.
 */
export function rectOriginToPageY(displayY: number, height: number, pageHeight: number): number {
  return pageHeight - displayY - height;
}

// ─── Text baseline conversion ─────────────────────────────────────────────────

/**
 * Converts a display-list text bounding box top-left Y to a pdf-lib text
 * baseline Y.
 *
 * In the display list, `y` is the **top** of the text bounding box.
 * pdf-lib's `drawText` positions text by its **baseline**.
 *
 * Approximation: baseline ≈ top + fontSize × 0.85 (accounts for typical
 * ascender height of standard fonts). This is a reasonable approximation for
 * Helvetica, Times-Roman, and Courier at common sizes.
 *
 * @param displayY - Top of the text bounding box (from page top).
 * @param fontSize - Font size in points.
 * @param pageHeight - Total page height in points.
 */
export function textBaselineY(displayY: number, fontSize: number, pageHeight: number): number {
  return pageHeight - displayY - fontSize * 0.85;
}
