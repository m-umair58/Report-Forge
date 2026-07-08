import type { ChartBuildConfig, ChartLayout, SceneGraph, SceneNode } from '../types.js';
import { renderBandAxis, renderBandAxisLeft, renderLinearAxis } from '../axis.js';
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

function chartTitle(config: ChartBuildConfig, layout: ChartLayout): SceneNode | undefined {
  if (config.title === undefined || layout.titleArea === undefined) return undefined;
  return createTitleText(config.title, config.width, config.theme, layout.titleArea.y, layout.titleArea.height);
}

function yAxisWidth(layout: ChartLayout): number {
  return layout.yAxisArea?.width ?? 44;
}

export function renderBarChart(config: ChartBuildConfig, layout: ChartLayout): SceneGraph {
  const nodes: SceneNode[] = [chartBackground(config)];
  const title = chartTitle(config, layout);
  if (title !== undefined) nodes.push(title);

  const { plotArea } = layout;
  const categories = config.data.categories;
  const series = config.data.series;
  const axisWidth = yAxisWidth(layout);

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

  const values = series.flatMap((item) => item.points.map((point) => point.y));
  const [minY, maxY] = extent(values);
  const yDomain: [number, number] = [Math.min(0, minY), maxY];
  nodes.push(...renderLinearAxis('left', plotArea, yDomain, config.theme, config.yAxis, axisWidth).nodes);
  nodes.push(...renderBandAxis(plotArea, categories, config.theme, config.xAxis).nodes);

  const xScale = createBandScale(categories, [plotArea.x, plotArea.x + plotArea.width], 0.2);
  const yScale = createLinearScale(yDomain, [plotArea.y + plotArea.height, plotArea.y]);
  const seriesCount = Math.max(series.length, 1);
  const barWidth = xScale.bandwidth / seriesCount;

  for (let s = 0; s < series.length; s++) {
    const current = series[s];
    if (current === undefined) continue;
    const color = current.color ?? seriesColor(config.theme, s);

    for (const point of current.points) {
      if (categories.indexOf(String(point.x)) < 0) continue;
      const groupX = xScale.scale(String(point.x));
      const x = groupX + s * barWidth;
      const y = yScale.scale(point.y);
      const baseline = yScale.scale(0);
      const height = Math.max(baseline - y, 1);

      nodes.push({
        kind: 'rect',
        x,
        y,
        width: Math.max(barWidth - 2, 1),
        height,
        fill: color,
        cornerRadius: 2,
      });
    }
  }

  return buildSceneGraph(config, layout, nodes, 'bar');
}

export function renderHorizontalBarChart(config: ChartBuildConfig, layout: ChartLayout): SceneGraph {
  const nodes: SceneNode[] = [chartBackground(config)];
  const title = chartTitle(config, layout);
  if (title !== undefined) nodes.push(title);

  const { plotArea } = layout;
  const categories = config.data.categories;
  const series = config.data.series;
  const axisWidth = yAxisWidth(layout);

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

  const values = series.flatMap((item) => item.points.map((point) => point.y));
  const [minX, maxX] = extent(values);
  const xDomain: [number, number] = [0, maxX * 1.05];

  nodes.push(...renderBandAxisLeft(plotArea, categories, config.theme, axisWidth).nodes);
  nodes.push(...renderLinearAxis('bottom', plotArea, xDomain, config.theme, config.xAxis).nodes);

  const xScale = createLinearScale(xDomain, [plotArea.x, plotArea.x + plotArea.width]);
  const yScale = createBandScale(categories, [plotArea.y, plotArea.y + plotArea.height], 0.2);
  const barHeight = yScale.bandwidth;

  for (let s = 0; s < series.length; s++) {
    const current = series[s];
    if (current === undefined) continue;
    const color = current.color ?? seriesColor(config.theme, s);

    for (const point of current.points) {
      const bandY = yScale.scale(String(point.x)) + s * (barHeight / Math.max(series.length, 1));
      const x0 = xScale.scale(0);
      const x1 = xScale.scale(point.y);
      nodes.push({
        kind: 'rect',
        x: Math.min(x0, x1),
        y: bandY,
        width: Math.max(Math.abs(x1 - x0), 1),
        height: Math.max(barHeight / Math.max(series.length, 1) - 2, 1),
        fill: color,
        cornerRadius: 2,
      });
    }
  }

  return buildSceneGraph(config, layout, nodes, 'horizontal-bar');
}

function buildSceneGraph(
  config: ChartBuildConfig,
  _layout: ChartLayout,
  nodes: SceneNode[],
  chartType: ChartBuildConfig['type'],
): SceneGraph {
  return {
    width: config.width,
    height: config.height,
    nodes,
    accessibility: {
      chartType,
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
