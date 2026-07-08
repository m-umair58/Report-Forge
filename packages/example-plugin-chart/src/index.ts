import { definePlugin } from '@reportforge/plugin-sdk';

export const SparklineChartPlugin = definePlugin({
  id: 'example-plugin-chart',
  name: 'Sparkline Chart Plugin',
  version: '1.0.0',
  description: 'Registers a sparkline chart type placeholder for future chart renderers.',
  author: 'ReportForge',
  license: 'MIT',
  keywords: ['chart', 'sparkline'],
  register(app) {
    app.charts.register({
      type: 'sparkline',
      label: 'Sparkline',
      description: 'Compact inline trend chart.',
    });

    app.renderCommands.register({
      type: 'sparkline',
      convert: () => [],
    });
  },
});

export default SparklineChartPlugin;
