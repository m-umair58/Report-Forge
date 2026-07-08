/**
 * dark-theme.ts
 *
 * Demonstrates the Dark built-in theme.
 *
 * Run: pnpm example dark-theme
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';
import { DarkTheme } from '@reportforge/themes';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'dark-theme.pdf');

const report = Report.create({
  metadata: { title: 'Dark Theme Demo', author: 'ReportForge' },
  theme: DarkTheme,
})
  .title('Operations Dashboard')
  .paragraph('System status overview for the production environment.')
  .add(Components.MetricCard({ label: 'Uptime', value: '99.97%', change: '+0.02%' }))
  .add(Components.MetricCard({ label: 'Incidents', value: '2', change: '-50%' }));

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
