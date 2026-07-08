import type { TemplateDefinition, TemplateOptions } from './types.js';

/**
 * Registry of named document templates with cached lookups.
 */
export class TemplateRegistry {
  private readonly _templates = new Map<string, TemplateDefinition>();

  register<TData, TOptions extends TemplateOptions = TemplateOptions>(
    template: TemplateDefinition<TData, TOptions>,
  ): void {
    if (this._templates.has(template.id)) {
      return;
    }
    this._templates.set(template.id, template as unknown as TemplateDefinition);
  }

  has(id: string): boolean {
    return this._templates.has(id);
  }

  get<TData = unknown, TOptions extends TemplateOptions = TemplateOptions>(
    id: string,
  ): TemplateDefinition<TData, TOptions> {
    const template = this._templates.get(id);
    if (template === undefined) {
      throw new Error(`Unknown template '${id}'.`);
    }
    return template as unknown as TemplateDefinition<TData, TOptions>;
  }

  list(): readonly string[] {
    return [...this._templates.keys()].sort();
  }

  listByCategory(category: TemplateDefinition['category']): readonly TemplateDefinition[] {
    return [...this._templates.values()].filter((template) => template.category === category);
  }
}

export const defaultTemplateRegistry = new TemplateRegistry();
