import type { ReportBuilder, SectionBuilder } from '@reportforge/core';
import type { ReportMetadata } from '@reportforge/shared';
import type { ThemeInput } from '@reportforge/theme';

export type TemplateCategory =
  | 'business'
  | 'education'
  | 'healthcare'
  | 'hr'
  | 'general';

/** Base options supported by all templates. */
export interface TemplateOptions {
  readonly showLogo?: boolean;
  readonly showFooter?: boolean;
  readonly showHeader?: boolean;
  readonly showPageNumbers?: boolean;
  readonly theme?: ThemeInput;
  readonly locale?: string;
  readonly currency?: string;
  readonly watermark?: boolean;
}

export interface BrandingConfig {
  readonly companyName: string;
  readonly logoSrc?: string;
  readonly logoAlt?: string;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly fontFamily?: string;
  readonly address?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly website?: string;
  readonly footerText?: string;
}

export interface TemplateValidationIssue {
  readonly message: string;
  readonly path?: string;
}

export interface TemplateValidationResult {
  readonly valid: boolean;
  readonly errors: readonly TemplateValidationIssue[];
}

export interface TemplateFieldRule {
  readonly path: string;
  readonly required?: boolean;
  readonly type?: 'string' | 'number' | 'array' | 'object';
}

export interface TemplateDefinition<TData = unknown, TOptions extends TemplateOptions = TemplateOptions> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: TemplateCategory;
  readonly version?: string;
  readonly fields?: readonly TemplateFieldRule[];
  readonly defaultOptions?: Partial<TOptions>;
  readonly defaultBranding?: Partial<BrandingConfig>;
  readonly build: (context: TemplateContext<TData, TOptions>) => void;
  readonly validate?: (data: TData, options: TOptions) => TemplateValidationResult;
  readonly metadata?: (data: TData, options: TOptions) => ReportMetadata;
}

export interface TemplateContext<TData = unknown, TOptions extends TemplateOptions = TemplateOptions> {
  readonly data: TData;
  readonly options: TOptions;
  readonly branding: BrandingConfig;
  readonly builder: ReportBuilder;

  /** Adds a section when `condition` is true (default true). */
  section(label: string | undefined, fn: (s: SectionBuilder) => void, condition?: boolean): void;

  /** Adds a conditional block without creating a section wrapper. */
  when(condition: boolean, fn: () => void): void;
}

export type { ReportBuilder, SectionBuilder, ReportMetadata, ThemeInput };
