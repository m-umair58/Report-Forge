import type { ITheme } from '@reportforge/shared';

import { inToPt } from './units.js';

/**
 * Default layout theme used when no theme is explicitly provided to the engine.
 *
 * Provides reasonable typographic and spacing defaults without requiring the
 * `@reportforge/themes` package. This keeps `@reportforge/layout` independent
 * of `@reportforge/themes`.
 *
 * Values for layout-relevant fields (spacing, typography, page) are
 * production-quality. Color tokens are placeholders — the renderer resolves
 * colors from its own theme configuration.
 *
 * All spacing and size values are in points (pt).
 *
 * @example
 * import { LayoutEngine, DEFAULT_LAYOUT_THEME } from '@reportforge/layout';
 *
 * const engine = new LayoutEngine();
 * const result = engine.layout({ schema, theme: DEFAULT_LAYOUT_THEME });
 */
export const DEFAULT_LAYOUT_THEME: ITheme = {
  name: 'layout-default',
  tokens: {
    colors: {
      primary: '#1a1a2e',
      secondary: '#555555',
      text: '#1a1a1a',
      textMuted: '#888888',
      background: '#ffffff',
      border: '#cccccc',
      accent: '#0066cc',
      error: '#cc0000',
      success: '#00aa00',
    },
    typography: {
      fontFamily: 'Helvetica',
      fontFamilyMono: 'Courier',
      // Base body font size. All estimates scale from this.
      fontSize: 12,
      fontSizeSmall: 10,
      fontSizeLarge: 14,
      fontSizeTitle: 24,
      fontSizeSubtitle: 18,
      // Line height multiplier applied to font size for height estimates.
      lineHeight: 1.2,
      fontWeightNormal: 400,
      fontWeightBold: 700,
    },
    spacing: {
      unit: 8,
      // Vertical space before a section heading group.
      section: 20,
      // Vertical space after a paragraph.
      paragraph: 8,
      // Vertical space after a title.
      title: 8,
      // Vertical space around a table.
      table: 12,
      // Generic vertical gap between sibling components.
      component: 10,
      // Page margins — 1 inch on all sides (72pt).
      pageMarginTop: inToPt(1),
      pageMarginBottom: inToPt(1),
      pageMarginLeft: inToPt(1),
      pageMarginRight: inToPt(1),
    },
    borders: {
      width: 0.5,
      color: '#cccccc',
      radius: 0,
      style: 'solid',
    },
    components: {
      title: {},
      subtitle: {},
      paragraph: {},
      table: {},
      header: {},
      footer: {},
      summaryCard: {},
      divider: {},
    },
    page: {
      size: 'A4',
      orientation: 'portrait',
      marginTop: inToPt(1),
      marginBottom: inToPt(1),
      marginLeft: inToPt(1),
      marginRight: inToPt(1),
    },
  },
};
