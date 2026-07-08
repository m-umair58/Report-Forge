import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_COMPONENT_ENTRIES,
  COMPONENT_TYPES,
  ComponentRegistry,
  DeserializationError,
  Report,
  ReportBuilder,
  SCHEMA_VERSION,
  ValidationFramework,
  allowedChildrenValidator,
  createDefaultRegistry,
  createDefaultValidationFramework,
  deserialize,
  duplicateIdValidator,
  knownTypeValidator,
  requiredPropsValidator,
  serialize,
} from './index.js';
import { createNode } from './node.js';
import { createIdGenerator } from './utils.js';

// ─── Report factory ──────────────────────────────────────────────────────────

describe('Report', () => {
  it('create() returns a ReportBuilder', () => {
    const report = Report.create();
    expect(report).toBeInstanceOf(ReportBuilder);
  });

  it('create() accepts metadata options', () => {
    const report = Report.create({ metadata: { title: 'Acme Report', theme: 'default' } });
    const json = report.toJSON();
    expect(json.metadata.title).toBe('Acme Report');
    expect(json.metadata.theme).toBe('default');
  });

  it('create() with no args produces valid schema', () => {
    const report = Report.create();
    const json = report.toJSON();
    expect(json.version).toBe(SCHEMA_VERSION);
    expect(json.root.type).toBe(COMPONENT_TYPES.REPORT);
    expect(json.root.children).toEqual([]);
  });

  it('fromJSON() restores a builder from serialized schema', () => {
    const original = Report.create({ metadata: { title: 'Restored' } })
      .title('Hello')
      .paragraph('World');

    const json = original.toJSON();
    const restored = Report.fromJSON(json);
    expect(restored).toBeInstanceOf(ReportBuilder);
    expect(JSON.stringify(restored.toJSON())).toBe(JSON.stringify(json));
  });

  it('fromJSON() throws DeserializationError for invalid input', () => {
    expect(() => Report.fromJSON('not an object')).toThrow(DeserializationError);
    expect(() => Report.fromJSON(null)).toThrow(DeserializationError);
    expect(() => Report.fromJSON({ version: '99.0.0', metadata: {}, root: {} })).toThrow(
      DeserializationError,
    );
  });

  it('withMetadata() creates a builder with given metadata', () => {
    const report = Report.withMetadata({ title: 'Quick Report' });
    expect(report.toJSON().metadata.title).toBe('Quick Report');
  });
});

// ─── Builder API ─────────────────────────────────────────────────────────────

describe('ReportBuilder – content methods', () => {
  it('title() adds a title node', () => {
    const json = Report.create().title('My Title').toJSON();
    const child = json.root.children[0];
    expect(child?.type).toBe(COMPONENT_TYPES.TITLE);
    expect(child?.props['text']).toBe('My Title');
  });

  it('subtitle() adds a subtitle node', () => {
    const json = Report.create().subtitle('Sub').toJSON();
    expect(json.root.children[0]?.type).toBe(COMPONENT_TYPES.SUBTITLE);
  });

  it('paragraph() adds a paragraph node', () => {
    const json = Report.create().paragraph('Some text').toJSON();
    expect(json.root.children[0]?.type).toBe(COMPONENT_TYPES.PARAGRAPH);
  });

  it('divider() adds a divider node', () => {
    const json = Report.create().divider().toJSON();
    expect(json.root.children[0]?.type).toBe(COMPONENT_TYPES.DIVIDER);
  });

  it('table() adds a table node', () => {
    const json = Report.create()
      .table({
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Alice' }],
      })
      .toJSON();
    const node = json.root.children[0];
    expect(node?.type).toBe(COMPONENT_TYPES.TABLE);
    const columns = node?.props['columns'];
    expect(Array.isArray(columns)).toBe(true);
  });

  it('image() adds an image node', () => {
    const json = Report.create().image({ src: './logo.png', alt: 'Logo' }).toJSON();
    const node = json.root.children[0];
    expect(node?.type).toBe(COMPONENT_TYPES.IMAGE);
    expect(node?.props['src']).toBe('./logo.png');
  });

  it('chart() adds a chart node', () => {
    const json = Report.create()
      .chart({
        type: 'bar',
        data: { labels: ['Q1'], datasets: [{ label: 'Rev', values: [100] }] },
      })
      .toJSON();
    expect(json.root.children[0]?.type).toBe(COMPONENT_TYPES.CHART);
  });

  it('summaryCard() adds a summary-card node', () => {
    const json = Report.create()
      .summaryCard({ label: 'Revenue', value: '$1.2M', trend: '+12%' })
      .toJSON();
    expect(json.root.children[0]?.type).toBe(COMPONENT_TYPES.SUMMARY_CARD);
  });

  it('qrCode() adds a qr-code node', () => {
    const json = Report.create().qrCode({ value: 'https://example.com' }).toJSON();
    expect(json.root.children[0]?.type).toBe(COMPONENT_TYPES.QR_CODE);
  });

  it('barcode() adds a barcode node', () => {
    const json = Report.create().barcode({ value: '123456', format: 'EAN13' }).toJSON();
    expect(json.root.children[0]?.type).toBe(COMPONENT_TYPES.BARCODE);
  });

  it('all content methods return the builder for chaining', () => {
    const report = Report.create();
    const result = report
      .title('T')
      .subtitle('S')
      .paragraph('P')
      .divider()
      .image({ src: 'x.png' })
      .summaryCard({ label: 'L', value: 'V' })
      .qrCode({ value: 'Q' })
      .barcode({ value: 'B' })
      .table({ columns: [{ key: 'k', label: 'K' }], rows: [] });
    expect(result).toBe(report);
  });
});

