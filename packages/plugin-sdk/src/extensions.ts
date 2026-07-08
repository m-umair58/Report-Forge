import type {
  ComponentDefinition,
  TemplateDefinition,
  ValidatorDefinition,
} from '@reportforge/shared';

export interface ComponentRegistration extends ComponentDefinition {
  readonly requiredProps?: readonly string[];
}

export interface ChartRegistration {
  readonly type: string;
  readonly label: string;
  readonly description?: string;
}

export interface RenderCommandRegistration {
  readonly type: string;
  readonly convert: (node: unknown, context: unknown) => readonly unknown[];
}

export interface FontRegistration {
  readonly family: string;
  readonly src?: string;
  readonly weight?: number | string;
  readonly style?: string;
}

export interface IconRegistration {
  readonly name: string;
  readonly src?: string;
  readonly unicode?: string;
}

/** Theme payload accepted by plugin theme registration. */
export interface PluginThemeInput {
  readonly name: string;
  readonly tokens?: unknown;
  readonly extends?: string;
}

export interface ThemeRegistration {
  readonly theme: PluginThemeInput;
}

export interface ThemeExtensionRegistry {
  register(theme: PluginThemeInput): void;
  list(): readonly string[];
}

export interface TemplateRegistration extends TemplateDefinition {
  readonly id: string;
}

export interface ValidatorRegistration extends ValidatorDefinition {}

export interface ComponentExtensionRegistry {
  register(definition: ComponentRegistration): void;
  list(): readonly string[];
}

export interface TemplateExtensionRegistry {
  register(template: TemplateRegistration): void;
  get(id: string): TemplateRegistration | undefined;
  list(): readonly string[];
}

export interface ChartExtensionRegistry {
  register(chart: ChartRegistration): void;
  list(): readonly string[];
}

export interface RenderCommandExtensionRegistry {
  register(command: RenderCommandRegistration): void;
  list(): readonly string[];
}

export interface ValidatorExtensionRegistry {
  register(validator: ValidatorRegistration): void;
  list(): readonly string[];
}

export interface FontExtensionRegistry {
  register(font: FontRegistration): void;
  list(): readonly string[];
}

export interface IconExtensionRegistry {
  register(icon: IconRegistration): void;
  list(): readonly string[];
}
