import type { HookHandler, HookName } from './hooks.js';
import type {
  ChartExtensionRegistry,
  ComponentExtensionRegistry,
  FontExtensionRegistry,
  IconExtensionRegistry,
  RenderCommandExtensionRegistry,
  TemplateExtensionRegistry,
  ThemeExtensionRegistry,
  ValidatorExtensionRegistry,
} from './extensions.js';
import type { PluginManifest } from './manifest.js';

/** Runtime context passed to plugins during registration and lifecycle. */
export interface PluginContext<TConfig = unknown> {
  readonly manifest: PluginManifest;
  readonly config: TConfig;
  readonly components: ComponentExtensionRegistry;
  readonly themes: ThemeExtensionRegistry;
  readonly templates: TemplateExtensionRegistry;
  readonly charts: ChartExtensionRegistry;
  readonly renderCommands: RenderCommandExtensionRegistry;
  readonly validators: ValidatorExtensionRegistry;
  readonly fonts: FontExtensionRegistry;
  readonly icons: IconExtensionRegistry;
  readonly hooks: {
    on<TName extends HookName>(name: TName, handler: HookHandler<TName>): void;
  };
}

export type PluginLifecyclePhase =
  | 'initialize'
  | 'register'
  | 'enable'
  | 'disable'
  | 'dispose';

export interface PluginLifecycle<TConfig = unknown> {
  initialize?(context: PluginContext<TConfig>): void | Promise<void>;
  register(context: PluginContext<TConfig>): void | Promise<void>;
  enable?(context: PluginContext<TConfig>): void | Promise<void>;
  disable?(context: PluginContext<TConfig>): void | Promise<void>;
  dispose?(context: PluginContext<TConfig>): void | Promise<void>;
}

export interface PluginDefinition<TConfig = unknown> extends PluginManifest, PluginLifecycle<TConfig> {}

export interface Plugin<TConfig = unknown> extends PluginDefinition<TConfig> {
  readonly manifest: PluginManifest;
}

export type PluginInput<TConfig = unknown> =
  | Plugin<TConfig>
  | PluginDefinition<TConfig>;