describe('ReportBuilder – container methods', () => {
  it('header() creates a header node via callback', () => {
    const json = Report.create()
      .header((h) => h.title('Acme'))
      .toJSON();
    const header = json.root.children[0];
    expect(header?.type).toBe(COMPONENT_TYPES.HEADER);
    expect(header?.children[0]?.type).toBe(COMPONENT_TYPES.TITLE);
  });

  it('footer() creates a footer node via callback', () => {
    const json = Report.create()
      .footer((f) => f.paragraph('Page 1'))
      .toJSON();
    const footer = json.root.children[0];
    expect(footer?.type).toBe(COMPONENT_TYPES.FOOTER);
    expect(footer?.children[0]?.props['text']).toBe('Page 1');
  });

  it('section() with callback only creates a section node', () => {
    const json = Report.create()
      .section((s) => s.title('Overview'))
      .toJSON();
    const section = json.root.children[0];
    expect(section?.type).toBe(COMPONENT_TYPES.SECTION);
    expect(section?.children[0]?.type).toBe(COMPONENT_TYPES.TITLE);
  });

  it('section() with label and callback stores label in props', () => {
    const json = Report.create()
      .section('Details', (s) => s.paragraph('Content'))
      .toJSON();
    const section = json.root.children[0];
    expect(section?.props['label']).toBe('Details');
    expect(section?.children[0]?.type).toBe(COMPONENT_TYPES.PARAGRAPH);
  });

  it('container methods return the builder for chaining', () => {
    const report = Report.create();
    const result = report
      .header((h) => h.title('H'))
      .section((s) => s.paragraph('S'))
      .footer((f) => f.paragraph('F'));
    expect(result).toBe(report);
  });
});

// ─── Nested sections ──────────────────────────────────────────────────────────

describe('Nested sections', () => {
  it('nested section creates a section inside a section', () => {
    const json = Report.create()
      .section((outer) => {
        outer.title('Outer').section((inner) => {
          inner.paragraph('Nested content');
        });
      })
      .toJSON();

    const outer = json.root.children[0];
    expect(outer?.type).toBe(COMPONENT_TYPES.SECTION);

    const title = outer?.children[0];
    expect(title?.type).toBe(COMPONENT_TYPES.TITLE);

    const inner = outer?.children[1];
    expect(inner?.type).toBe(COMPONENT_TYPES.SECTION);
    expect(inner?.children[0]?.props['text']).toBe('Nested content');
  });

  it('deeply nested sections work', () => {
    const json = Report.create()
      .section((l1) => {
        l1.section((l2) => {
          l2.section((l3) => {
            l3.title('Deep title');
          });
        });
      })
      .toJSON();

    const l1 = json.root.children[0];
    const l2 = l1?.children[0];
    const l3 = l2?.children[0];
    const title = l3?.children[0];
    expect(title?.type).toBe(COMPONENT_TYPES.TITLE);
    expect(title?.props['text']).toBe('Deep title');
  });
});

