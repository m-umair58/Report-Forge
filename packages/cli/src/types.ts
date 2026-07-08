import type { PluginInput } from '@reportforge/plugin-sdk';

export type ReportForgeRenderer = 'pdf' | 'html' | 'svg';
export type ReportForgeLanguage = 'typescript' | 'javascript';
export type PackageManager = 'pnpm' | 'npm' | 'yarn';

export type ScaffoldTemplateId =
  | 'invoice'
  | 'sales-report'
  | 'dashboard'
  | 'certificate'
  | 'financial-report'
  | 'blank';

export interface ReportForgeConfig {
  readonly renderer?: ReportForgeRenderer;
  readonly theme?: string;
  readonly output?: string;
  readonly plugins?: readonly PluginInput[];
  readonly reports?: readonly string[];
}

export interface InitOptions {
  readonly name: string;
  readonly packageManager: PackageManager;
  readonly template: ScaffoldTemplateId;
  readonly theme: string;
  readonly renderer: ReportForgeRenderer;
  readonly language: ReportForgeLanguage;
}

export interface CliCommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly action: (...args: readonly unknown[]) => void | Promise<void>;
}

export interface CliGeneratorDefinition {
  readonly id: string;
  readonly description: string;
  readonly generate: (options: Record<string, unknown>) => string | Promise<string>;
}

export interface CliValidatorDefinition {
  readonly id: string;
  readonly description: string;
  readonly validate: (context: ValidationContext) => ValidationIssue[];
}

export interface ValidationContext {
  readonly cwd: string;
  readonly config: ReportForgeConfig | null;
}

export interface ValidationIssue {
  readonly level: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly path?: string;
}

export interface DoctorCheck {
  readonly name: string;
  readonly status: 'pass' | 'warn' | 'fail';
  readonly message: string;
}

export const SCAFFOLD_TEMPLATES: readonly { readonly id: ScaffoldTemplateId; readonly label: string }[] = [
  { id: 'invoice', label: 'Invoice' },
  { id: 'sales-report', label: 'Sales Report' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'certificate', label: 'Certificate' },
  { id: 'financial-report', label: 'Financial Report' },
  { id: 'blank', label: 'Blank' },
] as const;

export const BUILT_IN_THEMES = ['default', 'corporate', 'minimal', 'dark', 'healthcare', 'financial'] as const;

export const BUILT_IN_TEMPLATES = [
  'Invoice',
  'SalesReport',
  'FinancialReport',
  'Certificate',
  'Quotation',
  'Payslip',
  'CompanyProfile',
] as const;
