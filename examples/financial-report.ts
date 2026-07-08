/**
 * financial-report.ts
 *
 * Financial summary table with footer row and styled header.
 *
 * Run: pnpm example financial-report
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'financial-report.pdf');

const employees = [
  { name: 'Alice Chen', department: 'Engineering', salary: '$142,000' },
  { name: 'Bob Martinez', department: 'Sales', salary: '$118,500' },
  { name: 'Carol Nguyen', department: 'Marketing', salary: '$105,200' },
  { name: 'David Kim', department: 'Engineering', salary: '$156,800' },
  { name: 'Eva Patel', department: 'Operations', salary: '$97,400' },
];

const report = Report.create({
  metadata: { title: 'Financial Report', author: 'ReportForge' },
})
  .title('Employee Compensation Summary')
  .add(
    Components.Table({
      columns: [
        { key: 'name', title: 'Employee' },
        { key: 'department', title: 'Department' },
        { key: 'salary', title: 'Salary', align: 'right' },
      ],
      rows: employees,
      footerRows: [{ name: 'Total (5)', department: '—', salary: '$619,900' }],
      tableStyle: {
        headerFontWeight: 'bold',
        headerBackground: '#1a1a2e',
        headerColor: '#ffffff',
        footerBackground: '#eef2ff',
      },
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
