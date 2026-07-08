import type { ReportCreateOptions, ReportBuilder } from '@reportforge/core';
import { ComponentRegistry, createDefaultRegistry, createReportBuilderWithRegistry } from '@reportforge/core';
import type { ValidationResult } from '@reportforge/shared';
import { ThemeRegistry } from '@reportforge/theme';
import { builtInThemes } from '@reportforge/themes';

import type { PluginManager } from './manager.js';
import { toValidatorFunctions } from './extensions.js';

export interface CreateReportOptions extends ReportCreateOptions {
  readonly themeRegistry?: ThemeRegistry;
}

export function createReportWithPlugins(
  manager: PluginManager,
  options: CreateReportOptions = {},
): ReportBuilder {
  const registry = createDefaultRegistry();
  mergePluginComponents(registry, manager);

  const themeRegistry = options.themeRegistry ?? createThemeRegistryWithPlugins(manager);

  return createReportBuilderWithRegistry(registry, {
    ...options,
    pluginRuntime: {
      validators: toValidatorFunctions(manager.extensions),
      emitHook: (name, context) => manager.hooks.emit(name as never, context as never),
      themeRegistry,
    },
  });
}

export async function validateReportWithPlugins(
  manager: PluginManager,
  builder: ReportBuilder,
): Promise<ValidationResult> {
  const schema = builder.toSchema();
  await manager.hooks.emit('beforeReportValidation', { schema });
  const validation = builder.validate();
  await manager.hooks.emit('afterReportValidation', { validation, schema });
  return validation;
}

function mergePluginComponents(registry: ComponentRegistry, manager: PluginManager): void {
  for (const entry of manager.extensions.toComponentRegistryEntries()) {
    if (!registry.has(entry.type)) {
      registry.register(entry);
    }
  }
}

function createThemeRegistryWithPlugins(manager: PluginManager): ThemeRegistry {
  const themes = [...builtInThemes, ...manager.extensions.themes.values()];
  return new ThemeRegistry(themes);
}
