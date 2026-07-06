/**
 * Measurement utilities for the ReportForge layout engine.
 *
 * All internal layout calculations use **points (pt)** as the canonical unit.
 * One point = 1/72 inch. This matches the traditional typographic unit and
 * the coordinate system used by PDF rendering.
 *
 * Functions in this module convert to and from points.
 * Renderers map points to their own coordinate systems (e.g. pixels, em).
 */

// ─── Conversion constants ─────────────────────────────────────────────────────

/** Points per inch (exact). */
export const PT_PER_INCH = 72 as const;

/** Points per millimeter (72 / 25.4). */
export const PT_PER_MM = 72 / 25.4;

/** Points per centimeter (72 / 2.54). */
export const PT_PER_CM = 72 / 2.54;

/**
 * Points per CSS pixel, assuming 96 DPI screen resolution.
 * 1px = 1/96 inch = 72/96 pt = 0.75 pt.
 */
export const PT_PER_PX = 72 / 96;

// ─── To points ───────────────────────────────────────────────────────────────

/**
 * Converts millimeters to points.
 * @example mmToPt(25.4) // 72 (1 inch)
 */
export function mmToPt(mm: number): number {
  return mm * PT_PER_MM;
}

/**
 * Converts centimeters to points.
 * @example cmToPt(2.54) // 72 (1 inch)
 */
export function cmToPt(cm: number): number {
  return cm * PT_PER_CM;
}

/**
 * Converts inches to points.
 * @example inToPt(1) // 72
 */
export function inToPt(inches: number): number {
  return inches * PT_PER_INCH;
}

/**
 * Converts CSS pixels (at 96 DPI) to points.
 * @example pxToPt(96) // 72 (1 inch at screen resolution)
 */
export function pxToPt(px: number): number {
  return px * PT_PER_PX;
}

// ─── From points ──────────────────────────────────────────────────────────────

/**
 * Converts points to millimeters.
 * @example ptToMm(72) // ≈ 25.4
 */
export function ptToMm(pt: number): number {
  return pt / PT_PER_MM;
}

/**
 * Converts points to centimeters.
 * @example ptToCm(72) // ≈ 2.54
 */
export function ptToCm(pt: number): number {
  return pt / PT_PER_CM;
}

/**
 * Converts points to inches.
 * @example ptToIn(72) // 1
 */
export function ptToIn(pt: number): number {
  return pt / PT_PER_INCH;
}

/**
 * Converts points to CSS pixels (at 96 DPI).
 * @example ptToPx(72) // 96
 */
export function ptToPx(pt: number): number {
  return pt / PT_PER_PX;
}
