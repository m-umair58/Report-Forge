import type { ITheme } from '@reportforge/shared';

import type { ChartTheme } from './types.js';

export const DEFAULT_CHART_COLORS: readonly string[] = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
];

export const DEFAULT_CHART_THEME: ChartTheme = {
  colors: DEFAULT_CHART_COLORS,
  fontFamily: 'Helvetica',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeTitle: 14,
  textColor: '#1a1a1a',
  mutedColor: '#666666',
  gridColor: '#e5e7eb',
  axisColor: '#374151',
  background: '#ffffff',
  strokeWidth: 1,
  spacing: 8,
};

export function createChartTheme(overrides: Partial<ChartTheme> = {}): ChartTheme {
  return {
    ...DEFAULT_CHART_THEME,
    ...overrides,
    colors: overrides.colors ?? DEFAULT_CHART_THEME.colors,
  };
}

/** Maps report theme tokens to chart styling without renderer coupling. */
export function chartThemeFromReportTheme(theme?: ITheme): ChartTheme {
  if (theme === undefined) return DEFAULT_CHART_THEME;

  const colors = theme.tokens.colors;
  const typography = theme.tokens.typography;

  return createChartTheme({
    colors: [
      colors.primary,
      colors.success,
      colors.accent,
      colors.secondary,
      colors.error,
      colors.primary,
      colors.secondary,
    ],
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    fontSizeSmall: typography.fontSizeSmall,
    fontSizeTitle: typography.fontSizeTitle,
    textColor: colors.text,
    mutedColor: colors.textMuted,
    gridColor: colors.border,
    axisColor: colors.text,
    background: colors.background,
    spacing: theme.tokens.spacing.component,
  });
}

export function seriesColor(theme: ChartTheme, index: number): string {
  return theme.colors[index % theme.colors.length] ?? '#2563eb';
}
