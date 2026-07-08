import type { ChartBuildConfig, ChartLayout, SceneGraph, SceneNode } from '../types.js';
import { renderBandAxis, renderLinearAxis } from '../axis.js';
import { layoutLegend } from '../legend.js';
import { createBandScale, createLinearScale, extent } from '../scale.js';
import { seriesColor } from '../theme.js';
import { createTitleText } from '../text-nodes.js';

function chartBackground(config: ChartBuildConfig): SceneNode {
  return {
    kind: 'rect',
    x: 0,
    y: 0,
    width: config.width,
    height: config.height,
    fill: config.theme.background,
  };
}

function yAxisWidth(layout: ChartLayout): number {
  return layout.yAxisArea?.width ?? 44;
}

function renderCartesianChart(
  config: ChartBuildConfig,
  layout: ChartLayout,
  mode: 'line' | 'area',
): SceneGraph {
  const nodes: SceneNode[] = [chartBackground(config)];
  const { plotArea } = layout;
  const categories = config.data.categories;
  const axisWidth = yAxisWidth(layout);

  if (config.title !== undefined && layout.titleArea !== undefined) {
    nodes.push(createTitleText(config.title, config.width, config.theme, layout.titleArea.y, layout.titleArea.height));
  }

  const legend = layoutLegend(
    config.legend ?? 'bottom',
    config.width,
    config.height,
    config.data,
    config.theme,
    config.type,
    plotArea,
  );
  if (legend !== undefined) nodes.push(...legend.nodes);

  const values = config.data.series.flatMap((series) => series.points.map((point) => point.y));
  const [minY, maxY] = extent(values);
  const yDomain: [number, number] = [Math.min(0, minY), maxY];
  nodes.push(...renderLinearAxis('left', plotArea, yDomain, config.theme, config.yAxis, axisWidth).nodes);
  nodes.push(...renderBandAxis(plotArea, categories, config.theme, config.xAxis).nodes);

  const xScale = createBandScale(categories, [plotArea.x, plotArea.x + plotArea.width], 0.05);
  const yScale = createLinearScale(yDomain, [plotArea.y + plotArea.height, plotArea.y]);

  for (let s = 0; s < config.data.series.length; s++) {
    const series = config.data.series[s];
    if (series === undefined) continue;
    const color = series.color ?? seriesColor(config.theme, s);
    const points = series.points
      .map((point) => {
        const x = xScale.scale(String(point.x)) + xScale.bandwidth / 2;
        const y = yScale.scale(point.y);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' L ');

    if (points.length === 0) continue;

    if (mode === 'area') {
      const firstX = xScale.scale(String(series.points[0]?.x ?? '')) + xScale.bandwidth / 2;
      const lastX =
        xScale.scale(String(series.points[series.points.length - 1]?.x ?? '')) + xScale.bandwidth / 2;
      const baseline = yScale.scale(0);
      nodes.push({
        kind: 'path',
        pathData: `M ${firstX.toFixed(2)} ${baseline.toFixed(2)} L ${points} L ${lastX.toFixed(2)} ${baseline.toFixed(2)} Z`,
        fill: color,
        opacity: 0.25,
      });
    }

    nodes.push({
      kind: 'path',
      pathData: `M ${points}`,
      stroke: color,
      strokeWidth: 2,
    });

    for (const point of series.points) {
      const cx = xScale.scale(String(point.x)) + xScale.bandwidth / 2;
      const cy = yScale.scale(point.y);
      nodes.push({
        kind: 'circle',
        cx,
        cy,
        radius: 2.5,
        fill: color,
        stroke: config.theme.background,
        strokeWidth: 1,
      });
    }
  }

  return {
    width: config.width,
    height: config.height,
    nodes,
    accessibility: {
      chartType: mode,
      ...(config.title !== undefined ? { title: config.title } : {}),
      categories,
      series: config.data.series.map((item) => ({
        name: item.name,
        values: item.points.map((point) => ({
          label: point.label ?? String(point.x),
          value: point.y,
        })),
      })),
    },
  };
}

export function renderLineChart(config: ChartBuildConfig, layout: ChartLayout): SceneGraph {
  return renderCartesianChart(config, layout, 'line');
}

export function renderAreaChart(config: ChartBuildConfig, layout: ChartLayout): SceneGraph {
  return renderCartesianChart(config, layout, 'area');
}

export function renderScatterChart(config: ChartBuildConfig, layout: ChartLayout): SceneGraph {
  const nodes: SceneNode[] = [chartBackground(config)];
  const { plotArea } = layout;
  const axisWidth = yAxisWidth(layout);

  if (config.title !== undefined && layout.titleArea !== undefined) {
    nodes.push(createTitleText(config.title, config.width, config.theme, layout.titleArea.y, layout.titleArea.height));
  }

  const xValues = config.data.series.flatMap((series) =>
    series.points.map((point) => (typeof point.x === 'number' ? point.x : Number(point.x) || 0)),
  );
  const yValues = config.data.series.flatMap((series) => series.points.map((point) => point.y));
  const [minX, maxX] = extent(xValues);
  const [minY, maxY] = extent(yValues);
  const xScale = createLinearScale([minX, maxX], [plotArea.x, plotArea.x + plotArea.width]);
  const yScale = createLinearScale([minY, maxY], [plotArea.y + plotArea.height, plotArea.y]);

  nodes.push(...renderLinearAxis('bottom', plotArea, [minX, maxX], config.theme, config.xAxis).nodes);
  nodes.push(...renderLinearAxis('left', plotArea, [minY, maxY], config.theme, config.yAxis, axisWidth).nodes);

  for (let s = 0; s < config.data.series.length; s++) {
    const series = config.data.series[s];
    if (series === undefined) continue;
    const color = series.color ?? seriesColor(config.theme, s);
    for (const point of series.points) {
      const xValue = typeof point.x === 'number' ? point.x : Number(point.x) || 0;
      nodes.push({
        kind: 'circle',
        cx: xScale.scale(xValue),
        cy: yScale.scale(point.y),
        radius: 3.5,
        fill: color,
        opacity: 0.85,
      });
    }
  }

  return {
    width: config.width,
    height: config.height,
    nodes,
    accessibility: {
      chartType: 'scatter',
      ...(config.title !== undefined ? { title: config.title } : {}),
      categories: config.data.categories,
      series: config.data.series.map((item) => ({
        name: item.name,
        values: item.points.map((point) => ({
          label: point.label ?? String(point.x),
          value: point.y,
        })),
      })),
    },
  };
}
