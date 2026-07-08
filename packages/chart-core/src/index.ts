/**
 * @reportforge/chart-core
 *
 * Renderer-independent chart engine for ReportForge.
 */

export {
  ChartRenderer,
  buildChartLayoutPayload,
  defaultChartRenderer,
  validateChartProps,
  parseChartProps,
  buildNormalizedData,
  computeChartLayout,
  estimateChartHeight,
} from './chart-renderer.js';

export {
  mapChartData,
  buildAccessibilityFromData,
} from './data.js';

export {
  createLinearScale,
  createBandScale,
  createOrdinalScale,
  createTimeScale,
  createLogScale,
  extent,
  defaultNumberFormat,
  scaleKindName,
} from './scale.js';

export type { LinearScale, BandScale, OrdinalScale, TimeScale, LogScale, Scale } from './scale.js';

export { renderLinearAxis, renderBandAxis, renderBandAxisLeft, formatAxisTick } from './axis.js';
export { createTitleText, createTickLabel, estimateTextWidth, measureYAxisWidth } from './text-nodes.js';
export { layoutLegend, legendMargin } from './legend.js';
export {
  DEFAULT_CHART_THEME,
  DEFAULT_CHART_COLORS,
  createChartTheme,
  chartThemeFromReportTheme,
  seriesColor,
} from './theme.js';

export { createAnimationContext, applyAnimationHooks, DEFAULT_ANIMATION_HOOKS } from './animation.js';

export type {
  ChartKind,
  LegendPosition,
  ScaleKind,
  DataPoint,
  DataSeries,
  ChartDataInput,
  ChartRowData,
  NormalizedChartData,
  ChartTheme,
  AxisConfig,
  ChartBuildConfig,
  ChartLayout,
  PlotArea,
  ChartAccessibilityMetadata,
  ChartValidationIssue,
  ChartValidationResult,
  ChartAnimationHooks,
  SceneNode,
  SceneRectNode,
  SceneLineNode,
  ScenePathNode,
  SceneTextNode,
  SceneCircleNode,
  SceneGroupNode,
  SceneGraph,
  ChartLayoutPayload,
  ChartPropsInput,
  TooltipPlaceholder,
} from './types.js';

export { TOOLTIP_PLACEHOLDER } from './types.js';

export const PACKAGE_NAME = '@reportforge/chart-core' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}
