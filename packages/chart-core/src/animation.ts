import type { ChartAnimationHooks } from './types.js';

/** Animation hooks — not implemented in this milestone. */
export interface ChartAnimationContext {
  readonly hooks?: ChartAnimationHooks;
}

export const DEFAULT_ANIMATION_HOOKS: ChartAnimationHooks = {
  enabled: false,
  durationMs: 0,
  easing: 'linear',
};

export function createAnimationContext(hooks?: ChartAnimationHooks): ChartAnimationContext {
  return { hooks: hooks ?? DEFAULT_ANIMATION_HOOKS };
}

/** Reserved for future animated renderers. Currently a no-op. */
export function applyAnimationHooks(_context: ChartAnimationContext): void {
  // Intentionally empty — animation belongs to a future milestone.
}
