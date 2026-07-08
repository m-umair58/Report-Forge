/**
 * company-profile.ts
 *
 * Company profile report with typography, logo, and structured sections.
 *
 * Run:
 *   pnpm example company-profile
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const dir = fileURLToPath(new URL('.', import.meta.url));
const outputPath = join(dir, 'company-profile.pdf');
const logoPath = join(dir, 'assets', 'logo.png');

const report = Report.create({
  metadata: { title: 'Acme Corp — Company Profile', author: 'ReportForge' },
})
  .header((h) => {
    h.title('Acme Corp');
    h.paragraph('Innovation since 2010');
  })
  .add(Components.Logo({ src: logoPath, alt: 'Acme Logo', width: 80, height: 80 }))
  .add(Components.Heading({ text: 'About Us', level: 2 }))
  .add(
    Components.Paragraph({
      text:
        'Acme Corp builds reporting tools that help teams communicate insights ' +
        'with clarity and confidence.',
    }),
  )
  .add(Components.Caption({ text: 'Last updated: July 2026' }))
  .add(Components.Divider())
  .add(
    Components.Container({
      children: [
        Components.Label({ text: 'Headquarters' }),
        Components.Paragraph({ text: 'San Francisco, California' }),
        Components.Label({ text: 'Employees' }),
        Components.Paragraph({ text: '240+ globally' }),
      ],
    }),
  );

await report.toPDF(outputPath);
console.log(`✔ PDF written to: ${outputPath}`);
