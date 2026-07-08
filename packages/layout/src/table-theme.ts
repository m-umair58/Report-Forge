import type { ITheme } from '@reportforge/shared';
import { DEFAULT_TABLE_THEME } from '@reportforge/table';

export function themeToTableTheme(theme: ITheme) {
  const { typography, borders, colors } = theme.tokens;
  return {
    ...DEFAULT_TABLE_THEME,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSmall > 0 ? typography.fontSizeSmall : typography.fontSize,
    lineHeight: typography.lineHeight,
    borderWidth: borders.width,
    borderColor: borders.color,
    textColor: colors.text,
    headerBackground: colors.background === '#ffffff' ? '#f0f0f0' : colors.background,
    headerColor: colors.text,
    footerBackground: colors.background === '#ffffff' ? '#f5f5f5' : colors.background,
    alternateRowBackground: colors.background === '#ffffff' ? '#fafafa' : colors.background,
  };
}
