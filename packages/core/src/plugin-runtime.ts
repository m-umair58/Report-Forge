import type { ThemeRegistry } from '@reportforge/theme';

import type { ValidatorFunction } from './validator.js';

/** Optional plugin runtime attached to a report builder instance. */
export interface ReportPluginRuntime {
  readonly validators?: readonly ValidatorFunction[];
  readonly emitHook?: (name: string, context: unknown) => Promise<void>;
  readonly themeRegistry?: ThemeRegistry;
}

export const REPORT_PLUGIN_RUNTIME = Symbol('reportforge:plugin-runtime');
