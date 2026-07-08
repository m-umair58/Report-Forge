import { describe, expect, it } from 'vitest';

import {
  COMPONENT_TYPES,
  Components,
  createDefaultRegistry,
  validateDescriptor,
  validateDescriptors,
} from './index.js';

describe('Components factory', () => {
  it('creates typography descriptors', () => {
    const title = Components.Title({ text: 'Hello' });
    expect(title.type).toBe(COMPONENT_TYPES.TITLE);
    expect(title.props['text']).toBe('Hello');
  });

  it('creates layout descriptors with children', () => {
    const section = Components.Section({
      label: 'Overview',
      children: [
        Components.Paragraph({ text: 'Body' }),
        Components.Divider(),
      ],
    });

    expect(section.type).toBe(COMPONENT_TYPES.SECTION);
    expect(section.children?.length).toBe(2);
  });

  it('normalizes SummaryCard title to label prop', () => {
    const card = Components.SummaryCard({ title: 'Revenue', value: '$1.2M' });
    expect(card.props['label']).toBe('Revenue');
    expect(card.props['value']).toBe('$1.2M');
    expect(card.props['title']).toBeUndefined();
  });

  it('supports style, margin, padding, visibility, and id', () => {
    const paragraph = Components.Paragraph({
      id: 'intro',
      text: 'Styled',
      style: { color: '#333', fontSize: 14, alignment: 'center' },
      margin: 12,
      padding: { top: 4, bottom: 4 },
      visibility: true,
    });

    expect(paragraph.id).toBe('intro');
    expect(paragraph.style?.color).toBe('#333');
    expect(paragraph.margin).toBe(12);
    expect(paragraph.visibility).toBe(true);
  });
});

describe('validateDescriptor', () => {
  const registry = createDefaultRegistry();

  it('accepts valid descriptors', () => {
    const result = validateDescriptor(
      Components.Paragraph({ text: 'OK' }),
      registry,
      COMPONENT_TYPES.SECTION,
    );
    expect(result.valid).toBe(true);
  });

  it('rejects missing required props', () => {
    const result = validateDescriptor(
      { type: COMPONENT_TYPES.PARAGRAPH, props: {} },
      registry,
      COMPONENT_TYPES.SECTION,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('text'))).toBe(true);
  });

  it('rejects unsupported nesting', () => {
    const result = validateDescriptor(
      Components.Table({ columns: [], rows: [] }),
      registry,
      COMPONENT_TYPES.ROW,
    );
    expect(result.valid).toBe(false);
  });

  it('detects duplicate explicit ids', () => {
    const result = validateDescriptors(
      [
        Components.Paragraph({ id: 'dup', text: 'A' }),
        Components.Paragraph({ id: 'dup', text: 'B' }),
      ],
      registry,
      COMPONENT_TYPES.SECTION,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
  });
});

describe('createDefaultRegistry', () => {
  it('registers all built-in component types', () => {
    const registry = createDefaultRegistry();
    expect(registry.has(COMPONENT_TYPES.HEADING)).toBe(true);
    expect(registry.has(COMPONENT_TYPES.METRIC_CARD)).toBe(true);
    expect(registry.has(COMPONENT_TYPES.ALERT_BOX)).toBe(true);
    expect(registry.list().length).toBeGreaterThan(25);
  });
});
