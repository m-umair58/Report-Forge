/**
 * executive-summary.ts
 *
 * Demonstrates the component library with composed business components.
 *
 * Run:
 *   pnpm example executive-summary
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'executive-summary.pdf');

const report = Report.create({
  metadata: { title: 'Executive Summary', author: 'ReportForge' },
})
  .add(Components.Title({ text: 'Executive Summary' }))
  .add(Components.Paragraph({ text: 'Q2 performance exceeded expectations across all regions.' }))
  .add(
    Components.Section({
      label: 'Key Metrics',
      children: [
        Components.SummaryCard({ title: 'Revenue', value: '$3.8M', trend: '+12%' }),
        Components.MetricCard({ label: 'Active Users', value: '48,200', change: '+6%' }),
        Components.KPI({ name: 'NPS', value: '72', target: '70', status: 'on-track' }),
        Components.Divider(),
        Components.InfoBox({
          title: 'Note',
          message: 'Figures are preliminary and subject to audit.',
        }),
      ],
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
