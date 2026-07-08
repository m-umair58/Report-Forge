import { describe, expect, it } from 'vitest';

import {
  CorporateTheme,
  DarkTheme,
  DefaultTheme,
  FinancialTheme,
  HealthcareTheme,
  MinimalTheme,
  builtInThemes,
  defaultThemeRegistry,
} from './index.js';

describe('@reportforge/themes', () => {
  it('registers all built-in themes', () => {
    expect(builtInThemes.length).toBe(6);
    expect(defaultThemeRegistry.has('corporate')).toBe(true);
    expect(defaultThemeRegistry.has('dark')).toBe(true);
  });

  it('resolves corporate theme colors', () => {
    const theme = defaultThemeRegistry.resolve('corporate');
    expect(theme.tokens.colors.primary).toBe('#003366');
  });

  it('exports preset themes', () => {
    expect(CorporateTheme.name).toBe('corporate');
    expect(DarkTheme.name).toBe('dark');
    expect(DefaultTheme.name).toBe('default');
    expect(MinimalTheme.name).toBe('minimal');
    expect(HealthcareTheme.name).toBe('healthcare');
    expect(FinancialTheme.name).toBe('financial');
  });
});
