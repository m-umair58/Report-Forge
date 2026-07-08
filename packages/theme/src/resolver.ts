import type {
  DesignTokens,
  ResolvedStyle,
  StyleResolveContext,
  Theme,
  ThemeValidationIssue,
  ThemeValidationResult,
} from './types.js';

const COLOR_TOKEN_NAMES = new Set<string>([
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'info',
  'background',
  'surface',
  'border',
  'text',
  'textPrimary',
  'textSecondary',
  'muted',
  'accent',
  'error',
]);

const FONT_SIZE_TOKENS = new Set<string>(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);
const SPACING_TOKENS = new Set<string>(['0', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']);
const RADIUS_TOKENS = new Set<string>(['none', 'sm', 'md', 'lg', 'xl', 'full']);

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

function resolveColor(tokens: DesignTokens, value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (isHexColor(value)) return value;
  const colors = tokens.colors as unknown as Record<string, string>;
  if (COLOR_TOKEN_NAMES.has(value)) {
    return colors[value];
  }
  return value;
}

function resolveFontSize(tokens: DesignTokens, value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && FONT_SIZE_TOKENS.has(value)) {
    return tokens.typography.scale[value as keyof typeof tokens.typography.scale];
  }
  return undefined;
}

function resolveSpacing(tokens: DesignTokens, value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && SPACING_TOKENS.has(value)) {
    return tokens.spacing[value as keyof typeof tokens.spacing];
  }
  return undefined;
}

function resolveRadius(tokens: DesignTokens, value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && RADIUS_TOKENS.has(value)) {
    return tokens.borders.radius[value as keyof typeof tokens.borders.radius];
  }
  return undefined;
}

function componentDefaults(theme: Theme, componentType: string): Readonly<Record<string, unknown>> {
  const map: Record<string, Readonly<Record<string, unknown>>> = {
    title: theme.tokens.components.title,
    subtitle: theme.tokens.components.subtitle,
    heading: theme.tokens.components.heading,
    paragraph: theme.tokens.components.paragraph,
    caption: theme.tokens.components.caption,
    label: theme.tokens.components.label,
    table: theme.tokens.components.table,
    header: theme.tokens.components.header,
    footer: theme.tokens.components.footer,
    summaryCard: theme.tokens.components.summaryCard,
    'summary-card': theme.tokens.components.summaryCard,
    metricCard: theme.tokens.components.metricCard,
    'metric-card': theme.tokens.components.metricCard,
    divider: theme.tokens.components.divider,
    section: theme.tokens.components.section,
  };
  return map[componentType] ?? {};
}

const PROP_OVERRIDE_KEYS = [
  'color',
  'background',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'opacity',
  'borderColor',
  'borderRadius',
  'padding',
  'alignment',
] as const;

/**
 * Resolves component styles from theme tokens and overrides.
 */
export class StyleResolver {
  private readonly _cache = new Map<string, ResolvedStyle>();

  resolve(context: StyleResolveContext): ResolvedStyle {
    const cacheKey = JSON.stringify({
      type: context.componentType,
      global: context.globalTheme.name,
      section: context.sectionTheme?.name,
      local: context.localStyle,
      props: context.propOverrides,
    });

    const cached = this._cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const activeTheme = context.sectionTheme ?? context.globalTheme;
    const tokens = activeTheme.tokens;
    const defaults = componentDefaults(context.globalTheme, context.componentType);
    const sectionDefaults = context.sectionTheme !== undefined
      ? componentDefaults(context.sectionTheme, context.componentType)
      : {};

    const merged: Record<string, unknown> = {
      ...defaults,
      ...sectionDefaults,
      ...context.localStyle,
      ...pickPropOverrides(context.propOverrides),
    };

    const color = resolveColor(tokens, merged['color'] ?? merged['foreground']);
    const background = resolveColor(tokens, merged['background']);
    const fontFamily = typeof merged['fontFamily'] === 'string' ? merged['fontFamily'] : tokens.typography.fontFamily;
    const fontSize = resolveFontSize(tokens, merged['fontSize']) ?? defaultFontSizeForType(context.componentType, tokens);
    const fontWeight = merged['fontWeight'] as string | number | undefined;
    const lineHeight = typeof merged['lineHeight'] === 'number' ? merged['lineHeight'] : tokens.typography.lineHeight;
    const letterSpacing = typeof merged['letterSpacing'] === 'number' ? merged['letterSpacing'] : tokens.typography.letterSpacing;
    const borderColor = resolveColor(tokens, merged['borderColor'] ?? merged['border']);
    const borderWidth = typeof merged['borderWidth'] === 'number' ? merged['borderWidth'] : tokens.borders.width;
    const borderRadius = resolveRadius(tokens, merged['borderRadius']);
    const opacity = typeof merged['opacity'] === 'number' ? merged['opacity'] : undefined;
    const padding = resolveSpacing(tokens, merged['padding']);
    const alignment = typeof merged['alignment'] === 'string' ? merged['alignment'] : undefined;

    const resolved: ResolvedStyle = {
      fontFamily,
      fontSize,
      lineHeight,
      letterSpacing,
      borderWidth,
      ...(color !== undefined ? { color } : {}),
      ...(background !== undefined ? { background } : {}),
      ...(fontWeight !== undefined ? { fontWeight } : {}),
      ...(borderColor !== undefined ? { borderColor } : {}),
      ...(borderRadius !== undefined ? { borderRadius } : {}),
      ...(opacity !== undefined ? { opacity } : {}),
      ...(padding !== undefined ? { padding } : {}),
      ...(alignment !== undefined ? { alignment } : {}),
    };

    this._cache.set(cacheKey, resolved);
    return resolved;
  }

  clearCache(): void {
    this._cache.clear();
  }
}

function pickPropOverrides(props?: Readonly<Record<string, unknown>>): Record<string, unknown> {
  if (props === undefined) return {};
  const picked: Record<string, unknown> = {};
  for (const key of PROP_OVERRIDE_KEYS) {
    if (props[key] !== undefined) {
      picked[key] = props[key];
    }
  }
  return picked;
}

function defaultFontSizeForType(componentType: string, tokens: DesignTokens): number {
  switch (componentType) {
    case 'title':
      return tokens.typography.fontSizeTitle;
    case 'subtitle':
    case 'heading':
      return tokens.typography.fontSizeSubtitle;
    case 'caption':
    case 'label':
      return tokens.typography.fontSizeSmall;
    default:
      return tokens.typography.fontSize;
  }
}

export function validateTheme(theme: Theme): ThemeValidationResult {
  const errors: ThemeValidationIssue[] = [];

  if (theme.extends !== undefined && theme.extends === theme.name) {
    errors.push({ message: `Theme '${theme.name}' cannot extend itself.`, path: theme.name });
  }

  for (const [name, value] of Object.entries(theme.tokens.colors)) {
    if (typeof value !== 'string' || !isHexColor(value)) {
      errors.push({ message: `Invalid color token '${name}': expected hex color.`, path: `colors.${name}` });
    }
  }

  if (theme.tokens.typography.fontSize <= 0) {
    errors.push({ message: 'Typography fontSize must be positive.', path: 'typography.fontSize' });
  }

  return { valid: errors.length === 0, errors };
}

export function resolvedStyleToRecord(style: ResolvedStyle): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(style)) {
    if (value !== undefined) {
      record[key] = value;
    }
  }
  return record;
}
