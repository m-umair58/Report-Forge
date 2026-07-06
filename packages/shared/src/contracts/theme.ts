/**
 * Contract for visual themes.
 * Themes define renderer-independent design tokens.
 */
export interface ITheme {
  /** Unique theme identifier (e.g. 'default', 'corporate'). */
  readonly name: string;

  /** Design tokens for typography, colors, spacing, and component styles. */
  readonly tokens: ThemeTokens;
}

/** Complete set of theme design tokens. */
export interface ThemeTokens {
  readonly colors: ColorTokens;
  readonly typography: TypographyTokens;
  readonly spacing: SpacingTokens;
  readonly borders: BorderTokens;
  readonly components: ComponentStyleTokens;
  readonly page: PageTokens;
}

/** Color palette tokens. */
export interface ColorTokens {
  readonly primary: string;
  readonly secondary: string;
  readonly text: string;
  readonly textMuted: string;
  readonly background: string;
  readonly border: string;
  readonly accent: string;
  readonly error: string;
  readonly success: string;
}

/** Typography tokens. */
export interface TypographyTokens {
  readonly fontFamily: string;
  readonly fontFamilyMono: string;
  readonly fontSize: number;
  readonly fontSizeSmall: number;
  readonly fontSizeLarge: number;
  readonly fontSizeTitle: number;
  readonly fontSizeSubtitle: number;
  readonly lineHeight: number;
  readonly fontWeightNormal: number;
  readonly fontWeightBold: number;
}

/** Spacing tokens. */
export interface SpacingTokens {
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

/** Border tokens. */
export interface BorderTokens {
  readonly width: number;
  readonly color: string;
  readonly radius: number;
  readonly style: 'solid' | 'dashed' | 'dotted' | 'none';
}

/** Per-component style default tokens. */
export interface ComponentStyleTokens {
  readonly title: Readonly<Record<string, unknown>>;
  readonly subtitle: Readonly<Record<string, unknown>>;
  readonly paragraph: Readonly<Record<string, unknown>>;
  readonly table: Readonly<Record<string, unknown>>;
  readonly header: Readonly<Record<string, unknown>>;
  readonly footer: Readonly<Record<string, unknown>>;
  readonly summaryCard: Readonly<Record<string, unknown>>;
  readonly divider: Readonly<Record<string, unknown>>;
}

/** Page configuration tokens. */
export interface PageTokens {
  readonly size: 'A4' | 'Letter' | 'Legal' | 'A3';
  readonly orientation: 'portrait' | 'landscape';
  readonly marginTop: number;
  readonly marginBottom: number;
  readonly marginLeft: number;
  readonly marginRight: number;
}
