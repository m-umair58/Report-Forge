import { type PDFDocument, type PDFFont, StandardFonts } from 'pdf-lib';

import type { FontWeight } from '@reportforge/display-list';

// ─── Font key ─────────────────────────────────────────────────────────────────

type FontCacheKey = `${string}:${FontWeight}`;

function makeKey(fontName: string, weight: FontWeight): FontCacheKey {
  return `${fontName.toLowerCase()}:${weight}`;
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
 *
 * Custom font embedding (TTF/OTF) is reserved for a future milestone.
 *
 * @example
 * resolveStandardFont('Helvetica', 'bold') // StandardFonts.HelveticaBold
 * resolveStandardFont('Courier', 'normal') // StandardFonts.Courier
 * resolveStandardFont('UnknownFont', 'bold') // StandardFonts.HelveticaBold (fallback)
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

  // Default: Helvetica (covers 'helvetica', 'sans', 'arial', 'inter', unknowns)
  return bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
}

// ─── All standard font pairs ──────────────────────────────────────────────────

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
 * `FontManager` is created fresh per `PdfRenderer.render()` call. It:
 * 1. Eagerly loads all six standard fonts (Helvetica, Times-Roman, Courier
 *    × normal/bold) into the pdf-lib document.
 * 2. Resolves a `(fontName, weight)` pair to a pre-loaded `PDFFont`.
 * 3. Falls back to Helvetica when a requested font is not found.
 *
 * ## Future extension
 *
 * To add custom font embedding (TTF/OTF), call `pdf-lib`'s
 * `PDFDocument.embedFont(fontBytes)` and register the result via a future
 * `FontManager.registerCustom()` method.
 *
 * @example
 * const fontManager = new FontManager();
 * await fontManager.preload(pdfDoc);
 * const font = fontManager.resolve('Helvetica', 'bold');
 * page.drawText('Hello', { font, size: 12, ... });
 */
export class FontManager {
  private readonly _cache = new Map<FontCacheKey, PDFFont>();

  /**
   * Eagerly loads all standard fonts into `pdfDoc`.
   * Must be called once before any calls to `resolve()`.
   */
  async preload(pdfDoc: PDFDocument): Promise<void> {
    for (const def of STANDARD_FONT_DEFINITIONS) {
      const key = makeKey(def.name, def.weight);
      if (!this._cache.has(key)) {
        const font = await pdfDoc.embedFont(def.standard);
        this._cache.set(key, font);
      }
    }
  }

  /**
   * Resolves a font name and weight to a loaded `PDFFont`.
   * Falls back to Helvetica (normal) if the requested combination was not loaded.
   *
   * @throws {Error} If `preload()` has not been called (no fonts loaded at all).
   */
  resolve(fontName: string, weight: FontWeight): PDFFont {
    const key = makeKey(fontName, weight);
    const cached = this._cache.get(key);
    if (cached !== undefined) return cached;

    // Try resolving via the standard-font mapping and look up that key.
    const standardFont = resolveStandardFont(fontName, weight);
    for (const def of STANDARD_FONT_DEFINITIONS) {
      if (def.standard === standardFont) {
        const resolvedKey = makeKey(def.name, def.weight);
        const resolvedFont = this._cache.get(resolvedKey);
        if (resolvedFont !== undefined) return resolvedFont;
      }
    }

    // Final fallback: Helvetica normal
    const fallback = this._cache.get(makeKey('helvetica', 'normal'));
    if (fallback !== undefined) return fallback;

    throw new Error(`FontManager: no fonts loaded. Did you forget to call preload()?`);
  }

  /** Returns the number of fonts currently loaded. */
  get size(): number {
    return this._cache.size;
  }
}
