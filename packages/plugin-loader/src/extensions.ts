import type { ComponentRegistryEntry } from '@reportforge/components';
import type { ValidatorFunction } from '@reportforge/core';
import type { IReportNode } from '@reportforge/shared';
import type { Theme } from '@reportforge/theme';
import type {
  ChartRegistration,
  ComponentRegistration,
  FontRegistration,
  HookHandler,
  HookName,
  IconRegistration,
  RenderCommandRegistration,
  TemplateRegistration,
  ValidatorRegistration,
} from '@reportforge/plugin-sdk';

export class ExtensionStore {
  readonly components = new Map<string, ComponentRegistration>();
  readonly themes = new Map<string, Theme>();
  readonly templates = new Map<string, TemplateRegistration>();
  readonly charts = new Map<string, ChartRegistration>();
  readonly renderCommands = new Map<string, RenderCommandRegistration>();
  readonly validators = new Map<string, ValidatorRegistration>();
  readonly fonts = new Map<string, FontRegistration>();
  readonly icons = new Map<string, IconRegistration>();

  toComponentRegistryEntries(): readonly ComponentRegistryEntry[] {
    return [...this.components.values()].map((definition) => ({
      type: definition.type,
      allowedChildren: new Set(definition.allowedChildren),
      allowedParents: new Set(definition.allowedParents),
      requiredProps: definition.requiredProps ?? [],
    }));
  }
}

export function createComponentRegistryAdapter(store: ExtensionStore) {
  return {
    register(definition: ComponentRegistration): void {
      if (store.components.has(definition.type)) {
        throw new Error(`Component type '${definition.type}' is already registered.`);
      }
      store.components.set(definition.type, definition);
    },
    list(): readonly string[] {
      return [...store.components.keys()].sort();
    },
  };
}

export function createThemeRegistryAdapter(store: ExtensionStore) {
  return {
    register(theme: Theme): void {
      if (store.themes.has(theme.name)) {
        throw new Error(`Theme '${theme.name}' is already registered.`);
      }
      store.themes.set(theme.name, theme);
    },
    list(): readonly string[] {
      return [...store.themes.keys()].sort();
    },
  } as import('@reportforge/plugin-sdk').ThemeExtensionRegistry;
}

export function createTemplateRegistryAdapter(store: ExtensionStore) {
  return {
    register(template: TemplateRegistration): void {
      if (store.templates.has(template.id)) {
        throw new Error(`Template '${template.id}' is already registered.`);
      }
      store.templates.set(template.id, template);
    },
    get(id: string): TemplateRegistration | undefined {
      return store.templates.get(id);
    },
    list(): readonly string[] {
      return [...store.templates.keys()].sort();
    },
  };
}

export function createChartRegistryAdapter(store: ExtensionStore) {
  return {
    register(chart: ChartRegistration): void {
      if (store.charts.has(chart.type)) {
        throw new Error(`Chart type '${chart.type}' is already registered.`);
      }
      store.charts.set(chart.type, chart);
    },
    list(): readonly string[] {
      return [...store.charts.keys()].sort();
    },
  };
}

export function createRenderCommandRegistryAdapter(store: ExtensionStore) {
  return {
    register(command: RenderCommandRegistration): void {
      if (store.renderCommands.has(command.type)) {
        throw new Error(`Render command '${command.type}' is already registered.`);
      }
      store.renderCommands.set(command.type, command);
    },
    list(): readonly string[] {
      return [...store.renderCommands.keys()].sort();
    },
  };
}

export function createValidatorRegistryAdapter(store: ExtensionStore) {
  return {
    register(validator: ValidatorRegistration): void {
      if (store.validators.has(validator.name)) {
        throw new Error(`Validator '${validator.name}' is already registered.`);
      }
      store.validators.set(validator.name, validator);
    },
    list(): readonly string[] {
      return [...store.validators.keys()].sort();
    },
  };
}

export function createFontRegistryAdapter(store: ExtensionStore) {
  return {
    register(font: FontRegistration): void {
      if (store.fonts.has(font.family)) {
        throw new Error(`Font '${font.family}' is already registered.`);
      }
      store.fonts.set(font.family, font);
    },
    list(): readonly string[] {
      return [...store.fonts.keys()].sort();
    },
  };
}

export function createIconRegistryAdapter(store: ExtensionStore) {
  return {
    register(icon: IconRegistration): void {
      if (store.icons.has(icon.name)) {
        throw new Error(`Icon '${icon.name}' is already registered.`);
      }
      store.icons.set(icon.name, icon);
    },
    list(): readonly string[] {
      return [...store.icons.keys()].sort();
    },
  };
}

export function toValidatorFunctions(store: ExtensionStore): ValidatorFunction[] {
  return [...store.validators.values()].map((validator) => {
    return (node: IReportNode, _parent, _context) => {
      const result = validator.validate(node);
      if (result.valid) return [];
      return [{
        message: result.message ?? `Validator '${validator.name}' failed.`,
        nodeId: node.id,
      }];
    };
  });
}

export interface HookRecord {
  readonly pluginId: string;
  readonly name: HookName;
  readonly handler: HookHandler<HookName>;
  readonly priority: number;
}

export class HookSystem {
  private readonly hooks: HookRecord[] = [];

  register(
    pluginId: string,
    name: HookName,
    handler: HookHandler<HookName>,
    priority = 0,
  ): void {
    this.hooks.push({ pluginId, name, handler, priority });
  }

  async emit<TName extends HookName>(
    name: TName,
    context: Parameters<HookHandler<TName>>[0],
  ): Promise<void> {
    const handlers = this.hooks
      .filter((hook) => hook.name === name)
      .sort((left, right) => right.priority - left.priority);

    for (const hook of handlers) {
      try {
        await hook.handler(context as Parameters<HookHandler<HookName>>[0]);
      } catch (error) {
        await this.emit('onError', { error, phase: name });
      }
    }
  }

  list(): readonly HookRecord[] {
    return [...this.hooks];
  }
}
