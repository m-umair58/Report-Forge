import { definePlugin } from '@reportforge/plugin-sdk';
import { createTheme } from '@reportforge/theme';

export interface BrandThemeConfig {
  readonly primaryColor?: string;
  readonly accentColor?: string;
}

export const BrandThemePlugin = definePlugin<BrandThemeConfig>({
  id: 'example-plugin-theme',
  name: 'Brand Theme Plugin',
  version: '1.0.0',
  description: 'Registers a customizable brand theme for ReportForge reports.',
  author: 'ReportForge',
  license: 'MIT',
  keywords: ['theme', 'brand'],
  minimumReportForgeVersion: '0.0.0',
  register(app) {
    app.themes.register(
      createTheme('brand', {
        colors: {
          primary: app.config.primaryColor ?? '#2563eb',
          accent: app.config.accentColor ?? '#1d4ed8',
        },
      }),
    );
  },
});

export default BrandThemePlugin;
