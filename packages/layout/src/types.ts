import type { LayoutOutput } from '@reportforge/shared';

import type { BoxModel } from './box.js';

/**
 * A positioned node in the layout tree.
 *
 * More detailed than `LayoutElement` (from `@reportforge/shared`):
 * - Includes the page number for multi-page documents
 * - Carries a full box model (margin and padding)
 * - Contains nested children for container nodes (Section, Header, Footer)
 *
 * Absolute coordinates are from the top-left corner of the page.
 *
 * @example
 * const titleNode: LayoutNode = {
 *   id: 'title-1',
 *   type: 'title',
 *   pageNumber: 1,
 *   x: 72,           // left margin
 *   y: 72,           // top margin (no header)
 *   width: 451.28,   // A4 content width
 *   height: 28.8,    // 24pt × 1.2 line height
 *   box: ZERO_BOX_MODEL,
 *   props: { text: 'Monthly Sales' },
 *   style: {},
 *   children: [],
 * };
 */
export interface LayoutNode {
  /** Unique node identifier matching the original schema node ID. */
  readonly id: string;
  /** Component type discriminator (e.g. 'title', 'section', 'table'). */
  readonly type: string;
  /** Page number this node appears on (1-indexed). */
  readonly pageNumber: number;
  /** Absolute X coordinate from the page left edge, in points. */
  readonly x: number;
  /** Absolute Y coordinate from the page top edge, in points. */
  readonly y: number;
  /** Element width in points. */
  readonly width: number;
  /** Element height in points (estimated for most component types in M4). */
  readonly height: number;
  /** Box model: margin and padding applied to this node, in points. */
  readonly box: BoxModel;
  /** Component-specific data (forwarded from the schema node). */
  readonly props: Readonly<Record<string, unknown>>;
  /** Resolved inline style tokens (forwarded from the schema node). */
  readonly style: Readonly<Record<string, unknown>>;
  /**
   * Child layout nodes for container elements (Section, Header, Footer).
   * Empty for leaf nodes (Title, Paragraph, Table, etc.).
   */
  readonly children: readonly LayoutNode[];
}

/**
 * Extended output from `LayoutEngine.layout()`.
 *
 * Satisfies `LayoutOutput` (from `@reportforge/shared`) and adds
 * the full hierarchical layout node tree for advanced consumers.
 *
 * Renderers use `pages` for flat per-page element lists.
 * Advanced tooling (debugging, accessibility, DOCX) can use `nodes`.
 *
 * @example
 * const result = engine.layout({ schema, theme });
 * console.log(`Pages: ${result.pages.length}`);
 * console.log(`Top-level nodes: ${result.nodes.length}`);
 */
export interface LayoutResult extends LayoutOutput {
  /**
   * Top-level layout nodes in document order.
   * Container nodes (Section) include their children in the `children` field.
   * Does not include Header and Footer (which appear in each page's elements).
   */
  readonly nodes: readonly LayoutNode[];
}
