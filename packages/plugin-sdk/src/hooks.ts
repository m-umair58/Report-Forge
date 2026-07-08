import type { ReportSchema, ValidationResult } from '@reportforge/shared';

/** Pipeline hook names supported by the plugin system. */
export const HOOK_NAMES = [
  'beforeReportValidation',
  'afterReportValidation',
  'beforeLayout',
  'afterLayout',
  'beforeRender',
  'afterRender',
  'beforeExport',
  'afterExport',
  'onError',
] as const;

export type HookName = (typeof HOOK_NAMES)[number];

export interface HookContextMap {
  readonly beforeReportValidation: { readonly schema?: ReportSchema };
  readonly afterReportValidation: { readonly validation: ValidationResult; readonly schema: ReportSchema };
  readonly beforeLayout: { readonly schema: ReportSchema };
  readonly afterLayout: { readonly schema: ReportSchema; readonly layout: unknown };
  readonly beforeRender: { readonly schema: ReportSchema; readonly displayList?: unknown };
  readonly afterRender: { readonly schema: ReportSchema; readonly bytes?: Uint8Array };
  readonly beforeExport: { readonly outputPath?: string };
  readonly afterExport: { readonly outputPath?: string; readonly bytes?: Uint8Array };
  readonly onError: { readonly error: unknown; readonly phase?: string };
}

export type HookHandler<TName extends HookName = HookName> = (
  context: HookContextMap[TName],
) => void | Promise<void>;

export interface HookRegistration<TName extends HookName = HookName> {
  readonly pluginId: string;
  readonly name: TName;
  readonly handler: HookHandler<TName>;
  readonly priority?: number;
}
