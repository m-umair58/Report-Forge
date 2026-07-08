import { DefaultTheme, ThemeRegistry } from '@reportforge/theme';

import {
  CorporateTheme,
  DarkTheme,
  FinancialTheme,
  HealthcareTheme,
  MinimalTheme,
} from './presets.js';

export { DefaultTheme } from '@reportforge/theme';

export {
  MinimalTheme,
  CorporateTheme,
  DarkTheme,
  HealthcareTheme,
  FinancialTheme,
} from './presets.js';

/** All built-in themes registered in a shared registry. */
export const builtInThemes = [
  DefaultTheme,
  MinimalTheme,
  CorporateTheme,
  DarkTheme,
  HealthcareTheme,
  FinancialTheme,
] as const;

/** Pre-configured registry containing all built-in themes. */
export const defaultThemeRegistry = new ThemeRegistry([...builtInThemes]);

export const PACKAGE_NAME = '@reportforge/themes' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
