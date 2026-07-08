import type { IReportNode, ITheme } from '@reportforge/shared';
import { estimateChartHeight } from '@reportforge/chart-core';
import { estimateTableHeight } from '@reportforge/table';

import { themeToTableTheme } from './table-theme.js';

/**
 * Height estimators for each built-in component type.
 *
 * These are intentional approximations — real measurements require font metrics
 * (kerning, ligatures, actual glyph advance widths) which are renderer-specific.
 * A future milestone will replace these with precise font-metric-based measurements.
 *
 * All returned values are in points (pt).
 *
 * ## Estimation model
 *
 * Text height: `fontSize × lineHeight`
 * Paragraph line count: `ceil(textLength / charsPerLine)`
 * where `charsPerLine = floor(contentWidth / (fontSize × AVG_CHAR_WIDTH_RATIO))`
 *
 * The constant `AVG_CHAR_WIDTH_RATIO = 0.5` approximates the average character
 * advance width for proportional fonts (Helvetica, Inter, Arial) as a fraction
 * of the point size. This is conservative — real text typically fits more
 * characters per line, so estimated heights may be slightly larger than actual.
 */

/** Ratio of average character advance width to font size for proportional fonts. */
const AVG_CHAR_WIDTH_RATIO = 0.5;

/**
 * Estimates the rendered height of a schema node in points.
 *
 * For container nodes (section, header, footer), the height is the sum
 * of their children's heights plus inter-element spacing.
 *
 * @param node - The schema node to estimate.
 * @param contentWidth - Available width in points (used for line-wrapping estimates).
 * @param theme - Theme providing typography and spacing tokens.
 */
export function estimateNodeHeight(node: IReportNode, contentWidth: number, theme: ITheme): number {
  const { typography, spacing } = theme.tokens;

  switch (node.type) {
    case 'title':
      return typography.fontSizeTitle * typography.lineHeight;

    case 'subtitle':
      return typography.fontSizeSubtitle * typography.lineHeight;

    case 'paragraph': {
      const text = typeof node.props['text'] === 'string' ? node.props['text'] : '';
      return estimateParagraphHeight(
        text,
        contentWidth,
        typography.fontSize,
        typography.lineHeight,
      );
    }

    case 'divider':
      // Thin horizontal rule — border width plus a small visual gap.
      return 2;

    case 'section':
    case 'container':
    case 'stack':
    case 'row': {
      let total = spacing.section;
      for (const child of node.children) {
        total += estimateNodeHeight(child, contentWidth, theme) + spacing.component;
      }
      return Math.max(total - spacing.component, spacing.section);
    }

    case 'heading':
      return typography.fontSizeSubtitle * typography.lineHeight;

    case 'caption':
    case 'label':
      return typography.fontSize * typography.lineHeight * 0.9;

    case 'spacer': {
      const size = node.props['size'];
      return typeof size === 'number' && size >= 0 ? size : spacing.component;
    }

    case 'logo':
      return typeof node.props['height'] === 'number' ? node.props['height'] : 80;

    case 'icon': {
      const size = node.props['size'];
      return typeof size === 'number' && size > 0 ? size : 24;
    }

    case 'metric-card':
    case 'kpi':
      return 68;

    case 'badge':
    case 'status-pill':
      return 28;

    case 'info-box':
    case 'alert-box': {
      const message = typeof node.props['message'] === 'string' ? node.props['message'] : '';
      return estimateParagraphHeight(message, contentWidth, typography.fontSize, typography.lineHeight) + 24;
    }

    case 'header':
    case 'footer': {
      let total = 0;
      for (const child of node.children) {
        total += estimateNodeHeight(child, contentWidth, theme) + spacing.paragraph;
      }
      return Math.max(total - spacing.paragraph, 0);
    }

    case 'table': {
      const columns = Array.isArray(node.props['columns']) ? node.props['columns'] : [];
      const rows = Array.isArray(node.props['rows']) ? node.props['rows'] : [];
      return estimateTableHeight(
        { columns: columns as never, rows: rows as never },
        contentWidth,
        themeToTableTheme(theme),
        { style: node.props['tableStyle'] as never },
      );
    }

    case 'image':
      // Placeholder: 100pt ≈ 35mm. Real size comes from image metadata.
      return 100;

    case 'chart': {
      const title = typeof node.props['title'] === 'string' ? node.props['title'] : undefined;
      const legend = node.props['legend'] as 'top' | 'bottom' | 'left' | 'right' | 'hidden' | undefined;
      const height = typeof node.props['height'] === 'number' ? node.props['height'] : undefined;
      return estimateChartHeight(title !== undefined, legend, height);
    }

    case 'summary-card':
      // Placeholder: a compact card with label, value, and trend line.
      return 60;

    case 'qr-code':
      // Placeholder: square QR code, 72pt ≈ 1 inch.
      return 72;

    case 'barcode':
      // Placeholder: barcode with label, 48pt ≈ 17mm height.
      return 48;

    default:
      // Unknown component type: fall back to a single text line height.
      return typography.fontSize * typography.lineHeight;
  }
}

/**
 * Estimates the height of a paragraph node in points.
 *
 * The algorithm:
 * 1. Compute chars-per-line using average character width (proportional to fontSize).
 * 2. Count lines = ceil(textLength / charsPerLine).
 * 3. Height = lines × fontSize × lineHeight.
 *
 * This model intentionally overestimates slightly (conservative) so that
 * pagination decisions err on the side of adding a new page rather than
 * allowing visible overflow.
 *
 * @param text - The paragraph text content.
 * @param contentWidth - Available width in points.
 * @param fontSize - Current font size in points.
 * @param lineHeight - Line height multiplier.
 */
export function estimateParagraphHeight(
  text: string,
  contentWidth: number,
  fontSize: number,
  lineHeight: number,
): number {
  if (text.length === 0) {
    return fontSize * lineHeight;
  }

  const charWidth = fontSize * AVG_CHAR_WIDTH_RATIO;
  const charsPerLine = Math.max(1, Math.floor(contentWidth / charWidth));
  const lineCount = Math.ceil(text.length / charsPerLine);
  return lineCount * fontSize * lineHeight;
}
