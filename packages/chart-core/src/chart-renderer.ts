import { applyAnimationHooks, createAnimationContext } from './animation.js';
import { buildNormalizedData, parseChartProps, validateChartProps } from './data.js';
import { computeChartLayout, estimateChartHeight, estimateChartWidth } from './layout.js';
import { renderAreaChart, renderLineChart, renderScatterChart } from './charts/cartesian.js';
import { renderBarChart, renderHorizontalBarChart } from './charts/bar.js';
import { renderDoughnutChart, renderPieChart, renderPlaceholderChart } from './charts/radial.js';
import { DEFAULT_CHART_THEME } from './theme.js';
import type {
  ChartBuildConfig,
  ChartLayoutPayload,
  ChartPropsInput,
  ChartTheme,
  SceneGraph,
} from './types.js';

/**
 * Generates renderer-independent scene graphs from chart configuration.
 * Charts never render directly to PDF or any target surface.
 */
export class ChartRenderer {
  private readonly _cache = new Map<string, SceneGraph>();

  render(config: ChartBuildConfig): SceneGraph {
    const cacheKey = JSON.stringify({
      type: config.type,
      width: config.width,
      height: config.height,
      title: config.title,
      legend: config.legend,
      data: config.data,
    });

    const cached = this._cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const layout = computeChartLayout(config);
    const animationContext = createAnimationContext();
    applyAnimationHooks(animationContext);

    let scene: SceneGraph;
    switch (config.type) {
      case 'bar':
        scene = renderBarChart(config, layout);
        break;
      case 'horizontal-bar':
        scene = renderHorizontalBarChart(config, layout);
        break;
      case 'line':
        scene = renderLineChart(config, layout);
        break;
      case 'area':
        scene = renderAreaChart(config, layout);
        break;
      case 'scatter':
        scene = renderScatterChart(config, layout);
        break;
      case 'pie':
        scene = renderPieChart(config, layout);
        break;
      case 'doughnut':
        scene = renderDoughnutChart(config, layout);
        break;
      case 'heatmap':
        scene = renderPlaceholderChart(config, 'Heatmap');
        break;
      case 'treemap':
        scene = renderPlaceholderChart(config, 'Treemap');
        break;
      case 'radar':
        scene = renderPlaceholderChart(config, 'Radar');
        break;
      case 'gauge':
        scene = renderPlaceholderChart(config, 'Gauge');
        break;
      default:
        scene = renderPlaceholderChart(config, config.type);
    }

    this._cache.set(cacheKey, scene);
    return scene;
  }

  clearCache(): void {
    this._cache.clear();
  }
}

export function buildChartLayoutPayload(
  props: Readonly<Record<string, unknown>>,
  contentWidth: number,
  theme: ChartTheme = DEFAULT_CHART_THEME,
): ChartLayoutPayload {
  const parsed = parseChartProps(
    props,
    estimateChartWidth(typeof props['width'] === 'number' ? props['width'] : undefined, contentWidth),
    estimateChartHeight(typeof props['title'] === 'string', props['legend'] as ChartPropsInput['legend'], typeof props['height'] === 'number' ? props['height'] : undefined),
  );

  const config: ChartBuildConfig = {
    type: parsed.type,
    width: parsed.width ?? contentWidth,
    height: parsed.height ?? estimateChartHeight(parsed.title !== undefined, parsed.legend),
    data: buildNormalizedData(parsed),
    theme,
    ...(parsed.title !== undefined ? { title: parsed.title } : {}),
    ...(parsed.legend !== undefined ? { legend: parsed.legend } : {}),
    ...(parsed.xAxis !== undefined ? { xAxis: parsed.xAxis } : {}),
    ...(parsed.yAxis !== undefined ? { yAxis: parsed.yAxis } : {}),
    ...(parsed.innerRadius !== undefined ? { innerRadius: parsed.innerRadius } : {}),
  };

  const renderer = new ChartRenderer();
  const sceneGraph = renderer.render(config);

  return {
    sceneGraph,
    width: config.width,
    height: config.height,
  };
}

export { validateChartProps, parseChartProps, buildNormalizedData, computeChartLayout, estimateChartHeight };

export const defaultChartRenderer = new ChartRenderer();
