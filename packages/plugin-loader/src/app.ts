import type { ReportBuilder, ReportCreateOptions } from '@reportforge/core';
import type { PluginInput } from '@reportforge/plugin-sdk';

import { PluginManager, type PluginManagerOptions } from './manager.js';
import { createReportWithPlugins, validateReportWithPlugins } from './pipeline.js';

export interface ReportForgeAppOptions extends PluginManagerOptions {}

export class ReportForgeApp {
  readonly plugins: PluginManager;

  constructor(options: ReportForgeAppOptions = {}) {
    this.plugins = new PluginManager(options);
  }

  /** Registers and enables a plugin with optional configuration. */
  async use<TConfig = unknown>(
    plugin: PluginInput<TConfig>,
    config?: TConfig,
  ): Promise<this> {
    await this.plugins.use(plugin, config);
    return this;
  }

  /** Creates a report builder with all registered plugin extensions applied. */
  createReport(options?: ReportCreateOptions): ReportBuilder {
    return createReportWithPlugins(this.plugins, options);
  }

  /** Validates a report and runs plugin validation hooks. */
  async validateReport(builder: ReportBuilder) {
    return validateReportWithPlugins(this.plugins, builder);
  }
}

/** Creates a ReportForge application instance for plugin registration. */
export function createReportForge(options?: ReportForgeAppOptions): ReportForgeApp {
  return new ReportForgeApp(options);
}

export { PluginManager, PluginRegistry } from './manager.js';
export { createReportWithPlugins, validateReportWithPlugins } from './pipeline.js';

export const PACKAGE_NAME = '@reportforge/plugin-loader' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
