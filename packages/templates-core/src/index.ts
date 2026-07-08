/**
 * @reportforge/templates-core
 *
 * Renderer-independent template engine for ReportForge.
 */

export type {
  TemplateCategory,
  TemplateOptions,
  BrandingConfig,
  TemplateValidationIssue,
  TemplateValidationResult,
  TemplateFieldRule,
  TemplateDefinition,
  TemplateContext,
  ReportBuilder,
  SectionBuilder,
  ReportMetadata,
  ThemeInput,
} from './types.js';

export { DEFAULT_BRANDING, mergeBranding, validateBranding, watermarkPlaceholderEnabled } from './branding.js';
export {
  validateRequiredFields,
  validateTemplateOptions,
  mergeValidation,
} from './validation.js';
export { createTemplateContext, extractBrandingFromData } from './context.js';
export { TemplateRegistry, defaultTemplateRegistry } from './registry.js';
export {
  TemplateResolver,
  TemplateBuilder,
  defineTemplate,
  defaultTemplateResolver,
  executiveSummarySection,
  revenueSection,
  signatureSection,
  termsAndConditionsSection,
  companyInfoSection,
  contactSection,
} from './builder.js';

export type { ExecutiveSummaryData, RevenueSectionData, SignatureSectionData, TermsSectionData } from './sections.js';

export const PACKAGE_NAME = '@reportforge/templates-core' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
