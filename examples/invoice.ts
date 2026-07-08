/**
 * invoice.ts
 *
 * Professional invoice layout with structured sections and metadata.
 *
 * Run:
 *   pnpm example invoice
 *
 * Output:
 *   examples/invoice.pdf
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'invoice.pdf');

const report = Report.create({
  metadata: {
    title: 'Invoice INV-2026-0042',
    author: 'Acme Corp Billing',
    subject: 'Invoice for professional services',
    keywords: ['invoice', 'billing'],
  },
})
  .header((h) => {
    h.title('ACME CORP');
    h.paragraph('123 Business Street · San Francisco, CA 94105');
  })
  .title('Invoice INV-2026-0042')
  .paragraph('Bill To: Northwind Traders · accounts@northwind.example')
  .paragraph('Invoice Date: July 1, 2026 · Due Date: July 31, 2026')
  .divider()
  .section((s) => {
    s.subtitle('Services Rendered');
    s.paragraph('Consulting services — Q2 2026 platform migration project.');
    s.summaryCard({ label: 'Subtotal', value: '$12,400.00' });
    s.summaryCard({ label: 'Tax (8.5%)', value: '$1,054.00' });
    s.summaryCard({ label: 'Total Due', value: '$13,454.00' });
  })
  .divider()
  .footer((f) => f.paragraph('Payment terms: Net 30 · Thank you for your business.'));

await report.toPDF(outputPath);

console.log(`✔ PDF written to: ${outputPath}`);
