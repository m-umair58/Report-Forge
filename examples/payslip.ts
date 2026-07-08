/**
 * payslip.ts
 *
 * Employee payslip using the Templates API.
 *
 * Run:
 *   pnpm example payslip
 *
 * Output:
 *   examples/payslip.pdf
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Templates } from '@reportforge/templates';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'payslip.pdf');

const report = Templates.Payslip.create(
  {
    employeeName: 'Sam Taylor',
    employeeId: 'EMP-2044',
    payPeriod: 'June 1–30, 2026',
    grossPay: 8500,
    deductions: [
      { name: 'Federal Tax', amount: 1200 },
      { name: 'State Tax', amount: 420 },
      { name: 'Health Insurance', amount: 320 },
      { name: '401(k)', amount: 580 },
    ],
    netPay: 5980,
    branding: {
      companyName: 'Acme Corp',
      address: '123 Business Street · San Francisco, CA',
      footerText: 'This is not a tax document.',
    },
  },
  { currency: 'USD' },
);

await report.toPDF(outputPath);

console.log(`✔ PDF written to: ${outputPath}`);
