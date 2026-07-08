import type { Plugin, PluginDefinition, PluginInput } from './plugin.js';

export function definePlugin<TConfig = unknown>(
  definition: PluginDefinition<TConfig>,
): Plugin<TConfig> {
  return {
    ...definition,
    manifest: {
      id: definition.id,
      name: definition.name,
      version: definition.version,
      description: definition.description,
      ...(definition.author !== undefined ? { author: definition.author } : {}),
      ...(definition.license !== undefined ? { license: definition.license } : {}),
      ...(definition.homepage !== undefined ? { homepage: definition.homepage } : {}),
      ...(definition.keywords !== undefined ? { keywords: definition.keywords } : {}),
      ...(definition.peerDependencies !== undefined
        ? { peerDependencies: definition.peerDependencies }
        : {}),
      ...(definition.minimumReportForgeVersion !== undefined
        ? { minimumReportForgeVersion: definition.minimumReportForgeVersion }
        : {}),
    },
  };
}

export function isPluginInput<TConfig = unknown>(
  value: PluginInput<TConfig>,
): value is Plugin<TConfig> {
  return typeof value === 'object' && value !== null && 'manifest' in value;
}

export function normalizePlugin<TConfig = unknown>(
  input: PluginInput<TConfig>,
): Plugin<TConfig> {
  if (isPluginInput(input)) {
    return input;
  }
  return definePlugin(input);
}
