import type { IBuilder, IReportNode } from './builder.js';
import type { IComponent } from './component.js';
import type { IRenderer } from './renderer.js';
import type { ITheme } from './theme.js';

/**
 * Contract for ReportForge plugins.
 * Plugins register extensions via the plugin registry during report construction.
 */
export interface IPlugin {
  /** Unique plugin identifier. */
  readonly name: string;

  /** Plugin version (semver). */
  readonly version: string;

  /**
   * Called during report initialization to register extensions.
   * @param registry - Central registry for components, themes, renderers, templates, and validators.
   */
  register(registry: IPluginRegistry): void;
}

/**
 * Central registry for plugin extension points.
 * Owned by @reportforge/core; passed to plugins during registration.
 */
export interface IPluginRegistry {
  registerComponent(definition: ComponentDefinition): void;
  registerRenderer(renderer: IRenderer): void;
  registerTheme(theme: ITheme): void;
  registerTemplate(template: TemplateDefinition): void;
  registerValidator(validator: ValidatorDefinition): void;
}

/** Definition for a custom component type registered by a plugin. */
export interface ComponentDefinition {
  readonly type: string;
  readonly allowedParents: readonly string[];
  readonly allowedChildren: readonly string[];
  readonly builderMethod?: string;
  readonly serialize: (component: IComponent) => IReportNode;
}

/** Definition for a reusable report template. */
export interface TemplateDefinition {
  readonly name: string;
  readonly description: string;
  readonly build: (builder: IBuilder, data: Readonly<Record<string, unknown>>) => void;
}

/** Definition for a custom schema validator. */
export interface ValidatorDefinition {
  readonly name: string;
  readonly validate: (node: IReportNode) => ValidatorResult;
}

/** Result of a single validator execution. */
export interface ValidatorResult {
  readonly valid: boolean;
  readonly message?: string;
}
