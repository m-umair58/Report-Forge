import type { Plugin, PluginContext, PluginInput } from '@reportforge/plugin-sdk';
import type { HookHandler, HookName } from '@reportforge/plugin-sdk';
import {
  createDiagnostic,
  normalizePlugin,
  REPORTFORGE_VERSION,
  satisfiesPeerDependency,
  validateManifest,
} from '@reportforge/plugin-sdk';

import {
  createChartRegistryAdapter,
  createComponentRegistryAdapter,
  createFontRegistryAdapter,
  createIconRegistryAdapter,
  createRenderCommandRegistryAdapter,
  createTemplateRegistryAdapter,
  createThemeRegistryAdapter,
  createValidatorRegistryAdapter,
  ExtensionStore,
  HookSystem,
} from './extensions.js';
import { resolvePluginDependencies } from './dependencies.js';

export type PluginState = 'registered' | 'enabled' | 'disabled' | 'disposed';

export interface LoadedPlugin<TConfig = unknown> {
  readonly plugin: Plugin<TConfig>;
  readonly config: TConfig;
  readonly state: PluginState;
}

export class PluginRegistry {
  private readonly plugins = new Map<string, LoadedPlugin>();

  has(id: string): boolean {
    return this.plugins.has(id);
  }

  get<TConfig = unknown>(id: string): LoadedPlugin<TConfig> | undefined {
    return this.plugins.get(id) as LoadedPlugin<TConfig> | undefined;
  }

  list(): readonly LoadedPlugin[] {
    return [...this.plugins.values()];
  }

  set<TConfig = unknown>(entry: LoadedPlugin<TConfig>): void {
    this.plugins.set(entry.plugin.manifest.id, entry as LoadedPlugin);
  }

  delete(id: string): void {
    this.plugins.delete(id);
  }
}

export interface PluginManagerOptions {
  readonly reportForgeVersion?: string;
  readonly installedPackages?: Readonly<Record<string, string>>;
}

export class PluginManager {
  readonly registry = new PluginRegistry();
  readonly extensions = new ExtensionStore();
  readonly hooks = new HookSystem();
  readonly diagnostics: import('@reportforge/plugin-sdk').PluginDiagnostic[] = [];

  private readonly reportForgeVersion: string;
  private readonly installedPackages: Readonly<Record<string, string>>;

  constructor(options: PluginManagerOptions = {}) {
    this.reportForgeVersion = options.reportForgeVersion ?? REPORTFORGE_VERSION;
    this.installedPackages = options.installedPackages ?? {};
  }

  async use<TConfig = unknown>(
    input: PluginInput<TConfig>,
    config?: TConfig,
  ): Promise<this> {
    const plugin = normalizePlugin(input);
    const manifestErrors = validateManifest(plugin.manifest);
    if (manifestErrors.length > 0) {
      throw new Error(`Invalid plugin manifest: ${manifestErrors.join(' ')}`);
    }

    if (this.registry.has(plugin.manifest.id)) {
      throw new Error(`Plugin '${plugin.manifest.id}' is already registered.`);
    }

    if (plugin.minimumReportForgeVersion !== undefined) {
      const compatibility = satisfiesPeerDependency(
        this.reportForgeVersion,
        plugin.minimumReportForgeVersion,
      );
      if (!compatibility.compatible) {
        throw new Error(compatibility.reason ?? 'Incompatible ReportForge version.');
      }
    }

    const dependencyResult = resolvePluginDependencies(
      plugin,
      this.registry.list().map((entry) => entry.plugin),
      this.installedPackages,
    );
    if (!dependencyResult.valid) {
      throw new Error(dependencyResult.errors.join(' '));
    }

    const context = this.createContext(plugin, config ?? ({} as TConfig));

    await this.runLifecycle(plugin, 'initialize', context);
    await this.runLifecycle(plugin, 'register', context);
    await this.runLifecycle(plugin, 'enable', context);

    this.registry.set({
      plugin,
      config: config ?? ({} as TConfig),
      state: 'enabled',
    });

    return this;
  }

  async disable(id: string): Promise<void> {
    const entry = this.registry.get(id);
    if (entry === undefined || entry.state !== 'enabled') return;

    const context = this.createContext(entry.plugin, entry.config);
    await this.runLifecycle(entry.plugin, 'disable', context);
    this.registry.set({ ...entry, state: 'disabled' });
  }

  async enable(id: string): Promise<void> {
    const entry = this.registry.get(id);
    if (entry === undefined || entry.state === 'enabled') return;

    const context = this.createContext(entry.plugin, entry.config);
    await this.runLifecycle(entry.plugin, 'enable', context);
    this.registry.set({ ...entry, state: 'enabled' });
  }

  async dispose(id: string): Promise<void> {
    const entry = this.registry.get(id);
    if (entry === undefined) return;

    const context = this.createContext(entry.plugin, entry.config);
    if (entry.state === 'enabled') {
      await this.runLifecycle(entry.plugin, 'disable', context);
    }
    await this.runLifecycle(entry.plugin, 'dispose', context);
    this.registry.delete(id);
  }

  getEnabledPlugins(): readonly LoadedPlugin[] {
    return this.registry.list().filter((entry) => entry.state === 'enabled');
  }

  private createContext<TConfig>(plugin: Plugin<TConfig>, config: TConfig): PluginContext<TConfig> {
    const pluginId = plugin.manifest.id;
    return {
      manifest: plugin.manifest,
      config,
      components: createComponentRegistryAdapter(this.extensions),
      themes: createThemeRegistryAdapter(this.extensions),
      templates: createTemplateRegistryAdapter(this.extensions),
      charts: createChartRegistryAdapter(this.extensions),
      renderCommands: createRenderCommandRegistryAdapter(this.extensions),
      validators: createValidatorRegistryAdapter(this.extensions),
      fonts: createFontRegistryAdapter(this.extensions),
      icons: createIconRegistryAdapter(this.extensions),
      hooks: {
        on: (name, handler) => {
          this.hooks.register(pluginId, name, handler as HookHandler<HookName>);
        },
      },
    };
  }

  private async runLifecycle<TConfig>(
    plugin: Plugin<TConfig>,
    phase: keyof Pick<Plugin<TConfig>, 'initialize' | 'register' | 'enable' | 'disable' | 'dispose'>,
    context: PluginContext<TConfig>,
  ): Promise<void> {
    const handler = plugin[phase];
    if (handler === undefined) return;

    try {
      await handler(context);
    } catch (error) {
      this.diagnostics.push(
        createDiagnostic(
          'PLUGIN_LIFECYCLE_ERROR',
          `Plugin '${plugin.manifest.id}' failed during ${phase}.`,
          { pluginId: plugin.manifest.id, cause: error },
        ),
      );
      await this.hooks.emit('onError', { error, phase });
    }
  }
}
