import type { Plugin } from '@reportforge/plugin-sdk';
import { satisfiesPeerDependency } from '@reportforge/plugin-sdk';

export interface DependencyResolutionResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export function resolvePluginDependencies(
  plugin: Plugin,
  installedPlugins: readonly Plugin[],
  installedPackages: Readonly<Record<string, string>>,
): DependencyResolutionResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const pluginIds = new Set(installedPlugins.map((entry) => entry.manifest.id));
  const graph = buildDependencyGraph([...installedPlugins, plugin]);

  const cycle = detectCycle(graph, plugin.manifest.id);
  if (cycle !== null) {
    errors.push(`Circular plugin dependency detected: ${cycle.join(' -> ')}`);
  }

  for (const [packageName, range] of Object.entries(plugin.peerDependencies ?? {})) {
    const installedVersion = installedPackages[packageName];
    const result = satisfiesPeerDependency(installedVersion, range);
    if (!result.compatible) {
      errors.push(
        result.reason ?? `Missing peer dependency '${packageName}@${range}' for plugin '${plugin.manifest.id}'.`,
      );
    }
  }

  for (const dependencyId of extractPluginDependencies(plugin)) {
    if (!pluginIds.has(dependencyId) && dependencyId !== plugin.manifest.id) {
      errors.push(`Plugin '${plugin.manifest.id}' requires plugin '${dependencyId}' which is not installed.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function extractPluginDependencies(plugin: Plugin): readonly string[] {
  const deps = plugin.peerDependencies?.['@reportforge/plugins'];
  if (deps === undefined) return [];

  return deps
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function buildDependencyGraph(plugins: readonly Plugin[]): Map<string, readonly string[]> {
  const graph = new Map<string, readonly string[]>();
  for (const plugin of plugins) {
    graph.set(plugin.manifest.id, extractPluginDependencies(plugin));
  }
  return graph;
}

function detectCycle(graph: Map<string, readonly string[]>, start: string): readonly string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];

  const visit = (node: string): readonly string[] | null => {
    if (visiting.has(node)) {
      const cycleStart = path.indexOf(node);
      return [...path.slice(cycleStart), node];
    }
    if (visited.has(node)) return null;

    visiting.add(node);
    path.push(node);

    for (const dependency of graph.get(node) ?? []) {
      const cycle = visit(dependency);
      if (cycle !== null) return cycle;
    }

    path.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  };

  return visit(start);
}
