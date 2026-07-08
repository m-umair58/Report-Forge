import { FontMetrics, BUILT_IN_FONT_METRICS, type FontMetricsData } from './font-metrics.js';
import type { FontWeight } from './types.js';

// ─── Registry key ─────────────────────────────────────────────────────────────

type RegistryKey = `${string}:${FontWeight}`;

function makeKey(family: string, weight: FontWeight): RegistryKey {
  return `${family.toLowerCase()}:${weight}`;
}

/**
 * Registry of font metrics for text measurement.
 *
 * Pre-loaded with built-in metrics for Helvetica, Times-Roman, and Courier
 * (normal and bold). Custom font metrics can be registered for future
 * TTF/OTF embedding support.
 *
 * @example
 * const registry = new FontRegistry();
 * const metrics = registry.get('Helvetica', 'normal');
 * console.log(metrics.stringWidth('Hello', 12)); // advance width in pt
 */
export class FontRegistry {
  private readonly _entries = new Map<RegistryKey, FontMetrics>();

  constructor() {
    for (const data of BUILT_IN_FONT_METRICS) {
      this.register(data);
    }
  }

  /**
   * Registers font metrics for a family + weight combination.
   * Overwrites any existing entry for the same key.
   */
  register(data: FontMetricsData): void {
    const key = makeKey(data.family, data.weight);
    this._entries.set(key, new FontMetrics(data));
  }

  /**
   * Unregisters metrics for a family + weight combination.
   * @returns true if an entry was removed.
   */
  unregister(family: string, weight: FontWeight): boolean {
    return this._entries.delete(makeKey(family, weight));
  }

  /**
   * Returns metrics for the given family and weight.
   * Falls back to Helvetica normal if not found.
   */
  get(family: string, weight: FontWeight): FontMetrics {
    const key = makeKey(family, weight);
    const cached = this._entries.get(key);
    if (cached !== undefined) return cached;

    // Try case-insensitive family lookup
    for (const [k, metrics] of this._entries) {
      const [registeredFamily, registeredWeight] = k.split(':') as [string, FontWeight];
      if (registeredFamily === family.toLowerCase() && registeredWeight === weight) {
        return metrics;
      }
    }

    // Fallback: Helvetica normal
    const fallback = this._entries.get(makeKey('Helvetica', 'normal'));
    if (fallback !== undefined) return fallback;

    // Should never happen — built-in fonts are always registered
    return new FontMetrics(BUILT_IN_FONT_METRICS[0]!);
  }

  /** Returns true if metrics are registered for the family + weight. */
  has(family: string, weight: FontWeight): boolean {
    return this._entries.has(makeKey(family, weight));
  }

  /** Lists all registered family:weight keys. */
  list(): readonly string[] {
    return [...this._entries.keys()];
  }

  /** Number of registered font metric entries. */
  get size(): number {
    return this._entries.size;
  }
}
