import { describe, expect, it } from 'vitest';

import {
  TemplateRegistry,
  defineTemplate,
  defaultTemplateResolver,
  mergeBranding,
  validateRequiredFields,
} from './index.js';

describe('TemplateRegistry', () => {
  it('registers and resolves templates', () => {
    const registry = new TemplateRegistry();
    const builder = defineTemplate({
      id: 'test',
      name: 'Test',
      description: 'Test template',
      category: 'general',
      build: () => {},
    });
    registry.register(builder.definition);
    expect(registry.has('test')).toBe(true);
    expect(registry.get('test').name).toBe('Test');
  });
});

describe('defineTemplate', () => {
  const invoiceTemplate = defineTemplate({
    id: 'invoice',
    name: 'Invoice',
    description: 'Invoice template',
    category: 'business',
    fields: [{ path: 'invoiceNumber', required: true, type: 'string' }],
    build: (ctx) => {
      ctx.builder.title(`Invoice ${(ctx.data as { invoiceNumber: string }).invoiceNumber}`);
    },
    metadata: (data) => ({
      title: `Invoice ${(data as { invoiceNumber: string }).invoiceNumber}`,
    }),
  });

  it('creates a report builder from template data', () => {
    const report = invoiceTemplate.create({ invoiceNumber: 'INV-001' }, { showFooter: false });
    const schema = report.toJSON();
    expect(schema.metadata.title).toBe('Invoice INV-001');
    expect(schema.root.children.length).toBeGreaterThan(0);
  });

  it('validates required fields', () => {
    const result = invoiceTemplate.validate({} as { invoiceNumber: string });
    expect(result.valid).toBe(false);
  });
});

describe('validation helpers', () => {
  it('mergeBranding applies defaults', () => {
    const branding = mergeBranding(undefined, { companyName: 'Acme' });
    expect(branding.companyName).toBe('Acme');
  });

  it('validateRequiredFields detects missing data', () => {
    const result = validateRequiredFields({}, [{ path: 'name', required: true, type: 'string' }]);
    expect(result.valid).toBe(false);
  });
});

describe('TemplateResolver', () => {
  it('throws on validation failure', () => {
    const template = defineTemplate({
      id: 'strict',
      name: 'Strict',
      description: 'Strict template',
      category: 'general',
      fields: [{ path: 'id', required: true, type: 'string' }],
      build: () => {},
    });

    expect(() => defaultTemplateResolver.createReport(
      {
        id: template.id,
        name: template.name,
        description: 'Strict template',
        category: 'general',
        fields: [{ path: 'id', required: true, type: 'string' }],
        build: () => {},
      },
      {},
    )).toThrow();
  });
});
