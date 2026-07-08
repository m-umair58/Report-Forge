import type { ResolvedTextStyle, TextAlign, TextStyle, TextStyleInput } from './types.js';

// ─── Defaults ─────────────────────────────────────────────────────────────────

/** Default font family when none is specified. */
export const DEFAULT_FONT_FAMILY = 'Helvetica' as const;

/** Default body font size in points. */
export const DEFAULT_FONT_SIZE = 12;

/** Default line height multiplier. */
export const DEFAULT_LINE_HEIGHT = 1.2;

/** Default letter spacing in points. */
export const DEFAULT_LETTER_SPACING = 0;

/** Default text alignment. */
export const DEFAULT_TEXT_ALIGN: TextAlign = 'left';

// ─── Style resolution ─────────────────────────────────────────────────────────

/**
 * Resolves a partial `TextStyleInput` into a complete `ResolvedTextStyle`.
 *
 * Fills in defaults for any omitted optional fields.
 *
 * @example
 * const style = resolveTextStyle({ fontFamily: 'Helvetica', fontSize: 16 });
 * // { fontFamily: 'Helvetica', fontSize: 16, fontWeight: 'normal', ... }
 */
export function resolveTextStyle(input: TextStyleInput): ResolvedTextStyle {
  return {
    fontFamily: input.fontFamily,
    fontSize: input.fontSize,
    fontWeight: input.fontWeight ?? 'normal',
    italic: input.italic ?? false,
    underline: input.underline ?? false,
    letterSpacing: input.letterSpacing ?? DEFAULT_LETTER_SPACING,
    lineHeight: input.lineHeight ?? DEFAULT_LINE_HEIGHT,
    textAlign: input.textAlign ?? DEFAULT_TEXT_ALIGN,
  };
}

/**
 * Creates a complete `TextStyle` object with defaults applied.
 * Alias for `resolveTextStyle` for API symmetry.
 */
export function createTextStyle(input: TextStyleInput): ResolvedTextStyle {
  return resolveTextStyle(input);
}

/**
 * Validates that a resolved style has sane values for measurement.
 * @throws {Error} If fontSize ≤ 0 or lineHeight ≤ 0.
 */
export function assertValidStyle(style: ResolvedTextStyle): void {
  if (style.fontSize <= 0) {
    throw new Error(`fontSize must be > 0 (got ${style.fontSize.toString()})`);
  }
  if (style.lineHeight <= 0) {
    throw new Error(`lineHeight must be > 0 (got ${style.lineHeight.toString()})`);
  }
}

/**
 * Returns the line box height for a given style (fontSize × lineHeight).
 */
export function lineBoxHeight(style: Pick<ResolvedTextStyle, 'fontSize' | 'lineHeight'>): number {
  return style.fontSize * style.lineHeight;
}

/**
 * Returns the ascender height for positioning baselines.
 * Uses 0.85 × fontSize as a reasonable approximation for standard fonts.
 */
export function ascenderHeight(style: Pick<ResolvedTextStyle, 'fontSize'>): number {
  return style.fontSize * 0.85;
}

// Re-export TextStyle for convenience
export type { TextStyle };
