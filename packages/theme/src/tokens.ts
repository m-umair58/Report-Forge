import type { ColorTokens, DesignTokens, FontSizeToken, RadiusToken, SpacingToken, Theme, ThemeTokenOverrides } from './types.js';

const PT_PER_INCH = 72;

export function inToPt(inches: number): number {
  return inches * PT_PER_INCH;
}

export const DEFAULT_RADIUS: Readonly<Record<RadiusToken, number>> = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  full: 9999,
};

export const DEFAULT_FONT_SCALE: Readonly<Record<FontSizeToken, number>> = {
  xs: 9,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
  '2xl': 24,
};

export const DEFAULT_SPACING: Readonly<Record<SpacingToken, number>> = {
  '0': 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
};

export function createBaseColors(overrides: Partial<ColorTokens> = {}): ColorTokens {
  const primary = overrides.primary ?? '#1a1a2e';
  const textPrimary = overrides.textPrimary ?? overrides.text ?? '#1a1a1a';
  const textSecondary = overrides.textSecondary ?? overrides.textMuted ?? '#555555';
  const muted = overrides.muted ?? '#888888';

  return {
    primary,
    secondary: overrides.secondary ?? '#555555',
    success: overrides.success ?? '#16a34a',
    warning: overrides.warning ?? '#d97706',
    danger: overrides.danger ?? overrides.error ?? '#dc2626',
    info: overrides.info ?? '#2563eb',
    background: overrides.background ?? '#ffffff',
    surface: overrides.surface ?? '#f8f9fa',
    border: overrides.border ?? '#cccccc',
    textPrimary,
    textSecondary,
    muted,
    accent: overrides.accent ?? '#0066cc',
    error: overrides.error ?? '#dc2626',
    text: textPrimary,
    textMuted: muted,
  };
}

export function createBaseTokens(colorOverrides: Partial<ColorTokens> = {}): DesignTokens {
  const colors = createBaseColors(colorOverrides);

  return {
    colors,
    typography: {
      fontFamily: 'Helvetica',
      fontFamilyMono: 'Courier',
      fontSize: 12,
      fontSizeSmall: 10,
      fontSizeLarge: 14,
      fontSizeTitle: 24,
      fontSizeSubtitle: 18,
      lineHeight: 1.2,
      letterSpacing: 0,
      fontWeightNormal: 400,
      fontWeightBold: 700,
      scale: { ...DEFAULT_FONT_SCALE },
      heading: { fontWeight: 700, color: 'textPrimary', fontSize: 'xl' },
      paragraph: { color: 'textPrimary', fontSize: 'md', lineHeight: 1.2 },
      caption: { color: 'muted', fontSize: 'sm', lineHeight: 1.2 },
    },
    spacing: {
      ...DEFAULT_SPACING,
      unit: 8,
      section: 20,
      paragraph: 8,
      title: 8,
      table: 12,
      component: 10,
      pageMarginTop: inToPt(1),
      pageMarginBottom: inToPt(1),
      pageMarginLeft: inToPt(1),
      pageMarginRight: inToPt(1),
    },
    sizing: {
      icon: 24,
      card: 68,
      tableRow: 28,
    },
    borders: {
      width: 0.5,
      color: colors.border,
      style: 'solid',
      radius: { ...DEFAULT_RADIUS },
    },
    opacity: {
      disabled: 0.5,
      muted: 0.7,
      overlay: 0.85,
    },
    elevation: {
      none: 0,
      sm: 1,
      md: 2,
      lg: 4,
    },
    shadows: {
      none: 'none',
      sm: '0 1px 2px rgba(0,0,0,0.06)',
      md: '0 2px 8px rgba(0,0,0,0.08)',
      lg: '0 4px 16px rgba(0,0,0,0.12)',
    },
    components: {
      title: { color: 'primary', fontSize: '2xl', fontWeight: 700 },
      subtitle: { color: 'textPrimary', fontSize: 'xl', fontWeight: 700 },
      heading: { color: 'textPrimary', fontSize: 'lg', fontWeight: 700 },
      paragraph: { color: 'textPrimary', fontSize: 'md' },
      caption: { color: 'muted', fontSize: 'sm' },
      label: { color: 'textSecondary', fontSize: 'sm', fontWeight: 600 },
      table: { fontSize: 'sm' },
      header: { background: 'surface', color: 'textPrimary' },
      footer: { background: 'surface', color: 'muted', fontSize: 'sm' },
      summaryCard: { background: 'surface', color: 'textPrimary' },
      metricCard: { background: 'surface', color: 'textPrimary' },
      divider: { borderColor: 'border' },
      section: {},
    },
    page: {
      size: 'A4',
      orientation: 'portrait',
      marginTop: inToPt(1),
      marginBottom: inToPt(1),
      marginLeft: inToPt(1),
      marginRight: inToPt(1),
      background: 'background',
    },
  };
}

/** Built-in default theme. */
export const DefaultTheme: Theme = {
  name: 'default',
  tokens: createBaseTokens(),
};

export function mergeTokens(base: DesignTokens, overrides: ThemeTokenOverrides): DesignTokens {
  return {
    colors: { ...base.colors, ...overrides.colors },
    typography: { ...base.typography, ...overrides.typography },
    spacing: { ...base.spacing, ...overrides.spacing },
    sizing: { ...base.sizing, ...overrides.sizing },
    borders: {
      ...base.borders,
      ...overrides.borders,
      radius: { ...base.borders.radius, ...overrides.borders?.radius },
    },
    opacity: { ...base.opacity, ...overrides.opacity },
    elevation: { ...base.elevation, ...overrides.elevation },
    shadows: { ...base.shadows, ...overrides.shadows },
    components: { ...base.components, ...overrides.components },
    page: { ...base.page, ...overrides.page },
  };
}

export function createTheme(name: string, tokenOverrides: ThemeTokenOverrides, extendsTheme?: Theme): Theme {
  const base = extendsTheme?.tokens ?? DefaultTheme.tokens;
  return {
    name,
    ...(extendsTheme !== undefined ? { extends: extendsTheme.name } : {}),
    tokens: mergeTokens(base, tokenOverrides),
  };
}
