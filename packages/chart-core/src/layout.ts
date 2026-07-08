import { legendMargin, layoutLegend } from './legend.js';
import { createLinearScale, defaultNumberFormat } from './scale.js';
import { measureYAxisWidth } from './text-nodes.js';
import type { ChartBuildConfig, ChartLayout, LegendPosition } from './types.js';

const TITLE_HEIGHT = 28;
const X_AXIS_HEIGHT = 44;
const CHART_PADDING = 12;

function yAxisTickLabels(config: ChartBuildConfig): readonly string[] {
  const values = config.data.series.flatMap((series) => series.points.map((point) => point.y));
  if (values.length === 0) return [];
  const min = Math.min(0, ...values);
  const max = Math.max(...values);
  const scale = createLinearScale([min, max], [0, 1]);
  const format = config.yAxis?.format ?? ((value: string | number) => defaultNumberFormat(Number(value)));
  return scale.ticks(config.yAxis?.tickCount ?? 5).map((tick) => format(tick));
}

export function computeChartLayout(config: ChartBuildConfig): ChartLayout {
  const legendPosition: LegendPosition = config.legend ?? 'bottom';

  const titleHeight = config.title !== undefined ? TITLE_HEIGHT : 0;
  const yAxisLabels =
    config.type === 'horizontal-bar'
      ? config.data.categories
      : yAxisTickLabels(config);
  const yAxisWidth = measureYAxisWidth(yAxisLabels, config.theme.fontSizeSmall);

  // Preliminary plot area for legend placement.
  const preliminaryPlotY = titleHeight + CHART_PADDING / 2;
  const preliminaryPlotX = yAxisWidth + CHART_PADDING;
  const preliminaryPlotWidth = Math.max(config.width - preliminaryPlotX - CHART_PADDING, 40);
  const preliminaryPlotHeight = Math.max(config.height - preliminaryPlotY - X_AXIS_HEIGHT - CHART_PADDING * 2, 40);
  const preliminaryPlot = {
    x: preliminaryPlotX,
    y: preliminaryPlotY,
    width: preliminaryPlotWidth,
    height: preliminaryPlotHeight,
  };

  const legend = layoutLegend(
    legendPosition,
    config.width,
    config.height,
    config.data,
    config.theme,
    config.type,
    preliminaryPlot,
    X_AXIS_HEIGHT,
  );
  const margins = legendMargin(legendPosition, legend);

  const plotX = yAxisWidth + margins.left + CHART_PADDING;
  const plotY = titleHeight + margins.top + CHART_PADDING / 2;
  const plotWidth = Math.max(config.width - plotX - margins.right - CHART_PADDING, 40);
  const plotHeight = Math.max(
    config.height - plotY - margins.bottom - X_AXIS_HEIGHT - CHART_PADDING,
    40,
  );

  const layout: ChartLayout = {
    width: config.width,
    height: config.height,
    plotArea: { x: plotX, y: plotY, width: plotWidth, height: plotHeight },
  };

  const xAxisArea = {
    x: plotX,
    y: plotY + plotHeight + 6,
    width: plotWidth,
    height: X_AXIS_HEIGHT,
  };
  const yAxisArea = { x: CHART_PADDING, y: plotY, width: yAxisWidth, height: plotHeight };

  if (config.title !== undefined) {
    return {
      ...layout,
      titleArea: { x: 0, y: 6, width: config.width, height: titleHeight },
      ...(legend !== undefined ? { legendArea: legend.area } : {}),
      xAxisArea,
      yAxisArea,
    };
  }

  return {
    ...layout,
    ...(legend !== undefined ? { legendArea: legend.area } : {}),
    xAxisArea,
    yAxisArea,
  };
}

export function estimateChartHeight(
  hasTitle: boolean,
  legend: LegendPosition = 'bottom',
  explicitHeight?: number,
): number {
  if (explicitHeight !== undefined) return explicitHeight;
  const base = 240;
  const titleExtra = hasTitle ? TITLE_HEIGHT : 0;
  const legendExtra = legend === 'hidden' ? 0 : 36;
  return base + titleExtra + legendExtra;
}

export function estimateChartWidth(explicitWidth?: number, contentWidth = 500): number {
  return explicitWidth ?? contentWidth;
}
