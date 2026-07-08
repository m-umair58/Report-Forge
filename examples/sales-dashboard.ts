/**
 * sales-dashboard.ts
 *
 * Sales dashboard with bar and line charts.
 *
 * Run: pnpm sales-dashboard
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Charts } from '@reportforge/charts';
import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'sales-dashboard.pdf');

const revenue = [
  { month: 'Jan', amount: 82000 },
  { month: 'Feb', amount: 91000 },
  { month: 'Mar', amount: 88000 },
  { month: 'Apr', amount: 102000 },
  { month: 'May', amount: 115000 },
  { month: 'Jun', amount: 121000 },
];

const report = Report.create({
  metadata: { title: 'Sales Dashboard', author: 'ReportForge' },
})
  .title('Sales Dashboard')
  .add(
    Charts.Bar({
      title: 'Monthly Revenue',
      data: revenue,
      x: 'month',
      y: 'amount',
      legend: 'hidden',
    }),
  )
  .add(
    Charts.Line({
      title: 'Revenue Trend',
      data: revenue,
      x: 'month',
      y: 'amount',
      legend: 'hidden',
    }),
  )
  .add(
    Components.SummaryCard({
      title: 'Q2 Total',
      value: '$338K',
      trend: '+14%',
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
