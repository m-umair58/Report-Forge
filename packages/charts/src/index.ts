import { Components, type ComponentDescriptor } from '@reportforge/components';
import type { ChartKind, ChartPropsInput, LegendPosition } from '@reportforge/chart-core';

type ChartFactoryInput = Omit<ChartPropsInput, 'type'> & {
  readonly type?: ChartKind;
};

function chartDescriptor(type: ChartKind, props: ChartFactoryInput): ComponentDescriptor {
  const { type: _ignored, ...rest } = props;
  return Components.Chart({
    type,
    ...rest,
  });
}

/** Fluent chart factories for the ReportForge builder API. */
export const Charts = {
  Bar: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('bar', props),

  HorizontalBar: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('horizontal-bar', props),

  Line: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('line', props),

  Area: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('area', props),

  Pie: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('pie', props),

  Doughnut: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('doughnut', props),

  Scatter: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('scatter', props),

  Heatmap: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('heatmap', props),

  Treemap: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('treemap', props),

  Radar: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('radar', props),

  Gauge: (props: ChartFactoryInput): ComponentDescriptor =>
    chartDescriptor('gauge', props),
} as const;

export type { ChartKind, ChartPropsInput, LegendPosition };

export const PACKAGE_NAME = '@reportforge/charts' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
