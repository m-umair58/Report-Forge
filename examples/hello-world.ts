/**
 * hello-world.ts
 *
 * A simple ReportForge PDF demonstrating title, paragraph, divider, and metadata.
 *
 * Run:
 *   pnpm example hello-world
 *
 * Output:
 *   examples/hello.pdf
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'hello.pdf');

const report = Report.create({
  metadata: {
    title: 'Hello ReportForge',
    author: 'ReportForge Examples',
    subject: 'Getting started',
    keywords: ['hello', 'demo'],
  },
})
  .title('Hello ReportForge')
  .paragraph('This is our first production-quality PDF.')
  .divider();

await report.toPDF(outputPath);

console.log(`✔ PDF written to: ${outputPath}`);
