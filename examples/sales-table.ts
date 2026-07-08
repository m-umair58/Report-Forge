/**
 * sales-table.ts
 *
 * Single-page sales table with fixed and auto column widths.
 *
 * Run: pnpm example sales-table
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'sales-table.pdf');

const report = Report.create({
  metadata: { title: 'Sales Table', author: 'ReportForge' },
})
  .title('Q2 Sales by Region')
  .add(
    Components.Table({
      columns: [
        { key: 'region', title: 'Region', width: '30%' },
        { key: 'sales', title: 'Sales', align: 'right', width: 'auto' },
        { key: 'growth', title: 'Growth', align: 'right', width: 80 },
      ],
      rows: [
        { region: 'North America', sales: '$1.2M', growth: '+14%' },
        { region: 'Europe', sales: '$980K', growth: '+9%' },
        { region: 'Asia Pacific', sales: '$1.5M', growth: '+22%' },
        { region: 'Latin America', sales: '$410K', growth: '+6%' },
      ],
      tableStyle: {
        alternateRowBackground: '#f7f9fc',
        headerBackground: '#e8eef5',
      },
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
