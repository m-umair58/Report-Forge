/**
 * inventory-table.ts
 *
 * Multi-page inventory table with repeated headers and alternating rows.
 *
 * Run: pnpm example inventory-table
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const outputPath = join(fileURLToPath(import.meta.url), '..', 'inventory-table.pdf');

const rows = Array.from({ length: 55 }, (_, index) => ({
  sku: `SKU-${(1000 + index).toString()}`,
  product: `Product ${(index + 1).toString()}`,
  stock: String(500 - index * 7),
  warehouse: index % 3 === 0 ? 'East' : index % 3 === 1 ? 'West' : 'Central',
}));

const report = Report.create({
  metadata: { title: 'Inventory Report', author: 'ReportForge' },
})
  .title('Warehouse Inventory')
  .paragraph('Live stock levels across all warehouses. Headers repeat on each page.')
  .add(
    Components.Table({
      columns: [
        { key: 'sku', title: 'SKU', width: 90 },
        { key: 'product', title: 'Product', width: 'auto' },
        { key: 'stock', title: 'In Stock', align: 'right', width: 70 },
        { key: 'warehouse', title: 'Warehouse', width: 80 },
      ],
      rows,
      repeatHeader: true,
      tableStyle: {
        alternateRowBackground: '#fafafa',
        cellPadding: 8,
      },
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
