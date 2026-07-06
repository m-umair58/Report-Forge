/**
 * CSS-inspired box model for the ReportForge layout engine.
 *
 * The box model determines how space is allocated around layout nodes.
 * All values are in points (pt).
 *
 * Layout model (outer → inner):
 * ```
 * ┌─────────────────────────────┐
 * │           margin            │
 * │  ┌───────────────────────┐  │
 * │  │        padding        │  │
 * │  │  ┌─────────────────┐  │  │
 * │  │  │     content     │  │  │
 * │  │  └─────────────────┘  │  │
 * │  └───────────────────────┘  │
 * └─────────────────────────────┘
 * ```
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Spacing on all four sides of a box (margin or padding).
 * All values are in points.
 */
export interface EdgeInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/**
 * Box model for a layout node.
 * Combines outer margin and inner padding.
 */
export interface BoxModel {
  readonly margin: EdgeInsets;
  readonly padding: EdgeInsets;
}

// ─── Factories ────────────────────────────────────────────────────────────────

/**
 * Creates an `EdgeInsets` with the same value on all four sides.
 * @example uniformEdgeInsets(12) → { top: 12, right: 12, bottom: 12, left: 12 }
 */
export function uniformEdgeInsets(value: number): EdgeInsets {
  return { top: value, right: value, bottom: value, left: value };
}

/**
 * Creates an `EdgeInsets` with explicit values for each side.
 * Order matches CSS shorthand: top, right, bottom, left.
 */
export function edgeInsets(top: number, right: number, bottom: number, left: number): EdgeInsets {
  return { top, right, bottom, left };
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** EdgeInsets with zero on all sides. */
export const ZERO_EDGE_INSETS: EdgeInsets = Object.freeze(uniformEdgeInsets(0));

/** Box model with zero margin and zero padding. */
export const ZERO_BOX_MODEL: BoxModel = Object.freeze({
  margin: ZERO_EDGE_INSETS,
  padding: ZERO_EDGE_INSETS,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the total horizontal extent (left + right) of an `EdgeInsets`.
 * Used to reduce available width when applying margin or padding.
 */
export function horizontalExtent(insets: EdgeInsets): number {
  return insets.left + insets.right;
}

/**
 * Returns the total vertical extent (top + bottom) of an `EdgeInsets`.
 * Used to reduce available height when applying margin or padding.
 */
export function verticalExtent(insets: EdgeInsets): number {
  return insets.top + insets.bottom;
}

/**
 * Returns the total horizontal space consumed by the box model
 * (margin left + margin right + padding left + padding right).
 */
export function totalHorizontalInsets(box: BoxModel): number {
  return horizontalExtent(box.margin) + horizontalExtent(box.padding);
}

/**
 * Returns the total vertical space consumed by the box model
 * (margin top + margin bottom + padding top + padding bottom).
 */
export function totalVerticalInsets(box: BoxModel): number {
  return verticalExtent(box.margin) + verticalExtent(box.padding);
}
