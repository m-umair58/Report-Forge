import type { ITheme, ReportMetadata } from '@reportforge/shared';

import { mmToPt, inToPt } from './units.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Supported named page size identifiers. */
export type PageSizeName = 'A4' | 'Letter' | 'Legal' | 'A3';

/** Page orientation. */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * Physical width and height of a page in points.
 * Values are always for portrait orientation — swap to get landscape.
 */
export interface PageDimensions {
  /** Page width in points. */
  readonly width: number;
  /** Page height in points. */
  readonly height: number;
}

/**
 * Fully resolved page model used throughout the layout algorithm.
 * All values are in points.
 */
export interface PageModel {
  /** Total page width in points. */
  readonly pageWidth: number;
  /** Total page height in points. */
  readonly pageHeight: number;
  /** Top margin in points. */
  readonly marginTop: number;
  /** Right margin in points. */
  readonly marginRight: number;
  /** Bottom margin in points. */
  readonly marginBottom: number;
  /** Left margin in points. */
  readonly marginLeft: number;
  /**
   * Width of the printable content area.
   * Equals pageWidth − marginLeft − marginRight.
   */
  readonly contentWidth: number;
  /**
   * Height of the printable content area.
   * Equals pageHeight − marginTop − marginBottom.
   * Header and footer heights are NOT yet subtracted here.
   */
  readonly contentHeight: number;
}

// ─── Page size constants ──────────────────────────────────────────────────────

/**
 * Physical dimensions for each named page size in portrait orientation.
 * All values are in points (pt).
 *
 * | Size   | Width (pt) | Height (pt) | Width (mm) | Height (mm) |
 * |--------|-----------|------------|-----------|------------|
 * | A4     | 595.28    | 841.89     | 210       | 297        |
 * | Letter | 612.00    | 792.00     | 215.9     | 279.4      |
 * | Legal  | 612.00    | 1008.00    | 215.9     | 355.6      |
 * | A3     | 841.89    | 1190.55    | 297       | 420        |
 */
export const PAGE_DIMENSIONS: Readonly<Record<PageSizeName, PageDimensions>> = {
  A4: { width: mmToPt(210), height: mmToPt(297) },
  Letter: { width: inToPt(8.5), height: inToPt(11) },
  Legal: { width: inToPt(8.5), height: inToPt(14) },
  A3: { width: mmToPt(297), height: mmToPt(420) },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the physical dimensions for a page size name and orientation.
 *
 * Falls back to A4 for unknown size strings, ensuring the layout engine always
 * has valid dimensions even when a custom size name is provided.
 *
 * @param sizeName - Named size (e.g. 'A4', 'Letter') or unknown string.
 * @param orientation - 'portrait' or 'landscape'.
 */
export function getPageDimensions(sizeName: string, orientation: PageOrientation): PageDimensions {
  const portrait = Object.prototype.hasOwnProperty.call(PAGE_DIMENSIONS, sizeName)
    ? (PAGE_DIMENSIONS as Record<string, PageDimensions>)[sizeName]
    : PAGE_DIMENSIONS['A4'];

  const base = portrait ?? PAGE_DIMENSIONS['A4'];

  return orientation === 'landscape' ? { width: base.height, height: base.width } : base;
}

/**
 * Builds a `PageModel` from the report schema metadata and the active theme.
 *
 * Resolution priority (highest to lowest):
 * 1. Report metadata (`metadata.pageSize`, `metadata.orientation`)
 * 2. Theme page tokens (`theme.tokens.page.*`)
 *
 * @example
 * const model = createPageModel({ pageSize: 'Letter', orientation: 'landscape' }, myTheme);
 * // model.pageWidth  → 792 pt (Letter landscape)
 * // model.pageHeight → 612 pt
 */
export function createPageModel(metadata: ReportMetadata, theme: ITheme): PageModel {
  const sizeName: string = metadata.pageSize ?? theme.tokens.page.size;
  const orientation: PageOrientation = metadata.orientation ?? theme.tokens.page.orientation;

  const dims = getPageDimensions(sizeName, orientation);

  const marginTop = theme.tokens.page.marginTop;
  const marginRight = theme.tokens.page.marginRight;
  const marginBottom = theme.tokens.page.marginBottom;
  const marginLeft = theme.tokens.page.marginLeft;

  return {
    pageWidth: dims.width,
    pageHeight: dims.height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    contentWidth: dims.width - marginLeft - marginRight,
    contentHeight: dims.height - marginTop - marginBottom,
  };
}
