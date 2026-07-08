/**
 * html-report.ts
 *
 * Generate an HTML report using the same pipeline as PDF.
 *
 * Run:
 *   pnpm example html-report
 *
 * Output:
 *   examples/html-report.html
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'html-report.html');

const report = Report.create({
  metadata: {
    title: 'HTML Sales Report',
    author: 'ReportForge',
  },
})
  .title('HTML Sales Report')
  .paragraph('This report was generated using the unified ReportForge rendering pipeline.')
  .divider()
  .section('Highlights', (section) => {
    section.summaryCard({ label: 'Revenue', value: '$1.2M', trend: '+12%' });
    section.summaryCard({ label: 'Customers', value: '842', trend: '+5%' });
  });

await report.toHTML(outputPath);

console.log(`✔ HTML written to: ${outputPath}`);
