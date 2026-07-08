/**
 * certificate.ts
 *
 * Achievement certificate using the Templates API.
 *
 * Run:
 *   pnpm example certificate
 *
 * Output:
 *   examples/certificate.pdf
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Templates } from '@reportforge/templates';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'certificate.pdf');

const report = Templates.Certificate.create(
  {
    recipientName: 'Alex Rivera',
    achievement: 'Advanced Web Development',
    date: 'June 30, 2026',
    issuer: 'Dr. Sarah Chen, Dean of Engineering',
    branding: {
      companyName: 'ReportForge Institute of Technology',
    },
  },
  { showHeader: false, showFooter: true },
);

await report.toPDF(outputPath);

console.log(`✔ PDF written to: ${outputPath}`);
