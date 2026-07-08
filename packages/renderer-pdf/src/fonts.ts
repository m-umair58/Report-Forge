import { type PDFDocument, StandardFonts } from 'pdf-lib';

import type { FontWeight } from '@reportforge/display-list';

// ─── Font key ─────────────────────────────────────────────────────────────────

type FontCacheKey = `${string}:${FontWeight}`;

function makeKey(fontName: string, weight: FontWeight): FontCacheKey {
  return `${fontName.toLowerCase()}:${weight}`;
}

// ─── Font registration ────────────────────────────────────────────────────────

/** Options for registering a custom font (embedding TTF/OTF is reserved for a future release). */
export interface CustomFontRegistration {
  readonly name: string;
  readonly weight?: FontWeight;
  /** Raw font bytes — not yet supported; registration is stored for future use. */
  readonly bytes?: Uint8Array;
  /** Map to a built-in standard font instead of embedding custom bytes. */
  readonly standardFont?: StandardFonts;
}

// ─── Standard font resolution ─────────────────────────────────────────────────

/**
 * Maps a font name and weight to a pdf-lib `StandardFonts` enum value.
 *
 * Supported families (case-insensitive, partial matching):
 * - `Helvetica`, `helvetica`, `sans`, `sans-serif`, `arial` → Helvetica
 * - `Times`, `times-roman`, `serif`, `georgia` → Times-Roman
 * - `Courier`, `courier-new`, `mono`, `monospace`, `consolas` → Courier
 *
 * Unknown font names fall back to Helvetica.
 */
export function resolveStandardFont(fontName: string, weight: FontWeight): StandardFonts {
  const name = fontName.toLowerCase();
  const bold = weight === 'bold';

  if (
    name.includes('courier') ||
    name.includes('mono') ||
    name.includes('consolas') ||
    name.includes('menlo') ||
    name.includes('inconsolata')
  ) {
    return bold ? StandardFonts.CourierBold : StandardFonts.Courier;
  }

  if (
    name.includes('times') ||
    name.includes('serif') ||
    name.includes('georgia') ||
    name.includes('garamond')
  ) {
    return bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
  }

  return bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
}

/** All built-in standard fonts that the renderer preloads per document. */
const STANDARD_FONT_DEFINITIONS: ReadonlyArray<{
  readonly name: string;
  readonly weight: FontWeight;
  readonly standard: StandardFonts;
}> = [
  { name: 'helvetica', weight: 'normal', standard: StandardFonts.Helvetica },
  { name: 'helvetica', weight: 'bold', standard: StandardFonts.HelveticaBold },
  { name: 'times-roman', weight: 'normal', standard: StandardFonts.TimesRoman },
  { name: 'times-roman', weight: 'bold', standard: StandardFonts.TimesRomanBold },
  { name: 'courier', weight: 'normal', standard: StandardFonts.Courier },
  { name: 'courier', weight: 'bold', standard: StandardFonts.CourierBold },
];

// ─── FontManager ──────────────────────────────────────────────────────────────

/**
 * Manages font loading and resolution for a single PDF document.
 *
 * Preloads Helvetica, Times-Roman, and Courier (normal + bold) and supports
 * registering additional font aliases via `register()`.
 */
export class FontManager {
  private readonly _cache = new Map<FontCacheKey, import('pdf-lib').PDFFont>();
  private readonly _aliases = new Map<FontCacheKey, FontCacheKey>();
  private readonly _pendingCustom: CustomFontRegistration[] = [];

  /**
   * Registers a font alias for use during rendering.
   *
   * Custom byte embedding (`bytes`) is reserved for a future release — only
   * `standardFont` remapping is active today.
   *
   * @example
   * fontManager.register('Brand Sans', { standardFont: StandardFonts.Helvetica, weight: 'bold' });
   */
  register(registration: CustomFontRegistration): void {
    const weight = registration.weight ?? 'normal';

    if (registration.bytes !== undefined) {
      this._pendingCustom.push(registration);
      return;
    }

    if (registration.standardFont !== undefined) {
      for (const def of STANDARD_FONT_DEFINITIONS) {
        if (def.standard === registration.standardFont && def.weight === weight) {
          this._aliases.set(makeKey(registration.name, weight), makeKey(def.name, def.weight));
          return;
        }
      }
    }

    this._aliases.set(makeKey(registration.name, weight), makeKey('helvetica', weight));
  }

  /** Returns custom font registrations awaiting future embedding support. */
  get pendingCustomFonts(): readonly CustomFontRegistration[] {
    return this._pendingCustom;
  }

  /** Eagerly loads all standard fonts into `pdfDoc`. */
  async preload(pdfDoc: PDFDocument): Promise<void> {
    for (const def of STANDARD_FONT_DEFINITIONS) {
      const key = makeKey(def.name, def.weight);
      if (!this._cache.has(key)) {
        const font = await pdfDoc.embedFont(def.standard);
        this._cache.set(key, font);
      }
    }
  }

  /** Resolves a font name and weight to a loaded `PDFFont`. */
  resolve(fontName: string, weight: FontWeight): import('pdf-lib').PDFFont {
    const directKey = makeKey(fontName, weight);
    const aliasKey = this._aliases.get(directKey);
    const lookupKey = aliasKey ?? directKey;

    const cached = this._cache.get(lookupKey);
    if (cached !== undefined) return cached;

    const standardFont = resolveStandardFont(fontName, weight);
    for (const def of STANDARD_FONT_DEFINITIONS) {
      if (def.standard === standardFont) {
        const resolvedKey = makeKey(def.name, def.weight);
        const resolvedFont = this._cache.get(resolvedKey);
        if (resolvedFont !== undefined) return resolvedFont;
      }
    }

    const fallback = this._cache.get(makeKey('helvetica', 'normal'));
    if (fallback !== undefined) return fallback;

    throw new Error('FontManager: no fonts loaded. Did you forget to call preload()?');
  }

  /** Returns the number of fonts currently loaded. */
  get size(): number {
    return this._cache.size;
  }
}
