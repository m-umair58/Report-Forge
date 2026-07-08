import { describe, expect, it } from 'vitest';

import { Components } from '@reportforge/components';
import { Report } from './report.js';

describe('ReportBuilder.add()', () => {
  it('adds component descriptors to the report tree', () => {
    const report = Report.create()
      .add(Components.Title({ text: 'Monthly Sales' }))
      .add(Components.Paragraph({ text: 'Summary...' }))
      .add(Components.Divider())
      .add(Components.SummaryCard({ title: 'Revenue', value: '$1.2M' }));

    const json = report.toJSON();
    const types = json.root.children.map((c) => c.type);

    expect(types).toEqual(['title', 'paragraph', 'divider', 'summary-card']);
    expect(json.root.children[3]?.props['label']).toBe('Revenue');
  });

  it('validates composed section children', () => {
    const report = Report.create().add(
      Components.Section({
        label: 'Executive Summary',
        children: [
          Components.Title({ text: 'Q2 Results' }),
          Components.Paragraph({ text: 'Revenue grew 12%.' }),
          Components.SummaryCard({ label: 'Revenue', value: '$3.8M', trend: '+12%' }),
          Components.Divider(),
        ],
      }),
    );

    const { valid } = report.validate();
    expect(valid).toBe(true);
  });

  it('rejects invalid descriptors at add time', () => {
    const report = Report.create();
    expect(() => report.add(Components.Paragraph({ text: '' }))).toThrow(/Invalid component descriptor/);
  });
});
