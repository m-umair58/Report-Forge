/**
 * Registry of known component types.
 * Drives allowed-children validation and builder safety.
 */
export interface ComponentRegistryEntry {
  readonly type: string;
  readonly allowedChildren: ReadonlySet<string>;
  readonly allowedParents: ReadonlySet<string>;
  readonly requiredProps: readonly string[];
}

export class ComponentRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComponentRegistryError';
  }
}

export class ComponentRegistry {
  private readonly entries = new Map<string, ComponentRegistryEntry>();

  register(entry: ComponentRegistryEntry): void {
    if (this.entries.has(entry.type)) {
      throw new ComponentRegistryError(
        `Component type '${entry.type}' is already registered. Use unregister() first to replace it.`,
      );
    }
    this.entries.set(entry.type, entry);
  }

  unregister(type: string): void {
    if (!this.entries.has(type)) {
      throw new ComponentRegistryError(`Cannot unregister unknown component type '${type}'.`);
    }
    this.entries.delete(type);
  }

  resolve(type: string): ComponentRegistryEntry | undefined {
    return this.entries.get(type);
  }

  has(type: string): boolean {
    return this.entries.has(type);
  }

  list(): readonly string[] {
    return Array.from(this.entries.keys()).sort();
  }
}
