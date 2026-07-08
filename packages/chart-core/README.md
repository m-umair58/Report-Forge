# @reportforge/chart-core

Renderer-independent chart engine for ReportForge.

## Features

- **Scene graph** output — no direct PDF/canvas rendering
- **Scales**: linear, band, ordinal (+ time/log placeholders)
- **Axes**: ticks, labels, titles, grid lines, formatting
- **Legend**: top, bottom, left, right, hidden
- **Charts**: bar, horizontal bar, line, area, pie, doughnut, scatter
- **Accessibility metadata** on every scene graph
- **Caching** in `ChartRenderer`

## Usage

```typescript
import {
  ChartRenderer,
  mapChartData,
  DEFAULT_CHART_THEME,
} from '@reportforge/chart-core';

const data = mapChartData(
  [{ month: 'Jan', revenue: 1200 }],
  'month',
  'revenue',
);

const scene = new ChartRenderer().render({
  type: 'bar',
  title: 'Revenue',
  width: 400,
  height: 240,
  data,
  theme: DEFAULT_CHART_THEME,
});
```

See [Chart & Visualization Guide](../../docs/guides/charts.md) for the full pipeline.
