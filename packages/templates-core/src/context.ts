import type { ReportBuilder, SectionBuilder } from '@reportforge/core';

import { mergeBranding } from './branding.js';
import type {
  BrandingConfig,
  TemplateContext,
  TemplateDefinition,
  TemplateOptions,
} from './types.js';

export function createTemplateContext<TData, TOptions extends TemplateOptions>(
  definition: TemplateDefinition<TData, TOptions>,
  data: TData,
  options: TOptions,
  builder: ReportBuilder,
  dataBranding?: Partial<BrandingConfig>,
): TemplateContext<TData, TOptions> {
  const branding = mergeBranding(definition.defaultBranding, dataBranding, options);

  return {
    data,
    options,
    branding,
    builder,
    section(label: string | undefined, fn: (s: SectionBuilder) => void, condition = true): void {
      if (!condition) return;
      if (label !== undefined) {
        builder.section(label, fn);
      } else {
        builder.section(fn);
      }
    },
    when(condition: boolean, fn: () => void): void {
      if (condition) fn();
    },
  };
}

export function extractBrandingFromData(data: unknown): Partial<BrandingConfig> | undefined {
  if (data === null || typeof data !== 'object') return undefined;
  const record = data as Record<string, unknown>;
  const branding = record['branding'];
  if (branding !== null && typeof branding === 'object') {
    return branding as Partial<BrandingConfig>;
  }
  return undefined;
}
