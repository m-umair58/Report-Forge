/**
 * comparison.ts
 *
 * Generate the same report as PDF, HTML, and SVG for format comparison.
 *
 * Run:
 *   pnpm example comparison
 *
 * Output:
 *   examples/comparison.pdf
 *   examples/comparison.html
 *   examples/comparison.svg
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report } from '@reportforge/core';

const basePath = join(fileURLToPath(import.meta.url), '..');

const report = Report.create({
  metadata: {
    title: 'Format Comparison',
    author: 'ReportForge',
    subject: 'Renderer SDK comparison',
  },
})
  .title('Format Comparison')
  .paragraph('This document is rendered through the same pipeline to PDF, HTML, and SVG.')
  .divider()
  .section('Summary', (section) => {
    section.paragraph('All three formats consume the same display list and render operations.');
    section.summaryCard({ label: 'Pipeline', value: 'Unified' });
    section.summaryCard({ label: 'Formats', value: 'PDF · HTML · SVG' });
  });

await report.toPDF(join(basePath, 'comparison.pdf'));
await report.toHTML(join(basePath, 'comparison.html'));
await report.toSVG(join(basePath, 'comparison.svg'));

console.log('✔ Comparison outputs written:');
console.log(`  PDF:  ${join(basePath, 'comparison.pdf')}`);
console.log(`  HTML: ${join(basePath, 'comparison.html')}`);
console.log(`  SVG:  ${join(basePath, 'comparison.svg')}`);
