import { type Color, rgb } from 'pdf-lib';

// ─── Color parsing ────────────────────────────────────────────────────────────

/**
 * Parses a display-list color string into a pdf-lib `Color` object.
 *
 * Supported formats:
 * - `null` → `null` (transparent / no color)
 * - `'transparent'` → `null`
 * - `'#RGB'` → `rgb(r/255, g/255, b/255)`
 * - `'#RRGGBB'` → `rgb(r/255, g/255, b/255)`
 * - `'#RRGGBBAA'` → `rgb(r/255, g/255, b/255)` (alpha ignored — pdf-lib handles opacity separately)
 * - `'rgb(r, g, b)'` → `rgb(r/255, g/255, b/255)`
 * - `'rgba(r, g, b, a)'` → `rgb(r/255, g/255, b/255)` (alpha ignored)
 *
 * Returns `null` for unrecognised strings, which callers treat as "no color".
 *
 * @example
 * parseColor('#ff0000')  // { type: 'RGB', red: 1, green: 0, blue: 0 }
 * parseColor(null)       // null
 * parseColor('transparent') // null
 */
export function parseColor(colorStr: string | null): Color | null {
  if (colorStr === null || colorStr === 'transparent') return null;

  if (colorStr.startsWith('#')) return parseHexColor(colorStr);
  if (colorStr.startsWith('rgb')) return parseRgbColor(colorStr);

  return null;
}

// ─── Hex parsing ──────────────────────────────────────────────────────────────

function parseHexColor(hex: string): Color | null {
  if (hex.length === 4) {
    // #RGB → expand to #RRGGBB
    const r1 = hex[1];
    const g1 = hex[2];
    const b1 = hex[3];
    if (r1 === undefined || g1 === undefined || b1 === undefined) return null;

    const r = parseInt(r1 + r1, 16);
    const g = parseInt(g1 + g1, 16);
    const b = parseInt(b1 + b1, 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

    return rgb(r / 255, g / 255, b / 255);
  }

  if (hex.length >= 7) {
    // #RRGGBB or #RRGGBBAA
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

    return rgb(r / 255, g / 255, b / 255);
  }

  return null;
}

// ─── RGB / RGBA parsing ───────────────────────────────────────────────────────

const RGB_RE = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i;

function parseRgbColor(colorStr: string): Color | null {
  const match = RGB_RE.exec(colorStr);
  if (match === null) return null;

  const rStr = match[1];
  const gStr = match[2];
  const bStr = match[3];
  if (rStr === undefined || gStr === undefined || bStr === undefined) return null;

  const r = parseInt(rStr, 10);
  const g = parseInt(gStr, 10);
  const b = parseInt(bStr, 10);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  return rgb(Math.min(1, r / 255), Math.min(1, g / 255), Math.min(1, b / 255));
}

// ─── Color validation ─────────────────────────────────────────────────────────

/** Matches `#RGB`, `#RRGGBB`, or `#RRGGBBAA`. */
const HEX_COLOR_VALID_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Returns true if the value is a valid non-null CSS color string accepted
 * by this renderer. Accepted formats: hex (`#RGB`, `#RRGGBB`, `#RRGGBBAA`),
 * `rgb()`, `rgba()`, `transparent`.
 */
export function isValidColor(color: string): boolean {
  return HEX_COLOR_VALID_RE.test(color) || /^rgba?\s*\(/.test(color) || color === 'transparent';
}

// ─── Named colors ─────────────────────────────────────────────────────────────

/**
 * A small subset of CSS named colors mapped to hex values.
 * Renderers may extend this table for richer named-color support.
 */
export const NAMED_COLORS: Readonly<Record<string, string>> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
  grey: '#808080',
  gray: '#808080',
  transparent: 'transparent',
};

/**
 * Parses a named color (e.g. `'black'`) in addition to hex/rgb formats.
 * Falls through to `parseColor` for other formats.
 */
export function parseColorWithNames(colorStr: string | null): Color | null {
  if (colorStr === null) return null;

  const lower = colorStr.toLowerCase();
  const hex = NAMED_COLORS[lower];
  if (hex !== undefined) {
    return parseColor(hex);
  }

  return parseColor(colorStr);
}
