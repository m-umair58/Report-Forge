/**
 * healthcare-dashboard.ts
 *
 * Healthcare metrics dashboard with area and doughnut charts.
 *
 * Run: pnpm healthcare-dashboard
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Charts } from '@reportforge/charts';
import { Report } from '@reportforge/core';
import { HealthcareTheme } from '@reportforge/themes';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'healthcare-dashboard.pdf');

const admissions = [
  { week: 'W1', patients: 120 },
  { week: 'W2', patients: 135 },
  { week: 'W3', patients: 128 },
  { week: 'W4', patients: 142 },
];

const departmentMix = [
  { department: 'Emergency', share: 32 },
  { department: 'Surgery', share: 24 },
  { department: 'Pediatrics', share: 18 },
  { department: 'Oncology', share: 26 },
];

const report = Report.create({
  metadata: { title: 'Healthcare Dashboard', author: 'Clinical Ops' },
  theme: HealthcareTheme,
})
  .title('Patient Volume Dashboard')
  .add(
    Charts.Area({
      title: 'Weekly Admissions',
      data: admissions,
      x: 'week',
      y: 'patients',
      legend: 'hidden',
    }),
  )
  .add(
    Charts.Doughnut({
      title: 'Department Mix',
      data: departmentMix,
      x: 'department',
      y: 'share',
      legend: 'bottom',
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
