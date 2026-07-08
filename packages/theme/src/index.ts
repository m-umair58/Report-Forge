/**
 * @reportforge/theme
 *
 * Renderer-independent theme and styling engine for ReportForge.
 */

export {
  DefaultTheme,
  DEFAULT_FONT_SCALE,
  DEFAULT_RADIUS,
  DEFAULT_SPACING,
  createBaseColors,
  createBaseTokens,
  createTheme,
  mergeTokens,
  inToPt,
} from './tokens.js';

export {
  ThemeRegistry,
  ThemeProvider,
  toLayoutTheme,
  createDisplayListThemeOptions,
} from './registry.js';

export {
  StyleResolver,
  validateTheme,
  resolvedStyleToRecord,
} from './resolver.js';

export {
  applyThemeToLayout,
  applyThemeToSchema,
  defaultStyleResolver,
} from './apply-theme.js';

export type {
  Theme,
  ThemeInput,
  DesignTokens,
  ColorTokens,
  TypographyTokens,
  TypographyStyleTokens,
  SpacingScale,
  SpacingToken,
  RadiusToken,
  FontSizeToken,
  ColorTokenName,
  SizingTokens,
  BorderTokens,
  OpacityTokens,
  ElevationTokens,
  ShadowTokens,
  ComponentThemeTokens,
  PageTokens,
  ResolvedStyle,
  StyleResolveContext,
  ThemeValidationIssue,
  ThemeValidationResult,
  ThemeTokenOverrides,
  ITheme,
} from './types.js';

export const PACKAGE_NAME = '@reportforge/theme' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
