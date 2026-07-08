/**
 * corporate-theme.ts
 *
 * Demonstrates the Corporate built-in theme.
 *
 * Run: pnpm example corporate-theme
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';
import { CorporateTheme } from '@reportforge/themes';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'corporate-theme.pdf');

const report = Report.create({
  metadata: { title: 'Corporate Theme Demo', author: 'ReportForge' },
  theme: CorporateTheme,
})
  .title('Monthly Sales')
  .paragraph('Revenue performance for Q2 2026.')
  .add(Components.SummaryCard({ title: 'Revenue', value: '$1.2M', trend: '+12%' }))
  .add(Components.SummaryCard({ title: 'Customers', value: '4,820', trend: '+6%' }));

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
