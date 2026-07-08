/**
 * Whitespace normalization utilities for the line breaker.
 *
 * ## Normalization rules
 *
 * 1. Trim leading and trailing whitespace from the entire string.
 * 2. Collapse consecutive spaces/tabs within a line to a single space.
 * 3. Preserve explicit newline characters (`\n`, `\r\n`).
 * 4. Remove empty lines caused solely by whitespace-only lines.
 *
 * Explicit newlines are never collapsed — they always produce line breaks.
 */

/**
 * Normalizes whitespace in a text string for paragraph layout.
 *
 * @param text - Raw input text.
 * @returns Normalized text with collapsed inline whitespace.
 *
 * @example
 * normalizeWhitespace('  Hello   world  ') // 'Hello world'
 * normalizeWhitespace('Line1\n\nLine2')   // 'Line1\n\nLine2'
 */
export function normalizeWhitespace(text: string): string {
  if (text.length === 0) return text;

  // Split on newlines, normalize each line, rejoin
  const lines = text.split(/\r?\n/);
  const normalized = lines.map((line) => line.replace(/[ \t]+/g, ' ').trim());

  return normalized.join('\n').trim();
}

/**
 * Splits text into paragraph segments at explicit newline boundaries.
 * Empty segments from consecutive newlines are preserved as empty strings.
 */
export function splitOnNewlines(text: string): string[] {
  return text.split(/\r?\n/);
}

/**
 * Tokenizes a single line segment into words (whitespace-separated).
 * Consecutive whitespace is treated as a single word boundary.
 */
export function tokenizeWords(line: string): string[] {
  if (line.length === 0) return [];
  return line.split(/\s+/).filter((word) => word.length > 0);
}