// ─── Tree structure ───────────────────────────────────────────────────────────

describe('Report tree structure', () => {
  it('milestone success criteria code produces correct tree', () => {
    const report = Report.create();

    report
      .title('Monthly Sales')
      .paragraph('Summary')
      .section((section) => {
        section.title('Orders').paragraph('This month...');
      })
      .divider();

    const json = report.toJSON();

    expect(json.version).toBe(SCHEMA_VERSION);
    expect(json.root.type).toBe(COMPONENT_TYPES.REPORT);
    expect(json.root.children).toHaveLength(4);

    const [titleNode, paragraphNode, sectionNode, dividerNode] = json.root.children;
    expect(titleNode?.type).toBe(COMPONENT_TYPES.TITLE);
    expect(titleNode?.props['text']).toBe('Monthly Sales');

    expect(paragraphNode?.type).toBe(COMPONENT_TYPES.PARAGRAPH);
    expect(paragraphNode?.props['text']).toBe('Summary');

    expect(sectionNode?.type).toBe(COMPONENT_TYPES.SECTION);
    expect(sectionNode?.children).toHaveLength(2);
    expect(sectionNode?.children[0]?.type).toBe(COMPONENT_TYPES.TITLE);
    expect(sectionNode?.children[1]?.type).toBe(COMPONENT_TYPES.PARAGRAPH);

    expect(dividerNode?.type).toBe(COMPONENT_TYPES.DIVIDER);
  });

  it('every node has a unique id', () => {
    const json = Report.create()
      .title('T')
      .section((s) => s.title('T2').paragraph('P'))
      .divider()
      .toJSON();

    const ids: string[] = [];
    function collectIds(nodes: typeof json.root.children): void {
      for (const node of nodes) {
        ids.push(node.id);
        collectIds(node.children);
      }
    }
    ids.push(json.root.id);
    collectIds(json.root.children);

    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all node ids are non-empty strings', () => {
    const json = Report.create().title('T').paragraph('P').toJSON();
    expect(typeof json.root.id).toBe('string');
    expect(json.root.id.length).toBeGreaterThan(0);
    for (const child of json.root.children) {
      expect(child.id.length).toBeGreaterThan(0);
    }
  });
});

// ─── Serialization ────────────────────────────────────────────────────────────

describe('Serialization', () => {
  it('toJSON() and toSchema() return identical output', () => {
    const report = Report.create().title('Test');
    expect(JSON.stringify(report.toJSON())).toBe(JSON.stringify(report.toSchema()));
  });

  it('toJSON() output is JSON-compatible', () => {
    const report = Report.create().title('Hello').paragraph('World');
    const json = report.toJSON();
    const roundTripped = JSON.parse(JSON.stringify(json)) as unknown;
    expect(roundTripped).toEqual(json);
  });

  it('serialize() produces correct schema structure', () => {
    const gen = createIdGenerator();
    const root = createNode(gen('report'), 'report', {}, null);
    const titleNode = createNode(gen('title'), 'title', { text: 'Hello' }, root);
    root.children.push(titleNode);

    const schema = serialize(root, { title: 'Test' });
    expect(schema.version).toBe(SCHEMA_VERSION);
    expect(schema.metadata.title).toBe('Test');
    expect(schema.root.type).toBe('report');
    expect(schema.root.children[0]?.type).toBe('title');
    expect(schema.root.children[0]?.props['text']).toBe('Hello');
  });
});

// ─── Deserialization ──────────────────────────────────────────────────────────

