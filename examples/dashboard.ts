/**
 * dashboard.ts
 *
 * KPI dashboard layout using Stack, Badge, and StatusPill components.
 *
 * Run:
 *   pnpm example dashboard
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'dashboard.pdf');

const report = Report.create({
  metadata: { title: 'Operations Dashboard', author: 'ReportForge' },
})
  .add(Components.Title({ text: 'Operations Dashboard' }))
  .add(
    Components.Stack({
      children: [
        Components.Row({
          children: [
            Components.Badge({ text: 'Live', variant: 'success' }),
            Components.StatusPill({ text: 'All systems operational', status: 'active' }),
          ],
        }),
        Components.Spacer({ size: 16 }),
        Components.MetricCard({ label: 'Uptime', value: '99.97%', unit: '30d' }),
        Components.MetricCard({ label: 'Incidents', value: '2', change: '-50%' }),
        Components.AlertBox({
          severity: 'warning',
          title: 'Maintenance',
          message: 'Scheduled database maintenance on Sunday 02:00 UTC.',
        }),
      ],
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
