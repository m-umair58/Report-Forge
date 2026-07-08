# Chart & Visualization Guide

ReportForge charts are **renderer-independent**. The chart engine produces a scene graph that the display-list converts into draw commands — charts never render directly to PDF.

## Quick start

```typescript
import { Charts } from '@reportforge/charts';
import { Report } from '@reportforge/core';

const revenue = [
  { month: 'Jan', amount: 1200 },
  { month: 'Feb', amount: 1500 },
];

const report = Report.create()
  .add(
    Charts.Bar({
      title: 'Monthly Revenue',
      data: revenue,
      x: 'month',
      y: 'amount',
    }),
  );

await report.toPDF('report.pdf');
```

## Architecture

```
Charts.Bar({ data, x, y })
       ↓
Report DOM (chart node)
       ↓
Layout Engine (height estimation)
       ↓
ChartLayout + ChartRenderer
       ↓
Scene Graph
       ↓
Display List (draw commands)
       ↓
PDF Renderer
```

Packages:

| Package | Role |
|---------|------|
| `@reportforge/chart-core` | Scales, axes, legend, scene graph, chart renderers |
| `@reportforge/charts` | Builder factories (`Charts.Bar`, `Charts.Line`, …) |

## Supported charts

| Chart | Factory |
|-------|---------|
| Bar | `Charts.Bar()` |
| Horizontal bar | `Charts.HorizontalBar()` |
| Line | `Charts.Line()` |
| Area | `Charts.Area()` |
| Pie | `Charts.Pie()` |
| Doughnut | `Charts.Doughnut()` |
| Scatter | `Charts.Scatter()` |
| Heatmap, Treemap, Radar, Gauge | Placeholder stubs |

## Data mapping

Row-oriented data with field mapping:

```typescript
Charts.Bar({
  data: [{ month: 'Jan', revenue: 1200 }],
  x: 'month',
  y: 'revenue',
});
```

Legacy labels/datasets format:

```typescript
Charts.Line({
  data: {
    labels: ['Jan', 'Feb'],
    datasets: [{ label: 'Revenue', values: [1200, 1500] }],
  },
});
```

Multi-series via multiple `y` fields or a `series` grouping field.

## Scales

- **Linear** — numeric axes
- **Band** — categorical bar positions
- **Ordinal** — color/category mapping
- **Time / Log** — placeholders for future milestones

## Styling

Charts inherit colors and typography from the report theme via `chartThemeFromReportTheme()`. Override with report-level themes:

```typescript
Report.create({ theme: CorporateTheme })
  .add(Charts.Bar({ ... }));
```

## Accessibility

Each scene graph includes metadata describing series, values, and labels for future accessible renderers.

## Custom chart types

Extend `@reportforge/chart-core` by:

1. Adding a chart kind to `ChartKind`
2. Implementing a renderer function returning a `SceneGraph`
3. Registering it in `ChartRenderer.render()`

## Examples

```bash
cd examples
pnpm sales-dashboard
pnpm healthcare-dashboard
pnpm manufacturing-report
pnpm financial-report-charts
```
