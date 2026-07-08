import type { ChartKind, ChartTheme, LegendPosition, NormalizedChartData, PlotArea, SceneNode } from './types.js';
import { seriesColor } from './theme.js';

export interface LegendLayout {
  readonly area: PlotArea;
  readonly nodes: readonly SceneNode[];
}

interface LegendEntry {
  readonly label: string;
  readonly color: string;
}

function legendEntries(
  data: NormalizedChartData,
  theme: ChartTheme,
  chartType?: ChartKind,
): readonly LegendEntry[] {
  const radial = chartType === 'pie' || chartType === 'doughnut';
  if (radial) {
    const points = data.series[0]?.points ?? [];
    return points.map((point, index) => ({
      label: point.label ?? String(point.x),
      color: seriesColor(theme, index),
    }));
  }

  return data.series.map((series, index) => ({
    label: series.name,
    color: series.color ?? seriesColor(theme, index),
  }));
}

export function layoutLegend(
  position: LegendPosition,
  chartWidth: number,
  _chartHeight: number,
  data: NormalizedChartData,
  theme: ChartTheme,
  chartType?: ChartKind,
  plotArea?: PlotArea,
  xAxisHeight = 44,
): LegendLayout | undefined {
  if (position === 'hidden') return undefined;

  const entries = legendEntries(data, theme, chartType);
  if (entries.length === 0) return undefined;

  const itemHeight = theme.fontSizeSmall + theme.spacing;
  const legendHeight = itemHeight * entries.length + theme.spacing;
  const legendWidth = plotArea?.width ?? Math.min(chartWidth - theme.spacing * 2, 200);

  let area: PlotArea;
  switch (position) {
    case 'top':
      area = {
        x: plotArea?.x ?? theme.spacing,
        y: theme.spacing,
        width: legendWidth,
        height: legendHeight,
      };
      break;
    case 'bottom':
      area = {
        x: plotArea?.x ?? theme.spacing,
        y: (plotArea?.y ?? 0) + (plotArea?.height ?? 0) + xAxisHeight + 4,
        width: legendWidth,
        height: legendHeight,
      };
      break;
    case 'left':
      area = {
        x: theme.spacing,
        y: (plotArea?.y ?? 0) + ((plotArea?.height ?? 0) - legendHeight) / 2,
        width: legendWidth,
        height: legendHeight,
      };
      break;
    case 'right':
      area = {
        x: chartWidth - legendWidth - theme.spacing,
        y: (plotArea?.y ?? 0) + ((plotArea?.height ?? 0) - legendHeight) / 2,
        width: legendWidth,
        height: legendHeight,
      };
      break;
    default:
      return undefined;
  }

  const nodes: SceneNode[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry === undefined) continue;
    const y = area.y + i * itemHeight;

    nodes.push({
      kind: 'rect',
      x: area.x,
      y,
      width: 10,
      height: 10,
      fill: entry.color,
      cornerRadius: 2,
    });
    nodes.push({
      kind: 'text',
      x: area.x + 16,
      y: y - 1,
      width: legendWidth - 20,
      height: itemHeight,
      text: entry.label,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSizeSmall,
      fill: theme.textColor,
      textAlign: 'left',
    });
  }

  return { area, nodes };
}

export function legendMargin(position: LegendPosition, legend?: LegendLayout): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (position === 'hidden' || legend === undefined) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  switch (position) {
    case 'top':
      return { top: legend.area.height + 12, right: 0, bottom: 0, left: 0 };
    case 'bottom':
      return { top: 0, right: 0, bottom: legend.area.height + 12, left: 0 };
    case 'left':
      return { top: 0, right: 0, bottom: 0, left: legend.area.width + 12 };
    case 'right':
      return { top: 0, right: legend.area.width + 12, bottom: 0, left: 0 };
    default:
      return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}
