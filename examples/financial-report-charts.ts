/**
 * financial-report.ts
 *
 * Financial report with revenue bar chart and expense breakdown pie chart.
 *
 * Run: pnpm financial-report
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Charts } from '@reportforge/charts';
import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'financial-report-charts.pdf');

const quarterlyRevenue = [
  { quarter: 'Q1', revenue: 1_200_000 },
  { quarter: 'Q2', revenue: 1_450_000 },
  { quarter: 'Q3', revenue: 1_380_000 },
  { quarter: 'Q4', revenue: 1_620_000 },
];

const expenseBreakdown = [
  { category: 'Payroll', amount: 420000 },
  { category: 'Operations', amount: 180000 },
  { category: 'Marketing', amount: 95000 },
  { category: 'R&D', amount: 210000 },
];

const report = Report.create({
  metadata: { title: 'Financial Report', author: 'Finance Team' },
})
  .title('Annual Financial Overview')
  .add(
    Charts.Bar({
      title: 'Quarterly Revenue',
      data: quarterlyRevenue,
      x: 'quarter',
      y: 'revenue',
      legend: 'hidden',
    }),
  )
  .add(
    Charts.Pie({
      title: 'Expense Breakdown',
      data: expenseBreakdown,
      x: 'category',
      y: 'amount',
      legend: 'right',
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
