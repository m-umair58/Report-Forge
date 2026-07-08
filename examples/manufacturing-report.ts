/**
 * manufacturing-report.ts
 *
 * Manufacturing KPI report with horizontal bar and scatter charts.
 *
 * Run: pnpm manufacturing-report
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Charts } from '@reportforge/charts';
import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'manufacturing-report.pdf');

const defectRates = [
  { line: 'Line A', defects: 2.1 },
  { line: 'Line B', defects: 1.4 },
  { line: 'Line C', defects: 3.2 },
  { line: 'Line D', defects: 1.8 },
];

const throughput = [
  { hour: 1, units: 420 },
  { hour: 2, units: 455 },
  { hour: 3, units: 470 },
  { hour: 4, units: 448 },
  { hour: 5, units: 490 },
];

const report = Report.create({
  metadata: { title: 'Manufacturing Report', author: 'Plant Ops' },
})
  .title('Production Quality Report')
  .add(
    Charts.HorizontalBar({
      title: 'Defect Rate by Line (%)',
      data: defectRates,
      x: 'line',
      y: 'defects',
      legend: 'hidden',
    }),
  )
  .add(
    Charts.Scatter({
      title: 'Hourly Throughput',
      data: throughput,
      x: 'hour',
      y: 'units',
      legend: 'hidden',
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
