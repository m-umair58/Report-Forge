/**
 * healthcare-theme.ts
 *
 * Demonstrates the Healthcare built-in theme.
 *
 * Run: pnpm example healthcare-theme
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';
import { HealthcareTheme } from '@reportforge/themes';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'healthcare-theme.pdf');

const report = Report.create({
  metadata: { title: 'Healthcare Theme Demo', author: 'ReportForge' },
  theme: HealthcareTheme,
})
  .title('Patient Summary')
  .paragraph('Monthly care metrics and appointment overview.')
  .add(Components.SummaryCard({ title: 'Appointments', value: '1,248' }))
  .add(Components.SummaryCard({ title: 'Satisfaction', value: '94%' }));

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
