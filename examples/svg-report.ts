/**
 * svg-report.ts
 *
 * Generate an SVG report using the same pipeline as PDF.
 *
 * Run:
 *   pnpm example svg-report
 *
 * Output:
 *   examples/svg-report.svg
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'svg-report.svg');

const report = Report.create({
  metadata: {
    title: 'SVG Sales Report',
    author: 'ReportForge',
  },
})
  .title('SVG Sales Report')
  .paragraph('Vector output from the unified ReportForge renderer SDK.')
  .divider()
  .section('Metrics', (section) => {
    section.summaryCard({ label: 'Revenue', value: '$1.2M' });
    section.summaryCard({ label: 'Growth', value: '+12%' });
  });

await report.toSVG(outputPath);

console.log(`✔ SVG written to: ${outputPath}`);
