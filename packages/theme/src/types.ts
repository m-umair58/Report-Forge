import type { ITheme } from '@reportforge/shared';

/** Spacing scale keys. */
export type SpacingToken = '0' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Border radius scale keys. */
export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Typography size scale keys. */
export type FontSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Color token names resolvable from component overrides. */
export type ColorTokenName =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'background'
  | 'surface'
  | 'border'
  | 'text'
  | 'textPrimary'
  | 'textSecondary'
  | 'muted'
  | 'accent'
  | 'error';

export interface ColorTokens {
  readonly primary: string;
  readonly secondary: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly info: string;
  readonly background: string;
  readonly surface: string;
  readonly border: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly muted: string;
  readonly accent: string;
  readonly error: string;
  /** Legacy aliases used by layout adapters. */
  readonly text: string;
  readonly textMuted: string;
}

export interface TypographyStyleTokens {
  readonly fontFamily?: string;
  readonly fontSize?: number | FontSizeToken;
  readonly fontWeight?: number | string;
  readonly lineHeight?: number;
  readonly letterSpacing?: number;
  readonly color?: string | ColorTokenName;
}

export interface TypographyTokens {
  readonly fontFamily: string;
  readonly fontFamilyMono: string;
  readonly fontSize: number;
  readonly fontSizeSmall: number;
  readonly fontSizeLarge: number;
  readonly fontSizeTitle: number;
  readonly fontSizeSubtitle: number;
  readonly lineHeight: number;
  readonly letterSpacing: number;
  readonly fontWeightNormal: number;
  readonly fontWeightBold: number;
  readonly heading: TypographyStyleTokens;
  readonly paragraph: TypographyStyleTokens;
  readonly caption: TypographyStyleTokens;
  readonly scale: Readonly<Record<FontSizeToken, number>>;
}

export interface SpacingScale {
  readonly '0': number;
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly '2xl': number;
  readonly unit: number;
  readonly section: number;
  readonly paragraph: number;
  readonly title: number;
  readonly table: number;
  readonly component: number;
  readonly pageMarginTop: number;
  readonly pageMarginBottom: number;
  readonly pageMarginLeft: number;
  readonly pageMarginRight: number;
}

export interface SizingTokens {
  readonly icon: number;
  readonly card: number;
  readonly tableRow: number;
}

export interface BorderTokens {
  readonly width: number;
  readonly color: string;
  readonly style: 'solid' | 'dashed' | 'dotted' | 'none';
  readonly radius: Readonly<Record<RadiusToken, number>>;
}

export interface OpacityTokens {
  readonly disabled: number;
  readonly muted: number;
  readonly overlay: number;
}

/** Placeholders for future milestones. */
export interface ElevationTokens {
  readonly none: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
}

export interface ShadowTokens {
  readonly none: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
}

export interface ComponentThemeTokens {
  readonly title: Readonly<Record<string, unknown>>;
  readonly subtitle: Readonly<Record<string, unknown>>;
  readonly heading: Readonly<Record<string, unknown>>;
  readonly paragraph: Readonly<Record<string, unknown>>;
  readonly caption: Readonly<Record<string, unknown>>;
  readonly label: Readonly<Record<string, unknown>>;
  readonly table: Readonly<Record<string, unknown>>;
  readonly header: Readonly<Record<string, unknown>>;
  readonly footer: Readonly<Record<string, unknown>>;
  readonly summaryCard: Readonly<Record<string, unknown>>;
  readonly metricCard: Readonly<Record<string, unknown>>;
  readonly divider: Readonly<Record<string, unknown>>;
  readonly section: Readonly<Record<string, unknown>>;
}

export interface PageTokens {
  readonly size: 'A4' | 'Letter' | 'Legal' | 'A3';
  readonly orientation: 'portrait' | 'landscape';
  readonly marginTop: number;
  readonly marginBottom: number;
  readonly marginLeft: number;
  readonly marginRight: number;
  readonly background?: string | ColorTokenName;
}

/** Complete design token set for a theme. */
export interface DesignTokens {
  readonly colors: ColorTokens;
  readonly typography: TypographyTokens;
  readonly spacing: SpacingScale;
  readonly sizing: SizingTokens;
  readonly borders: BorderTokens;
  readonly opacity: OpacityTokens;
  readonly elevation: ElevationTokens;
  readonly shadows: ShadowTokens;
  readonly components: ComponentThemeTokens;
  readonly page: PageTokens;
}

/** Partial token overrides when creating or extending a theme. */
export interface ThemeTokenOverrides {
  readonly colors?: Partial<ColorTokens>;
  readonly typography?: Partial<TypographyTokens>;
  readonly spacing?: Partial<SpacingScale>;
  readonly sizing?: Partial<SizingTokens>;
  readonly borders?: Partial<Omit<BorderTokens, 'radius'>> & {
    readonly radius?: Partial<Record<RadiusToken, number>>;
  };
  readonly opacity?: Partial<OpacityTokens>;
  readonly elevation?: Partial<ElevationTokens>;
  readonly shadows?: Partial<ShadowTokens>;
  readonly components?: Partial<ComponentThemeTokens>;
  readonly page?: Partial<PageTokens>;
}

/** A named theme with design tokens. */
export interface Theme {
  readonly name: string;
  readonly tokens: DesignTokens;
  readonly extends?: string;
}

/** Fully resolved concrete styles passed to renderers via layout/display-list. */
export interface ResolvedStyle {
  readonly color?: string;
  readonly background?: string;
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly fontWeight?: string | number;
  readonly lineHeight?: number;
  readonly letterSpacing?: number;
  readonly borderColor?: string;
  readonly borderWidth?: number;
  readonly borderRadius?: number;
  readonly opacity?: number;
  readonly padding?: number;
  readonly alignment?: string;
}

export interface StyleResolveContext {
  readonly componentType: string;
  readonly globalTheme: Theme;
  readonly sectionTheme?: Theme;
  readonly localStyle?: Readonly<Record<string, unknown>>;
  readonly propOverrides?: Readonly<Record<string, unknown>>;
}

export interface ThemeValidationIssue {
  readonly message: string;
  readonly path?: string;
}

export interface ThemeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ThemeValidationIssue[];
}

export type ThemeInput = Theme | string;

export type { ITheme };
