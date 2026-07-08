import { describe, expect, it } from 'vitest';

import {
  DefaultTheme,
  StyleResolver,
  ThemeProvider,
  ThemeRegistry,
  createTheme,
  validateTheme,
} from './index.js';

describe('ThemeRegistry', () => {
  it('resolves registered themes', () => {
    const registry = new ThemeRegistry([DefaultTheme]);
    expect(registry.resolve('default').name).toBe('default');
  });

  it('throws for unknown themes', () => {
    const registry = new ThemeRegistry([DefaultTheme]);
    expect(() => registry.resolve('unknown')).toThrow();
  });
});

describe('StyleResolver', () => {
  const resolver = new StyleResolver();

  it('resolves color token overrides', () => {
    const style = resolver.resolve({
      componentType: 'title',
      globalTheme: DefaultTheme,
      propOverrides: { color: 'primary' },
    });
    expect(style.color).toBe(DefaultTheme.tokens.colors.primary);
  });

  it('resolves fontSize token overrides', () => {
    const style = resolver.resolve({
      componentType: 'paragraph',
      globalTheme: DefaultTheme,
      propOverrides: { fontSize: 'lg' },
    });
    expect(style.fontSize).toBe(DefaultTheme.tokens.typography.scale.lg);
  });

  it('caches resolved styles', () => {
    const context = {
      componentType: 'title',
      globalTheme: DefaultTheme,
      propOverrides: { color: 'primary' },
    };
    const first = resolver.resolve(context);
    const second = resolver.resolve(context);
    expect(first).toBe(second);
  });

  it('applies component defaults from theme', () => {
    const corporate = createTheme('corporate', {
      components: {
        title: { color: 'primary', fontSize: '2xl' },
        subtitle: {},
        heading: {},
        paragraph: {},
        caption: {},
        label: {},
        table: {},
        header: {},
        footer: {},
        summaryCard: { background: 'surface' },
        metricCard: {},
        divider: {},
        section: {},
      },
      colors: { primary: '#003366' },
    });

    const titleStyle = resolver.resolve({
      componentType: 'title',
      globalTheme: corporate,
    });
    expect(titleStyle.color).toBe('#003366');
  });
});

describe('ThemeProvider', () => {
  it('resolves theme objects directly', () => {
    const provider = new ThemeProvider();
    const custom = createTheme('custom', { colors: { primary: '#112233' } });
    expect(provider.resolve(custom).tokens.colors.primary).toBe('#112233');
  });

  it('resolves theme by name', () => {
    const registry = new ThemeRegistry([DefaultTheme]);
    const provider = new ThemeProvider(registry);
    expect(provider.resolve('default').name).toBe('default');
  });
});

describe('validateTheme', () => {
  it('accepts valid themes', () => {
    expect(validateTheme(DefaultTheme).valid).toBe(true);
  });

  it('rejects invalid colors', () => {
    const bad = createTheme('bad', {
      colors: { primary: 'not-a-color' },
    });
    expect(validateTheme(bad).valid).toBe(false);
  });
});
