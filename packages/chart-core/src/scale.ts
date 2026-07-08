import type { ScaleKind } from './types.js';

export interface LinearScale {
  readonly kind: 'linear';
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
  scale(value: number): number;
  ticks(count?: number): readonly number[];
  invert(value: number): number;
}

export interface BandScale {
  readonly kind: 'band';
  readonly domain: readonly string[];
  readonly range: readonly [number, number];
  readonly bandwidth: number;
  scale(value: string): number;
  ticks(): readonly string[];
}

export interface OrdinalScale {
  readonly kind: 'ordinal';
  readonly domain: readonly string[];
  readonly range: readonly string[];
  scale(value: string): string;
  ticks(): readonly string[];
}

/** Placeholder — time scale reserved for future milestones. */
export interface TimeScale {
  readonly kind: 'time';
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
  scale(value: number): number;
}

/** Placeholder — log scale reserved for future milestones. */
export interface LogScale {
  readonly kind: 'log';
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
  scale(value: number): number;
}

export type Scale = LinearScale | BandScale | OrdinalScale | TimeScale | LogScale;

export function createLinearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const rangeSpan = r1 - r0;

  return {
    kind: 'linear',
    domain,
    range,
    scale(value: number): number {
      const t = (value - d0) / span;
      return r0 + t * rangeSpan;
    },
    ticks(count = 5): readonly number[] {
      const step = span / Math.max(count - 1, 1);
      const result: number[] = [];
      for (let i = 0; i < count; i++) {
        result.push(d0 + step * i);
      }
      return result;
    },
    invert(value: number): number {
      const t = (value - r0) / (rangeSpan || 1);
      return d0 + t * span;
    },
  };
}

export function createBandScale(
  domain: readonly string[],
  range: readonly [number, number],
  padding = 0.1,
): BandScale {
  const [r0, r1] = range;
  const step = domain.length > 0 ? (r1 - r0) / domain.length : 0;
  const bandwidth = step * (1 - padding);

  return {
    kind: 'band',
    domain,
    range,
    bandwidth,
    scale(value: string): number {
      const index = domain.indexOf(value);
      if (index < 0) return r0;
      return r0 + index * step + (step - bandwidth) / 2;
    },
    ticks(): readonly string[] {
      return domain;
    },
  };
}

export function createOrdinalScale(domain: readonly string[], range: readonly string[]): OrdinalScale {
  return {
    kind: 'ordinal',
    domain,
    range,
    scale(value: string): string {
      const index = domain.indexOf(value);
      if (index < 0) return range[0] ?? '#888888';
      return range[index % range.length] ?? '#888888';
    },
    ticks(): readonly string[] {
      return domain;
    },
  };
}

export function createTimeScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): TimeScale {
  const linear = createLinearScale(domain, range);
  return {
    kind: 'time',
    domain,
    range,
    scale: linear.scale,
  };
}

export function createLogScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): LogScale {
  const safeDomain: [number, number] = [
    Math.max(domain[0], Number.MIN_VALUE),
    Math.max(domain[1], Number.MIN_VALUE),
  ];
  const logDomain: [number, number] = [Math.log10(safeDomain[0]), Math.log10(safeDomain[1])];
  const linear = createLinearScale(logDomain, range);
  return {
    kind: 'log',
    domain,
    range,
    scale(value: number): number {
      return linear.scale(Math.log10(Math.max(value, Number.MIN_VALUE)));
    },
  };
}

export function scaleKindName(scale: Scale): ScaleKind {
  return scale.kind;
}

export function extent(values: readonly number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  let min = values[0] ?? 0;
  let max = values[0] ?? 0;
  for (let i = 1; i < values.length; i++) {
    const value = values[i] ?? 0;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === max) {
    return min === 0 ? [0, 1] : [min * 0.9, max * 1.1];
  }
  return [min, max];
}

export function defaultNumberFormat(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}
