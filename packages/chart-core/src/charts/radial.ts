import type { ChartBuildConfig, ChartLayout, SceneGraph, SceneNode } from '../types.js';
import { layoutLegend } from '../legend.js';
import { seriesColor } from '../theme.js';
import { createTitleText } from '../text-nodes.js';

function renderRadialChart(
  config: ChartBuildConfig,
  layout: ChartLayout,
  innerRadiusRatio: number,
): SceneGraph {
  const nodes: SceneNode[] = [];
  const series = config.data.series[0];
  const points = series?.points ?? [];
  const total = points.reduce((sum, point) => sum + Math.max(point.y, 0), 0) || 1;
  const { plotArea } = layout;

  nodes.push({
    kind: 'rect',
    x: 0,
    y: 0,
    width: config.width,
    height: config.height,
    fill: config.theme.background,
  });

  if (config.title !== undefined && layout.titleArea !== undefined) {
    nodes.push(createTitleText(config.title, config.width, config.theme, layout.titleArea.y, layout.titleArea.height));
  }

  const legend = layoutLegend(
    config.legend ?? 'right',
    config.width,
    config.height,
    config.data,
    config.theme,
    config.type,
    plotArea,
  );
  if (legend !== undefined) nodes.push(...legend.nodes);

  const cx = plotArea.x + plotArea.width / 2;
  const cy = plotArea.y + plotArea.height / 2;
  const outerRadius = Math.min(plotArea.width, plotArea.height) / 2 - 12;
  const innerRadius = outerRadius * innerRadiusRatio;

  let startAngle = -Math.PI / 2;
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (point === undefined) continue;
    const slice = (Math.max(point.y, 0) / total) * Math.PI * 2;
    const endAngle = startAngle + slice;
    const color = seriesColor(config.theme, i);
    nodes.push({
      kind: 'path',
      pathData: arcPath(cx, cy, outerRadius, innerRadius, startAngle, endAngle),
      fill: color,
      stroke: config.theme.background,
      strokeWidth: 1,
    });
    startAngle = endAngle;
  }

  return {
    width: config.width,
    height: config.height,
    nodes,
    accessibility: {
      chartType: innerRadiusRatio > 0 ? 'doughnut' : 'pie',
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

function arcPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1 = cx + outerRadius * Math.cos(startAngle);
  const y1 = cy + outerRadius * Math.sin(startAngle);
  const x2 = cx + outerRadius * Math.cos(endAngle);
  const y2 = cy + outerRadius * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  if (innerRadius <= 0) {
    return `M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerRadius.toFixed(2)} ${outerRadius.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
  }

  const ix1 = cx + innerRadius * Math.cos(endAngle);
  const iy1 = cy + innerRadius * Math.sin(endAngle);
  const ix2 = cx + innerRadius * Math.cos(startAngle);
  const iy2 = cy + innerRadius * Math.sin(startAngle);

  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${outerRadius.toFixed(2)} ${outerRadius.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
    `A ${innerRadius.toFixed(2)} ${innerRadius.toFixed(2)} 0 ${largeArc} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export function renderPieChart(config: ChartBuildConfig, layout: ChartLayout): SceneGraph {
  return renderRadialChart(config, layout, 0);
}

export function renderDoughnutChart(config: ChartBuildConfig, layout: ChartLayout): SceneGraph {
  const ratio = config.innerRadius ?? 0.55;
  return renderRadialChart(config, layout, ratio);
}

export function renderPlaceholderChart(
  config: ChartBuildConfig,
  label: string,
): SceneGraph {
  const nodes: SceneNode[] = [
    {
      kind: 'rect',
      x: 0,
      y: 0,
      width: config.width,
      height: config.height,
      fill: config.theme.background,
      stroke: config.theme.gridColor,
      strokeWidth: 1,
    },
    {
      kind: 'text',
      x: 0,
      y: config.height / 2 - 8,
      width: config.width,
      height: 16,
      text: `${label} (coming soon)`,
      fontFamily: config.theme.fontFamily,
      fontSize: config.theme.fontSize,
      fill: config.theme.mutedColor,
      textAlign: 'center',
    },
  ];

  return {
    width: config.width,
    height: config.height,
    nodes,
    accessibility: {
      chartType: config.type,
      ...(config.title !== undefined ? { title: config.title } : {}),
      categories: config.data.categories,
      series: [],
    },
  };
}
