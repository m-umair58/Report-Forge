/**
 * @reportforge/plugin-loader
 *
 * Plugin loading, dependency resolution, and application runtime for ReportForge.
 */

export {
  createReportForge,
  ReportForgeApp,
  PluginManager,
  PluginRegistry,
  createReportWithPlugins,
  validateReportWithPlugins,
  PACKAGE_NAME,
  getPackageName,
} from './app.js';

export type { ReportForgeAppOptions } from './app.js';
export type { CreateReportOptions } from './pipeline.js';

export type {
  LoadedPlugin,
  PluginState,
  PluginManagerOptions,
} from './manager.js';

export type { DependencyResolutionResult } from './dependencies.js';
export { resolvePluginDependencies } from './dependencies.js';

export type { HookRecord } from './extensions.js';
export { ExtensionStore, HookSystem } from './extensions.js';

export type {
  Plugin,
  PluginDefinition,
  PluginInput,
  PluginContext,
  HookName,
  PluginManifest,
} from '@reportforge/plugin-sdk';

export { definePlugin, HOOK_NAMES, REPORTFORGE_VERSION } from '@reportforge/plugin-sdk';
