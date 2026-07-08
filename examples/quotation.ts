/**
 * quotation.ts
 *
 * Sales quotation generated from the Templates API.
 *
 * Run:
 *   pnpm example quotation
 *
 * Output:
 *   examples/quotation.pdf
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Templates } from '@reportforge/templates';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'quotation.pdf');

const report = Templates.Quotation.create(
  {
    quoteNumber: 'QT-2026-118',
    client: 'Contoso Ltd.',
    validUntil: 'August 15, 2026',
    items: [
      { description: 'Enterprise license (annual)', quantity: 1, unitPrice: 24000, total: 24000 },
      { description: 'Implementation services', quantity: 80, unitPrice: 175, total: 14000 },
    ],
    total: 38000,
    branding: {
      companyName: 'Acme Corp',
      address: '123 Business Street · San Francisco, CA',
      email: 'sales@acme.example',
    },
  },
  { currency: 'USD' },
);

await report.toPDF(outputPath);

console.log(`✔ PDF written to: ${outputPath}`);
