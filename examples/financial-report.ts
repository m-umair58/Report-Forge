/**
 * financial-report.ts
 *
 * Financial summary report using the Templates API.
 *
 * Run:
 *   pnpm example financial-report
 *
 * Output:
 *   examples/financial-report.pdf
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Templates } from '@reportforge/templates';
import { FinancialTheme } from '@reportforge/themes';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'financial-report.pdf');

const report = Templates.FinancialReport.create(
  {
    period: 'FY 2026 H1',
    summary: 'Operating margin improved to 18.4% while maintaining steady cash flow.',
    rows: [
      { category: 'Revenue', amount: '$8.4M' },
      { category: 'COGS', amount: '$3.1M' },
      { category: 'Operating Expenses', amount: '$2.8M' },
      { category: 'Net Income', amount: '$1.54M' },
    ],
    totals: [
      { label: 'EBITDA', value: '$2.1M' },
      { label: 'Free Cash Flow', value: '$1.2M' },
    ],
    branding: {
      companyName: 'Acme Financial Services',
      address: '500 Market Street · San Francisco, CA',
      footerText: 'Confidential — Internal use only',
    },
  },
  { theme: FinancialTheme },
);

await report.toPDF(outputPath);

console.log(`✔ PDF written to: ${outputPath}`);