describe('Deserialization – round-trip', () => {
  it('fromJSON(toJSON()) produces identical schema', () => {
    const original = Report.create({ metadata: { title: 'RT Test', author: 'Bot' } })
      .title('Heading')
      .paragraph('Body text')
      .section('Details', (s) => s.table({ columns: [{ key: 'x', label: 'X' }], rows: [] }))
      .divider();

    const json = original.toJSON();
    const restored = Report.fromJSON(json);
    const restoredJson = restored.toJSON();

    expect(JSON.stringify(restoredJson)).toBe(JSON.stringify(json));
  });

  it('deserialize() restores node IDs exactly', () => {
    const report = Report.create().title('T').paragraph('P');
    const json = report.toJSON();
    const { rootNode } = deserialize(json);

    expect(rootNode.id).toBe(json.root.id);
    expect(rootNode.children[0]?.id).toBe(json.root.children[0]?.id);
  });

  it('deserialize() throws on missing version', () => {
    expect(() => deserialize({ metadata: {}, root: {} })).toThrow(DeserializationError);
  });

  it('deserialize() throws on wrong version', () => {
    expect(() =>
      deserialize({
        version: '2.0.0',
        metadata: {},
        root: { id: 'r', type: 'report', props: {}, children: [] },
      }),
    ).toThrow(DeserializationError);
  });

  it('deserialize() throws on non-string node id', () => {
    expect(() =>
      deserialize({
        version: SCHEMA_VERSION,
        metadata: {},
        root: { id: 123, type: 'report', props: {}, children: [] },
      }),
    ).toThrow(DeserializationError);
  });

  it('deserialize() throws on non-array children', () => {
    expect(() =>
      deserialize({
        version: SCHEMA_VERSION,
        metadata: {},
        root: { id: 'r', type: 'report', props: {}, children: 'not-array' },
      }),
    ).toThrow(DeserializationError);
  });
});

// ─── ComponentRegistry ────────────────────────────────────────────────────────

