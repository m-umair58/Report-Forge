import { Report, type ReportBuilder } from '@reportforge/core';

import { validateBranding, mergeBranding } from './branding.js';
import { createTemplateContext, extractBrandingFromData } from './context.js';
import type { TemplateRegistry } from './registry.js';
import { defaultTemplateRegistry } from './registry.js';
import {
  companyInfoSection,
  contactSection,
  executiveSummarySection,
  revenueSection,
  signatureSection,
  termsAndConditionsSection,
} from './sections.js';
import type { TemplateDefinition, TemplateOptions, TemplateValidationResult } from './types.js';
import { mergeValidation, validateRequiredFields, validateTemplateOptions } from './validation.js';

const BASE_OPTION_KEYS: readonly (keyof TemplateOptions)[] = [
  'showLogo',
  'showFooter',
  'showHeader',
  'showPageNumbers',
  'theme',
  'locale',
  'currency',
  'watermark',
];

/**
 * Resolves a template definition and materializes a ReportBuilder.
 */
export class TemplateResolver {
  constructor(private readonly registry: TemplateRegistry = defaultTemplateRegistry) {}

  resolve<TData, TOptions extends TemplateOptions>(
    templateId: string,
  ): TemplateDefinition<TData, TOptions> {
    return this.registry.get<TData, TOptions>(templateId);
  }

  validate<TData, TOptions extends TemplateOptions>(
    definition: TemplateDefinition<TData, TOptions>,
    data: TData,
    options: TOptions,
  ): TemplateValidationResult {
    const results: TemplateValidationResult[] = [];

    if (definition.fields !== undefined) {
      results.push(validateRequiredFields(data, definition.fields));
    }

    results.push(validateTemplateOptions(options, BASE_OPTION_KEYS));
    results.push(
      validateBranding(
        mergeBranding(definition.defaultBranding, extractBrandingFromData(data), options),
      ),
    );

    if (definition.validate !== undefined) {
      results.push(definition.validate(data, options));
    }

    return mergeValidation(...results);
  }

  createReport<TData, TOptions extends TemplateOptions>(
    definition: TemplateDefinition<TData, TOptions>,
    data: TData,
    options?: Partial<TOptions>,
  ): ReportBuilder {
    const mergedOptions = {
      showLogo: true,
      showFooter: true,
      showHeader: true,
      showPageNumbers: true,
      ...definition.defaultOptions,
      ...options,
    } as TOptions;

    const validation = this.validate(definition, data, mergedOptions);
    if (!validation.valid) {
      const message = validation.errors.map((error) => error.message).join(' ');
      throw new Error(`Template validation failed: ${message}`);
    }

    const metadata = definition.metadata?.(data, mergedOptions) ?? {
      title: definition.name,
      author: mergedOptions.locale ?? definition.category,
    };

    const report = Report.create({
      metadata,
      ...(mergedOptions.theme !== undefined ? { theme: mergedOptions.theme } : {}),
    });

    const context = createTemplateContext(
      definition,
      data,
      mergedOptions,
      report,
      extractBrandingFromData(data),
    );

    applyStandardChrome(context);
    definition.build(context);

    return report;
  }
}

/** Fluent builder wrapper for a single template definition. */
export class TemplateBuilder<TData, TOptions extends TemplateOptions = TemplateOptions> {
  constructor(
    private readonly _definition: TemplateDefinition<TData, TOptions>,
    private readonly resolver: TemplateResolver = new TemplateResolver(),
  ) {}

  get definition(): TemplateDefinition<TData, TOptions> {
    return this._definition;
  }

  get id(): string {
    return this._definition.id;
  }

  get name(): string {
    return this._definition.name;
  }

  create(data: TData, options?: Partial<TOptions>): ReportBuilder {
    return this.resolver.createReport(this._definition, data, options);
  }

  validate(data: TData, options?: Partial<TOptions>): TemplateValidationResult {
    const mergedOptions = {
      ...this._definition.defaultOptions,
      ...options,
    } as TOptions;
    return this.resolver.validate(this._definition, data, mergedOptions);
  }
}

function applyStandardChrome<TData, TOptions extends TemplateOptions>(
  context: ReturnType<typeof createTemplateContext<TData, TOptions>>,
): void {
  const { builder, branding, options } = context;

  if (options.showHeader !== false) {
    builder.header((h) => {
      h.title(branding.companyName);
      if (branding.address !== undefined) {
        h.paragraph(branding.address);
      }
      if (options.showLogo === true && branding.logoSrc !== undefined) {
        h.image({ src: branding.logoSrc, alt: branding.logoAlt ?? branding.companyName, width: 64, height: 64 });
      }
    });
  }

  if (options.showFooter !== false) {
    builder.footer((f) => {
      const parts: string[] = [];
      if (branding.footerText !== undefined) parts.push(branding.footerText);
      if (options.showPageNumbers === true) parts.push('Page {pageNumber} of {totalPages}');
      if (branding.website !== undefined) parts.push(branding.website);
      f.paragraph(parts.join(' · '));
    });
  }
}

export function defineTemplate<TData, TOptions extends TemplateOptions = TemplateOptions>(
  definition: TemplateDefinition<TData, TOptions>,
): TemplateBuilder<TData, TOptions> {
  return new TemplateBuilder(definition);
}

export const defaultTemplateResolver = new TemplateResolver();

export {
  executiveSummarySection,
  revenueSection,
  signatureSection,
  termsAndConditionsSection,
  companyInfoSection,
  contactSection,
};
