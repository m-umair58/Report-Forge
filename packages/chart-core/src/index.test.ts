import { describe, expect, it } from 'vitest';

import {
  ChartRenderer,
  createBandScale,
  createLinearScale,
  createOrdinalScale,
  defaultChartRenderer,
  layoutLegend,
  mapChartData,
  renderBandAxis,
  renderLinearAxis,
  validateChartProps,
  computeChartLayout,
  DEFAULT_CHART_THEME,
} from './index.js';

describe('mapChartData', () => {
  it('maps row data with x/y fields', () => {
    const data = mapChartData(
      [
        { month: 'Jan', revenue: 1200 },
        { month: 'Feb', revenue: 1500 },
      ],
      'month',
      'revenue',
    );

    expect(data.categories).toEqual(['Jan', 'Feb']);
    expect(data.series[0]?.points[0]?.y).toBe(1200);
  });

  it('maps legacy labels/datasets format', () => {
    const data = mapChartData({
      labels: ['A', 'B'],
      datasets: [{ label: 'Sales', values: [10, 20] }],
    });

    expect(data.series[0]?.name).toBe('Sales');
    expect(data.series[0]?.points[1]?.y).toBe(20);
  });
});

describe('scales', () => {
  it('linear scale maps domain to range', () => {
    const scale = createLinearScale([0, 100], [0, 200]);
    expect(scale.scale(50)).toBe(100);
    expect(scale.ticks(3)).toEqual([0, 50, 100]);
  });

  it('band scale assigns bandwidth per category', () => {
    const scale = createBandScale(['A', 'B'], [0, 100]);
    expect(scale.bandwidth).toBeGreaterThan(0);
    expect(scale.scale('B')).toBeGreaterThan(scale.scale('A'));
  });

  it('ordinal scale maps categories to colors', () => {
    const scale = createOrdinalScale(['A', 'B'], ['#111111', '#222222']);
    expect(scale.scale('B')).toBe('#222222');
  });
});

describe('axes and legend', () => {
  it('renders axis ticks and grid lines', () => {
    const axis = renderLinearAxis(
      'left',
      { x: 50, y: 20, width: 300, height: 180 },
      [0, 100],
      DEFAULT_CHART_THEME,
    );
    expect(axis.nodes.length).toBeGreaterThan(2);
    expect(axis.scale.scale(100)).toBe(20);
  });

  it('renders band axis labels', () => {
    const axis = renderBandAxis(
      { x: 50, y: 20, width: 300, height: 180 },
      ['Jan', 'Feb'],
      DEFAULT_CHART_THEME,
    );
    expect(axis.tickLabels).toEqual(['Jan', 'Feb']);
  });

  it('layouts legend entries', () => {
    const data = mapChartData([{ month: 'Jan', revenue: 1 }], 'month', 'revenue');
    const legend = layoutLegend('bottom', 400, 240, data, DEFAULT_CHART_THEME);
    expect(legend?.nodes.length).toBeGreaterThan(0);
  });
});

describe('ChartRenderer', () => {
  it('generates a bar chart scene graph', () => {
    const data = mapChartData(
      [
        { month: 'Jan', revenue: 1200 },
        { month: 'Feb', revenue: 1500 },
      ],
      'month',
      'revenue',
    );

    const scene = defaultChartRenderer.render({
      type: 'bar',
      title: 'Monthly Revenue',
      width: 400,
      height: 240,
      data,
      theme: DEFAULT_CHART_THEME,
      legend: 'hidden',
    });

    expect(scene.nodes.some((node) => node.kind === 'rect')).toBe(true);
    expect(scene.accessibility.series[0]?.values.length).toBe(2);
  });

  it('caches scene graphs', () => {
    const config = {
      type: 'line' as const,
      width: 300,
      height: 200,
      data: mapChartData([{ x: 'A', y: 1 }], 'x', 'y'),
      theme: DEFAULT_CHART_THEME,
    };
    const renderer = new ChartRenderer();
    expect(renderer.render(config)).toBe(renderer.render(config));
  });

  it('computes chart layout with title and plot area', () => {
    const layout = computeChartLayout({
      type: 'bar',
      title: 'Revenue',
      width: 400,
      height: 240,
      data: mapChartData([{ month: 'Jan', revenue: 1 }], 'month', 'revenue'),
      theme: DEFAULT_CHART_THEME,
    });
    expect(layout.plotArea.width).toBeGreaterThan(0);
    expect(layout.titleArea).toBeDefined();
  });
});

describe('validateChartProps', () => {
  it('accepts valid bar chart props', () => {
    const result = validateChartProps({
      type: 'bar',
      data: [{ month: 'Jan', revenue: 10 }],
      x: 'month',
      y: 'revenue',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects empty data', () => {
    const result = validateChartProps({
      type: 'bar',
      data: [],
      x: 'month',
      y: 'revenue',
    });
    expect(result.valid).toBe(false);
  });
});
