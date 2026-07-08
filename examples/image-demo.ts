/**
 * image-demo.ts
 *
 * Demonstrates PNG image embedding with aspect-ratio preservation.
 *
 * Run:
 *   pnpm example image-demo
 *
 * Output:
 *   examples/image-demo.pdf
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report } from '@reportforge/core';

const dir = fileURLToPath(new URL('.', import.meta.url));
const outputPath = join(dir, 'image-demo.pdf');
const logoPath = join(dir, 'assets', 'logo.png');

const report = Report.create({
  metadata: {
    title: 'Image Demo',
    author: 'ReportForge',
    subject: 'PNG image embedding',
  },
})
  .title('Image Rendering Demo')
  .paragraph('The logo below is embedded from a PNG file with aspect ratio preserved.')
  .image({ src: logoPath, alt: 'ReportForge Logo', width: 120, height: 120 })
  .divider()
  .paragraph('Missing images render a graceful placeholder instead of crashing.');

await report.toPDF(outputPath);

console.log(`✔ PDF written to: ${outputPath}`);
