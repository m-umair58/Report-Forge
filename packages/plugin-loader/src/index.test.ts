import { describe, expect, it } from 'vitest';

import { definePlugin } from '@reportforge/plugin-sdk';

import { resolvePluginDependencies } from './dependencies.js';
import { createReportForge } from './app.js';
import { BrandThemePlugin } from '@reportforge/example-plugin-theme';
import { HighlightBoxPlugin } from '@reportforge/example-plugin-component';
import { MeetingNotesTemplatePlugin } from '@reportforge/example-plugin-template';
import { SparklineChartPlugin } from '@reportforge/example-plugin-chart';

describe('PluginManager', () => {
  it('loads plugins and exposes extensions', async () => {
    const app = createReportForge();
    await app.use(BrandThemePlugin, { primaryColor: '#111827' });

    expect(app.plugins.extensions.themes.has('brand')).toBe(true);
  });

  it('rejects duplicate plugin ids', async () => {
    const app = createReportForge();
    await app.use(BrandThemePlugin);
    await expect(app.use(BrandThemePlugin)).rejects.toThrow(/already registered/i);
  });

  it('supports plugin configuration', async () => {
    const app = createReportForge();
    await app.use(BrandThemePlugin, { primaryColor: '#047857' });
    const entry = app.plugins.registry.get('example-plugin-theme');
    expect(entry?.config).toEqual({ primaryColor: '#047857' });
  });
});

describe('createReportWithPlugins', () => {
  it('registers custom component types on the report registry', async () => {
    const app = createReportForge();
    await app.use(HighlightBoxPlugin);

    const report = app.createReport();
    expect(report.getComponentRegistry().has('highlight-box')).toBe(true);
  });

  it('registers templates and charts', async () => {
    const app = createReportForge();
    await app.use(MeetingNotesTemplatePlugin);
    await app.use(SparklineChartPlugin);

    expect(app.plugins.extensions.templates.has('meeting-notes')).toBe(true);
    expect(app.plugins.extensions.charts.has('sparkline')).toBe(true);
  });
});

describe('hook execution', () => {
  it('runs registered hooks during validation', async () => {
    const app = createReportForge();
    const phases: string[] = [];

    await app.use(definePlugin({
      id: 'hook-logger',
      name: 'Hook Logger',
      version: '1.0.0',
      description: 'Logs hook phases',
      register(context) {
        context.hooks.on('beforeReportValidation', () => {
          phases.push('beforeReportValidation');
        });
        context.hooks.on('afterReportValidation', () => {
          phases.push('afterReportValidation');
        });
      },
    }));

    const report = app.createReport().title('Hook Test');
    await app.validateReport(report);

    expect(phases).toEqual(['beforeReportValidation', 'afterReportValidation']);
  });
});

describe('dependency validation', () => {
  it('detects missing peer dependencies', () => {
    const plugin = definePlugin({
      id: 'needs-peer',
      name: 'Needs Peer',
      version: '1.0.0',
      description: 'Requires a peer package',
      peerDependencies: {
        '@reportforge/missing-package': '^1.0.0',
      },
      register() {},
    });

    const result = resolvePluginDependencies(plugin, [], {});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/peer dependency/i);
  });

  it('detects circular plugin dependencies', () => {
    const pluginA = definePlugin({
      id: 'plugin-a',
      name: 'Plugin A',
      version: '1.0.0',
      description: 'A',
      peerDependencies: { '@reportforge/plugins': 'plugin-b' },
      register() {},
    });
    const pluginB = definePlugin({
      id: 'plugin-b',
      name: 'Plugin B',
      version: '1.0.0',
      description: 'B',
      peerDependencies: { '@reportforge/plugins': 'plugin-a' },
      register() {},
    });

    const result = resolvePluginDependencies(pluginA, [pluginB], {});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Circular/i);
  });
});

describe('error isolation', () => {
  it('captures lifecycle failures without crashing the manager', async () => {
    const app = createReportForge();

    await app.use(definePlugin({
      id: 'broken-plugin',
      name: 'Broken Plugin',
      version: '1.0.0',
      description: 'Fails during register',
      register() {
        throw new Error('register failed');
      },
    }));

    expect(app.plugins.registry.has('broken-plugin')).toBe(true);
    expect(app.plugins.diagnostics.some((entry) => entry.code === 'PLUGIN_LIFECYCLE_ERROR')).toBe(true);
  });
});
