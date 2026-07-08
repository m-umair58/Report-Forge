import { FontNotFoundError } from './errors.js';
import type { FontRegistry } from './font-registry.js';
import type { FontMetrics } from './font-metrics.js';
import type { FontWeight, ResolvedTextStyle } from './types.js';

/**
 * Resolves a font family name and weight to `FontMetrics`.
 *
 * Handles common aliases (e.g. 'Arial' → Helvetica, 'monospace' → Courier)
 * and provides a strict mode that throws when a font is not found.
 *
 * @example
 * const resolver = new FontResolver(registry);
 * const metrics = resolver.resolve('Helvetica', 'bold');
 */
export class FontResolver {
  private readonly _registry: FontRegistry;
  private readonly _strict: boolean;

  /**
   * @param registry - Font metrics registry to resolve against.
   * @param strict - When true, throws `FontNotFoundError` for unknown families
   *                 instead of falling back to Helvetica.
   */
  constructor(registry: FontRegistry, strict = false) {
    this._registry = registry;
    this._strict = strict;
  }

  /**
   * Resolves a font family and weight to `FontMetrics`.
   *
   * Alias resolution:
   * - 'Arial', 'sans', 'sans-serif', 'Inter' → Helvetica
   * - 'Times', 'serif', 'Georgia' → Times-Roman
   * - 'Courier', 'mono', 'monospace' → Courier
   */
  resolve(family: string, weight: FontWeight): FontMetrics {
    const canonical = this.canonicalFamily(family);

    if (this._strict && !this._registry.has(canonical, weight)) {
      throw new FontNotFoundError(family);
    }

    return this._registry.get(canonical, weight);
  }

  /**
   * Resolves metrics from a complete `ResolvedTextStyle`.
   *
   * Italic is a placeholder — it does not select a different metrics table
   * in this milestone. Future milestones may register italic font metrics.
   */
  resolveFromStyle(style: ResolvedTextStyle): FontMetrics {
    return this.resolve(style.fontFamily, style.fontWeight);
  }

  /**
   * Maps common font family aliases to canonical built-in names.
   */
  canonicalFamily(family: string): string {
    const name = family.toLowerCase();

    if (
      name.includes('sans') ||
      name.includes('helvetica') ||
      name.includes('arial') ||
      name.includes('inter') ||
      name.includes('roboto')
    ) {
      return 'Helvetica';
    }

    if (
      name.includes('times') ||
      name.includes('serif') ||
      name.includes('georgia') ||
      name.includes('garamond')
    ) {
      return 'Times-Roman';
    }

    if (
      name.includes('courier') ||
      name.includes('mono') ||
      name.includes('consolas') ||
      name.includes('menlo')
    ) {
      return 'Courier';
    }

    // Return as-is — registry will fall back to Helvetica if not found
    return family;
  }
}
