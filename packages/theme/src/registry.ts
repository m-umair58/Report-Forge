import type { ITheme } from '@reportforge/shared';

import { DefaultTheme } from './tokens.js';
import type { Theme, ThemeInput } from './types.js';

/**
 * Registry of named themes with cached resolved instances.
 */
export class ThemeRegistry {
  private readonly _themes = new Map<string, Theme>();
  private readonly _resolvedCache = new Map<string, Theme>();

  constructor(themes: readonly Theme[] = [DefaultTheme]) {
    for (const theme of themes) {
      this.register(theme);
    }
  }

  register(theme: Theme): void {
    if (this._themes.has(theme.name)) {
      throw new Error(`Theme '${theme.name}' is already registered.`);
    }
    this._themes.set(theme.name, theme);
    this._resolvedCache.delete(theme.name);
  }

  has(name: string): boolean {
    return this._themes.has(name);
  }

  resolve(name: string): Theme {
    const cached = this._resolvedCache.get(name);
    if (cached !== undefined) return cached;

    const theme = this._themes.get(name);
    if (theme === undefined) {
      throw new Error(`Unknown theme '${name}'.`);
    }

    const resolved = theme.extends !== undefined
      ? this.mergeWithParent(theme, this.resolve(theme.extends))
      : theme;

    this._resolvedCache.set(name, resolved);
    return resolved;
  }

  list(): readonly string[] {
    return [...this._themes.keys()].sort();
  }

  private mergeWithParent(theme: Theme, parent: Theme): Theme {
    return {
      name: theme.name,
      ...(theme.extends !== undefined ? { extends: theme.extends } : {}),
      tokens: {
        colors: { ...parent.tokens.colors, ...theme.tokens.colors },
        typography: { ...parent.tokens.typography, ...theme.tokens.typography },
        spacing: { ...parent.tokens.spacing, ...theme.tokens.spacing },
        sizing: { ...parent.tokens.sizing, ...theme.tokens.sizing },
        borders: {
          ...parent.tokens.borders,
          ...theme.tokens.borders,
          radius: { ...parent.tokens.borders.radius, ...theme.tokens.borders.radius },
        },
        opacity: { ...parent.tokens.opacity, ...theme.tokens.opacity },
        elevation: { ...parent.tokens.elevation, ...theme.tokens.elevation },
        shadows: { ...parent.tokens.shadows, ...theme.tokens.shadows },
        components: { ...parent.tokens.components, ...theme.tokens.components },
        page: { ...parent.tokens.page, ...theme.tokens.page },
      },
    };
  }
}

/** Resolves theme inputs (object or registered name). */
export class ThemeProvider {
  private readonly _registry: ThemeRegistry;

  constructor(registry?: ThemeRegistry) {
    this._registry = registry ?? new ThemeRegistry();
  }

  get registry(): ThemeRegistry {
    return this._registry;
  }

  resolve(input?: ThemeInput): Theme {
    if (input === undefined) {
      return this._registry.resolve('default');
    }
    if (typeof input === 'string') {
      return this._registry.resolve(input);
    }
    if (input.extends !== undefined) {
      const parent = this._registry.resolve(input.extends);
      const merged = new ThemeRegistry([parent]).resolve(parent.name);
      return {
        name: input.name,
        extends: input.extends,
        tokens: {
          colors: { ...merged.tokens.colors, ...input.tokens.colors },
          typography: { ...merged.tokens.typography, ...input.tokens.typography },
          spacing: { ...merged.tokens.spacing, ...input.tokens.spacing },
          sizing: { ...merged.tokens.sizing, ...input.tokens.sizing },
          borders: {
            ...merged.tokens.borders,
            ...input.tokens.borders,
            radius: { ...merged.tokens.borders.radius, ...input.tokens.borders?.radius },
          },
          opacity: { ...merged.tokens.opacity, ...input.tokens.opacity },
          elevation: { ...merged.tokens.elevation, ...input.tokens.elevation },
          shadows: { ...merged.tokens.shadows, ...input.tokens.shadows },
          components: { ...merged.tokens.components, ...input.tokens.components },
          page: { ...merged.tokens.page, ...input.tokens.page },
        },
      };
    }
    return input;
  }
}

/** Adapts a Theme to the shared ITheme contract for the layout engine. */
export function toLayoutTheme(theme: Theme): ITheme {
  const { colors, typography, spacing, borders, components, page } = theme.tokens;
  return {
    name: theme.name,
    tokens: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        text: colors.textPrimary,
        textMuted: colors.muted,
        background: colors.background,
        border: colors.border,
        accent: colors.accent,
        error: colors.error,
        success: colors.success,
      },
      typography: {
        fontFamily: typography.fontFamily,
        fontFamilyMono: typography.fontFamilyMono,
        fontSize: typography.fontSize,
        fontSizeSmall: typography.fontSizeSmall,
        fontSizeLarge: typography.fontSizeLarge,
        fontSizeTitle: typography.fontSizeTitle,
        fontSizeSubtitle: typography.fontSizeSubtitle,
        lineHeight: typography.lineHeight,
        fontWeightNormal: typography.fontWeightNormal,
        fontWeightBold: typography.fontWeightBold,
      },
      spacing: {
        unit: spacing.unit,
        section: spacing.section,
        paragraph: spacing.paragraph,
        title: spacing.title,
        table: spacing.table,
        component: spacing.component,
        pageMarginTop: spacing.pageMarginTop,
        pageMarginBottom: spacing.pageMarginBottom,
        pageMarginLeft: spacing.pageMarginLeft,
        pageMarginRight: spacing.pageMarginRight,
      },
      borders: {
        width: borders.width,
        color: borders.color,
        radius: borders.radius.md,
        style: borders.style,
      },
      components: {
        title: components.title,
        subtitle: components.subtitle,
        paragraph: components.paragraph,
        table: components.table,
        header: components.header,
        footer: components.footer,
        summaryCard: components.summaryCard,
        divider: components.divider,
      },
      page,
    },
  };
}

export function createDisplayListThemeOptions(theme: Theme): {
  defaultFont: string;
  defaultFontSize: number;
  defaultColor: string;
  pageBackground: string | null;
} {
  return {
    defaultFont: theme.tokens.typography.fontFamily,
    defaultFontSize: theme.tokens.typography.fontSize,
    defaultColor: theme.tokens.colors.textPrimary,
    pageBackground: resolveColorValue(theme, theme.tokens.page.background ?? 'background'),
  };
}

function resolveColorValue(theme: Theme, value: string): string {
  const colors = theme.tokens.colors as unknown as Record<string, string>;
  return colors[value] ?? value;
}
