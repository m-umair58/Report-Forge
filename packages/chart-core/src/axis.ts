import { createLinearScale, defaultNumberFormat, type LinearScale } from './scale.js';
import { createTickLabel } from './text-nodes.js';
import type { AxisConfig, ChartTheme, PlotArea, SceneNode } from './types.js';

export interface AxisRenderResult {
  readonly nodes: readonly SceneNode[];
  readonly scale: LinearScale;
}

export interface BandAxisRenderResult {
  readonly nodes: readonly SceneNode[];
  readonly tickLabels: readonly string[];
}

export function renderLinearAxis(
  orientation: 'bottom' | 'left',
  plot: PlotArea,
  domain: readonly [number, number],
  theme: ChartTheme,
  config: AxisConfig = {},
  yAxisWidth = 44,
): AxisRenderResult {
  const tickCount = config.tickCount ?? 5;
  const format = config.format ?? ((value: string | number) => defaultNumberFormat(Number(value)));
  const showGrid = config.showGrid ?? true;
  const nodes: SceneNode[] = [];

  const range: [number, number] =
    orientation === 'bottom' ? [plot.x, plot.x + plot.width] : [plot.y + plot.height, plot.y];
  const scale = createLinearScale(domain, range);
  const ticks = scale.ticks(tickCount);
  const tickStep = ticks.length > 1 ? plot.width / (ticks.length - 1) : plot.width;

  if (orientation === 'bottom') {
    nodes.push({
      kind: 'line',
      x1: plot.x,
      y1: plot.y + plot.height,
      x2: plot.x + plot.width,
      y2: plot.y + plot.height,
      stroke: theme.axisColor,
      strokeWidth: theme.strokeWidth,
    });

    for (const tick of ticks) {
      const x = scale.scale(tick);
      nodes.push({
        kind: 'line',
        x1: x,
        y1: plot.y + plot.height,
        x2: x,
        y2: plot.y + plot.height + 4,
        stroke: theme.axisColor,
        strokeWidth: theme.strokeWidth,
      });
      nodes.push(
        createTickLabel(
          x - tickStep / 2,
          plot.y + plot.height + 8,
          format(tick),
          theme,
          'center',
          tickStep,
        ),
      );

      if (showGrid) {
        nodes.push({
          kind: 'line',
          x1: x,
          y1: plot.y,
          x2: x,
          y2: plot.y + plot.height,
          stroke: theme.gridColor,
          strokeWidth: 0.5,
          opacity: 0.6,
        });
      }
    }

    if (config.title !== undefined) {
      nodes.push(
        createTickLabel(
          plot.x,
          plot.y + plot.height + 28,
          config.title,
          theme,
          'center',
          plot.width,
          theme.fontSizeSmall,
          'bold',
        ),
      );
    }
  } else {
    nodes.push({
      kind: 'line',
      x1: plot.x,
      y1: plot.y,
      x2: plot.x,
      y2: plot.y + plot.height,
      stroke: theme.axisColor,
      strokeWidth: theme.strokeWidth,
    });

    for (const tick of ticks) {
      const y = scale.scale(tick);
      nodes.push({
        kind: 'line',
        x1: plot.x - 4,
        y1: y,
        x2: plot.x,
        y2: y,
        stroke: theme.axisColor,
        strokeWidth: theme.strokeWidth,
      });
      nodes.push(
        createTickLabel(
          plot.x - yAxisWidth,
          y - theme.fontSizeSmall * 0.55,
          format(tick),
          theme,
          'right',
          yAxisWidth - 6,
        ),
      );

      if (showGrid) {
        nodes.push({
          kind: 'line',
          x1: plot.x,
          y1: y,
          x2: plot.x + plot.width,
          y2: y,
          stroke: theme.gridColor,
          strokeWidth: 0.5,
          opacity: 0.6,
        });
      }
    }
  }

  return { nodes, scale };
}

export function renderBandAxis(
  plot: PlotArea,
  labels: readonly string[],
  theme: ChartTheme,
  config: AxisConfig = {},
): BandAxisRenderResult {
  const nodes: SceneNode[] = [];
  const step = labels.length > 0 ? plot.width / labels.length : plot.width;

  nodes.push({
    kind: 'line',
    x1: plot.x,
    y1: plot.y + plot.height,
    x2: plot.x + plot.width,
    y2: plot.y + plot.height,
    stroke: theme.axisColor,
    strokeWidth: theme.strokeWidth,
  });

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i] ?? '';
    const x = plot.x + i * step + step / 2;
    nodes.push({
      kind: 'line',
      x1: x,
      y1: plot.y + plot.height,
      x2: x,
      y2: plot.y + plot.height + 4,
      stroke: theme.axisColor,
      strokeWidth: theme.strokeWidth,
    });
    nodes.push(
      createTickLabel(
        plot.x + i * step,
        plot.y + plot.height + 8,
        label,
        theme,
        'center',
        step,
      ),
    );
  }

  if (config.title !== undefined) {
    nodes.push(
      createTickLabel(
        plot.x,
        plot.y + plot.height + 28,
        config.title,
        theme,
        'center',
        plot.width,
        theme.fontSizeSmall,
        'bold',
      ),
    );
  }

  return { nodes, tickLabels: labels };
}

/** Left-side band axis for horizontal bar charts (category labels). */
export function renderBandAxisLeft(
  plot: PlotArea,
  labels: readonly string[],
  theme: ChartTheme,
  yAxisWidth: number,
): BandAxisRenderResult {
  const nodes: SceneNode[] = [];
  const step = labels.length > 0 ? plot.height / labels.length : plot.height;

  nodes.push({
    kind: 'line',
    x1: plot.x,
    y1: plot.y,
    x2: plot.x,
    y2: plot.y + plot.height,
    stroke: theme.axisColor,
    strokeWidth: theme.strokeWidth,
  });

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i] ?? '';
    const y = plot.y + i * step + step / 2;
    nodes.push({
      kind: 'line',
      x1: plot.x - 4,
      y1: y,
      x2: plot.x,
      y2: y,
      stroke: theme.axisColor,
      strokeWidth: theme.strokeWidth,
    });
    nodes.push(
      createTickLabel(
        plot.x - yAxisWidth,
        y - theme.fontSizeSmall * 0.55,
        label,
        theme,
        'right',
        yAxisWidth - 6,
      ),
    );
  }

  return { nodes, tickLabels: labels };
}

export { defaultNumberFormat as formatAxisTick };
