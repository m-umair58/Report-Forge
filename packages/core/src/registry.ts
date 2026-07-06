import { BuilderError } from './errors.js';

/**
 * Describes a registered component type.
 * Drives allowed-children validation and builder API safety.
 */
export interface ComponentRegistryEntry {
  /** Unique type discriminator string (e.g. 'title', 'summary-card'). */
  readonly type: string;
  /**
   * Set of child type strings this component may contain.
   * An empty set means this component is a leaf and accepts no children.
   */
  readonly allowedChildren: ReadonlySet<string>;
  /**
   * Set of parent type strings that may contain this component.
   * An empty set means this component is the root (only 'report').
   */
  readonly allowedParents: ReadonlySet<string>;
  /** Props that must be present (non-undefined) for this component type. */
  readonly requiredProps: readonly string[];
}

/**
 * Registry of all known component types within a report instance.
 * Supports dynamic registration for the plugin system in future milestones.
 *
 * @example
 * const registry = new ComponentRegistry();
 * registry.register({ type: 'badge', allowedChildren: new Set(), ... });
 * registry.has('badge'); // true
 * registry.list();       // [..., 'badge', ...]
 */
export class ComponentRegistry {
  private readonly entries = new Map<string, ComponentRegistryEntry>();

  /**
   * Registers a component type definition.
   * @throws {BuilderError} If the type is already registered.
   */
  register(entry: ComponentRegistryEntry): void {
    if (this.entries.has(entry.type)) {
      throw new BuilderError(
        `Component type '${entry.type}' is already registered. Use unregister() first to replace it.`,
      );
    }
    this.entries.set(entry.type, entry);
  }

  /**
   * Removes a component type from the registry.
   * @throws {BuilderError} If the type is not registered.
   */
  unregister(type: string): void {
    if (!this.entries.has(type)) {
      throw new BuilderError(`Cannot unregister unknown component type '${type}'.`);
    }
    this.entries.delete(type);
  }

  /**
   * Returns the definition for a component type, or undefined if not registered.
   */
  resolve(type: string): ComponentRegistryEntry | undefined {
    return this.entries.get(type);
  }

  /**
   * Returns true if the given component type is registered.
   */
  has(type: string): boolean {
    return this.entries.has(type);
  }

  /**
   * Returns a sorted list of all registered component type strings.
   */
  list(): readonly string[] {
    return Array.from(this.entries.keys()).sort();
  }
}
