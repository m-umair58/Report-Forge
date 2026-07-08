/**
 * financial-theme.ts
 *
 * Demonstrates the Financial built-in theme.
 *
 * Run: pnpm example financial-theme
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';
import { FinancialTheme } from '@reportforge/themes';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'financial-theme.pdf');

const report = Report.create({
  metadata: { title: 'Financial Theme Demo', author: 'ReportForge' },
  theme: FinancialTheme,
})
  .title('Portfolio Summary')
  .paragraph('Quarterly performance across managed accounts.')
  .add(Components.SummaryCard({ title: 'AUM', value: '$842M' }))
  .add(Components.SummaryCard({ title: 'Return', value: '+8.4%' }));

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
