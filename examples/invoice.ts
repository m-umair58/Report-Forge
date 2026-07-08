/**
 * invoice.ts
 *
 * Generate a professional invoice using the Templates API.
 *
 * Run:
 *   pnpm example invoice
 *
 * Output:
 *   examples/invoice.pdf
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Templates } from '@reportforge/templates';
import { CorporateTheme } from '@reportforge/themes';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'invoice.pdf');

const report = Templates.Invoice.create(
  {
    invoiceNumber: 'INV-2026-0042',
    billTo: 'Northwind Traders · accounts@northwind.example',
    invoiceDate: 'July 1, 2026',
    dueDate: 'July 31, 2026',
    items: [
      { description: 'Consulting services — Q2 platform migration', quantity: 40, unitPrice: 150, total: 6000 },
      { description: 'Platform support retainer', quantity: 1, unitPrice: 6400, total: 6400 },
    ],
    subtotal: 12400,
    tax: 1054,
    total: 13454,
    currency: 'USD',
    terms: ['Payment due within 30 days.', 'Late payments subject to 1.5% monthly interest.'],
    branding: {
      companyName: 'ACME CORP',
      address: '123 Business Street · San Francisco, CA 94105',
      footerText: 'Payment terms: Net 30 · Thank you for your business.',
    },
  },
  {
    showLogo: false,
    showFooter: true,
    currency: 'USD',
    theme: CorporateTheme,
  },
);

await report.toPDF(outputPath);

console.log(`✔ PDF written to: ${outputPath}`);
