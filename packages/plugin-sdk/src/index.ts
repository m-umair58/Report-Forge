/**
 * @reportforge/plugin-sdk
 *
 * Official Plugin SDK for ReportForge.
 */

export type { PluginManifest } from './manifest.js';
export { validateManifest } from './manifest.js';

export type {
  HookName,
  HookHandler,
  HookRegistration,
  HookContextMap,
} from './hooks.js';
export { HOOK_NAMES } from './hooks.js';

export type {
  ComponentRegistration,
  ChartRegistration,
  RenderCommandRegistration,
  FontRegistration,
  IconRegistration,
  PluginThemeInput,
  ThemeRegistration,
  TemplateRegistration,
  ValidatorRegistration,
  ComponentExtensionRegistry,
  ThemeExtensionRegistry,
  TemplateExtensionRegistry,
  ChartExtensionRegistry,
  RenderCommandExtensionRegistry,
  ValidatorExtensionRegistry,
  FontExtensionRegistry,
  IconExtensionRegistry,
} from './extensions.js';

export type {
  Plugin,
  PluginDefinition,
  PluginInput,
  PluginContext,
  PluginLifecycle,
  PluginLifecyclePhase,
} from './plugin.js';

export { definePlugin, isPluginInput, normalizePlugin } from './define-plugin.js';

export {
  REPORTFORGE_VERSION,
  isVersionCompatible,
  satisfiesPeerDependency,
} from './version.js';
export type { VersionCompatibilityResult } from './version.js';

export {
  PluginError,
  createDiagnostic,
} from './diagnostics.js';
export type { PluginDiagnostic } from './diagnostics.js';

export const PACKAGE_NAME = '@reportforge/plugin-sdk' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}

// Re-export shared plugin contracts for convenience.
export type {
  IPlugin,
  IPluginRegistry,
  ComponentDefinition,
  TemplateDefinition,
  ValidatorDefinition,
  ValidatorResult,
} from '@reportforge/shared';
