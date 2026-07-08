/**
 * hello-world.ts
 *
 * The first working ReportForge vertical slice.
 * Generates a PDF from Title, Paragraph, and Divider components.
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

const report = Report.create()
  .title('Hello ReportForge')
  .paragraph('This is our first PDF.')
  .divider();

await report.toPDF(outputPath);

console.log(`✔ PDF written to: ${outputPath}`);