describe('ComponentRegistry', () => {
  it('register() adds a component type', () => {
    const registry = new ComponentRegistry();
    registry.register({
      type: 'custom',
      allowedChildren: new Set(),
      allowedParents: new Set(['section']),
      requiredProps: [],
    });
    expect(registry.has('custom')).toBe(true);
  });

  it('resolve() returns the entry for a registered type', () => {
    const registry = new ComponentRegistry();
    const entry = {
      type: 'badge',
      allowedChildren: new Set<string>(),
      allowedParents: new Set(['section']),
      requiredProps: ['label'],
    };
    registry.register(entry);
    const resolved = registry.resolve('badge');
    expect(resolved?.type).toBe('badge');
    expect(resolved?.requiredProps).toContain('label');
  });

  it('resolve() returns undefined for unknown type', () => {
    const registry = new ComponentRegistry();
    expect(registry.resolve('ghost')).toBeUndefined();
  });

  it('has() returns false for unknown type', () => {
    const registry = new ComponentRegistry();
    expect(registry.has('unknown')).toBe(false);
  });

  it('unregister() removes a component type', () => {
    const registry = new ComponentRegistry();
    registry.register({
      type: 'temp',
      allowedChildren: new Set(),
      allowedParents: new Set(),
      requiredProps: [],
    });
    registry.unregister('temp');
    expect(registry.has('temp')).toBe(false);
  });

  it('register() throws on duplicate type', () => {
    const registry = new ComponentRegistry();
    const entry = {
      type: 'x',
      allowedChildren: new Set<string>(),
      allowedParents: new Set<string>(),
      requiredProps: [],
    };
    registry.register(entry);
    expect(() => registry.register(entry)).toThrow();
  });

  it('unregister() throws on unknown type', () => {
    const registry = new ComponentRegistry();
    expect(() => registry.unregister('ghost')).toThrow();
  });

  it('list() returns sorted type names', () => {
    const registry = new ComponentRegistry();
    registry.register({
      type: 'zzz',
      allowedChildren: new Set(),
      allowedParents: new Set(),
      requiredProps: [],
    });
    registry.register({
      type: 'aaa',
      allowedChildren: new Set(),
      allowedParents: new Set(),
      requiredProps: [],
    });
    const list = registry.list();
    expect(list[0]).toBe('aaa');
    expect(list[1]).toBe('zzz');
  });

  it('createDefaultRegistry() registers all built-in types', () => {
    const registry = createDefaultRegistry();
    for (const entry of BUILT_IN_COMPONENT_ENTRIES) {
      expect(registry.has(entry.type)).toBe(true);
    }
  });

  it('createDefaultRegistry() list() contains all built-in types', () => {
    const registry = createDefaultRegistry();
    expect(registry.list()).toHaveLength(BUILT_IN_COMPONENT_ENTRIES.length);
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('Validation – valid schema', () => {
  it('simple valid report passes validation', () => {
    const report = Report.create().title('T').paragraph('P');
    const { valid, errors } = report.validate();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('complex valid report passes validation', () => {
    const report = Report.create({ metadata: { title: 'Complex' } })
      .header((h) => h.title('Header'))
      .title('Main')
      .section('Overview', (s) => {
        s.paragraph('Content').table({ columns: [{ key: 'k', label: 'K' }], rows: [] });
      })
      .footer((f) => f.paragraph('Footer'));
    const { valid } = report.validate();
    expect(valid).toBe(true);
  });
});

describe('Validation – duplicate IDs', () => {
  it('schema with duplicate ids fails validation', () => {
    const registry = createDefaultRegistry();
    const gen = createIdGenerator();

    const root = createNode(gen('report'), 'report', {}, null);
    const duplicate = 'dup-id-123';
    const child1 = createNode(duplicate, 'title', { text: 'First' }, root);
    const child2 = createNode(duplicate, 'paragraph', { text: 'Second' }, root);
    root.children.push(child1, child2);

    const schema = serialize(root, {});
    const framework = createDefaultValidationFramework();
    const result = framework.validate(schema, registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
  });
});

describe('Validation – unknown type', () => {
  it('schema with unknown type fails knownTypeValidator', () => {
    const registry = createDefaultRegistry();
    const gen = createIdGenerator();

    const root = createNode(gen('report'), 'report', {}, null);
    const unknown = createNode(gen('unknown'), 'flying-saucer', {}, root);
    root.children.push(unknown);

    const schema = serialize(root, {});
    const framework = new ValidationFramework();
    framework.addValidator(knownTypeValidator);
    const result = framework.validate(schema, registry);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toContain('flying-saucer');
  });
});

describe('Validation – hierarchy', () => {
  it('invalid parent-child fails allowedChildrenValidator', () => {
    const registry = createDefaultRegistry();
    const gen = createIdGenerator();

    // Header only allows title, paragraph, image — not divider
    const root = createNode(gen('report'), 'report', {}, null);
    const header = createNode(gen('header'), 'header', {}, root);
    const divider = createNode(gen('divider'), 'divider', {}, header);
    header.children.push(divider);
    root.children.push(header);

    const schema = serialize(root, {});
    const framework = new ValidationFramework();
    framework.addValidator(allowedChildrenValidator);
    const result = framework.validate(schema, registry);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toContain('divider');
  });
});

describe('Validation – required props', () => {
  it('title without text prop fails requiredPropsValidator', () => {
    const registry = createDefaultRegistry();
    const gen = createIdGenerator();

    const root = createNode(gen('report'), 'report', {}, null);
    const title = createNode(gen('title'), 'title', {}, root); // missing 'text' prop
    root.children.push(title);

    const schema = serialize(root, {});
    const framework = new ValidationFramework();
    framework.addValidator(requiredPropsValidator);
    const result = framework.validate(schema, registry);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toContain("'text'");
  });

  it('table without required props fails', () => {
    const registry = createDefaultRegistry();
    const gen = createIdGenerator();

    const root = createNode(gen('report'), 'report', {}, null);
    const table = createNode(gen('table'), 'table', { columns: [] }, root); // missing 'rows'
    root.children.push(table);

    const schema = serialize(root, {});
    const framework = new ValidationFramework();
    framework.addValidator(requiredPropsValidator);
    const result = framework.validate(schema, registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("'rows'"))).toBe(true);
  });
});

describe('Validation – custom validators', () => {
  it('custom validator can be added to the framework', () => {
    const framework = new ValidationFramework();
    let callCount = 0;
    framework.addValidator((node) => {
      callCount++;
      return node.type === 'forbidden' ? [{ nodeId: node.id, message: 'Forbidden type' }] : [];
    });

    const registry = createDefaultRegistry();
    const json = Report.create().title('T').toJSON();
    framework.validate(json, registry);
    expect(callCount).toBeGreaterThan(0);
  });
});

describe('Validation – duplicateIdValidator standalone', () => {
  it('finds duplicate IDs in a constructed schema', () => {
    const registry = createDefaultRegistry();
    const gen = createIdGenerator();
    const root = createNode(gen('report'), 'report', {}, null);
    const shared = 'same-id';
    root.children.push(createNode(shared, 'title', { text: 'A' }, root));
    root.children.push(createNode(shared, 'title', { text: 'B' }, root));
    const schema = serialize(root, {});
    const framework = new ValidationFramework();
    framework.addValidator(duplicateIdValidator);
    const { valid } = framework.validate(schema, registry);
    expect(valid).toBe(false);
  });
});
